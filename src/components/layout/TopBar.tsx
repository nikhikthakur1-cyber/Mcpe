import React from 'react';
import {
  Download,
  FolderOpen,
  Plus,
  Save,
  Layers,
  FolderTree,
  FileCode2,
  AlertCircle,
  ShieldCheck,
  Volume2,
  Package,
} from 'lucide-react';
import { ActiveTab, ValidationIssue } from '../../types';

interface TopBarProps {
  packName: string;
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onNewProject: () => void;
  onImport: () => void;
  onSave: () => void;
  onExport: () => void;
  onOpenAudit: () => void;
  onOpenZipModal: () => void;
  isDirty: boolean;
  validationIssues: ValidationIssue[];
  customTexturesCount: number;
}

export const TopBar: React.FC<TopBarProps> = ({
  packName,
  activeTab,
  onTabChange,
  onNewProject,
  onImport,
  onSave,
  onExport,
  onOpenAudit,
  onOpenZipModal,
  isDirty,
  validationIssues,
  customTexturesCount,
}) => {
  const errorCount = validationIssues.filter((i) => i.severity === 'error').length;
  const warningCount = validationIssues.filter((i) => i.severity === 'warning').length;

  return (
    <header className="h-14 bg-[#0D1219]/95 backdrop-blur-md border-b border-[#1E293B] px-3 md:px-5 flex items-center justify-between gap-3 md:gap-6 shrink-0 select-none overflow-x-hidden">
      {/* Zone 1: Brand Title and Pack Breadcrumb */}
      <div className="flex items-center gap-2.5 md:gap-3.5 min-w-0 shrink">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-extrabold text-xs md:text-sm tracking-wider shrink-0 shadow-[0_0_12px_rgba(16,185,129,0.15)]">
            ⛏
          </div>
          <div className="flex flex-col">
            <span className="text-xs md:text-sm font-bold tracking-tight text-white whitespace-nowrap">
              Bedrock Studio
            </span>
            <span className="text-[10px] text-emerald-400 font-mono -mt-0.5 hidden sm:inline">
              Resource Pack Engine
            </span>
          </div>
        </div>
        <span className="text-slate-600 font-light hidden sm:inline">/</span>
        <span
          className="text-xs text-slate-300 font-mono bg-[#141C26] px-2.5 py-1 rounded-md border border-[#1E293B] truncate max-w-[120px] md:max-w-[220px]"
          title={packName}
        >
          {packName || 'Untitled Pack'}
        </span>
      </div>

      {/* Zone 2: Navigation Links (Desktop + Tablet) */}
      <nav className="hidden md:flex items-center gap-1 bg-[#070A0E] p-1 rounded-xl border border-[#1E293B]/80 shadow-inner overflow-x-auto">
        <button
          onClick={() => onTabChange('textures')}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
            activeTab === 'textures'
              ? 'bg-gradient-to-r from-emerald-500/20 to-emerald-500/10 border border-emerald-500/40 text-emerald-300 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-[#141C26]'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-emerald-400" />
          <span>Textures</span>
          {customTexturesCount > 0 ? (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/30">
              {customTexturesCount}
            </span>
          ) : (
            <span className="text-[10px] text-slate-500 font-mono hidden xl:inline">
              (4,880)
            </span>
          )}
        </button>

        <button
          onClick={() => onTabChange('explorer')}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
            activeTab === 'explorer'
              ? 'bg-gradient-to-r from-sky-500/20 to-sky-500/10 border border-sky-500/40 text-sky-300 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-[#141C26]'
          }`}
        >
          <FolderTree className="w-3.5 h-3.5 text-sky-400" />
          <span>Explorer</span>
        </button>

        <button
          onClick={() => onTabChange('samples')}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
            activeTab === 'samples'
              ? 'bg-gradient-to-r from-cyan-500/20 to-cyan-500/10 border border-cyan-500/40 text-cyan-300 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-[#141C26]'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          <span>Samples</span>
        </button>

        <button
          onClick={() => onTabChange('manifest')}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
            activeTab === 'manifest'
              ? 'bg-gradient-to-r from-amber-500/20 to-amber-500/10 border border-amber-500/40 text-amber-300 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-[#141C26]'
          }`}
        >
          <FileCode2 className="w-3.5 h-3.5 text-amber-400" />
          <span>Manifest</span>
        </button>

        <button
          onClick={() => onTabChange('tree')}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
            activeTab === 'tree'
              ? 'bg-gradient-to-r from-purple-500/20 to-purple-500/10 border border-purple-500/40 text-purple-300 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-[#141C26]'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-purple-400" />
          <span>Tree</span>
        </button>

        <button
          onClick={() => onTabChange('validation')}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
            activeTab === 'validation'
              ? 'bg-gradient-to-r from-rose-500/20 to-rose-500/10 border border-rose-500/40 text-rose-300 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-[#141C26]'
          }`}
        >
          <AlertCircle
            className={`w-3.5 h-3.5 ${
              errorCount > 0
                ? 'text-red-400 animate-pulse'
                : warningCount > 0
                ? 'text-amber-400'
                : 'text-slate-400'
            }`}
          />
          <span>Validation</span>
          {(errorCount > 0 || warningCount > 0) && (
            <span
              className={`text-[10px] font-mono ${
                errorCount > 0 ? 'text-red-400' : 'text-amber-400'
              }`}
            >
              ({errorCount > 0 ? `${errorCount} err` : `${warningCount} warn`})
            </span>
          )}
        </button>
      </nav>

      {/* Mobile Tab Selector (Compact on screens < 768px) */}
      <div className="flex md:hidden items-center bg-[#0B0F14] p-1 rounded-lg border border-[#1E293B]">
        {(['textures', 'explorer', 'samples', 'manifest', 'tree', 'validation'] as ActiveTab[]).map(
          (tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => onTabChange(tab)}
                title={tab}
                className={`p-1.5 rounded transition-colors ${
                  isActive ? 'bg-[#1E293B] text-emerald-400' : 'text-slate-400'
                }`}
              >
                {tab === 'textures' && <Layers className="w-4 h-4" />}
                {tab === 'explorer' && <FolderTree className="w-4 h-4" />}
                {tab === 'manifest' && <FileCode2 className="w-4 h-4" />}
                {tab === 'tree' && <Layers className="w-4 h-4" />}
                {tab === 'validation' && (
                  <AlertCircle
                    className={`w-4 h-4 ${
                      errorCount > 0 ? 'text-red-400' : 'text-slate-400'
                    }`}
                  />
                )}
              </button>
            );
          }
        )}
      </div>

      {/* Zone 3: Project Actions */}
      <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
        <button
          onClick={onOpenZipModal}
          title="ZIP Assets Reader & Manager"
          className="flex items-center gap-1.5 px-2 md:px-2.5 py-1.5 text-xs font-medium text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-md transition-colors whitespace-nowrap min-h-[36px]"
        >
          <Package className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline">ZIP Assets</span>
        </button>

        <button
          onClick={onOpenAudit}
          title="MCPE Version & Folder Auditor"
          className="flex items-center gap-1.5 px-2 md:px-2.5 py-1.5 text-xs font-medium text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-md transition-colors whitespace-nowrap min-h-[36px]"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Version Check</span>
        </button>

        <button
          onClick={onNewProject}
          title="Create New Bedrock Resource Pack"
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-slate-100 bg-[#161F29] hover:bg-[#1E293B] border border-[#1E293B] rounded-md transition-colors whitespace-nowrap min-h-[36px]"
        >
          <Plus className="w-3.5 h-3.5 text-emerald-400" />
          <span>New</span>
        </button>

        <button
          onClick={onImport}
          title="Import .mcpack or .zip file"
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-slate-100 bg-[#161F29] hover:bg-[#1E293B] border border-[#1E293B] rounded-md transition-colors whitespace-nowrap min-h-[36px]"
        >
          <FolderOpen className="w-3.5 h-3.5 text-sky-400" />
          <span>Import</span>
        </button>

        <button
          onClick={onSave}
          title={isDirty ? 'Save changes to local storage' : 'All changes saved locally'}
          className={`flex items-center gap-1.5 px-2 md:px-2.5 py-1.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap min-h-[36px] ${
            isDirty
              ? 'bg-amber-500/10 border-amber-500/40 text-amber-300 hover:bg-amber-500/20'
              : 'bg-[#161F29] border-[#1E293B] text-slate-400 hover:text-slate-200'
          }`}
        >
          <Save className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{isDirty ? 'Save*' : 'Saved'}</span>
        </button>

        <button
          onClick={onExport}
          className="flex items-center gap-1.5 px-2.5 md:px-3.5 py-1.5 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-md shadow-sm transition-colors whitespace-nowrap min-h-[36px]"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Export .mcpack</span>
          <span className="sm:hidden">Export</span>
        </button>
      </div>
    </header>
  );
};
