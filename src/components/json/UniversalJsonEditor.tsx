import React, { useState, useEffect, useMemo } from 'react';
import {
  Code,
  FolderTree,
  Check,
  Copy,
  AlertCircle,
  Save,
  Wand2,
  Minimize2,
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  Search,
  FileCode,
  X,
  Plus,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react';
import { BedrockManifest, ProjectFile } from '../../types';
import { formatManifestJSON } from '../../services/manifestService';

interface UniversalJsonEditorProps {
  initialFilePath: string;
  files: Record<string, ProjectFile>;
  manifest: BedrockManifest;
  onSave: (filePath: string, updatedJsonText: string) => void;
  onClose?: () => void;
}

export const UniversalJsonEditor: React.FC<UniversalJsonEditorProps> = ({
  initialFilePath,
  files,
  manifest,
  onSave,
  onClose,
}) => {
  // Collect all available JSON files across project
  const availableJsonFiles = useMemo(() => {
    const list = ['manifest.json'];
    for (const p of Object.keys(files)) {
      if (p.toLowerCase().endsWith('.json') && p.toLowerCase() !== 'manifest.json') {
        list.push(p);
      }
    }
    return list;
  }, [files]);

  // Open tabs
  const [openTabs, setOpenTabs] = useState<string[]>([initialFilePath]);
  const [activeTabPath, setActiveTabPath] = useState<string>(initialFilePath);

  // In-memory drafts for each open tab
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  // Sidebar collapsible state
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // UI status
  const [copied, setCopied] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [treeSearch, setTreeSearch] = useState('');
  const [collapsedNodes, setCollapsedNodes] = useState<Record<string, boolean>>({});
  const [mobileView, setMobileView] = useState<'code' | 'tree'>('code');

  // Helper to get formatted text for a file
  const getFileInitialText = (filePath: string): string => {
    if (filePath.toLowerCase() === 'manifest.json') {
      return formatManifestJSON(manifest);
    }
    const f = files[filePath];
    if (f) {
      try {
        const raw = new TextDecoder('utf-8').decode(f.data);
        const parsed = JSON.parse(raw);
        return JSON.stringify(parsed, null, 2);
      } catch {
        return new TextDecoder('utf-8').decode(f.data);
      }
    }
    return '{\n}';
  };

  // Initialize draft for initialFilePath
  useEffect(() => {
    if (!drafts[initialFilePath]) {
      setDrafts((prev) => ({
        ...prev,
        [initialFilePath]: getFileInitialText(initialFilePath),
      }));
    }
    if (!openTabs.includes(initialFilePath)) {
      setOpenTabs((prev) => [...prev, initialFilePath]);
    }
    setActiveTabPath(initialFilePath);
  }, [initialFilePath]);

  // Current active text
  const currentJsonText = drafts[activeTabPath] ?? getFileInitialText(activeTabPath);

  const handleTextChange = (text: string) => {
    setDrafts((prev) => ({
      ...prev,
      [activeTabPath]: text,
    }));
  };

  const handleOpenTab = (path: string) => {
    if (!openTabs.includes(path)) {
      setOpenTabs((prev) => [...prev, path]);
    }
    if (!drafts[path]) {
      setDrafts((prev) => ({
        ...prev,
        [path]: getFileInitialText(path),
      }));
    }
    setActiveTabPath(path);
  };

  const handleCloseTab = (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const remaining = openTabs.filter((t) => t !== path);
    if (remaining.length === 0) {
      if (onClose) onClose();
      return;
    }
    setOpenTabs(remaining);
    if (activeTabPath === path) {
      setActiveTabPath(remaining[remaining.length - 1]);
    }
  };

  // Parse JSON and compute errors for active tab
  const { parsedData, parseError } = useMemo(() => {
    try {
      const data = JSON.parse(currentJsonText);
      return { parsedData: data, parseError: null };
    } catch (err: unknown) {
      return {
        parsedData: null,
        parseError: err instanceof Error ? err.message : 'Invalid JSON format',
      };
    }
  }, [currentJsonText]);

  // Format / Beautify
  const handleBeautify = () => {
    if (!parsedData) return;
    handleTextChange(JSON.stringify(parsedData, null, 2));
  };

  // Minify
  const handleMinify = () => {
    if (!parsedData) return;
    handleTextChange(JSON.stringify(parsedData));
  };

  // Copy to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(currentJsonText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Save active file
  const handleSaveActive = () => {
    onSave(activeTabPath, currentJsonText);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const toggleCollapse = (path: string) => {
    setCollapsedNodes((prev) => ({
      ...prev,
      [path]: !prev[path],
    }));
  };

  const collapseAll = () => {
    if (!parsedData) return;
    const collapsed: Record<string, boolean> = {};
    const recurse = (obj: unknown, path: string) => {
      if (obj && typeof obj === 'object') {
        collapsed[path] = true;
        for (const [k, v] of Object.entries(obj)) {
          recurse(v, path ? `${path}.${k}` : k);
        }
      }
    };
    recurse(parsedData, 'root');
    setCollapsedNodes(collapsed);
  };

  const expandAll = () => {
    setCollapsedNodes({});
  };

  // Line numbers calculation
  const linesCount = useMemo(() => currentJsonText.split('\n').length, [currentJsonText]);

  // Recursive Tree Node Renderer
  const renderTreeNode = (keyName: string, value: unknown, path: string, depth: number = 0) => {
    const isObject = value !== null && typeof value === 'object';
    const isArray = Array.isArray(value);
    const isCollapsed = Boolean(collapsedNodes[path]);

    if (isObject) {
      const entries = Object.entries(value as Record<string, unknown>);
      const count = entries.length;

      if (treeSearch.trim()) {
        const query = treeSearch.toLowerCase();
        const matchesKey = keyName.toLowerCase().includes(query);
        const matchesChild = JSON.stringify(value).toLowerCase().includes(query);
        if (!matchesKey && !matchesChild) return null;
      }

      return (
        <div key={path} className="text-xs">
          <div
            onClick={() => toggleCollapse(path)}
            style={{ paddingLeft: `${depth * 14}px` }}
            className="flex items-center gap-1.5 py-1 px-1.5 hover:bg-[#161F29] rounded cursor-pointer select-none group"
          >
            {isCollapsed ? (
              <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            )}
            <span className="font-semibold text-slate-200">{keyName}:</span>
            <span className="text-[10px] font-mono text-slate-500">
              {isArray ? `Array[${count}]` : `Object{${count}}`}
            </span>
          </div>

          {!isCollapsed && (
            <div>
              {entries.map(([childKey, childVal]) =>
                renderTreeNode(childKey, childVal, `${path}.${childKey}`, depth + 1)
              )}
            </div>
          )}
        </div>
      );
    }

    const valType: string = value === null ? 'null' : typeof value;
    const typeColor =
      valType === 'string'
        ? 'text-emerald-400'
        : valType === 'number'
        ? 'text-sky-400'
        : valType === 'boolean'
        ? 'text-amber-400'
        : 'text-slate-500';

    if (treeSearch.trim()) {
      const query = treeSearch.toLowerCase();
      const matchesKey = keyName.toLowerCase().includes(query);
      const matchesVal = String(value).toLowerCase().includes(query);
      if (!matchesKey && !matchesVal) return null;
    }

    return (
      <div
        key={path}
        style={{ paddingLeft: `${depth * 14 + 18}px` }}
        className="flex items-center justify-between py-0.5 px-1.5 hover:bg-[#161F29] rounded text-xs group"
      >
        <div className="flex items-center gap-2 truncate">
          <span className="text-slate-300 font-medium">{keyName}:</span>
          <span className={`font-mono text-xs truncate ${typeColor}`}>
            {valType === 'string' ? `"${value}"` : String(value)}
          </span>
        </div>

        <span className="text-[9px] uppercase font-mono text-slate-600 px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
          {valType}
        </span>
      </div>
    );
  };

  return (
    <div className="flex h-full w-full bg-[#0B0F14] select-none overflow-hidden">
      {/* 1. Left Collapsible File Tree (All JSON files in pack) */}
      <div
        className={`${
          isSidebarOpen ? 'w-56' : 'w-0'
        } transition-all duration-150 bg-[#111822] border-r border-[#1E293B] flex flex-col h-full overflow-hidden shrink-0`}
      >
        <div className="p-3 bg-[#141C26] border-b border-[#1E293B] flex items-center justify-between">
          <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <FileCode className="w-3.5 h-3.5 text-sky-400" />
            <span>Pack JSON Files</span>
          </span>
          <span className="text-[10px] font-mono text-slate-500">
            ({availableJsonFiles.length})
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {availableJsonFiles.map((p) => {
            const isActive = activeTabPath === p;
            const isOpen = openTabs.includes(p);
            const fileName = p.split('/').pop() || p;

            return (
              <div
                key={p}
                onClick={() => handleOpenTab(p)}
                className={`p-2 rounded text-xs cursor-pointer flex items-center justify-between transition-colors ${
                  isActive
                    ? 'bg-[#182332] text-emerald-400 font-semibold'
                    : 'text-slate-300 hover:bg-[#161F29] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FileCode className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                  <div className="truncate">
                    <span className="block truncate">{fileName}</span>
                    {p !== fileName && (
                      <span className="text-[9px] text-slate-500 font-mono block truncate">
                        {p}
                      </span>
                    )}
                  </div>
                </div>

                {isOpen && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Main Editor Canvas with Top Tab Bar */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Tab Bar */}
        <div className="h-10 bg-[#111822] border-b border-[#1E293B] flex items-center justify-between px-2 gap-2 shrink-0 overflow-x-auto">
          <div className="flex items-center gap-1 overflow-x-auto">
            {/* Toggle Left Sidebar Button */}
            <button
              onClick={() => setIsSidebarOpen((prev) => !prev)}
              title={isSidebarOpen ? 'Collapse JSON File Tree' : 'Expand JSON File Tree'}
              className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-[#1E293B] rounded transition-colors mr-1 shrink-0"
            >
              {isSidebarOpen ? (
                <PanelLeftClose className="w-4 h-4" />
              ) : (
                <PanelLeft className="w-4 h-4 text-emerald-400" />
              )}
            </button>

            {/* Open Tabs */}
            {openTabs.map((tabPath) => {
              const isActive = activeTabPath === tabPath;
              const tabName = tabPath.split('/').pop() || tabPath;

              return (
                <div
                  key={tabPath}
                  onClick={() => setActiveTabPath(tabPath)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-t text-xs cursor-pointer select-none transition-colors shrink-0 ${
                    isActive
                      ? 'bg-[#090D12] border-t-2 border-emerald-400 text-slate-100 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#161F29]'
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <span className="truncate max-w-[140px]">{tabName}</span>
                  <button
                    onClick={(e) => handleCloseTab(tabPath, e)}
                    className="p-0.5 text-slate-500 hover:text-slate-300 rounded"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Top Right Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Mobile View Switcher */}
            <div className="md:hidden flex items-center bg-[#0B0F14] p-0.5 rounded border border-[#1E293B] text-[10px]">
              <button
                onClick={() => setMobileView('code')}
                className={`px-2 py-0.5 rounded font-medium ${
                  mobileView === 'code' ? 'bg-[#1E293B] text-emerald-400' : 'text-slate-400'
                }`}
              >
                Code
              </button>
              <button
                onClick={() => setMobileView('tree')}
                className={`px-2 py-0.5 rounded font-medium ${
                  mobileView === 'tree' ? 'bg-[#1E293B] text-emerald-400' : 'text-slate-400'
                }`}
              >
                Tree
              </button>
            </div>

            <button
              onClick={handleBeautify}
              disabled={Boolean(parseError)}
              title="Auto-format with 2 spaces"
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white bg-[#161F29] hover:bg-[#1E293B] border border-[#1E293B] rounded transition-colors disabled:opacity-40"
            >
              <Wand2 className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden sm:inline">Format</span>
            </button>

            <button
              onClick={handleMinify}
              disabled={Boolean(parseError)}
              title="Compact single-line JSON"
              className="hidden sm:flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-300 hover:text-white bg-[#161F29] hover:bg-[#1E293B] border border-[#1E293B] rounded transition-colors disabled:opacity-40"
            >
              <Minimize2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Minify</span>
            </button>

            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-300 hover:text-white bg-[#161F29] hover:bg-[#1E293B] border border-[#1E293B] rounded transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              onClick={handleSaveActive}
              disabled={Boolean(parseError)}
              className={`flex items-center gap-1 px-3 py-1 text-xs font-bold rounded shadow-sm transition-colors ${
                savedSuccess
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-emerald-400 hover:bg-emerald-300 text-slate-950 disabled:opacity-50'
              }`}
            >
              <Save className="w-3.5 h-3.5" />
              <span>{savedSuccess ? 'Saved' : 'Save'}</span>
            </button>

            {onClose && (
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-200 text-xs px-2 py-1"
              >
                Close
              </button>
            )}
          </div>
        </div>

        {/* Syntax Error Banner */}
        {parseError && (
          <div className="bg-red-500/10 border-b border-red-500/30 px-4 py-1.5 flex items-center gap-2 text-xs text-red-400 font-mono">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>JSON Syntax Error: {parseError}</span>
          </div>
        )}

        {/* 3. Editor Panes */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Pane: Code View with Line Numbers */}
          <div
            className={`${
              mobileView === 'code' ? 'flex' : 'hidden md:flex'
            } flex-1 flex-col border-r border-[#1E293B] bg-[#090D12] overflow-hidden`}
          >
            <div className="h-7 px-3 bg-[#111822] border-b border-[#1E293B] flex items-center justify-between text-[11px] text-slate-400">
              <span className="font-mono text-slate-300">{activeTabPath}</span>
              <span className="font-mono text-slate-500">{linesCount} lines · 2-space formatted</span>
            </div>

            <div className="flex-1 flex overflow-auto">
              <div className="w-10 md:w-12 bg-[#090D12] border-r border-[#1E293B] py-3 text-right pr-2 text-slate-600 font-mono text-xs select-none">
                {Array.from({ length: linesCount }).map((_, i) => (
                  <div key={i} className="leading-6">
                    {i + 1}
                  </div>
                ))}
              </div>

              <textarea
                value={currentJsonText}
                onChange={(e) => handleTextChange(e.target.value)}
                spellCheck={false}
                className="flex-1 p-3 bg-transparent text-emerald-400 font-mono text-xs leading-6 outline-none resize-none whitespace-pre"
                style={{ tabSize: 2 }}
              />
            </div>
          </div>

          {/* Right Pane: Interactive JSON Node Tree */}
          <div
            className={`${
              mobileView === 'tree' ? 'flex' : 'hidden md:flex'
            } w-full md:w-80 xl:w-96 flex-col bg-[#0E141D] overflow-hidden shrink-0`}
          >
            <div className="h-7 px-3 bg-[#111822] border-b border-[#1E293B] flex items-center justify-between text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5 font-medium text-slate-300">
                <FolderTree className="w-3 h-3 text-emerald-400" />
                <span>Object Tree</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={expandAll}
                  className="hover:text-slate-200 px-1 py-0.5 rounded transition-colors"
                >
                  Expand
                </button>
                <span>/</span>
                <button
                  onClick={collapseAll}
                  className="hover:text-slate-200 px-1 py-0.5 rounded transition-colors"
                >
                  Collapse
                </button>
              </div>
            </div>

            {/* Tree search filter */}
            <div className="p-2 border-b border-[#1E293B] bg-[#111822]">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={treeSearch}
                  onChange={(e) => setTreeSearch(e.target.value)}
                  placeholder="Filter keys or values..."
                  className="w-full pl-8 pr-3 py-1 bg-[#0B0F14] border border-[#1E293B] rounded text-[11px] text-slate-200 placeholder-slate-500 outline-none focus:border-sky-500"
                />
              </div>
            </div>

            {/* Tree Viewport */}
            <div className="flex-1 overflow-auto p-3 space-y-0.5">
              {parsedData ? (
                renderTreeNode('root', parsedData, 'root', 0)
              ) : (
                <div className="p-4 text-center text-xs text-slate-500">
                  Fix JSON syntax errors to explore the object tree.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
