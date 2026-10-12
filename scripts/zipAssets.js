import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

async function packAssets() {
  const zip = new JSZip();

  function addDirToZip(zipFolder, dirPath) {
    if (!fs.existsSync(dirPath)) return;
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

  const texturesDir = path.join(projectRoot, 'public', 'textures');
  const soundsDir = path.join(projectRoot, 'public', 'vanilla_sounds');
  const targetZip = path.join(projectRoot, 'public', 'vanilla_assets.zip');

  const hasTextures = fs.existsSync(texturesDir);
  const hasSounds = fs.existsSync(soundsDir);

  if (hasTextures || hasSounds) {
    console.log('📦 Packing public/textures and public/vanilla_sounds into vanilla_assets.zip...');
    if (hasTextures) addDirToZip(zip.folder('textures'), texturesDir);
    if (hasSounds) addDirToZip(zip.folder('vanilla_sounds'), soundsDir);

    const buffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    });

    fs.writeFileSync(targetZip, buffer);
    console.log(`✅ Generated public/vanilla_assets.zip (${(buffer.length / (1024 * 1024)).toFixed(2)} MB)`);
  } else {
    if (fs.existsSync(targetZip)) {
      const stat = fs.statSync(targetZip);
      console.log(`✅ Verified public/vanilla_assets.zip (${(stat.size / (1024 * 1024)).toFixed(2)} MB) - Ready.`);
    } else {
      console.warn('⚠️ Warning: public/vanilla_assets.zip not found.');
    }
  }
}

packAssets().catch((err) => {
  console.error('❌ Asset script error:', err);
  process.exit(1);
});
