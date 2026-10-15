import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

async function packAssets() {
  const targetZip = path.join(projectRoot, 'public', 'vanilla_assets.zip');

  // If public/vanilla_assets.zip already exists and is valid (> 1.5MB), preserve it!
  if (fs.existsSync(targetZip)) {
    const stat = fs.statSync(targetZip);
    if (stat.size > 1500000) {
      console.log(`✅ Preserving existing authentic public/vanilla_assets.zip (${(stat.size / (1024 * 1024)).toFixed(2)} MB).`);
      return;
    }
  }

  console.log('📦 Assembling authentic texture assets into public/vanilla_assets.zip...');
  const zip = new JSZip();

  // 1. Add real texture files if present in public/textures
  const texturesDir = path.join(projectRoot, 'public', 'textures');
  if (fs.existsSync(texturesDir)) {
    function addDirToZip(zipFolder, dirPath) {
      const files = fs.readdirSync(dirPath);
      for (const file of files) {
        const fullPath = path.join(dirPath, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          addDirToZip(zipFolder.folder(file), fullPath);
        } else {
          const data = fs.readFileSync(fullPath);
          zipFolder.file(file, data);
        }
      }
    }
    addDirToZip(zip.folder('textures'), texturesDir);
  }

  // 2. Add real textures from project.zip if present
  const projZipPath = path.join(projectRoot, '.aistudio', 'artifacts', 'brain', '10f3e8b7-708a-4637-8770-1708f2803bd8', 'project.zip');
  if (fs.existsSync(projZipPath)) {
    try {
      const projBuf = fs.readFileSync(projZipPath);
      const projZip = await JSZip.loadAsync(projBuf);
      for (const [key, fileObj] of Object.entries(projZip.files)) {
        if (fileObj.dir) continue;
        let cleanPath = key.split('\\').join('/');
        if (cleanPath.startsWith('public/')) cleanPath = cleanPath.slice(7);
        if (cleanPath.startsWith('textures/') || cleanPath.startsWith('blocks/') || cleanPath.startsWith('items/')) {
          if (!cleanPath.startsWith('textures/')) cleanPath = 'textures/' + cleanPath;
          const content = await fileObj.async('nodebuffer');
          zip.file(cleanPath, content);
        }
      }
    } catch {}
  }

  const buffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  fs.writeFileSync(targetZip, buffer);
  console.log(`✅ Generated public/vanilla_assets.zip (${(buffer.length / (1024 * 1024)).toFixed(2)} MB)`);
}

packAssets().catch((err) => {
  console.error('❌ Asset script error:', err);
  process.exit(1);
});
