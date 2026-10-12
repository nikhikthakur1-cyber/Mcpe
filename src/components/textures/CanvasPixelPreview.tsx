import React, { useEffect, useRef, useState } from 'react';
import { ZoomIn, ZoomOut, Maximize2, RotateCcw } from 'lucide-react';

interface CanvasPixelPreviewProps {
  imageData?: Uint8Array | null;
  imageUrl?: string | null;
  mimeType?: string;
  recommendedDimensions?: { width: number; height: number };
  sampleColor?: string;
}

export const CanvasPixelPreview: React.FC<CanvasPixelPreviewProps> = ({
  imageData,
  imageUrl,
  recommendedDimensions,
  sampleColor = '#334155',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [zoom, setZoom] = useState<number>(8); // 8x default for 16x16 pixel art
  const [naturalDimensions, setNaturalDimensions] = useState<{ width: number; height: number } | null>(null);
  const [hasAlpha, setHasAlpha] = useState<boolean>(false);
  const [hoveredPixel, setHoveredPixel] = useState<{ x: number; y: number; r: number; g: number; b: number; a: number } | null>(null);

  useEffect(() => {
    let activeUrl: string | null = null;
    let isBlobUrl = false;

    if (imageData && imageData.length > 0) {
      const blob = new Blob([imageData as BlobPart], { type: 'image/png' });
      activeUrl = URL.createObjectURL(blob);
      isBlobUrl = true;
    } else if (imageUrl) {
      activeUrl = imageUrl;
      isBlobUrl = false;
    } else {
      setNaturalDimensions(null);
      setHasAlpha(false);
      setHoveredPixel(null);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      setNaturalDimensions({ width: img.naturalWidth, height: img.naturalHeight });

      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      // Check alpha channel
      try {
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        let foundAlpha = false;
        for (let i = 3; i < imgData.data.length; i += 4) {
          if (imgData.data[i] < 255) {
            foundAlpha = true;
            break;
          }
        }
        setHasAlpha(foundAlpha);
      } catch {
        // Ignore CORS/security issue if any
      }

      if (isBlobUrl && activeUrl) {
        URL.revokeObjectURL(activeUrl);
      }
    };

    img.onerror = () => {
      if (isBlobUrl && activeUrl) {
        URL.revokeObjectURL(activeUrl);
      }
    };

    img.src = activeUrl;

    return () => {
      if (isBlobUrl && activeUrl) {
        URL.revokeObjectURL(activeUrl);
      }
    };
  }, [imageData, imageUrl]);

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !naturalDimensions) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = naturalDimensions.width / rect.width;
    const scaleY = naturalDimensions.height / rect.height;

    const px = Math.floor((e.clientX - rect.left) * scaleX);
    const py = Math.floor((e.clientY - rect.top) * scaleY);

    if (px >= 0 && px < naturalDimensions.width && py >= 0 && py < naturalDimensions.height) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const p = ctx.getImageData(px, py, 1, 1).data;
        setHoveredPixel({ x: px, y: py, r: p[0], g: p[1], b: p[2], a: p[3] });
      }
    }
  };

  const handleCanvasMouseLeave = () => {
    setHoveredPixel(null);
  };

  const fileSizeKb = imageData ? (imageData.length / 1024).toFixed(1) : null;

  return (
    <div className="flex flex-col h-full bg-[#0E141D] rounded-lg border border-[#1E293B] overflow-hidden select-none">
      {/* Toolbar */}
      <div className="h-9 px-3 bg-[#141C26] border-b border-[#1E293B] flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="font-medium text-slate-200">Pixel Preview</span>
          {naturalDimensions ? (
            <span className="text-[11px] font-mono text-emerald-400">
              {naturalDimensions.width}×{naturalDimensions.height} px · {fileSizeKb} KB
            </span>
          ) : recommendedDimensions ? (
            <span className="text-[11px] font-mono text-slate-500">
              Standard: {recommendedDimensions.width}×{recommendedDimensions.height} px
            </span>
          ) : null}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setZoom((z) => Math.max(1, z / 2))}
            title="Zoom Out"
            className="p-1 hover:text-slate-200 hover:bg-[#1E293B] rounded transition-colors"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="px-1.5 font-mono text-[11px] text-slate-300 w-9 text-center">
            {zoom}×
          </span>
          <button
            onClick={() => setZoom((z) => Math.min(32, z * 2))}
            title="Zoom In"
            className="p-1 hover:text-slate-200 hover:bg-[#1E293B] rounded transition-colors"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <div className="w-[1px] h-3.5 bg-slate-700 mx-1" />
          <button
            onClick={() => setZoom(8)}
            title="Reset Zoom (8x)"
            className="p-1 hover:text-slate-200 hover:bg-[#1E293B] rounded transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoom(16)}
            title="Focus Fit (16x)"
            className="p-1 hover:text-slate-200 hover:bg-[#1E293B] rounded transition-colors"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Canvas Viewport with Alpha Checkerboard */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-6 bg-[#090D12] relative">
        {(imageData && imageData.length > 0) || naturalDimensions ? (
          <div
            className="relative border border-[#2A374A] shadow-2xl rounded-sm"
            style={{
              backgroundImage: `
                linear-gradient(45deg, #161F2A 25%, transparent 25%),
                linear-gradient(-45deg, #161F2A 25%, transparent 25%),
                linear-gradient(45deg, transparent 75%, #161F2A 75%),
                linear-gradient(-45deg, transparent 75%, #161F2A 75%)
              `,
              backgroundSize: '16px 16px',
              backgroundColor: '#0F151F',
            }}
          >
            <canvas
              ref={canvasRef}
              onMouseMove={handleCanvasMouseMove}
              onMouseLeave={handleCanvasMouseLeave}
              style={{
                width: naturalDimensions ? `${naturalDimensions.width * zoom}px` : 'auto',
                height: naturalDimensions ? `${naturalDimensions.height * zoom}px` : 'auto',
                imageRendering: 'pixelated',
                display: 'block',
              }}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-8 max-w-xs">
            <div
              className="w-16 h-16 rounded border border-dashed border-slate-700 mb-3 flex items-center justify-center text-slate-500 font-mono text-xs"
              style={{ backgroundColor: `${sampleColor}15` }}
            >
              16×16
            </div>
            <p className="text-xs text-slate-300 font-medium">No custom texture uploaded</p>
            <p className="text-[11px] text-slate-500 mt-1">
              Upload a replacement PNG in the inspector panel to preview and map it.
            </p>
          </div>
        )}
      </div>

      {/* Bottom Inspection Bar */}
      <div className="h-7 px-3 bg-[#111822] border-t border-[#1E293B] flex items-center justify-between text-[11px] text-slate-400 font-mono">
        <div className="flex items-center gap-3">
          {hasAlpha ? (
            <span className="text-sky-400">Alpha / Transparency: Present</span>
          ) : (
            <span className="text-slate-500">Opaque Texture</span>
          )}
        </div>

        <div>
          {hoveredPixel ? (
            <span className="text-slate-300">
              X:{hoveredPixel.x} Y:{hoveredPixel.y} · rgba({hoveredPixel.r}, {hoveredPixel.g}, {hoveredPixel.b}, {(hoveredPixel.a / 255).toFixed(2)})
            </span>
          ) : (
            <span className="text-slate-600">Hover over canvas to inspect pixel RGBA</span>
          )}
        </div>
      </div>
    </div>
  );
};
