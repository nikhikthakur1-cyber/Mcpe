import React, { useState } from 'react';
import { AlertCircle, AlertTriangle, Info, CheckCircle2, ArrowRight, ShieldCheck, RefreshCw } from 'lucide-react';
import { ValidationIssue, ValidationSeverity, ActiveTab } from '../../types';

interface ValidationPanelProps {
  issues: ValidationIssue[];
  onNavigateTab: (tab: ActiveTab) => void;
  onRefreshValidation: () => void;
}

export const ValidationPanel: React.FC<ValidationPanelProps> = ({
  issues,
  onNavigateTab,
  onRefreshValidation,
}) => {
  const [severityFilter, setSeverityFilter] = useState<'all' | ValidationSeverity>('all');

  const filteredIssues = issues.filter((issue) => {
    if (severityFilter === 'all') return true;
    return issue.severity === severityFilter;
  });

  const errorCount = issues.filter((i) => i.severity === 'error').length;
  const warningCount = issues.filter((i) => i.severity === 'warning').length;
  const infoCount = issues.filter((i) => i.severity === 'info').length;

  const handleFixClick = (issue: ValidationIssue) => {
    if (issue.fixAction === 'navigate_manifest' || issue.fixAction === 'regenerate_uuid') {
      onNavigateTab('manifest');
    } else if (issue.fixAction === 'navigate_textures') {
      onNavigateTab('textures');
    } else if (issue.fixAction === 'navigate_explorer') {
      onNavigateTab('explorer');
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0B0F14] select-none overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-[#111822] border-b border-[#1E293B] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100">Resource Pack Validation Center</h2>
            <p className="text-xs text-slate-400">
              Audits Minecraft Bedrock compliance, manifest integrity, UUID collisions, and texture assets.
            </p>
          </div>
        </div>

        <button
          onClick={onRefreshValidation}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#161F29] hover:bg-[#1E293B] border border-[#1E293B] rounded text-xs text-slate-300 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Re-validate</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 bg-[#0E141D] border-b border-[#1E293B]">
        <div
          onClick={() => setSeverityFilter('all')}
          className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
            severityFilter === 'all'
              ? 'bg-[#182332] border-sky-500 shadow-sm'
              : 'bg-[#111822] border-[#1E293B] hover:border-slate-700'
          }`}
        >
          <span className="text-xs text-slate-400 font-medium block">Total Findings</span>
          <span className="text-xl font-bold font-mono text-slate-100 mt-1 block">
            {issues.length}
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Across all categories</span>
        </div>

        <div
          onClick={() => setSeverityFilter('error')}
          className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
            severityFilter === 'error'
              ? 'bg-red-500/15 border-red-500 shadow-sm'
              : 'bg-[#111822] border-[#1E293B] hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-red-400 font-medium">Blocking Errors</span>
            <AlertCircle className="w-4 h-4 text-red-400" />
          </div>
          <span className="text-xl font-bold font-mono text-red-400 mt-1 block">
            {errorCount}
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            {errorCount === 0 ? 'Export ready' : 'Prevents Minecraft import'}
          </span>
        </div>

        <div
          onClick={() => setSeverityFilter('warning')}
          className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
            severityFilter === 'warning'
              ? 'bg-amber-500/15 border-amber-500 shadow-sm'
              : 'bg-[#111822] border-[#1E293B] hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-amber-400 font-medium">Warnings</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <span className="text-xl font-bold font-mono text-amber-400 mt-1 block">
            {warningCount}
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Recommended adjustments</span>
        </div>

        <div
          onClick={() => setSeverityFilter('info')}
          className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
            severityFilter === 'info'
              ? 'bg-sky-500/15 border-sky-500 shadow-sm'
              : 'bg-[#111822] border-[#1E293B] hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-sky-400 font-medium">Information</span>
            <Info className="w-4 h-4 text-sky-400" />
          </div>
          <span className="text-xl font-bold font-mono text-sky-400 mt-1 block">
            {infoCount}
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Tips and suggestions</span>
        </div>
      </div>

      {/* Issues List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-3">
        {filteredIssues.length > 0 ? (
          filteredIssues.map((issue) => {
            const isError = issue.severity === 'error';
            const isWarning = issue.severity === 'warning';

            return (
              <div
                key={issue.id}
                className={`p-4 rounded-lg border flex items-start justify-between gap-4 transition-all ${
                  isError
                    ? 'bg-red-500/10 border-red-500/30'
                    : isWarning
                    ? 'bg-amber-500/10 border-amber-500/30'
                    : 'bg-sky-500/10 border-sky-500/20'
                }`}
              >
                <div className="flex items-start gap-3">
                  {isError ? (
                    <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  ) : isWarning ? (
                    <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  ) : (
                    <Info className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
                  )}

                  <div>
                    <div className="flex items-center gap-2">
                      <h4
                        className={`text-xs font-bold ${
                          isError
                            ? 'text-red-300'
                            : isWarning
                            ? 'text-amber-300'
                            : 'text-sky-300'
                        }`}
                      >
                        {issue.title}
                      </h4>
                      {issue.fieldOrPath && (
                        <span className="text-[10px] font-mono text-slate-400 bg-[#0B0F14] px-1.5 py-0.5 rounded border border-[#1E293B]">
                          {issue.fieldOrPath}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      {issue.message}
                    </p>
                  </div>
                </div>

                {issue.fixAction && (
                  <button
                    onClick={() => handleFixClick(issue)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded bg-[#111822] hover:bg-[#1E293B] text-slate-200 border border-[#1E293B] shrink-0 transition-colors"
                  >
                    <span>Resolve</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })
        ) : (
          <div className="h-64 flex flex-col items-center justify-center text-center p-8 bg-[#111822] rounded-lg border border-[#1E293B]">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mb-2" />
            <h3 className="text-sm font-bold text-slate-100">Clean Validation Audit</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md">
              No issues detected for the selected filter. Your resource pack manifest, structure, and files comply with Minecraft Bedrock Edition standards.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
