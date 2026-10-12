import React, { useRef, useState, useEffect } from 'react';
import { X, Image as ImageIcon, Upload, Sparkles, Check } from 'lucide-react';
import { CanvasPixelPreview } from '../textures/CanvasPixelPreview';

interface PackIconModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentIconData: Uint8Array | null;
  packName: string;
  onSaveIcon: (data: Uint8Array) => void;
}

export const PackIconModal: React.FC<PackIconModalProps> = ({
  isOpen,
  onClose,
  currentIconData,
  packName,
  onSaveIcon,
}) => {
  const [iconText, setIconText] = useState(packName.slice(0, 6).toUpperCase() || 'PACK');
  const [gemTheme, setGemTheme] = useState<'emerald' | 'diamond' | 'ruby' | 'gold'>('emerald');
  const [previewData, setPreviewData] = useState<Uint8Array | null>(currentIconData);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setIconText(packName.slice(0, 6).toUpperCase() || 'PACK');
  }, [packName]);

  const generatePreview = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;

    // Dark slate background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 64, 64);

    // Stone border
    ctx.fillStyle = '#334155';
    ctx.fillRect(0, 0, 64, 4);
    ctx.fillRect(0, 60, 64, 4);
    ctx.fillRect(0, 0, 4, 64);
    ctx.fillRect(60, 0, 4, 64);

    // Bevel
    ctx.fillStyle = '#475569';
    ctx.fillRect(4, 4, 56, 2);
    ctx.fillRect(4, 4, 2, 56);
    ctx.fillStyle = '#020617';
    ctx.fillRect(4, 58, 56, 2);
    ctx.fillRect(58, 4, 2, 56);

    // Theme palette
    let darkColor = '#064e3b';
    let mainColor = '#10b981';
    let lightColor = '#34d399';
    let highlightColor = '#a7f3d0';

    if (gemTheme === 'diamond') {
      darkColor = '#0c4a6e';
      mainColor = '#0284c7';
      lightColor = '#38bdf8';
      highlightColor = '#bae6fd';
    } else if (gemTheme === 'ruby') {
      darkColor = '#7f1d1d';
      mainColor = '#dc2626';
      lightColor = '#f87171';
      highlightColor = '#fecaca';
    } else if (gemTheme === 'gold') {
      darkColor = '#78350f';
      mainColor = '#d97706';
      lightColor = '#facc15';
      highlightColor = '#fef08a';
    }

    // Gem emblem
    ctx.fillStyle = darkColor;
    ctx.fillRect(24, 16, 16, 24);
    ctx.fillRect(20, 20, 24, 16);

    ctx.fillStyle = mainColor;
    ctx.fillRect(26, 18, 12, 20);
    ctx.fillRect(22, 22, 20, 12);

    ctx.fillStyle = lightColor;
    ctx.fillRect(26, 18, 4, 4);
    ctx.fillRect(22, 22, 4, 4);
    ctx.fillStyle = highlightColor;
    ctx.fillRect(27, 19, 2, 2);

    // Bottom banner
    ctx.fillStyle = '#020617';
    ctx.fillRect(8, 46, 48, 10);
    ctx.fillStyle = mainColor;
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(iconText.slice(0, 6), 32, 51);

    canvas.toBlob((blob) => {
      if (!blob) return;
      blob.arrayBuffer().then((buf) => {
        setPreviewData(new Uint8Array(buf));
      });
    }, 'image/png');
  };

  useEffect(() => {
    if (isOpen && !currentIconData) {
      generatePreview();
    } else if (isOpen && currentIconData) {
      setPreviewData(currentIconData);
    }
  }, [isOpen]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const buf = await file.arrayBuffer();
    setPreviewData(new Uint8Array(buf));
  };

  const handleSave = () => {
    if (previewData) {
      onSaveIcon(previewData);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 select-none">
      <div className="bg-[#111822] border border-[#1E293B] rounded-xl shadow-2xl max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-[#141C26] border-b border-[#1E293B] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ImageIcon className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-100">Manage pack_icon.png</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-100 hover:bg-[#1E293B] rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          {/* Preview canvas */}
          <div className="h-48 border border-[#1E293B] rounded-lg overflow-hidden">
            <CanvasPixelPreview imageData={previewData} recommendedDimensions={{ width: 64, height: 64 }} />
          </div>

          {/* Generator Controls */}
          <div className="p-3 bg-[#0B0F14] rounded-lg border border-[#1E293B] space-y-3">
            <span className="font-semibold text-slate-200 block">Pixel-Art Icon Generator</span>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Banner Tag (Max 6 chars)</label>
                <input
                  type="text"
                  maxLength={6}
                  value={iconText}
                  onChange={(e) => setIconText(e.target.value.toUpperCase())}
                  className="w-full px-2.5 py-1.5 bg-[#111822] border border-[#1E293B] rounded text-slate-100 font-mono text-xs outline-none uppercase"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Theme Color</label>
                <select
                  value={gemTheme}
                  onChange={(e) => setGemTheme(e.target.value as 'emerald' | 'diamond' | 'ruby' | 'gold')}
                  className="w-full px-2.5 py-1.5 bg-[#111822] border border-[#1E293B] rounded text-slate-100 text-xs outline-none"
                >
                  <option value="emerald">Emerald Green</option>
                  <option value="diamond">Diamond Blue</option>
                  <option value="ruby">Redstone Ruby</option>
                  <option value="gold">Golden Sun</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={generatePreview}
                className="flex items-center gap-1 px-3 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded font-medium"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generate Pixel Icon</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1 px-3 py-1 bg-[#161F29] hover:bg-[#1E293B] text-slate-300 border border-[#1E293B] rounded font-medium"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Custom PNG</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".png,image/png"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 border-t border-[#1E293B] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold rounded-md shadow-sm transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Apply to pack_icon.png</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
