import React, { useMemo } from 'react';
import { X, FileImage, FileCode, Download } from 'lucide-react';
import { ProjectFile } from '../../types';
import { CanvasPixelPreview } from '../textures/CanvasPixelPreview';

interface FileContentModalProps {
  file: ProjectFile | null;
  onClose: () => void;
  onDownloadFile?: (file: ProjectFile) => void;
  onEditJson?: (filePath: string) => void;
}

export const FileContentModal: React.FC<FileContentModalProps> = ({
  file,
  onClose,
  onDownloadFile,
  onEditJson,
}) => {
  if (!file) return null;

  const isImage = file.name.toLowerCase().endsWith('.png');
  const isText = file.name.toLowerCase().endsWith('.json') || file.name.toLowerCase().endsWith('.txt') || file.name.toLowerCase().endsWith('.lang');

  const textContent = useMemo(() => {
    if (!isText) return '';
    try {
      const decoder = new TextDecoder('utf-8');
      const raw = decoder.decode(file.data);
      if (file.name.toLowerCase().endsWith('.json')) {
        try {
          const parsed = JSON.parse(raw);
          return JSON.stringify(parsed, null, 2);
        } catch {
          return raw;
        }
      }
      return raw;
    } catch {
      return 'Unable to decode text content.';
    }
  }, [file, isText]);

  const handleDownload = () => {
    const blob = new Blob([file.data as BlobPart], { type: file.mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
      <div className="bg-[#111822] border border-[#1E293B] rounded-xl shadow-2xl max-w-3xl w-full flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-[#141C26] border-b border-[#1E293B] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {isImage ? (
              <FileImage className="w-5 h-5 text-emerald-400" />
            ) : (
              <FileCode className="w-5 h-5 text-amber-400" />
            )}
            <div>
              <h3 className="text-sm font-bold text-slate-100">{file.name}</h3>
              <p className="text-xs font-mono text-slate-400">{file.path}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              title="Download File"
              className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-[#1E293B] rounded transition-colors"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-[#1E293B] rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 p-4 overflow-auto min-h-[350px] bg-[#090D12]">
          {isImage ? (
            <div className="h-full min-h-[380px]">
              <CanvasPixelPreview imageData={file.data} />
            </div>
          ) : isText ? (
            <pre className="text-xs font-mono text-slate-200 bg-[#0B0F14] p-4 rounded border border-[#1E293B] overflow-auto max-h-[500px]">
              {textContent}
            </pre>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400 text-xs">
              <p>Binary file format</p>
              <p className="font-mono text-slate-500 mt-1">
                {(file.data.length / 1024).toFixed(1)} KB ({file.data.length} bytes)
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#111822] border-t border-[#1E293B] flex items-center justify-between text-xs text-slate-400">
          <span className="font-mono">
            Size: {(file.data.length / 1024).toFixed(2)} KB · Type: {file.mimeType}
          </span>
          <div className="flex items-center gap-2">
            {file.name.toLowerCase().endsWith('.json') && onEditJson && (
              <button
                onClick={() => {
                  onEditJson(file.path);
                  onClose();
                }}
                className="px-3 py-1 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded text-xs transition-colors flex items-center gap-1.5"
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>Open in Split JSON Editor</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-3 py-1 bg-[#1E293B] hover:bg-slate-700 text-slate-200 rounded text-xs transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
