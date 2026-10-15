import fs from 'fs';
import path from 'path';
import https from 'https';
import JSZip from 'jszip';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

function fetchBuffer(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        return resolve(null); // File doesn't exist or not 200
      }
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', () => resolve(null));
  });
}

async function run() {
  console.log('🚀 Loading public/vanilla_assets.zip...');
  const zipPath = path.join(projectRoot, 'public', 'vanilla_assets.zip');
  let zip = new JSZip();
  if (fs.existsSync(zipPath)) {
    const buf = fs.readFileSync(zipPath);
    zip = await JSZip.loadAsync(buf);
  }

  // Load catalog paths from textureCatalog.ts
  const catalogText = fs.readFileSync(path.join(projectRoot, 'src', 'data', 'textureCatalog.ts'), 'utf8');
  const catalogPaths = [...catalogText.matchAll(/path:\s*['\"]([^'\"]+)['\"]/g)].map(m => m[1]);
  
  // Also load item & block paths from vanillaTextureIndex.json
  const indexJson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'src', 'data', 'vanillaTextureIndex.json'), 'utf8'));
  const allItemPaths = indexJson.filter(i => i.category === 'items').map(i => i.path);
  const allBlockPaths = indexJson.filter(i => i.category === 'blocks').slice(0, 300).map(i => i.path);

  // Combine unique paths with primary catalog paths prioritized
  const targetPaths = Array.from(new Set([...catalogPaths, ...allItemPaths, ...allBlockPaths]));
  console.log(`📋 Identified ${targetPaths.length} authentic texture paths to sync from Mojang repository...`);

  let downloadedCount = 0;
  let batchSize = 15;

  for (let i = 0; i < targetPaths.length; i += batchSize) {
    const chunk = targetPaths.slice(i, i + batchSize);
    await Promise.all(chunk.map(async (p) => {
      let cleanPath = p;
      if (!cleanPath.startsWith('textures/')) cleanPath = `textures/${cleanPath}`;

      // Download from official Mojang repository
      const url = `https://raw.githubusercontent.com/Mojang/bedrock-samples/main/resource_pack/${cleanPath}`;
      const buf = await fetchBuffer(url);
      if (buf && buf.length > 50) {
        zip.file(cleanPath, buf);
        downloadedCount++;
      }
    }));

    if (downloadedCount % 50 === 0 || i + batchSize >= targetPaths.length) {
      process.stdout.write(`Downloaded ${downloadedCount} authentic textures (${Math.round(((i + batchSize) / targetPaths.length) * 100)}%)...\r`);
    }
  }

  console.log(`\n✅ Successfully downloaded and bundled ${downloadedCount} authentic Mojang textures into ZIP!`);

  console.log('💾 Writing updated public/vanilla_assets.zip...');
  const zipBuffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  });

  fs.writeFileSync(zipPath, zipBuffer);
  console.log(`🎉 Saved public/vanilla_assets.zip (${(zipBuffer.length / (1024 * 1024)).toFixed(2)} MB)`);
}

run().catch(console.error);
