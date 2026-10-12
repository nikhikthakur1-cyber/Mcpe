import React, { useRef, useState, useMemo, useEffect } from 'react';
import { Upload, Trash2, AlertTriangle, FileCheck, Info, ExternalLink, Eye, ArrowRight, Box, Layers } from 'lucide-react';
import { TextureSlot, ProjectFile } from '../../types';
import {
  getVanillaTextureUrl,
  getVanillaTextureFallbackUrl,
  getProceduralVanillaReferenceUrl,
} from '../../utils/vanillaTextureGenerator';
import { CanvasPixelPreview } from './CanvasPixelPreview';
import { Model3DViewer } from './Model3DViewer';
import { zipAssetService } from '../../services/zipAssetService';

interface TextureInspectorProps {
  selectedSlot: TextureSlot | null;
  customFile?: ProjectFile;
  onUploadTexture: (slot: TextureSlot, file: File) => Promise<void>;
  onRemoveCustomTexture: (slot: TextureSlot) => void;
  onJumpToExplorer?: (path: string) => void;
}

export const TextureInspector: React.FC<TextureInspectorProps> = ({
  selectedSlot,
  customFile,
  onUploadTexture,
  onRemoveCustomTexture,
  onJumpToExplorer,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [displayMode, setDisplayMode] = useState<'2d' | '3d'>('3d');
  const [imgSrc, setImgSrc] = useState<string | null>(null);

  const referenceUrl = useMemo(() => {
    if (!selectedSlot) return null;
    return getProceduralVanillaReferenceUrl(
      selectedSlot.id,
      selectedSlot.sampleColor || '#64748B',
      selectedSlot.recommendedWidth,
      selectedSlot.recommendedHeight
    );
  }, [selectedSlot]);

  useEffect(() => {
    if (!selectedSlot) {
      setImgSrc(null);
      return;
    }
    let isCancelled = false;
    zipAssetService.getTextureObjectUrl(selectedSlot.path).then((url) => {
      if (isCancelled) return;
      if (url) {
        setImgSrc(url);
      } else {
        setImgSrc(referenceUrl);
      }
    });
    return () => {
      isCancelled = true;
    };
  }, [selectedSlot, referenceUrl]);

  if (!selectedSlot) {
    return (
      <aside className="w-80 bg-[#111822] border-l border-[#1E293B] p-4 flex flex-col justify-center items-center text-center text-slate-500 text-xs">
        <Info className="w-8 h-8 text-slate-600 mb-2" />
        <p className="font-medium text-slate-400">No Texture Selected</p>
        <p className="text-[11px] text-slate-600 mt-1">
          Select any slot in the browser to view vanilla reference, inspect pixels, and replace with custom textures.
        </p>
      </aside>
    );
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);

    if (!file.name.toLowerCase().endsWith('.png') && file.type !== 'image/png') {
      setUploadError('Only PNG images are supported for Minecraft Bedrock textures.');
      return;
    }

    try {
      await onUploadTexture(selectedSlot, file);
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Failed to process image');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    setUploadError(null);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.png')) {
      setUploadError('Only PNG images are supported.');
      return;
    }

    try {
      await onUploadTexture(selectedSlot, file);
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Failed to process image');
    }
  };

  return (
    <aside className="w-80 bg-[#111822] border-l border-[#1E293B] flex flex-col h-full select-none shrink-0 overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-[#1E293B]">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-mono tracking-wider text-emerald-400 font-semibold">
            {selectedSlot.category} Slot
          </span>
          {customFile ? (
            <span className="text-[10px] text-emerald-400 font-mono font-medium flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded">
              <FileCheck className="w-3 h-3" />
              Customized in Pack
            </span>
          ) : (
            <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1 bg-[#1A2332] px-2 py-0.5 rounded">
              <Eye className="w-3 h-3 text-slate-400" />
              Vanilla Reference
            </span>
          )}
        </div>
        <h3 className="text-sm font-bold text-slate-100 mt-1">{selectedSlot.name}</h3>
        <p className="text-xs text-slate-400 mt-1">{selectedSlot.description}</p>
      </div>

      {/* Mode Switcher: 3D Viewport vs 2D Pixel Comparison */}
      <div className="p-3 border-b border-[#1E293B] bg-[#0E141E] flex items-center justify-between">
        <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-semibold">
          Preview Mode
        </span>
        <div className="flex items-center p-0.5 bg-[#080B10] rounded-lg border border-[#1E293B]">
          <button
            onClick={() => setDisplayMode('3d')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
              displayMode === '3d'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>3D Model</span>
          </button>
          <button
            onClick={() => setDisplayMode('2d')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
              displayMode === '2d'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>2D Sprite</span>
          </button>
        </div>
      </div>

      {/* 3D Model Viewport Area */}
      {displayMode === '3d' ? (
        <div className="p-3 border-b border-[#1E293B] bg-[#0A0E14] h-72">
          <Model3DViewer
            textureUrl={customFile ? null : imgSrc || referenceUrl}
            textureData={customFile?.data || null}
            category={selectedSlot.category}
            sampleColor={selectedSlot.sampleColor}
            name={selectedSlot.name}
            slotPath={selectedSlot.path}
            slotId={selectedSlot.id}
            recommendedDimensions={{
              width: selectedSlot.recommendedWidth,
              height: selectedSlot.recommendedHeight,
            }}
          />
        </div>
      ) : (
        /* Side-by-Side 2D Comparison Area */
        <div className="p-4 border-b border-[#1E293B] bg-[#0C1118]">
          <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-semibold block mb-2">
            {customFile ? 'Side-by-Side Comparison' : 'Vanilla Reference Preview'}
          </span>

          <div className="grid grid-cols-2 gap-2">
            {/* Default / Vanilla Reference Card */}
            <div className="bg-[#111822] border border-[#1E293B] rounded-lg p-2 flex flex-col items-center">
              <span className="text-[9px] font-mono text-slate-400 mb-1 flex items-center gap-1">
                <Eye className="w-2.5 h-2.5" /> Vanilla Sprite
              </span>
              <div
                className="w-16 h-16 rounded bg-[#0A0E14] border border-[#232F40] flex items-center justify-center p-1 overflow-hidden"
                style={{
                  backgroundImage: `linear-gradient(45deg, #182230 25%, transparent 25%),
                     linear-gradient(-45deg, #182230 25%, transparent 25%),
                     linear-gradient(45deg, transparent 75%, #182230 75%),
                     linear-gradient(-45deg, transparent 75%, #182230 75%)`,
                  backgroundSize: '6px 6px',
                }}
              >
                <img
                  src={imgSrc || referenceUrl || ''}
                  alt="Vanilla default"
                  className="w-full h-full object-contain"
                  style={{ imageRendering: 'pixelated' }}
                />
              </div>
              <span className="text-[8px] font-mono text-slate-500 mt-1 text-center">
                Display Only (Not in pack)
              </span>
            </div>

            {/* Custom Replacement Card */}
            <div
              className={`rounded-lg p-2 flex flex-col items-center border ${
                customFile
                  ? 'bg-emerald-950/20 border-emerald-500/40'
                  : 'bg-[#111822] border-dashed border-[#2A374A]'
              }`}
            >
              <span
                className={`text-[9px] font-mono mb-1 flex items-center gap-1 ${
                  customFile ? 'text-emerald-400' : 'text-slate-500'
                }`}
              >
                <FileCheck className="w-2.5 h-2.5" />
                {customFile ? 'Your Custom' : 'Not Replaced'}
              </span>
              <div
                className="w-16 h-16 rounded bg-[#0A0E14] border border-[#232F40] flex items-center justify-center p-1 overflow-hidden"
                style={{
                  backgroundImage: `linear-gradient(45deg, #182230 25%, transparent 25%),
                     linear-gradient(-45deg, #182230 25%, transparent 25%),
                     linear-gradient(45deg, transparent 75%, #182230 75%),
                     linear-gradient(-45deg, transparent 75%, #182230 75%)`,
                  backgroundSize: '6px 6px',
                }}
              >
                {customFile ? (
                  <img
                    src={URL.createObjectURL(new Blob([customFile.data as BlobPart], { type: 'image/png' }))}
                    alt="Your custom texture"
                    className="w-full h-full object-contain"
                    style={{ imageRendering: 'pixelated' }}
                  />
                ) : (
                  <span className="text-[10px] text-slate-600 text-center font-mono">
                    Drop PNG
                  </span>
                )}
              </div>
              <span
                className={`text-[8px] font-mono mt-1 text-center ${
                  customFile ? 'text-emerald-400' : 'text-slate-500'
                }`}
              >
                {customFile ? 'Saved to .mcpack' : 'Vanilla used in-game'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Target Path Specifications */}
      <div className="p-4 border-b border-[#1E293B] space-y-3">
        <div>
          <label className="text-[11px] text-slate-500 font-medium block">Bedrock Target Path</label>
          <div className="mt-1 p-2 bg-[#0B0F14] rounded border border-[#1E293B] flex items-center justify-between group">
            <code className="text-xs font-mono text-slate-300 break-all select-all">
              {selectedSlot.path}
            </code>
            {onJumpToExplorer && customFile && (
              <button
                onClick={() => onJumpToExplorer(selectedSlot.path)}
                title="View in File Explorer"
                className="text-slate-500 hover:text-sky-400 p-1 transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2 bg-[#0B0F14] rounded border border-[#1E293B]">
            <span className="text-[10px] text-slate-500 block">Recommended</span>
            <span className="font-mono text-slate-200 mt-0.5 block">
              {selectedSlot.recommendedWidth}×{selectedSlot.recommendedHeight} px
            </span>
          </div>
          <div className="p-2 bg-[#0B0F14] rounded border border-[#1E293B]">
            <span className="text-[10px] text-slate-500 block">File Format</span>
            <span className="font-mono text-slate-200 mt-0.5 block">PNG (RGBA)</span>
          </div>
        </div>

        {customFile ? (
          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded text-xs space-y-1">
            <div className="flex items-center justify-between text-emerald-400 font-medium">
              <span>Installed in Pack</span>
              <span className="font-mono text-[11px]">
                {(customFile.data.length / 1024).toFixed(1)} KB
              </span>
            </div>
            <p className="text-[11px] text-slate-300">
              Only customized files are bundled in your <code className="text-emerald-300">.mcpack</code>.
            </p>
          </div>
        ) : (
          <div className="p-2.5 bg-[#0E1520] border border-[#1E293B] rounded text-[11px] text-slate-400">
            This texture currently uses Minecraft Bedrock's default look. Replacing it will bundle your custom PNG into the pack.
          </div>
        )}
      </div>

      {/* Upload & Replacement Area */}
      <div className="p-4 border-b border-[#1E293B] space-y-3">
        <label className="text-xs font-semibold text-slate-200 block">
          {customFile ? 'Replace Custom Texture' : 'Upload & Replace With Custom'}
        </label>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-colors ${
            isDragging
              ? 'border-emerald-500 bg-emerald-500/10'
              : 'border-[#2A374A] hover:border-slate-500 bg-[#0B0F14]'
          }`}
        >
          <Upload className="w-5 h-5 mx-auto text-slate-400 mb-2" />
          <p className="text-xs font-medium text-slate-300">
            Click to upload PNG or drop image here
          </p>
          <p className="text-[10px] text-slate-500 mt-1">
            Replaces vanilla texture in game
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".png,image/png"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {uploadError && (
          <div className="p-2 bg-red-500/10 border border-red-500/30 rounded flex items-center gap-2 text-xs text-red-400">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}

        {customFile && (
          <button
            onClick={() => onRemoveCustomTexture(selectedSlot)}
            className="w-full py-2 px-3 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/30 rounded transition-colors flex items-center justify-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Revert to Vanilla (Remove from Pack)</span>
          </button>
        )}
      </div>

      {/* Guide & Tips */}
      <div className="p-4 text-[11px] text-slate-500 space-y-2">
        <h5 className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
          Bedrock Packaging Rule
        </h5>
        <p>
          Vanilla reference textures are shown for convenience. Unmodified textures are never copied into your <code>.mcpack</code> file, keeping your pack lightweight and fast to install.
        </p>
      </div>
    </aside>
  );
};
