/**
 * Generates an authentic Minecraft-style 64x64 pixel pack_icon.png
 */
export async function generateDefaultPackIcon(packTitle: string = 'Texture Pack'): Promise<Uint8Array> {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context not available');

  // Disable smoothing for authentic pixel art
  ctx.imageSmoothingEnabled = false;

  // Background stone/dirt pattern
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, 0, 64, 64);

  // Border frame (Minecraft stone frame)
  ctx.fillStyle = '#334155';
  ctx.fillRect(0, 0, 64, 4);
  ctx.fillRect(0, 60, 64, 4);
  ctx.fillRect(0, 0, 4, 64);
  ctx.fillRect(60, 0, 4, 64);

  // Inner beveled highlight
  ctx.fillStyle = '#475569';
  ctx.fillRect(4, 4, 56, 2);
  ctx.fillRect(4, 4, 2, 56);
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(4, 58, 56, 2);
  ctx.fillRect(58, 4, 2, 56);

  // Center emblem - Minecraft Emerald/Diamond gem motif
  // Gem outline
  ctx.fillStyle = '#064e3b';
  ctx.fillRect(24, 16, 16, 24);
  ctx.fillRect(20, 20, 24, 16);

  // Gem main emerald body
  ctx.fillStyle = '#10b981';
  ctx.fillRect(26, 18, 12, 20);
  ctx.fillRect(22, 22, 20, 12);

  // Gem highlights
  ctx.fillStyle = '#34d399';
  ctx.fillRect(26, 18, 4, 4);
  ctx.fillRect(22, 22, 4, 4);
  ctx.fillStyle = '#a7f3d0';
  ctx.fillRect(27, 19, 2, 2);

  // Bottom banner band for title initials
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(8, 46, 48, 10);
  ctx.fillStyle = '#22c55e';
  ctx.font = 'bold 8px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const initial = packTitle.trim().slice(0, 6).toUpperCase() || 'PACK';
  ctx.fillText(initial, 32, 51);

  // Convert canvas to Blob -> Uint8Array
  return new Promise<Uint8Array>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Failed to create icon PNG blob'));
        return;
      }
      blob.arrayBuffer().then((buf) => {
        resolve(new Uint8Array(buf));
      });
    }, 'image/png');
  });
}
