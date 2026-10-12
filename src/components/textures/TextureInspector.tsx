import React, { useRef, useState } from 'react';
import { Upload, Trash2, AlertTriangle, FileCheck, Info, ExternalLink } from 'lucide-react';
import { TextureSlot, ProjectFile } from '../../types';

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

  if (!selectedSlot) {
    return (
      <aside className="w-80 bg-[#111822] border-l border-[#1E293B] p-4 flex flex-col justify-center items-center text-center text-slate-500 text-xs">
        <Info className="w-8 h-8 text-slate-600 mb-2" />
        <p className="font-medium text-slate-400">No Texture Selected</p>
        <p className="text-[11px] text-slate-600 mt-1">
          Select any slot in the browser to view details, inspect pixels, and upload custom textures.
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
          {customFile && (
            <span className="text-[10px] text-emerald-400 font-mono font-medium flex items-center gap-1">
              <FileCheck className="w-3 h-3" />
              Customized
            </span>
          )}
        </div>
        <h3 className="text-sm font-bold text-slate-100 mt-1">{selectedSlot.name}</h3>
        <p className="text-xs text-slate-400 mt-1">{selectedSlot.description}</p>
      </div>

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

        {customFile && (
          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded text-xs space-y-1">
            <div className="flex items-center justify-between text-emerald-400 font-medium">
              <span>Installed File</span>
              <span className="font-mono text-[11px]">
                {(customFile.data.length / 1024).toFixed(1)} KB
              </span>
            </div>
            <p className="text-[11px] text-slate-300">
              Placed in resource pack at: <code className="font-mono text-emerald-300">{customFile.path}</code>
            </p>
          </div>
        )}
      </div>

      {/* Upload & Replacement Area */}
      <div className="p-4 border-b border-[#1E293B] space-y-3">
        <label className="text-xs font-semibold text-slate-200 block">
          {customFile ? 'Replace Texture' : 'Upload Custom Texture'}
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
            Standard Minecraft pixel art format (16×16, 32×32, 64×64)
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
            <span>Remove Custom Texture</span>
          </button>
        )}
      </div>

      {/* Guide & Tips */}
      <div className="p-4 text-[11px] text-slate-500 space-y-2">
        <h5 className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
          Bedrock Guidelines
        </h5>
        <p>
          Bedrock Edition loads PNG textures directly from subdirectories matching this exact relative path.
        </p>
        <p>
          Any power-of-two resolution (16x, 32x, 64x, 128x) works, but maintaining uniform pixel density looks best in-game.
        </p>
      </div>
    </aside>
  );
};
