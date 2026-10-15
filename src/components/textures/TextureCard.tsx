import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Check, Box, Sword, Sparkles, Layout, Cloud, Eye, RotateCw } from 'lucide-react';
import { TextureSlot } from '../../types';
import { textureUrlCache } from '../../utils/lruCache';
import {
  getProceduralVanillaReferenceUrl,
} from '../../utils/vanillaTextureGenerator';
import { zipAssetService } from '../../services/zipAssetService';

interface TextureCardProps {
  slot: TextureSlot;
  isSelected: boolean;
  isCustomized: boolean;
  customImageData?: Uint8Array;
  onSelect: (slot: TextureSlot) => void;
  isCompact?: boolean;
}

export const TextureCard: React.FC<TextureCardProps> = ({
  slot,
  isSelected,
  isCustomized,
  customImageData,
  onSelect,
  isCompact = false,
}) => {
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const cardRef = useRef<HTMLDivElement | null>(null);

  // Fallback procedural vanilla reference url
  const referenceUrl = useMemo(() => {
    return getProceduralVanillaReferenceUrl(
      slot.id,
      slot.sampleColor || '#64748B',
      slot.recommendedWidth,
      slot.recommendedHeight
    );
  }, [slot.id, slot.sampleColor, slot.recommendedWidth, slot.recommendedHeight]);

  // Viewport-based lazy loading with IntersectionObserver
  useEffect(() => {
    const node = cardRef.current;
    if (!node) return;

    if (typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '160px',
        threshold: 0.01,
      }
    );

    observer.observe(node);
    return () => {
      observer.disconnect();
    };
  }, []);

  // Fetch / extract texture on-demand ONLY when visible in viewport
  useEffect(() => {
    if (!isVisible) return;

    let isCancelled = false;

    const loadTextureSrc = async () => {
      setHasError(false);

      // 1. Customized user texture
      if (isCustomized && customImageData && customImageData.length > 0) {
        const cachedUrl = textureUrlCache.set(slot.path, customImageData);
        if (!isCancelled) setThumbUrl(cachedUrl);
        return;
      }
      setThumbUrl(null);

      // 2. Synchronous in-memory cache check (<1ms)
      const syncUrl = zipAssetService.getTextureObjectUrlSync(slot.path);
      if (syncUrl) {
        if (!isCancelled) setImgSrc(syncUrl);
        return;
      }

      // 3. Asynchronous on-demand extraction from local ZIP or Mojang fallback
      setIsLoading(true);
      try {
        const asyncUrl = await zipAssetService.getTextureObjectUrl(slot.path);
        if (isCancelled) return;
        if (asyncUrl) {
          setImgSrc(asyncUrl);
        } else {
          setImgSrc(referenceUrl);
        }
      } catch {
        if (!isCancelled) {
          setImgSrc(referenceUrl);
          setHasError(true);
        }
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    };

    loadTextureSrc();

    return () => {
      isCancelled = true;
    };
  }, [isVisible, slot.path, isCustomized, customImageData, referenceUrl, retryCount]);

  const handleImageError = () => {
    setHasError(true);
    if (imgSrc !== referenceUrl) {
      setImgSrc(referenceUrl);
    }
  };

  const handleRetry = (e: React.MouseEvent) => {
    e.stopPropagation();
    setHasError(false);
    setIsLoading(true);
    setRetryCount((c) => c + 1);
  };

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
      ref={cardRef}
      onClick={() => onSelect(slot)}
      className={`group relative rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
        isCompact ? 'p-2' : 'p-3'
      } ${
        isSelected
          ? 'bg-[#162232] border-sky-400 shadow-[0_0_20px_rgba(56,189,248,0.2)] ring-1 ring-sky-400/30'
          : isCustomized
          ? 'bg-[#121E24] border-emerald-500/40 hover:border-emerald-400 hover:shadow-[0_0_15px_rgba(16,185,129,0.1)]'
          : 'bg-[#101722] border-[#1C2738] hover:border-slate-600 hover:bg-[#131D2A]'
      }`}
    >
      <div className={`flex items-start ${isCompact ? 'gap-2' : 'gap-3'}`}>
        {/* Preview Thumbnail Box with pixel checkerboard */}
        <div
          className={`${
            isCompact ? 'w-11 h-11' : 'w-14 h-14'
          } rounded-lg bg-[#090D14] border border-[#223044] shrink-0 flex items-center justify-center overflow-hidden relative shadow-inner group-hover:scale-105 transition-transform`}
          style={{
            backgroundImage: `linear-gradient(45deg, #151D28 25%, transparent 25%),
               linear-gradient(-45deg, #151D28 25%, transparent 25%),
               linear-gradient(45deg, transparent 75%, #151D28 75%),
               linear-gradient(-45deg, transparent 75%, #151D28 75%)`,
            backgroundSize: '10px 10px',
          }}
        >
          {hasError ? (
            <div
              onClick={handleRetry}
              title="Click to retry loading texture"
              className="w-full h-full flex flex-col items-center justify-center bg-black/60 hover:bg-black/80 transition-colors p-1 text-center cursor-pointer group/retry"
            >
              <RotateCw className="w-3.5 h-3.5 text-amber-400 group-hover/retry:rotate-180 transition-transform" />
              <span className="text-[8px] text-amber-300 font-mono mt-0.5">Retry</span>
            </div>
          ) : thumbUrl ? (
            <img
              src={thumbUrl}
              alt={slot.name}
              onError={handleImageError}
              className="w-full h-full object-contain p-1"
              style={{ imageRendering: 'pixelated' }}
            />
          ) : imgSrc ? (
            <img
              src={imgSrc}
              alt={`${slot.name} vanilla`}
              loading="lazy"
              onError={handleImageError}
              className="w-full h-full object-contain p-1 opacity-90 group-hover:opacity-100 transition-opacity"
              style={{ imageRendering: 'pixelated' }}
            />
          ) : isLoading ? (
            <div className="w-full h-full flex items-center justify-center bg-slate-900/60 animate-pulse">
              <div className="w-3.5 h-3.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : isVisible && referenceUrl ? (
            <img
              src={referenceUrl}
              alt={`${slot.name} reference`}
              onError={handleImageError}
              className="w-full h-full object-contain p-1 opacity-80 group-hover:opacity-100 transition-opacity"
              style={{ imageRendering: 'pixelated' }}
            />
          ) : (
            <div
              className="w-8 h-8 rounded flex items-center justify-center text-slate-400"
              style={{ backgroundColor: `${slot.sampleColor || '#38BDF8'}20` }}
            >
              {getCategoryIcon()}
            </div>
          )}

          {/* Reference indicator icon when uncustomized */}
          {!isCustomized && !hasError && (
            <div
              title="Vanilla Reference (Mojang Official)"
              className="absolute bottom-0 right-0 bg-[#0B0F14]/90 px-0.5 py-0.2 rounded-tl text-[8px] text-slate-400 font-mono"
            >
              <Eye className="w-2.5 h-2.5 text-slate-400 inline" />
            </div>
          )}
        </div>

        {/* Slot Info */}
        <div className="min-w-0 flex-1 overflow-hidden">
          <div className="flex items-center justify-between gap-1">
            <h4 className="text-xs font-bold text-slate-100 truncate group-hover:text-white min-w-0">
              <span className="truncate block">{slot.name}</span>
            </h4>
            {isCustomized ? (
              <span className="flex items-center gap-0.5 text-[9px] text-emerald-300 font-semibold shrink-0 bg-emerald-500/20 border border-emerald-500/30 px-1 py-0.2 rounded">
                <Check className="w-2.5 h-2.5 text-emerald-400" />
                {!isCompact && <span>Custom</span>}
              </span>
            ) : (
              !isCompact && (
                <span className="text-[9px] text-slate-400 font-mono shrink-0 bg-[#16202E] border border-[#202E42] px-1 py-0.2 rounded">
                  Vanilla
                </span>
              )
            )}
          </div>

          <p className="text-[10px] font-mono text-slate-400 truncate mt-0.5" title={slot.path}>
            {slot.path}
          </p>

          {!isCompact && (
            <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5 leading-snug">
              {slot.description}
            </p>
          )}
        </div>
      </div>

      {/* Footer dimension & category */}
      {!isCompact && (
        <div className="mt-2.5 pt-1.5 border-t border-[#1C2738] flex items-center justify-between text-[10px] text-slate-400">
          <span className="capitalize flex items-center gap-1 text-slate-300 truncate min-w-0">
            <span className="text-slate-400 shrink-0">{getCategoryIcon()}</span>
            <span className="truncate">{slot.category}</span>
          </span>
          <span className="font-mono text-slate-400 bg-[#0A0E14] px-1.5 py-0.5 rounded border border-[#1E293B] shrink-0">
            {slot.recommendedWidth}×{slot.recommendedHeight}px
          </span>
        </div>
      )}
    </div>
  );
};
