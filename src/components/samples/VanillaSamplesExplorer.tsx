import React, { useState, useMemo } from 'react';
import {
  Folder,
  FolderOpen,
  FileCode,
  FileText,
  Search,
  Download,
  Copy,
  Check,
  Plus,
  Layers,
  Sparkles,
  ExternalLink,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import rawSamplesIndex from '../../data/vanillaFullManifestIndex.json';

interface SampleFile {
  path: string;
  size: number;
  type: string;
}

interface VanillaSamplesExplorerProps {
  onCopyPath?: (path: string) => void;
  onImportSampleFile?: (samplePath: string) => Promise<void>;
  onInspectSampleFile?: (samplePath: string) => void;
}

export const VanillaSamplesExplorer: React.FC<VanillaSamplesExplorerProps> = ({
  onCopyPath,
  onImportSampleFile,
  onInspectSampleFile,
}) => {
  const [search, setSearch] = useState('');
  const [selectedFolderFilter, setSelectedFolderFilter] = useState<string>('all');
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<SampleFile | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [isLoadingContent, setIsLoadingContent] = useState(false);

  const samples = rawSamplesIndex as SampleFile[];

  const mainCategories = [
    { id: 'all', label: 'All Resource Pack Files', count: samples.length },
    {
      id: 'ui',
      label: 'Bedrock UI Screens',
      count: samples.filter((s) => s.path.startsWith('ui/')).length,
    },
    {
      id: 'particles',
      label: 'Particle FX Definitions',
      count: samples.filter((s) => s.path.startsWith('particles/')).length,
    },
    {
      id: 'fogs',
      label: 'Atmospheric Biome Fogs',
      count: samples.filter((s) => s.path.startsWith('fogs/')).length,
    },
    {
      id: 'texts',
      label: 'Language & Translation Keys',
      count: samples.filter((s) => s.path.endsWith('.lang') || s.path.startsWith('texts')).length,
    },
  ];

  const filteredSamples = useMemo(() => {
    return samples.filter((s) => {
      if (selectedFolderFilter !== 'all') {
        if (selectedFolderFilter === 'texts') {
          if (!s.path.endsWith('.lang') && !s.path.startsWith('texts')) return false;
        } else if (!s.path.startsWith(selectedFolderFilter)) {
          return false;
        }
      }

      if (search.trim()) {
        const q = search.toLowerCase().trim();
        return s.path.toLowerCase().includes(q);
      }
      return true;
    });
  }, [samples, selectedFolderFilter, search]);

  const handleCopy = (path: string) => {
    navigator.clipboard.writeText(path).catch(() => {});
    setCopiedPath(path);
    setTimeout(() => setCopiedPath(null), 2000);
    if (onCopyPath) onCopyPath(path);
  };

  const handleSelectFile = async (sample: SampleFile) => {
    setSelectedFile(sample);
    setIsLoadingContent(true);
    setFileContent(null);
    try {
      const res = await fetch(`/vanilla_samples/${sample.path}`);
      if (res.ok) {
        const text = await res.text();
        setFileContent(text);
      } else {
        setFileContent('Unable to fetch file content.');
      }
    } catch {
      setFileContent('Error loading file content.');
    } finally {
      setIsLoadingContent(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0B0F14] text-slate-100 select-none">
      {/* Header */}
      <div className="p-4 bg-[#111822] border-b border-[#1E293B] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-100">
                Official Mojang Bedrock Samples Library
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
                {samples.length} Files
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Browse, inspect, and copy official vanilla JSON definitions, UI templates, particles, and behavior files
            </p>
          </div>
        </div>
      </div>

      {/* Categories Bar */}
      <div className="px-4 py-2.5 bg-[#0E141C] border-b border-[#1E293B] flex flex-wrap items-center gap-2 text-xs">
        {mainCategories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedFolderFilter(cat.id)}
            className={`px-3 py-1.5 rounded-md font-medium text-xs transition-colors flex items-center gap-2 ${
              selectedFolderFilter === cat.id
                ? 'bg-sky-600 text-white shadow-sm'
                : 'bg-[#141C26] hover:bg-[#1C2735] text-slate-400'
            }`}
          >
            <span>{cat.label}</span>
            <span
              className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                selectedFolderFilter === cat.id
                  ? 'bg-sky-700 text-white'
                  : 'bg-[#0B0F14] text-slate-500'
              }`}
            >
              {cat.count}
            </span>
          </button>
        ))}
      </div>

      {/* Main Split Layout: Left File List, Right Inspector */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: Search + Files list */}
        <div className="w-full md:w-1/2 lg:w-5/12 border-r border-[#1E293B] flex flex-col bg-[#0D1219]">
          <div className="p-3 border-b border-[#1E293B]">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter by filename or path (e.g. chest, hud, zombie)..."
                className="w-full pl-8 pr-3 py-1.5 bg-[#080B0F] border border-[#1E293B] rounded text-slate-200 placeholder:text-slate-600 outline-none focus:border-sky-400 font-mono text-xs"
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 font-mono">
              <span>Matches: {filteredSamples.length}</span>
              <span>Click a file to inspect</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-[#1A2533]">
            {filteredSamples.slice(0, 300).map((file) => {
              const isSelected = selectedFile?.path === file.path;
              const isJson = file.path.endsWith('.json');
              const isLang = file.path.endsWith('.lang');

              return (
                <div
                  key={file.path}
                  onClick={() => handleSelectFile(file)}
                  className={`p-2.5 hover:bg-[#141D29] cursor-pointer flex items-center justify-between gap-3 text-xs transition-colors ${
                    isSelected ? 'bg-[#182332] border-l-2 border-sky-400' : ''
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {isJson ? (
                      <FileCode className="w-4 h-4 text-amber-400 shrink-0" />
                    ) : isLang ? (
                      <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <FileCode className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                    <span className="font-mono text-xs text-slate-300 truncate" title={file.path}>
                      {file.path}
                    </span>
                  </div>

                  <span className="text-[10px] text-slate-500 font-mono shrink-0">
                    {(file.size / 1024).toFixed(1)} KB
                  </span>
                </div>
              );
            })}
            {filteredSamples.length > 300 && (
              <div className="p-3 text-center text-[11px] text-slate-500 font-mono">
                Showing first 300 of {filteredSamples.length} files. Use search above to narrow down.
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Preview & Add to Pack */}
        <div className="hidden md:flex flex-1 flex-col bg-[#090D12] overflow-hidden">
          {selectedFile ? (
            <div className="flex flex-col h-full">
              {/* File details bar */}
              <div className="p-3 bg-[#111822] border-b border-[#1E293B] flex items-center justify-between">
                <div>
                  <h3 className="font-mono text-xs font-semibold text-slate-200">
                    {selectedFile.path}
                  </h3>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Size: {(selectedFile.size / 1024).toFixed(2)} KB
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(selectedFile.path)}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-[#1A2533] hover:bg-[#223042] text-xs rounded text-slate-200 transition-colors"
                  >
                    {copiedPath === selectedFile.path ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400 text-xs">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Path</span>
                      </>
                    )}
                  </button>

                  {onImportSampleFile && (
                    <button
                      onClick={() => onImportSampleFile(selectedFile.path)}
                      className="flex items-center gap-1.5 px-3 py-1 bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs rounded transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add to Pack</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Code viewer */}
              <div className="flex-1 p-4 overflow-y-auto font-mono text-xs bg-[#06080B] text-slate-300">
                {isLoadingContent ? (
                  <div className="flex items-center justify-center h-full text-slate-500">
                    Loading vanilla template...
                  </div>
                ) : (
                  <pre className="whitespace-pre-wrap leading-relaxed select-text">
                    {fileContent || 'No content loaded.'}
                  </pre>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-500">
              <FileCode className="w-12 h-12 mb-3 text-slate-600" />
              <p className="text-sm font-medium text-slate-400">Select any Vanilla Sample</p>
              <p className="text-xs max-w-sm mt-1">
                Choose from over 3,300 official Bedrock UI screens, particles, biome fogs, or behavior recipes to preview and inject into your pack.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
