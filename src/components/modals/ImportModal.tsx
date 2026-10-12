import React, { useRef, useState } from 'react';
import { X, UploadCloud, AlertTriangle, CheckCircle2, Loader2, FileArchive } from 'lucide-react';
import { importArchiveFile, ImportArchiveResult } from '../../services/archiveService';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmImport: (result: ImportArchiveResult) => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  onConfirmImport,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [importResult, setImportResult] = useState<ImportArchiveResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleProcessFile = async (file: File) => {
    setLoading(true);
    setErrorMessage(null);
    setImportResult(null);

    const isSupported =
      file.name.toLowerCase().endsWith('.mcpack') ||
      file.name.toLowerCase().endsWith('.zip');

    if (!isSupported) {
      setErrorMessage('Please select a valid .mcpack or .zip file archive.');
      setLoading(false);
      return;
    }

    try {
      const result = await importArchiveFile(file);
      setImportResult(result);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to read archive file');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleProcessFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleProcessFile(file);
  };

  const handleConfirm = () => {
    if (importResult) {
      onConfirmImport(importResult);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 select-none">
      <div className="bg-[#111822] border border-[#1E293B] rounded-xl shadow-2xl max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-[#141C26] border-b border-[#1E293B] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <FileArchive className="w-5 h-5 text-sky-400" />
            <h3 className="text-sm font-bold text-slate-100">Import Resource Pack Archive</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-100 hover:bg-[#1E293B] rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* Drag & Drop Box */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
              isDragging
                ? 'border-sky-400 bg-sky-500/10'
                : 'border-[#2A374A] hover:border-slate-500 bg-[#0B0F14]'
            }`}
          >
            {loading ? (
              <div className="flex flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 text-sky-400 animate-spin mb-2" />
                <p className="text-xs text-slate-300 font-medium">Unpacking archive files in browser...</p>
              </div>
            ) : (
              <>
                <UploadCloud className="w-10 h-10 mx-auto text-sky-400 mb-3" />
                <p className="text-sm font-semibold text-slate-200">
                  Select or drag a <span className="text-sky-300">.mcpack</span> or <span className="text-sky-300">.zip</span> file
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Files are processed 100% locally in your browser with private memory storage.
                </p>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".mcpack,.zip,application/zip"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded flex items-center gap-2 text-xs text-red-400">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Import Inspection Result */}
          {importResult && (
            <div className="p-4 bg-[#0B0F14] border border-[#1E293B] rounded-lg space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-200">Archive Inspection</span>
                <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Read Complete
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 bg-[#111822] rounded border border-[#1E293B]">
                  <span className="text-slate-500 block">Total Files</span>
                  <span className="text-slate-200 font-mono font-semibold">
                    {Object.keys(importResult.files).length} files
                  </span>
                </div>
                <div className="p-2 bg-[#111822] rounded border border-[#1E293B]">
                  <span className="text-slate-500 block">Manifest Status</span>
                  <span className={`font-mono font-semibold ${importResult.manifest ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {importResult.manifest ? 'Valid manifest.json' : 'Repairs needed'}
                  </span>
                </div>
              </div>

              {importResult.manifest ? (
                <div className="text-[11px] text-slate-400">
                  Pack Name: <strong className="text-slate-200">{importResult.manifest.header?.name || 'Unknown'}</strong>
                </div>
              ) : importResult.manifestError ? (
                <div className="text-[11px] text-amber-400 bg-amber-500/10 p-2 rounded border border-amber-500/20">
                  {importResult.manifestError} (You will be able to repair or generate a new manifest in the editor).
                </div>
              ) : null}
            </div>
          )}

          {/* Actions */}
          <div className="pt-2 border-t border-[#1E293B] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!importResult}
              onClick={handleConfirm}
              className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-md shadow-sm transition-colors disabled:opacity-50"
            >
              Load Into Studio
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
