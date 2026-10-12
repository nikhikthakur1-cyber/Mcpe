import React, { useState, useMemo } from 'react';
import {
  Folder,
  FolderOpen,
  FileImage,
  FileCode,
  File as FileIcon,
  ChevronRight,
  ChevronDown,
  Trash2,
  Eye,
  Plus,
  Upload,
} from 'lucide-react';
import { ProjectFile } from '../../types';

interface FileTreeProps {
  files: Record<string, ProjectFile>;
  onSelectFile: (file: ProjectFile) => void;
  onDeleteFile: (path: string) => void;
  onUploadCustomFile: (path: string, file: File) => Promise<void>;
  onEditJsonFile?: (path: string) => void;
}

interface TreeNode {
  name: string;
  path: string;
  isFolder: boolean;
  children: Record<string, TreeNode>;
  file?: ProjectFile;
}

export const FileTree: React.FC<FileTreeProps> = ({
  files,
  onSelectFile,
  onDeleteFile,
  onUploadCustomFile,
  onEditJsonFile,
}) => {
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    '': true,
    textures: true,
    'textures/blocks': true,
    'textures/items': true,
    'textures/entity': true,
  });

  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [isAddingFile, setIsAddingFile] = useState(false);
  const [newFilePath, setNewFilePath] = useState('');
  const [selectedUploadFile, setSelectedUploadFile] = useState<File | null>(null);

  // Build tree from files dictionary
  const tree = useMemo(() => {
    const root: TreeNode = {
      name: 'root',
      path: '',
      isFolder: true,
      children: {},
    };

    // Always include manifest.json in visual tree even if generated dynamically
    const allPaths = Object.keys(files);
    if (!allPaths.includes('manifest.json')) {
      allPaths.unshift('manifest.json');
    }

    for (const rawPath of allPaths) {
      const parts = rawPath.split('/');
      let current = root;
      let currentPath = '';

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        currentPath = currentPath ? `${currentPath}/${part}` : part;
        const isLast = i === parts.length - 1;

        if (isLast) {
          current.children[part] = {
            name: part,
            path: currentPath,
            isFolder: false,
            children: {},
            file: files[currentPath],
          };
        } else {
          if (!current.children[part]) {
            current.children[part] = {
              name: part,
              path: currentPath,
              isFolder: true,
              children: {},
            };
          }
          current = current.children[part];
        }
      }
    }

    return root;
  }, [files]);

  const toggleFolder = (folderPath: string) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [folderPath]: !prev[folderPath],
    }));
  };

  const handleCreateFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFilePath.trim() || !selectedUploadFile) return;

    let targetPath = newFilePath.trim().replace(/^\/+/, '');
    await onUploadCustomFile(targetPath, selectedUploadFile);

    setIsAddingFile(false);
    setNewFilePath('');
    setSelectedUploadFile(null);
  };

  const renderNode = (node: TreeNode, depth: number = 0) => {
    if (node.isFolder) {
      const isExpanded = expandedFolders[node.path] !== false;
      const sortedChildKeys = Object.keys(node.children).sort((a, b) => {
        const nodeA = node.children[a];
        const nodeB = node.children[b];
        if (nodeA.isFolder === nodeB.isFolder) return a.localeCompare(b);
        return nodeA.isFolder ? -1 : 1;
      });

      return (
        <div key={node.path || 'root'}>
          {node.path && (
            <div
              onClick={() => toggleFolder(node.path)}
              style={{ paddingLeft: `${depth * 14 + 12}px` }}
              className="flex items-center gap-1.5 py-1.5 hover:bg-[#161F29] cursor-pointer text-xs text-slate-300 font-medium select-none group"
            >
              {isExpanded ? (
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
              )}
              {isExpanded ? (
                <FolderOpen className="w-4 h-4 text-sky-400 shrink-0" />
              ) : (
                <Folder className="w-4 h-4 text-sky-400 shrink-0" />
              )}
              <span className="truncate">{node.name}</span>
            </div>
          )}

          {isExpanded && (
            <div>
              {sortedChildKeys.map((key) => renderNode(node.children[key], depth + 1))}
            </div>
          )}
        </div>
      );
    }

    // Leaf file
    const isSelected = selectedPath === node.path;
    const isImage = node.name.toLowerCase().endsWith('.png');
    const isJson = node.name.toLowerCase().endsWith('.json');
    const isManifest = node.path.toLowerCase() === 'manifest.json';
    const fileSize = node.file ? (node.file.data.length / 1024).toFixed(1) : null;

    return (
      <div
        key={node.path}
        onClick={() => {
          setSelectedPath(node.path);
          if (node.file) onSelectFile(node.file);
        }}
        style={{ paddingLeft: `${depth * 14 + 12}px` }}
        className={`flex items-center justify-between py-1.5 pr-3 hover:bg-[#161F29] cursor-pointer text-xs select-none group transition-colors ${
          isSelected ? 'bg-[#182332] text-white' : 'text-slate-300'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {isImage ? (
            <FileImage className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : isJson ? (
            <FileCode className="w-4 h-4 text-amber-400 shrink-0" />
          ) : (
            <FileIcon className="w-4 h-4 text-slate-400 shrink-0" />
          )}

          <span className="font-mono text-xs truncate" title={node.path}>
            {node.name}
          </span>

          {isManifest && (
            <span className="text-[10px] text-amber-400 bg-amber-400/10 px-1.5 py-0.2 rounded font-medium">
              Core
            </span>
          )}

          {node.file?.isCustom && (
            <span className="text-[10px] text-emerald-400 bg-emerald-400/10 px-1.5 py-0.2 rounded font-medium">
              Custom
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {fileSize && (
            <span className="text-[10px] text-slate-500 font-mono">
              {fileSize} KB
            </span>
          )}

          {isJson && onEditJsonFile && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEditJsonFile(node.path);
              }}
              title="Open in Split JSON Editor"
              className="text-sky-400 hover:text-sky-300 p-0.5"
            >
              <FileCode className="w-3.5 h-3.5" />
            </button>
          )}

          {node.file && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelectFile(node.file!);
              }}
              title="Inspect File"
              className="text-slate-400 hover:text-slate-200 p-0.5"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          )}

          {!isManifest && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm(`Delete "${node.path}" from resource pack?`)) {
                  onDeleteFile(node.path);
                }
              }}
              title="Delete File"
              className="text-slate-500 hover:text-red-400 p-0.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    );
  };

  const totalFiles = Object.keys(files).length;

  return (
    <div className="flex flex-col h-full bg-[#111822] border-r border-[#1E293B] select-none">
      {/* Explorer Header */}
      <div className="p-3 bg-[#141C26] border-b border-[#1E293B] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-200">Pack Explorer</span>
          <span className="text-[10px] font-mono text-slate-400">({totalFiles} files)</span>
        </div>

        <button
          onClick={() => setIsAddingFile(true)}
          title="Add File to Resource Pack"
          className="flex items-center gap-1 text-[11px] text-slate-300 hover:text-emerald-400 px-2 py-1 bg-[#0B0F14] hover:bg-[#1E293B] border border-[#1E293B] rounded transition-colors"
        >
          <Plus className="w-3 h-3" />
          <span>Add File</span>
        </button>
      </div>

      {/* New File Modal / Inline form */}
      {isAddingFile && (
        <form
          onSubmit={handleCreateFile}
          className="p-3 bg-[#182332] border-b border-sky-500/40 text-xs space-y-2.5"
        >
          <div className="flex items-center justify-between">
            <span className="font-semibold text-sky-400">Add File to Archive</span>
            <button
              type="button"
              onClick={() => setIsAddingFile(false)}
              className="text-slate-400 hover:text-slate-200"
            >
              ✕
            </button>
          </div>

          <div>
            <label className="text-[11px] text-slate-400 block mb-1">
              Relative Path (e.g. textures/blocks/custom_ore.png)
            </label>
            <input
              type="text"
              required
              value={newFilePath}
              onChange={(e) => setNewFilePath(e.target.value)}
              placeholder="textures/blocks/my_block.png"
              className="w-full px-2.5 py-1.5 bg-[#0B0F14] border border-[#1E293B] rounded text-slate-100 font-mono text-xs outline-none focus:border-sky-400"
            />
          </div>

          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Upload File</label>
            <input
              type="file"
              required
              onChange={(e) => setSelectedUploadFile(e.target.files?.[0] || null)}
              className="text-[11px] text-slate-300 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-slate-800 file:text-slate-200 file:text-[11px] hover:file:bg-slate-700"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAddingFile(false)}
              className="px-2.5 py-1 text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedUploadFile || !newFilePath.trim()}
              className="px-3 py-1 bg-sky-500 hover:bg-sky-400 text-slate-950 font-medium rounded disabled:opacity-50"
            >
              Add to Pack
            </button>
          </div>
        </form>
      )}

      {/* Tree View */}
      <div className="flex-1 overflow-y-auto py-2">
        {renderNode(tree)}
      </div>

      {/* Footer Info */}
      <div className="p-2.5 bg-[#0B0F14] border-t border-[#1E293B] text-[10px] text-slate-500 font-mono flex items-center justify-between">
        <span>Root level pack archive</span>
        <span className="text-emerald-400">Ready</span>
      </div>
    </div>
  );
};
