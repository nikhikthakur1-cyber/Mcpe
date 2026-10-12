import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
  Sparkles,
  Layers,
  ArrowRight,
  FolderTree,
} from 'lucide-react';
import { BedrockManifest, ProjectFile } from '../../types';
import {
  BEDROCK_VERSION_PROFILES,
  auditBedrockStructure,
} from '../../services/versionAuditorService';

interface VersionAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  manifest: BedrockManifest;
  files: Record<string, ProjectFile>;
  onUpdateEngineVersion: (newEngineVersion: [number, number, number]) => void;
  onScaffoldFolders: () => void;
  onSelectSlotFromAudit?: (slotPath: string) => void;
}

export const VersionAuditModal: React.FC<VersionAuditModalProps> = ({
  isOpen,
  onClose,
  manifest,
  files,
  onUpdateEngineVersion,
  onScaffoldFolders,
  onSelectSlotFromAudit,
}) => {
  const [selectedVersionId, setSelectedVersionId] = useState<string>('1.21.0');
  const [activeTab, setActiveTab] = useState<'audit' | 'changelog'>('audit');

  if (!isOpen) return null;

  const auditResult = auditBedrockStructure(files, manifest, selectedVersionId);
  const currentEngineVer = manifest.header.min_engine_version || [1, 20, 0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-3 md:p-6 select-none overflow-y-auto">
      <div className="bg-[#111822] border border-[#1E293B] rounded-xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-[#141C26] border-b border-[#1E293B] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-sm font-bold text-slate-100">
                Bedrock / MCPE Version & Folder Auditor
              </h3>
              <p className="text-xs text-slate-400">
                Verify folder compliance and discover Minecraft updates & texture changes.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-[#1E293B] rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Version Selector & Sub-Tabs */}
        <div className="px-5 py-3 bg-[#0B0F14] border-b border-[#1E293B] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Target Bedrock Version:</span>
            <select
              value={selectedVersionId}
              onChange={(e) => setSelectedVersionId(e.target.value)}
              className="bg-[#161F29] border border-[#1E293B] text-slate-200 px-3 py-1.5 rounded-md font-mono text-xs outline-none focus:border-emerald-500"
            >
              {BEDROCK_VERSION_PROFILES.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1 bg-[#161F29] p-1 rounded-lg border border-[#1E293B]">
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                activeTab === 'audit'
                  ? 'bg-[#1E293B] text-emerald-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Structure Audit
            </button>
            <button
              onClick={() => setActiveTab('changelog')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                activeTab === 'changelog'
                  ? 'bg-[#1E293B] text-emerald-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              MCPE Changelog ({auditResult.targetProfile.majorAdditions.length})
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {activeTab === 'audit' ? (
            <div className="space-y-4">
              {/* Engine Version Card */}
              <div className="p-3.5 bg-[#0B0F14] rounded-lg border border-[#1E293B] flex items-center justify-between">
                <div>
                  <span className="text-slate-400 block text-[11px]">
                    Current Manifest Engine Version
                  </span>
                  <span className="font-mono text-sm font-bold text-slate-100">
                    min_engine_version: [{currentEngineVer.join(', ')}]
                  </span>
                </div>

                {!auditResult.engineVersionMatches && (
                  <button
                    onClick={() => {
                      onUpdateEngineVersion(auditResult.targetProfile.engineVersion);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded text-xs font-semibold transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Update to v{auditResult.targetProfile.engineVersion.join('.')}</span>
                  </button>
                )}
              </div>

              {/* Standard Folders Grid */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-slate-300 uppercase tracking-wider text-[11px]">
                    Standard Bedrock Subdirectories
                  </h4>
                  <button
                    onClick={onScaffoldFolders}
                    className="flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300"
                  >
                    <FolderTree className="w-3 h-3" />
                    <span>Scaffold Standard Directories</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {['textures/blocks', 'textures/items', 'textures/entity', 'textures/ui', 'textures/environment'].map(
                    (folder) => {
                      const isPresent = auditResult.standardFoldersPresent.includes(folder);
                      return (
                        <div
                          key={folder}
                          className={`p-2.5 rounded border flex items-center justify-between ${
                            isPresent
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                              : 'bg-[#0B0F14] border-[#1E293B] text-slate-400'
                          }`}
                        >
                          <span className="font-mono text-xs">{folder}/</span>
                          {isPresent ? (
                            <span className="text-[10px] font-medium text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> In Pack
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500">Unused</span>
                          )}
                        </div>
                      );
                    }
                  )}
                </div>
              </div>

              {/* Audit Findings */}
              <div className="space-y-2 pt-2">
                <h4 className="font-semibold text-slate-300 uppercase tracking-wider text-[11px]">
                  Audit Findings ({auditResult.findings.length})
                </h4>
                <div className="space-y-2">
                  {auditResult.findings.map((finding, idx) => {
                    const isSuccess = finding.type === 'success';
                    const isError = finding.type === 'error';
                    const isWarning = finding.type === 'warning';

                    return (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg border flex items-start gap-3 ${
                          isSuccess
                            ? 'bg-emerald-500/10 border-emerald-500/30'
                            : isError
                            ? 'bg-red-500/10 border-red-500/30'
                            : isWarning
                            ? 'bg-amber-500/10 border-amber-500/30'
                            : 'bg-sky-500/10 border-sky-500/20'
                        }`}
                      >
                        {isSuccess ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        ) : isError ? (
                          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                        ) : isWarning ? (
                          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        ) : (
                          <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                        )}

                        <div className="min-w-0 flex-1">
                          <h5
                            className={`text-xs font-bold ${
                              isSuccess
                                ? 'text-emerald-300'
                                : isError
                                ? 'text-red-300'
                                : isWarning
                                ? 'text-amber-300'
                                : 'text-sky-300'
                            }`}
                          >
                            {finding.title}
                          </h5>
                          <p className="text-[11px] text-slate-300 mt-0.5">
                            {finding.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* Changelog View: What Changed in MCPE */
            <div className="space-y-3">
              <div className="p-3 bg-[#0B0F14] rounded-lg border border-[#1E293B]">
                <h4 className="text-xs font-bold text-slate-200">
                  {auditResult.targetProfile.name}
                </h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  {auditResult.targetProfile.description}
                </p>
              </div>

              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  New Texture Slots Introduced
                </span>

                <div className="space-y-2">
                  {auditResult.targetProfile.majorAdditions.map((item) => {
                    const isCustomized = Boolean(files[item.path]);

                    return (
                      <div
                        key={item.path}
                        className={`p-3 rounded-lg border flex items-center justify-between gap-3 ${
                          isCustomized
                            ? 'bg-emerald-500/10 border-emerald-500/30'
                            : 'bg-[#0B0F14] border-[#1E293B]'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-200">
                              {item.name}
                            </span>
                            <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded bg-[#161F29] text-slate-400">
                              {item.category}
                            </span>
                            {isCustomized && (
                              <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-0.5">
                                <CheckCircle2 className="w-3 h-3" /> Textured
                              </span>
                            )}
                          </div>
                          <code className="text-[10px] font-mono text-slate-400 block mt-0.5 truncate">
                            {item.path}
                          </code>
                          <p className="text-[11px] text-slate-400 mt-1">{item.note}</p>
                        </div>

                        {onSelectSlotFromAudit && (
                          <button
                            onClick={() => {
                              onSelectSlotFromAudit(item.path);
                              onClose();
                            }}
                            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium bg-[#161F29] hover:bg-[#1E293B] text-slate-200 rounded border border-[#1E293B] shrink-0"
                          >
                            <span>Texture This</span>
                            <ArrowRight className="w-3 h-3 text-emerald-400" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#141C26] border-t border-[#1E293B] flex items-center justify-between text-xs">
          <span className="text-slate-400 text-[11px] font-mono">
            Audit standard: Bedrock Engine Specification v2
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#1E293B] hover:bg-slate-700 text-slate-200 font-semibold rounded text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
