import React, { useState } from 'react';
import { X, Sparkles, FolderPlus } from 'lucide-react';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, description: string, version: [number, number, number], engineVersion: [number, number, number], includeDefaultIcon: boolean) => void;
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const [name, setName] = useState('My Custom Pack');
  const [description, setDescription] = useState('A custom Minecraft Bedrock resource pack');
  const [includeIcon, setIncludeIcon] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate(name.trim(), description.trim(), [1, 0, 0], [1, 26, 52], includeIcon);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 select-none">
      <div className="bg-[#111822] border border-[#1E293B] rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-[#141C26] border-b border-[#1E293B] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <FolderPlus className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-100">Create New Resource Pack</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-100 hover:bg-[#1E293B] rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-200 block mb-1.5">
              Pack Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Emerald Haven 16x"
              className="w-full px-3 py-2 bg-[#0B0F14] border border-[#1E293B] rounded-md text-slate-100 text-xs outline-none focus:border-emerald-500 font-medium"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-200 block mb-1.5">
              Pack Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your textures, author details, or release notes..."
              className="w-full px-3 py-2 bg-[#0B0F14] border border-[#1E293B] rounded-md text-slate-100 text-xs outline-none focus:border-emerald-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 p-3 bg-[#0B0F14] rounded-lg border border-[#1E293B] text-[11px] text-slate-400">
            <div>
              <span className="text-slate-500 block">Initial Version:</span>
              <span className="font-mono text-slate-200 font-medium">[1, 0, 0]</span>
            </div>
            <div>
              <span className="text-slate-500 block">Bedrock Engine:</span>
              <span className="font-mono text-emerald-400 font-medium">v1.26.52+</span>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-[#161F29]">
            <input
              type="checkbox"
              checked={includeIcon}
              onChange={(e) => setIncludeIcon(e.target.checked)}
              className="rounded bg-[#0B0F14] border-[#1E293B] text-emerald-500 focus:ring-0"
            />
            <span className="text-slate-300">Generate default Minecraft pack_icon.png</span>
          </label>

          <div className="pt-3 border-t border-[#1E293B] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-slate-400 hover:text-slate-200 text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold rounded-md shadow-sm transition-colors text-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Initialize Pack</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
