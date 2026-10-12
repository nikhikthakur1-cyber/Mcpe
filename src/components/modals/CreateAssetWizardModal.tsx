import React, { useState } from 'react';
import { X, Sparkles, FileCode2, Image, Layers, CheckCircle2, Copy, BookOpen } from 'lucide-react';
import { ASSET_TEMPLATES, CustomAssetTemplate } from '../../data/formatSpecs';

interface CreateAssetWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateAsset: (params: {
    assetType: 'block' | 'item' | 'flipbook' | 'entity';
    name: string;
    texturePath: string;
    jsonPath: string;
    initialJsonContent?: string;
  }) => Promise<void>;
}

export const CreateAssetWizardModal: React.FC<CreateAssetWizardModalProps> = ({
  isOpen,
  onClose,
  onCreateAsset,
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<CustomAssetTemplate>(ASSET_TEMPLATES[0]);
  const [identifier, setIdentifier] = useState('custom_ruby');
  const [isCreating, setIsCreating] = useState(false);
  const [activeStep, setActiveStep] = useState<'template' | 'config' | 'preview'>('template');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const cleanIdentifier = identifier.toLowerCase().replace(/[^a-z0-9_]/g, '_') || 'custom_asset';
  const resolvedTexturePath = selectedTemplate.category === 'item'
    ? `textures/items/${cleanIdentifier}.png`
    : selectedTemplate.category === 'entity'
    ? `textures/entity/${cleanIdentifier}/${cleanIdentifier}.png`
    : `textures/blocks/${cleanIdentifier}.png`;

  const jsonSnippet = selectedTemplate.sampleJsonSnippet(
    cleanIdentifier,
    resolvedTexturePath.replace(/\.png$/, '')
  );

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      await onCreateAsset({
        assetType: selectedTemplate.category,
        name: cleanIdentifier,
        texturePath: resolvedTexturePath,
        jsonPath: selectedTemplate.targetJsonPath,
        initialJsonContent: jsonSnippet,
      });
      onClose();
    } finally {
      setIsCreating(false);
    }
  };

  const copySnippet = () => {
    navigator.clipboard.writeText(jsonSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 select-none">
      <div className="bg-[#111822] border border-[#1E293B] rounded-xl max-w-2xl w-full flex flex-col max-h-[90vh] shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 bg-[#141C26] border-b border-[#1E293B] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <span>Create Custom Bedrock Asset & JSON Definition</span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                  v1.26.52.3
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Scaffold new blocks, items, or animations with required Bedrock JSON & texture bindings.
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

        {/* Step Navigation Tabs */}
        <div className="flex border-b border-[#1E293B] bg-[#0E141D] text-xs font-mono">
          <button
            onClick={() => setActiveStep('template')}
            className={`flex-1 py-2.5 px-4 text-center border-b-2 transition-colors flex items-center justify-center gap-2 ${
              activeStep === 'template'
                ? 'border-emerald-500 text-emerald-400 bg-[#141C26]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>1. Asset Type</span>
          </button>
          <button
            onClick={() => setActiveStep('config')}
            className={`flex-1 py-2.5 px-4 text-center border-b-2 transition-colors flex items-center justify-center gap-2 ${
              activeStep === 'config'
                ? 'border-emerald-500 text-emerald-400 bg-[#141C26]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>2. Paths & Naming</span>
          </button>
          <button
            onClick={() => setActiveStep('preview')}
            className={`flex-1 py-2.5 px-4 text-center border-b-2 transition-colors flex items-center justify-center gap-2 ${
              activeStep === 'preview'
                ? 'border-emerald-500 text-emerald-400 bg-[#141C26]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>3. Bedrock Schema Review</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {activeStep === 'template' && (
            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-300 block">
                Choose Asset Type to Scaffold
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {ASSET_TEMPLATES.map((tmpl) => (
                  <div
                    key={tmpl.id}
                    onClick={() => setSelectedTemplate(tmpl)}
                    className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                      selectedTemplate.id === tmpl.id
                        ? 'bg-emerald-950/20 border-emerald-500/60 ring-1 ring-emerald-500/30'
                        : 'bg-[#141C26] border-[#1E293B] hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-emerald-400" />
                        {tmpl.title}
                      </span>
                      {selectedTemplate.id === tmpl.id && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mb-2 leading-relaxed">
                      {tmpl.description}
                    </p>
                    <div className="text-[10px] font-mono text-slate-500 bg-[#0B0F14] p-1.5 rounded border border-[#1E293B]">
                      <span className="text-emerald-400">Target:</span> {tmpl.targetJsonPath}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeStep === 'config' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block">
                  Asset Identifier (Unique Name)
                </label>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Used by Minecraft Bedrock behavior files and texture atlases. Use lowercase letters and underscores.
                </p>
                <div className="mt-1.5 flex items-center gap-2">
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="e.g. ruby_block, laser_sword"
                    className="flex-1 px-3 py-2 bg-[#0B0F14] border border-[#1E293B] rounded-lg text-xs font-mono text-slate-100 outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Generated Path Review */}
              <div className="p-3.5 bg-[#0B0F14] border border-[#1E293B] rounded-lg space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between text-slate-400 pb-1.5 border-b border-[#1E293B]">
                  <span>Bedrock File Mapping</span>
                  <span className="text-emerald-400 text-[10px]">Ready to Scaffold</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">TEXTURE PNG PATH:</span>
                  <span className="text-slate-200">{resolvedTexturePath}</span>
                  <span className="text-[10px] text-slate-500 block">
                    (Default dimensions: {selectedTemplate.suggestedDimensions.width}×
                    {selectedTemplate.suggestedDimensions.height} px)
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">JSON ATLAS PATH:</span>
                  <span className="text-sky-300">{selectedTemplate.targetJsonPath}</span>
                </div>
              </div>
            </div>
          )}

          {activeStep === 'preview' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300">
                  Bedrock JSON Definition Schema
                </label>
                <button
                  onClick={copySnippet}
                  className="px-2 py-1 text-[10px] font-mono text-slate-400 hover:text-white bg-[#1E293B] rounded flex items-center gap-1 transition-colors"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copied ? 'Copied!' : 'Copy Schema'}</span>
                </button>
              </div>

              <div className="bg-[#0B0F14] border border-[#1E293B] rounded-lg p-3 overflow-x-auto max-h-56 font-mono text-xs text-emerald-300">
                <pre>{jsonSnippet}</pre>
              </div>

              <div className="p-3 bg-[#141C26] rounded-lg border border-[#1E293B] text-[11px] text-slate-400 space-y-1">
                <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-sky-400" />
                  <span>What Minecraft Bedrock Expects:</span>
                </div>
                <p>
                  1. The texture path omitting <code>.png</code> inside the JSON definition.
                </p>
                <p>
                  2. A matching 32-bit RGBA PNG image placed at <code>{resolvedTexturePath}</code>.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#141C26] border-t border-[#1E293B] flex items-center justify-between">
          <div className="text-xs text-slate-400">
            {activeStep === 'template' && 'Step 1 of 3'}
            {activeStep === 'config' && 'Step 2 of 3'}
            {activeStep === 'preview' && 'Step 3 of 3: Ready to create'}
          </div>

          <div className="flex items-center gap-2">
            {activeStep !== 'template' && (
              <button
                onClick={() =>
                  setActiveStep((s) => (s === 'preview' ? 'config' : 'template'))
                }
                className="px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-[#1E293B] rounded transition-colors"
              >
                Back
              </button>
            )}

            {activeStep !== 'preview' ? (
              <button
                onClick={() =>
                  setActiveStep((s) => (s === 'template' ? 'config' : 'preview'))
                }
                className="px-4 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded transition-colors"
              >
                Next Step
              </button>
            ) : (
              <button
                onClick={handleCreate}
                disabled={isCreating}
                className="px-4 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded transition-colors flex items-center gap-1.5 shadow-md shadow-emerald-900/30"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isCreating ? 'Scaffolding...' : 'Scaffold JSON & Texture'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
