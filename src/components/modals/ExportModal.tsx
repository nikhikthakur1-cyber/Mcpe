import React, { useState } from 'react';
import { X, Download, AlertCircle, AlertTriangle, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { BedrockManifest, ProjectFile, ValidationIssue } from '../../types';
import { generateMcPackArchive, triggerDownload } from '../../services/archiveService';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  manifest: BedrockManifest;
  files: Record<string, ProjectFile>;
  validationIssues: ValidationIssue[];
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  manifest,
  files,
  validationIssues,
}) => {
  const defaultFilename = (manifest.header.name || 'ResourcePack')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .toLowerCase();

  const [filename, setFilename] = useState(defaultFilename);
  const [isExporting, setIsExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  if (!isOpen) return null;

  const errors = validationIssues.filter((i) => i.severity === 'error');
  const warnings = validationIssues.filter((i) => i.severity === 'warning');
  const hasErrors = errors.length > 0;

  const handleExport = async () => {
    setIsExporting(true);
    setExportError(null);

    try {
      const sanitizedName = filename.trim() || 'my_resource_pack';
      const blob = await generateMcPackArchive({
        manifest,
        files,
        filename: sanitizedName,
      });

      triggerDownload(blob, `${sanitizedName}.mcpack`);
      setExportComplete(true);
    } catch (err: unknown) {
      setExportError(err instanceof Error ? err.message : 'Export failed to build archive.');
    } finally {
      setIsExporting(false);
    }
  };

  const totalFiles = Object.keys(files).length + 1; // including manifest.json

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 select-none">
      <div className="bg-[#111822] border border-[#1E293B] rounded-xl shadow-2xl max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-[#141C26] border-b border-[#1E293B] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Download className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-100">Export as Minecraft .mcpack</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-100 hover:bg-[#1E293B] rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          {exportComplete ? (
            <div className="p-5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
              <div>
                <h4 className="text-sm font-bold text-slate-100">Pack Exported Successfully!</h4>
                <p className="text-xs text-slate-300 mt-1">
                  Your <span className="font-mono text-emerald-300">{filename}.mcpack</span> file is ready and downloading.
                </p>
              </div>

              <div className="p-3 bg-[#0B0F14] rounded-lg text-[11px] text-slate-400 text-left space-y-1 border border-[#1E293B]">
                <p className="font-semibold text-slate-300">How to install in Minecraft Bedrock:</p>
                <p>1. Double-click the downloaded <strong className="text-slate-200">.mcpack</strong> file.</p>
                <p>2. Minecraft Bedrock Edition will automatically launch and import the pack.</p>
                <p>3. Go to <strong className="text-slate-200">Settings &gt; Global Resources</strong> to activate it.</p>
              </div>

              <button
                onClick={onClose}
                className="w-full py-2 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold rounded-md"
              >
                Done
              </button>
            </div>
          ) : (
            <>
              {/* Validation status badge */}
              {hasErrors ? (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg space-y-1.5">
                  <div className="flex items-center gap-2 text-red-400 font-bold">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errors.length} Blocking Issue(s) Detected</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Fix the following issues in the Manifest Editor or Validation Center before exporting to avoid Minecraft import errors:
                  </p>
                  <ul className="list-disc list-inside text-[11px] text-red-300 space-y-0.5 pl-1">
                    {errors.map((e) => (
                      <li key={e.id}>{e.title}: {e.message}</li>
                    ))}
                  </ul>
                </div>
              ) : warnings.length > 0 ? (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-start gap-2 text-amber-300">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="text-[11px]">
                    <span className="font-semibold">Notice:</span> {warnings.length} warning(s) detected. The pack is exportable, but reviewing warnings is recommended.
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center gap-2 text-emerald-400 font-medium">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Pack validation passed! Ready for Bedrock import.</span>
                </div>
              )}

              {/* Filename configuration */}
              <div>
                <label className="font-semibold text-slate-200 block mb-1.5">
                  Output Filename
                </label>
                <div className="flex items-center">
                  <input
                    type="text"
                    value={filename}
                    onChange={(e) => setFilename(e.target.value.replace(/[^a-zA-Z0-9_-]/g, '_'))}
                    placeholder="my_resource_pack"
                    className="flex-1 px-3 py-2 bg-[#0B0F14] border border-r-0 border-[#1E293B] rounded-l-md text-slate-100 font-mono text-xs outline-none focus:border-emerald-500"
                  />
                  <span className="px-3 py-2 bg-[#161F29] border border-[#1E293B] text-slate-400 font-mono text-xs rounded-r-md">
                    .mcpack
                  </span>
                </div>
              </div>

              {/* Pack contents summary */}
              <div className="p-3 bg-[#0B0F14] rounded-lg border border-[#1E293B] space-y-2 text-[11px]">
                <span className="font-semibold text-slate-300 block">Archive Structure:</span>
                <div className="grid grid-cols-2 gap-2 text-slate-400 font-mono">
                  <div>Pack: <strong className="text-slate-200">{manifest.header.name}</strong></div>
                  <div>Format: <strong className="text-emerald-400">format_version: 2</strong></div>
                  <div>Engine: <strong className="text-slate-200">v{manifest.header.min_engine_version?.join('.') || '1.26.52'}</strong></div>
                  <div>Files to Package: <strong className="text-emerald-400">{totalFiles} items</strong></div>
                </div>
                <div className="text-[10px] text-emerald-400/90 bg-emerald-500/10 p-2 rounded border border-emerald-500/20 font-sans">
                  ✓ Selective Packaging: Only customized textures and your project files are bundled. Vanilla reference textures are excluded to keep your download light and fast.
                </div>
              </div>

              {exportError && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded text-red-400">
                  {exportError}
                </div>
              )}

              {/* Footer Buttons */}
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
                  disabled={hasErrors || isExporting}
                  onClick={handleExport}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold rounded-md shadow-sm transition-colors disabled:opacity-50"
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Generating Archive...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      <span>Download .mcpack</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
