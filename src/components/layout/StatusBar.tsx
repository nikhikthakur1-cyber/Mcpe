import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, HardDrive } from 'lucide-react';
import { ValidationIssue } from '../../types';

interface StatusBarProps {
  selectedSlotPath: string | null;
  customTexturesCount: number;
  totalFilesCount: number;
  isDirty: boolean;
  validationIssues: ValidationIssue[];
}

export const StatusBar: React.FC<StatusBarProps> = ({
  selectedSlotPath,
  customTexturesCount,
  totalFilesCount,
  isDirty,
  validationIssues,
}) => {
  const errorCount = validationIssues.filter((i) => i.severity === 'error').length;
  const warningCount = validationIssues.filter((i) => i.severity === 'warning').length;

  return (
    <footer className="h-7 bg-[#0B0F14] border-t border-[#1E293B] px-4 flex items-center justify-between text-[11px] text-slate-400 select-none shrink-0 font-mono">
      {/* Left zone: Active selection & project state */}
      <div className="flex items-center gap-3 truncate">
        <span className="flex items-center gap-1.5 text-slate-300">
          <HardDrive className="w-3 h-3 text-emerald-400" />
          <span>Bedrock v1.20+ Ready</span>
        </span>

        <span className="text-slate-700" aria-hidden="true">·</span>

        <span className="truncate">
          {selectedSlotPath ? (
            <span className="text-slate-200">{selectedSlotPath}</span>
          ) : (
            <span className="text-slate-500">No slot selected</span>
          )}
        </span>
      </div>

      {/* Right zone: Stats & Validation Indicators */}
      <div className="flex items-center gap-2 md:gap-4 shrink-0">
        <div className="hidden sm:flex items-center gap-1.5">
          <span className="text-slate-500">Custom:</span>
          <span className="text-emerald-400 tabular-nums font-semibold">{customTexturesCount}</span>
        </div>

        <span className="text-slate-700 hidden sm:inline" aria-hidden="true">·</span>

        <div className="hidden md:flex items-center gap-1.5">
          <span className="text-slate-500">Files:</span>
          <span className="text-slate-300 tabular-nums">{totalFilesCount}</span>
        </div>

        <span className="text-slate-700 hidden md:inline" aria-hidden="true">·</span>

        <div className="flex items-center gap-2">
          {errorCount > 0 ? (
            <span className="flex items-center gap-1 text-red-400">
              <AlertCircle className="w-3 h-3" />
              <span>{errorCount} err</span>
            </span>
          ) : warningCount > 0 ? (
            <span className="flex items-center gap-1 text-amber-400">
              <AlertTriangle className="w-3 h-3" />
              <span>{warningCount} warn</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 text-emerald-400">
              <CheckCircle2 className="w-3 h-3" />
              <span>Valid</span>
            </span>
          )}
        </div>

        <span className="text-slate-700 hidden sm:inline" aria-hidden="true">·</span>

        <div className="hidden sm:block">
          {isDirty ? (
            <span className="text-amber-400 font-medium">Unsaved</span>
          ) : (
            <span className="text-slate-500">IndexedDB</span>
          )}
        </div>
      </div>
    </footer>
  );
};
