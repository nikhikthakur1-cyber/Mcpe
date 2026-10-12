import React, { useEffect, useState } from 'react';
import { Check, Box, Sword, Sparkles, Layout, Cloud } from 'lucide-react';
import { TextureSlot } from '../../types';
import { textureUrlCache } from '../../utils/lruCache';

interface TextureCardProps {
  slot: TextureSlot;
  isSelected: boolean;
  isCustomized: boolean;
  customImageData?: Uint8Array;
  onSelect: (slot: TextureSlot) => void;
}

export const TextureCard: React.FC<TextureCardProps> = ({
  slot,
  isSelected,
  isCustomized,
  customImageData,
  onSelect,
}) => {
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!customImageData || customImageData.length === 0) {
      setThumbUrl(null);
      return;
    }

    const cachedUrl = textureUrlCache.set(slot.path, customImageData);
    setThumbUrl(cachedUrl);
  }, [customImageData, slot.path]);

  const getCategoryIcon = () => {
    switch (slot.category) {
      case 'blocks':
        return <Box className="w-3.5 h-3.5" />;
      case 'items':
        return <Sword className="w-3.5 h-3.5" />;
      case 'entity':
        return <Sparkles className="w-3.5 h-3.5" />;
      case 'ui':
        return <Layout className="w-3.5 h-3.5" />;
      case 'environment':
        return <Cloud className="w-3.5 h-3.5" />;
      default:
        return <Box className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div
      onClick={() => onSelect(slot)}
      className={`group relative p-3 rounded-lg border cursor-pointer transition-all flex flex-col justify-between ${
        isSelected
          ? 'bg-[#182332] border-sky-500 shadow-md ring-1 ring-sky-500/20'
          : isCustomized
          ? 'bg-[#141E28] border-emerald-500/30 hover:border-emerald-500/60'
          : 'bg-[#111822] border-[#1E293B] hover:border-slate-700 hover:bg-[#141C28]'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Preview Thumbnail Box */}
        <div
          className="w-12 h-12 rounded bg-[#0A0E14] border border-[#232F40] shrink-0 flex items-center justify-center overflow-hidden relative"
          style={{
            backgroundImage: isCustomized
              ? `linear-gradient(45deg, #182230 25%, transparent 25%),
                 linear-gradient(-45deg, #182230 25%, transparent 25%),
                 linear-gradient(45deg, transparent 75%, #182230 75%),
                 linear-gradient(-45deg, transparent 75%, #182230 75%)`
              : 'none',
            backgroundSize: '8px 8px',
          }}
        >
          {thumbUrl ? (
            <img
              src={thumbUrl}
              alt={slot.name}
              className="w-full h-full object-contain"
              style={{ imageRendering: 'pixelated' }}
            />
          ) : (
            <div
              className="w-7 h-7 rounded-sm flex items-center justify-center text-slate-300"
              style={{ backgroundColor: `${slot.sampleColor || '#38BDF8'}25` }}
            >
              {getCategoryIcon()}
            </div>
          )}
        </div>

        {/* Slot Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1">
            <h4 className="text-xs font-semibold text-slate-100 truncate group-hover:text-white">
              {slot.name}
            </h4>
            {isCustomized && (
              <span className="flex items-center gap-0.5 text-[10px] text-emerald-400 font-medium">
                <Check className="w-3 h-3" />
                <span>Custom</span>
              </span>
            )}
          </div>

          <p className="text-[11px] font-mono text-slate-500 truncate mt-0.5" title={slot.path}>
            {slot.path}
          </p>

          <p className="text-[11px] text-slate-400 line-clamp-1 mt-1">
            {slot.description}
          </p>
        </div>
      </div>

      {/* Footer dimension & category */}
      <div className="mt-2.5 pt-2 border-t border-[#1C2634] flex items-center justify-between text-[10px] text-slate-500">
        <span className="capitalize">{slot.category}</span>
        <span className="font-mono text-slate-400">
          {slot.recommendedWidth}×{slot.recommendedHeight} px
        </span>
      </div>
    </div>
  );
};
