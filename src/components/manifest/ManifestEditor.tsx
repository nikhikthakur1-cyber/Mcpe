import React, { useState, useEffect } from 'react';
import { RefreshCw, Code, CheckCircle, AlertTriangle, AlertCircle, Copy, Check } from 'lucide-react';
import { BedrockManifest, ValidationIssue } from '../../types';
import { generateDistinctUUIDs } from '../../utils/uuid';
import { formatManifestJSON, parseManifestJSON, validateManifest } from '../../services/manifestService';

interface ManifestEditorProps {
  manifest: BedrockManifest;
  onChange: (updated: BedrockManifest) => void;
  validationIssues: ValidationIssue[];
}

export const ManifestEditor: React.FC<ManifestEditorProps> = ({
  manifest,
  onChange,
  validationIssues,
}) => {
  const [activeMode, setActiveMode] = useState<'form' | 'json'>('form');
  const [rawJsonText, setRawJsonText] = useState(formatManifestJSON(manifest));
  const [jsonParseError, setJsonParseError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setRawJsonText(formatManifestJSON(manifest));
  }, [manifest]);

  const handleFieldChange = (field: string, value: unknown) => {
    const updated = { ...manifest };
    if (field === 'name') {
      updated.header = { ...updated.header, name: String(value) };
    } else if (field === 'description') {
      updated.header = { ...updated.header, description: String(value) };
    } else if (field === 'headerUuid') {
      updated.header = { ...updated.header, uuid: String(value) };
    } else if (field === 'moduleUuid') {
      if (updated.modules?.[0]) {
        updated.modules[0] = { ...updated.modules[0], uuid: String(value) };
      }
    } else if (field.startsWith('version_')) {
      const idx = parseInt(field.split('_')[1], 10);
      const newVer = [...updated.header.version] as [number, number, number];
      newVer[idx] = Math.max(0, parseInt(String(value), 10) || 0);
      updated.header = { ...updated.header, version: newVer };
      if (updated.modules?.[0]) {
        updated.modules[0] = { ...updated.modules[0], version: newVer };
      }
    } else if (field.startsWith('engine_')) {
      const idx = parseInt(field.split('_')[1], 10);
      const newEng = [...(updated.header.min_engine_version || [1, 20, 0])] as [number, number, number];
      newEng[idx] = Math.max(0, parseInt(String(value), 10) || 0);
      updated.header = { ...updated.header, min_engine_version: newEng };
    }
    onChange(updated);
  };

  const handleRegenerateUUIDs = () => {
    if (
      window.confirm(
        'Regenerate manifest UUIDs? Note: Minecraft treats this as a brand new resource pack upon import.'
      )
    ) {
      const { headerUuid, moduleUuid } = generateDistinctUUIDs();
      const updated: BedrockManifest = {
        ...manifest,
        header: {
          ...manifest.header,
          uuid: headerUuid,
        },
        modules: [
          {
            ...manifest.modules[0],
            uuid: moduleUuid,
          },
        ],
      };
      onChange(updated);
    }
  };

  const handleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setRawJsonText(text);
    const result = parseManifestJSON(text);
    if (result.error) {
      setJsonParseError(result.error);
    } else if (result.manifest) {
      setJsonParseError(null);
      onChange(result.manifest);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(rawJsonText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const manifestIssues = validationIssues.filter((i) => i.fieldOrPath?.startsWith('header') || i.fieldOrPath?.startsWith('modules') || i.fieldOrPath === 'format_version');
  const errorCount = manifestIssues.filter((i) => i.severity === 'error').length;

  return (
    <div className="flex h-full w-full bg-[#0B0F14] select-none">
      {/* Left Form Editor */}
      <div className="flex-1 flex flex-col h-full overflow-hidden border-r border-[#1E293B]">
        {/* Sub Header */}
        <div className="p-4 bg-[#111822] border-b border-[#1E293B] flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span>Manifest Configuration</span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                Format v2
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Defines resource pack registration, unique IDs, and Minecraft Bedrock compatibility.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveMode(activeMode === 'form' ? 'json' : 'form')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                activeMode === 'json'
                  ? 'bg-sky-500/10 border-sky-500/40 text-sky-400'
                  : 'bg-[#161F29] border-[#1E293B] text-slate-300 hover:text-slate-100'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>{activeMode === 'form' ? 'Raw JSON Mode' : 'Form Mode'}</span>
            </button>
          </div>
        </div>

        {/* Content Form or JSON Editor */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeMode === 'form' ? (
            <div className="max-w-2xl space-y-5">
              {/* Basic Pack Info */}
              <div className="space-y-4 bg-[#111822] p-5 rounded-lg border border-[#1E293B]">
                <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Basic Pack Details
                </h3>

                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1.5">
                    Pack Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={manifest.header.name || ''}
                    onChange={(e) => handleFieldChange('name', e.target.value)}
                    placeholder="e.g. Pure Faithful 32x"
                    className="w-full px-3 py-2 bg-[#0B0F14] border border-[#1E293B] rounded-md text-slate-100 text-xs outline-none focus:border-emerald-500 font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1.5">
                    Pack Description
                  </label>
                  <textarea
                    rows={3}
                    value={manifest.header.description || ''}
                    onChange={(e) => handleFieldChange('description', e.target.value)}
                    placeholder="Describe your resource pack theme, style, or credits..."
                    className="w-full px-3 py-2 bg-[#0B0F14] border border-[#1E293B] rounded-md text-slate-100 text-xs outline-none focus:border-emerald-500 resize-none"
                  />
                </div>
              </div>

              {/* Version Numbers */}
              <div className="space-y-4 bg-[#111822] p-5 rounded-lg border border-[#1E293B]">
                <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Versioning & Target Engine
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-slate-300 block mb-1.5">
                      Pack Version [Major, Minor, Patch]
                    </label>
                    <div className="flex items-center gap-2">
                      {[0, 1, 2].map((idx) => (
                        <input
                          key={`ver_${idx}`}
                          type="number"
                          min="0"
                          value={manifest.header.version?.[idx] ?? 0}
                          onChange={(e) => handleFieldChange(`version_${idx}`, e.target.value)}
                          className="w-16 px-2.5 py-1.5 bg-[#0B0F14] border border-[#1E293B] rounded text-slate-100 text-xs font-mono text-center outline-none focus:border-emerald-500"
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-300 block mb-1.5">
                      Min Engine Version [Major, Minor, Patch]
                    </label>
                    <div className="flex items-center gap-2">
                      {[0, 1, 2].map((idx) => (
                        <input
                          key={`eng_${idx}`}
                          type="number"
                          min="0"
                          value={manifest.header.min_engine_version?.[idx] ?? 0}
                          onChange={(e) => handleFieldChange(`engine_${idx}`, e.target.value)}
                          className="w-16 px-2.5 py-1.5 bg-[#0B0F14] border border-[#1E293B] rounded text-slate-100 text-xs font-mono text-center outline-none focus:border-emerald-500"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* UUID Identifiers */}
              <div className="space-y-4 bg-[#111822] p-5 rounded-lg border border-[#1E293B]">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Pack Identifiers (RFC4122 v4 UUIDs)
                  </h3>
                  <button
                    onClick={handleRegenerateUUIDs}
                    title="Generate new distinct UUIDs"
                    className="flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Regenerate IDs</span>
                  </button>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    Header UUID (Pack Identity)
                  </label>
                  <input
                    type="text"
                    value={manifest.header.uuid || ''}
                    onChange={(e) => handleFieldChange('headerUuid', e.target.value)}
                    className="w-full px-3 py-1.5 bg-[#0B0F14] border border-[#1E293B] rounded text-slate-200 text-xs font-mono outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    Module UUID (Resource Component Identity)
                  </label>
                  <input
                    type="text"
                    value={manifest.modules?.[0]?.uuid || ''}
                    onChange={(e) => handleFieldChange('moduleUuid', e.target.value)}
                    className="w-full px-3 py-1.5 bg-[#0B0F14] border border-[#1E293B] rounded text-slate-200 text-xs font-mono outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col space-y-2">
              <label className="text-xs text-slate-400 font-medium">
                Direct JSON Manifest Editing
              </label>
              <textarea
                value={rawJsonText}
                onChange={handleJsonChange}
                rows={22}
                className="w-full font-mono text-xs bg-[#0B0F14] text-emerald-400 p-4 rounded-lg border border-[#1E293B] focus:border-sky-500 outline-none leading-relaxed"
              />
              {jsonParseError && (
                <div className="p-2.5 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>JSON Parse Error: {jsonParseError}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Synchronized JSON Preview Panel */}
      <div className="w-96 flex flex-col h-full bg-[#0E141D] shrink-0">
        <div className="p-4 bg-[#141C26] border-b border-[#1E293B] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-200">manifest.json Preview</span>
            {errorCount === 0 ? (
              <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                <CheckCircle className="w-3 h-3" /> Valid
              </span>
            ) : (
              <span className="text-[10px] text-red-400 flex items-center gap-1 font-mono">
                <AlertTriangle className="w-3 h-3" /> {errorCount} issues
              </span>
            )}
          </div>

          <button
            onClick={copyToClipboard}
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 p-1 rounded"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        <div className="flex-1 p-4 overflow-auto bg-[#090D12]">
          <pre className="text-xs font-mono text-slate-300 leading-relaxed whitespace-pre-wrap">
            {rawJsonText}
          </pre>
        </div>

        {manifestIssues.length > 0 && (
          <div className="p-3 bg-[#111822] border-t border-[#1E293B] max-h-40 overflow-y-auto space-y-1.5">
            <span className="text-[10px] uppercase font-mono text-slate-400 block font-semibold">
              Manifest Audit
            </span>
            {manifestIssues.map((issue) => (
              <div
                key={issue.id}
                className={`text-[11px] p-2 rounded border flex items-start gap-1.5 ${
                  issue.severity === 'error'
                    ? 'bg-red-500/10 border-red-500/30 text-red-400'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                }`}
              >
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">{issue.title}</p>
                  <p className="text-[10px] text-slate-400">{issue.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
