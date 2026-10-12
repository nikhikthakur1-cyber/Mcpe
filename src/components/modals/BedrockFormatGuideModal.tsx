import React, { useState } from 'react';
import { X, BookOpen, Layers, FileCode2, Copy, Check, Info } from 'lucide-react';
import { BEDROCK_FORMAT_SPECS, FormatSpec } from '../../data/formatSpecs';

interface BedrockFormatGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BedrockFormatGuideModal: React.FC<BedrockFormatGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [selectedSpec, setSelectedSpec] = useState<FormatSpec>(BEDROCK_FORMAT_SPECS[0]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const filteredSpecs = BEDROCK_FORMAT_SPECS.filter(
    (s) => selectedCategory === 'all' || s.category === selectedCategory
  );

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 select-none">
      <div className="bg-[#111822] border border-[#1E293B] rounded-xl max-w-4xl w-full flex flex-col h-[85vh] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-[#141C26] border-b border-[#1E293B] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <span>Minecraft Bedrock v1.26.52.3 Format & Code Specs</span>
                <span className="text-[10px] font-mono text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded">
                  Official Standard
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Format definitions, dimensions, color depth, and JSON syntax required for MCPE / Bedrock.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-200 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Spec List */}
          <div className="w-72 bg-[#0E141D] border-r border-[#1E293B] flex flex-col h-full overflow-hidden shrink-0">
            {/* Filter bar */}
            <div className="p-2 border-b border-[#1E293B] flex gap-1 overflow-x-auto text-[10px] font-mono">
              {['all', 'textures', 'atlases', 'metadata', 'audio'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2 py-1 rounded capitalize transition-colors ${
                    selectedCategory === cat
                      ? 'bg-sky-500/20 text-sky-400 font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {filteredSpecs.map((spec) => (
                <div
                  key={spec.id}
                  onClick={() => setSelectedSpec(spec)}
                  className={`p-2.5 rounded-lg cursor-pointer transition-colors text-xs ${
                    selectedSpec.id === spec.id
                      ? 'bg-[#182332] text-white border border-sky-500/40'
                      : 'text-slate-300 hover:bg-[#141C26]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold truncate">{spec.name}</span>
                    <span className="font-mono text-[10px] text-sky-400 bg-sky-500/10 px-1 py-0.5 rounded">
                      {spec.extension}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono block truncate mt-0.5">
                    {spec.pathPattern}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Spec Detail */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#111822]">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-sky-400 font-semibold">
                  {selectedSpec.category} Specification
                </span>
                <h3 className="text-base font-bold text-slate-100 mt-0.5">
                  {selectedSpec.name} ({selectedSpec.extension})
                </h3>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {selectedSpec.description}
            </p>

            {/* Quick Specs Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-[#0B0F14] rounded-lg border border-[#1E293B]">
                <span className="text-[10px] text-slate-500 font-mono block">COLOR DEPTH & CHANNELS</span>
                <span className="text-slate-200 font-mono mt-1 block">
                  {selectedSpec.colorDepth}
                </span>
              </div>
              <div className="p-3 bg-[#0B0F14] rounded-lg border border-[#1E293B]">
                <span className="text-[10px] text-slate-500 font-mono block">RECOMMENDED RESOLUTION</span>
                <span className="text-slate-200 font-mono mt-1 block">
                  {selectedSpec.recommendedDimensions}
                </span>
              </div>
              <div className="p-3 bg-[#0B0F14] rounded-lg border border-[#1E293B] sm:col-span-2">
                <span className="text-[10px] text-slate-500 font-mono block">PATH TEMPLATE IN PACK</span>
                <code className="text-sky-300 font-mono text-xs mt-1 block">
                  {selectedSpec.pathPattern}
                </code>
              </div>
            </div>

            {/* Bedrock Requirements Note */}
            <div className="p-3.5 bg-sky-950/20 border border-sky-500/30 rounded-lg text-xs space-y-1.5">
              <div className="flex items-center gap-2 text-sky-400 font-semibold">
                <Info className="w-4 h-4 shrink-0" />
                <span>Bedrock Engine Rule (1.26.52.3)</span>
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                {selectedSpec.bedrockNote}
              </p>
            </div>

            {/* Example Code Snippet */}
            {selectedSpec.exampleSnippet && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <FileCode2 className="w-3.5 h-3.5 text-emerald-400" />
                    Example Code & Schema
                  </span>
                  <button
                    onClick={() => copyCode(selectedSpec.exampleSnippet!)}
                    className="px-2 py-1 text-[10px] font-mono text-slate-400 hover:text-white bg-[#1E293B] rounded flex items-center gap-1 transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy Snippet</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="bg-[#0B0F14] border border-[#1E293B] rounded-lg p-3 font-mono text-xs text-emerald-300 overflow-x-auto max-h-60">
                  <pre>{selectedSpec.exampleSnippet}</pre>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#141C26] border-t border-[#1E293B] flex items-center justify-between text-xs text-slate-400">
          <span>Standards verified against Bedrock 1.26.52.3 client parser.</span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-[#1E293B] hover:bg-slate-700 text-slate-200 rounded transition-colors text-xs"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
