/**
 * Generates an empty or sample 16x16 / 32x32 / 64x64 PNG in RGBA format
 * for newly scaffolded custom Bedrock texture slots.
 */
export async function generatePlaceholderTexturePng(
  label: string,
  width: number = 16,
  height: number = 16,
  hexColor: string = '#10b981'
): Promise<Uint8Array> {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context not available');

  ctx.imageSmoothingEnabled = false;

  // Fill with color and a checkered pixel border
  ctx.fillStyle = hexColor;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = '#064e3b';
  ctx.strokeRect(0.5, 0.5, width - 1, height - 1);

  // Subtle cross pixel details
  ctx.fillStyle = '#34d399';
  ctx.fillRect(Math.floor(width / 2) - 1, Math.floor(height / 2) - 1, 2, 2);

  return new Promise<Uint8Array>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Failed to generate PNG blob'));
        return;
      }
      blob.arrayBuffer().then((buf) => {
        resolve(new Uint8Array(buf));
      });
    }, 'image/png');
  });
}
