import React, { useState, useMemo, useCallback } from 'react';
import {
  FileCode2,
  FileImage,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Eye,
  Layers,
  RefreshCw,
  Search,
  PlusCircle,
  BookOpen,
} from 'lucide-react';
import { ConnectionGraph, ProjectFile } from '../../types';
import { CanvasPixelPreview } from '../textures/CanvasPixelPreview';
import { getVanillaTextureUrl } from '../../utils/vanillaTextureGenerator';

interface ConnectionTreeViewProps {
  graph: ConnectionGraph;
  files: Record<string, ProjectFile>;
  onOpenJsonEditor: (filePath: string) => void;
  onSelectTexture: (filePath: string) => void;
  onRefreshGraph: () => void;
  onOpenCreateAssetWizard?: () => void;
  onOpenFormatGuide?: () => void;
}

export const ConnectionTreeView: React.FC<ConnectionTreeViewProps> = ({
  graph,
  files,
  onOpenJsonEditor,
  onSelectTexture,
  onRefreshGraph,
  onOpenCreateAssetWizard,
  onOpenFormatGuide,
}) => {
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    'manifest.json': true,
    'textures/terrain_texture.json': true,
    'textures/item_texture.json': true,
    unreferenced: false, // collapsed by default to prevent initial load freeze
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [inspectedTexturePath, setInspectedTexturePath] = useState<string | null>(null);

  const toggleNode = useCallback((key: string) => {
    setExpandedNodes((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }, []);

  // Filtered JSON nodes based on search query - memoized for zero latency
  const filteredJsonNodes = useMemo(() => {
    if (!searchQuery.trim()) return graph.jsonNodes;
    const query = searchQuery.toLowerCase().trim();

    return graph.jsonNodes.filter((node) => {
      if (node.title.toLowerCase().includes(query)) return true;
      if (node.jsonPath.toLowerCase().includes(query)) return true;
      return node.references.some(
        (r) =>
          r.resolvedPath.toLowerCase().includes(query) ||
          r.rawReference.toLowerCase().includes(query) ||
          r.jsonKeyPath.toLowerCase().includes(query)
      );
    });
  }, [graph.jsonNodes, searchQuery]);

  const filteredUnreferenced = useMemo(() => {
    if (!searchQuery.trim()) return graph.unreferencedTextures;
    const query = searchQuery.toLowerCase().trim();
    return graph.unreferencedTextures.filter((p) => p.toLowerCase().includes(query));
  }, [graph.unreferencedTextures, searchQuery]);

  const inspectedFile = inspectedTexturePath ? files[inspectedTexturePath] : null;

  return (
    <div className="flex h-full w-full bg-[#0B0F14] select-none overflow-hidden flex-col md:flex-row">
      {/* Main Connection Tree Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden border-r border-[#1E293B]">
        {/* Header Toolbar */}
        <div className="p-3 md:p-4 bg-[#111822] border-b border-[#1E293B] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <span>JSON ↔ Texture Connection Tree</span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                  {graph.totalLinkedTextures} Active Links
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Fast on-demand graph linking Bedrock JSON definitions to texture files.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Real-time search filter */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter links or paths..."
                className="pl-8 pr-3 py-1 bg-[#0B0F14] border border-[#1E293B] rounded-md text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-emerald-500 w-36 md:w-48"
              />
            </div>

            {/* "+ New Custom Asset / JSON" Wizard Trigger */}
            {onOpenCreateAssetWizard && (
              <button
                onClick={onOpenCreateAssetWizard}
                className="px-2.5 py-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded flex items-center gap-1.5 transition-colors shadow-sm"
                title="Create a new custom JSON and texture mapping"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>+ Custom Asset</span>
              </button>
            )}

            {/* Bedrock Format Specs Guide */}
            {onOpenFormatGuide && (
              <button
                onClick={onOpenFormatGuide}
                className="px-2 py-1 text-xs font-medium text-slate-300 hover:text-white bg-[#161F29] border border-[#1E293B] hover:border-slate-600 rounded flex items-center gap-1.5 transition-colors"
                title="View Bedrock v1.26.52.3 Format Guide"
              >
                <BookOpen className="w-3.5 h-3.5 text-sky-400" />
                <span className="hidden sm:inline">Format Guide</span>
              </button>
            )}

            <button
              onClick={onRefreshGraph}
              title="Refresh Graph"
              className="p-1.5 text-slate-400 hover:text-slate-100 bg-[#161F29] border border-[#1E293B] rounded transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Tree Canvas */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          {/* Root Resource Pack Node */}
          <div className="p-3 bg-[#111822] border border-[#1E293B] rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded bg-emerald-400/20 text-emerald-300 flex items-center justify-center text-xs font-bold font-mono">
                RP
              </div>
              <div>
                <span className="text-xs font-bold text-slate-100">Minecraft Resource Pack Root</span>
                <span className="text-[11px] text-slate-500 block">
                  Governs {graph.jsonNodes.length} JSON definitions and {Object.keys(files).length} total pack files
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="text-emerald-400">{graph.totalLinkedTextures} linked</span>
              {graph.missingReferencesCount > 0 && (
                <span className="text-red-400">{graph.missingReferencesCount} missing</span>
              )}
            </div>
          </div>

          {/* JSON Definition Branches */}
          <div className="space-y-3 pl-2 md:pl-4 border-l-2 border-[#1E293B]">
            {filteredJsonNodes.map((jsonNode) => {
              const isExpanded = expandedNodes[jsonNode.jsonPath] !== false;
              const hasMissing = jsonNode.references.some((r) => !r.exists);

              return (
                <div
                  key={jsonNode.jsonPath}
                  className="bg-[#111822] border border-[#1E293B] rounded-lg overflow-hidden transition-all"
                >
                  {/* JSON Node Header */}
                  <div
                    onClick={() => toggleNode(jsonNode.jsonPath)}
                    className="p-3 bg-[#141C26] hover:bg-[#182332] cursor-pointer flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                      )}
                      <FileCode2 className="w-4 h-4 text-sky-400 shrink-0" />
                      <div className="truncate">
                        <span className="text-xs font-bold text-slate-200">{jsonNode.title}</span>
                        <span className="text-[10px] font-mono text-slate-500 block truncate">
                          {jsonNode.jsonPath}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
                        {jsonNode.references.length} refs
                      </span>

                      {hasMissing ? (
                        <span className="text-[10px] text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded font-mono flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Broken links
                        </span>
                      ) : (
                        <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded font-mono flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Verified
                        </span>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenJsonEditor(jsonNode.jsonPath);
                        }}
                        className="px-2 py-1 text-[11px] font-medium text-slate-300 hover:text-white bg-[#1E293B] hover:bg-slate-700 rounded transition-colors flex items-center gap-1"
                      >
                        <span>Edit</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Connected Texture Children (Rendered lazily on expansion) */}
                  {isExpanded && (
                    <div className="p-2 md:p-3 bg-[#0E141D] divide-y divide-[#1A2433]">
                      {jsonNode.references.length > 0 ? (
                        jsonNode.references.map((ref, idx) => {
                          const isInspected = inspectedTexturePath === ref.resolvedPath;

                          return (
                            <div
                              key={`${ref.resolvedPath}_${idx}`}
                              onClick={() => {
                                setInspectedTexturePath(ref.resolvedPath);
                                onSelectTexture(ref.resolvedPath);
                              }}
                              className={`py-2 px-2 rounded flex items-center justify-between cursor-pointer transition-colors ${
                                isInspected
                                  ? 'bg-[#182332] text-white'
                                  : 'hover:bg-[#141C28] text-slate-300'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="text-slate-600 font-mono text-xs">└─</span>
                                <FileImage
                                  className={`w-3.5 h-3.5 shrink-0 ${
                                    ref.exists ? 'text-emerald-400' : 'text-red-400'
                                  }`}
                                />
                                <div className="truncate">
                                  <span className="text-xs font-mono font-medium truncate block">
                                    {ref.resolvedPath}
                                  </span>
                                  <span className="text-[10px] font-mono text-slate-500 truncate block">
                                    Key: {ref.jsonKeyPath}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                {ref.exists ? (
                                  <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                                    <CheckCircle2 className="w-3 h-3" /> Verified
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-red-400 flex items-center gap-1 font-mono">
                                    <AlertCircle className="w-3 h-3" /> Missing
                                  </span>
                                )}

                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setInspectedTexturePath(ref.resolvedPath);
                                  }}
                                  title="Inspect Texture"
                                  className="p-1 text-slate-400 hover:text-slate-200"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="py-2 text-[11px] text-slate-500 italic pl-6">
                          No texture references found inside this JSON file.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Unreferenced Textures Branch */}
            {filteredUnreferenced.length > 0 && (
              <div className="bg-[#111822] border border-[#1E293B] rounded-lg overflow-hidden">
                <div
                  onClick={() => toggleNode('unreferenced')}
                  className="p-3 bg-[#141C26] hover:bg-[#182332] cursor-pointer flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {expandedNodes['unreferenced'] ? (
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    )}
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <div>
                      <span className="text-xs font-bold text-slate-200">
                        Unregistered Textures ({filteredUnreferenced.length})
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        Files in pack that are not explicitly defined in a JSON atlas
                      </span>
                    </div>
                  </div>
                </div>

                {expandedNodes['unreferenced'] && (
                  <div className="p-3 bg-[#0E141D] divide-y divide-[#1A2433] max-h-56 overflow-y-auto">
                    {filteredUnreferenced.map((path) => (
                      <div
                        key={path}
                        onClick={() => {
                          setInspectedTexturePath(path);
                          onSelectTexture(path);
                        }}
                        className="py-1.5 px-2 rounded hover:bg-[#141C28] flex items-center justify-between cursor-pointer text-xs font-mono text-slate-300"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <FileImage className="w-3.5 h-3.5 text-slate-400" />
                          <span className="truncate">{path}</span>
                        </div>
                        <span className="text-[10px] text-amber-400 font-mono">Unregistered</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Texture Inspector Drawer */}
      <div className="w-full md:w-80 flex flex-col h-72 md:h-full bg-[#0E141D] shrink-0 border-t md:border-t-0 md:border-l border-[#1E293B]">
        <div className="p-3 md:p-4 bg-[#141C26] border-b border-[#1E293B] flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-200">Asset Preview</span>
          {inspectedFile && (
            <span className="text-[10px] font-mono text-emerald-400">
              {(inspectedFile.data.length / 1024).toFixed(1)} KB
            </span>
          )}
        </div>

        <div className="flex-1 p-3 md:p-4 flex flex-col justify-center overflow-auto">
          {inspectedFile ? (
            <div className="h-full flex flex-col">
              <div className="flex-1 min-h-[160px] md:min-h-[260px] mb-2">
                <CanvasPixelPreview imageData={inspectedFile.data} />
              </div>
              <div className="p-2.5 bg-[#111822] rounded border border-[#1E293B] text-xs font-mono space-y-1">
                <span className="text-slate-400 block text-[10px]">CUSTOM FILE PATH</span>
                <span className="text-slate-200 text-xs block break-all">{inspectedFile.path}</span>
              </div>
            </div>
          ) : inspectedTexturePath ? (
            <div className="h-full flex flex-col">
              <div className="flex-1 min-h-[160px] md:min-h-[260px] mb-2">
                <CanvasPixelPreview imageUrl={getVanillaTextureUrl(inspectedTexturePath)} />
              </div>
              <div className="p-2.5 bg-[#111822] rounded border border-[#1E293B] text-xs font-mono space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 block text-[10px]">VANILLA REFERENCE</span>
                  <span className="text-[10px] text-amber-400/80 font-mono">Default Bedrock Asset</span>
                </div>
                <span className="text-slate-200 text-xs block break-all">{inspectedTexturePath}</span>
              </div>
            </div>
          ) : (
            <div className="text-center p-6 text-slate-500 text-xs">
              <FileImage className="w-8 h-8 mx-auto text-slate-600 mb-2" />
              <p className="font-semibold text-slate-400">No Asset Selected</p>
              <p className="text-[11px] text-slate-600 mt-1">
                Click any texture node in the connection tree to inspect pixel data and resolution.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
