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
  isDirty,
  validationIssues,
  customTexturesCount,
}) => {
  const errorCount = validationIssues.filter((i) => i.severity === 'error').length;
  const warningCount = validationIssues.filter((i) => i.severity === 'warning').length;

  return (
    <header className="h-14 bg-[#111820] border-b border-[#1E293B] px-2 md:px-4 flex items-center justify-between gap-2 md:gap-6 shrink-0 select-none overflow-x-hidden">
      {/* Zone 1: Brand Title and Pack Breadcrumb */}
      <div className="flex items-center gap-2 md:gap-3 min-w-0 shrink">
        <div className="flex items-center gap-1.5 md:gap-2">
          <div className="w-7 h-7 rounded bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xs md:text-sm tracking-wider shrink-0">
            B
          </div>
          <span className="text-xs md:text-sm font-semibold tracking-tight text-slate-100 whitespace-nowrap hidden sm:inline">
            Bedrock Texture Studio
          </span>
          <span className="text-xs font-semibold tracking-tight text-slate-100 whitespace-nowrap sm:hidden">
            Studio
          </span>
        </div>
        <span className="text-slate-600 font-light hidden sm:inline">/</span>
        <span
          className="text-xs text-slate-400 font-medium truncate max-w-[100px] md:max-w-[200px]"
          title={packName}
        >
          {packName || 'Untitled Pack'}
        </span>
      </div>

      {/* Zone 2: Navigation Links (Desktop + Tablet) */}
      <nav className="hidden lg:flex items-center gap-1 bg-[#0B0F14] p-1 rounded-lg border border-[#1E293B]">
        <button
          onClick={() => onTabChange('textures')}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
            activeTab === 'textures'
              ? 'bg-[#1E293B] text-emerald-400 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Textures</span>
          {customTexturesCount > 0 && (
            <span className="text-[10px] text-emerald-400 font-mono">
              ({customTexturesCount})
            </span>
          )}
        </button>

        <button
          onClick={() => onTabChange('explorer')}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
            activeTab === 'explorer'
              ? 'bg-[#1E293B] text-emerald-400 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FolderTree className="w-3.5 h-3.5" />
          <span>Explorer</span>
        </button>

        <button
          onClick={() => onTabChange('manifest')}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
            activeTab === 'manifest'
              ? 'bg-[#1E293B] text-emerald-400 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileCode2 className="w-3.5 h-3.5" />
          <span>Manifest</span>
        </button>

        <button
          onClick={() => onTabChange('tree')}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
            activeTab === 'tree'
              ? 'bg-[#1E293B] text-emerald-400 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Connection Tree</span>
        </button>

        <button
          onClick={() => onTabChange('validation')}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
            activeTab === 'validation'
              ? 'bg-[#1E293B] text-emerald-400 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <AlertCircle
            className={`w-3.5 h-3.5 ${
              errorCount > 0
                ? 'text-red-400'
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

      {/* Mobile Tab Selector (Compact on screens < 1024px) */}
      <div className="flex lg:hidden items-center bg-[#0B0F14] p-1 rounded-lg border border-[#1E293B]">
        {(['textures', 'explorer', 'manifest', 'tree', 'validation'] as ActiveTab[]).map(
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
