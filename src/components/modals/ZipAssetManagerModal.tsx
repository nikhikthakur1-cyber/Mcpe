import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Package,
  Download,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Search,
  Music,
  Image as ImageIcon,
  FileText,
  Layers,
  Globe,
  Sparkles,
} from 'lucide-react';
import { zipAssetService, ZipAssetLoaderState, ZipAssetEntry } from '../../services/zipAssetService';

interface ZipAssetManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string) => void;
}

export const ZipAssetManagerModal: React.FC<ZipAssetManagerModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
}) => {
  const [zipState, setZipState] = useState<ZipAssetLoaderState>(zipAssetService.getState());
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'textures' | 'sounds'>('all');
  const [isReloading, setIsReloading] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncStatus, setSyncStatus] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const unsubscribe = zipAssetService.subscribe((s) => {
      setZipState(s);
    });
    return unsubscribe;
  }, []);

  const entries = useMemo(() => {
    return zipAssetService.listEntries(activeTab === 'all' ? undefined : activeTab);
  }, [zipState, activeTab]);

  const filteredEntries = useMemo(() => {
    if (!search.trim()) return entries.slice(0, 200);
    const q = search.toLowerCase().trim();
    return entries.filter((e) => e.path.toLowerCase().includes(q) || e.name.toLowerCase().includes(q)).slice(0, 300);
  }, [entries, search]);

  if (!isOpen) return null;

  const handleSyncOfficial = async () => {
    setIsSyncing(true);
    setSyncProgress(10);
    setSyncStatus('Connecting to official Mojang repository...');
    try {
      const res = await zipAssetService.syncOfficialVanillaPack((pct, status) => {
        setSyncProgress(pct);
        setSyncStatus(status);
      });
      if (res.success) {
        onShowToast(`Synced ${res.count} vanilla textures from official repository!`);
      } else {
        onShowToast(`Sync failed: ${res.error || 'Unknown error'}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sync failed';
      onShowToast(`Error: ${msg}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleReloadZip = async () => {
    setIsReloading(true);
    const ok = await zipAssetService.loadZipFromUrl('/vanilla_assets.zip');
    setIsReloading(false);
    if (ok) {
      onShowToast('Successfully unzipped & loaded assets from vanilla_assets.zip!');
    } else {
      onShowToast('Error loading ZIP file.');
    }
  };

  const handleCustomZipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsReloading(true);
    try {
      const count = await zipAssetService.processZipBlob(file, file.name);
      onShowToast(`Unpacked ${count} assets from ${file.name}`);
    } catch {
      onShowToast('Failed to parse uploaded ZIP archive.');
    } finally {
      setIsReloading(false);
    }
  };

  const handleDownloadZip = () => {
    zipAssetService.downloadZip(zipState.zipName);
    onShowToast(`Downloading ${zipState.zipName}...`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200 select-none">
      <div className="bg-[#0F1622] border border-[#1E293B] w-full max-w-4xl max-h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Header */}
        <div className="p-4 bg-[#111822] border-b border-[#1E293B] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-100">Vanilla Asset Pack & Repository Sync</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  {zipState.zipName}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Streaming textures directly from compressed ZIP with automatic official Mojang GitHub fallback
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-[#1E293B] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Sync Banner */}
        {isSyncing && (
          <div className="p-3 bg-emerald-950/40 border-b border-emerald-500/30 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs text-emerald-300 font-mono">
              <span className="flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                <span>{syncStatus || 'Downloading official vanilla pack...'}</span>
              </span>
              <span>{syncProgress}%</span>
            </div>
            <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-emerald-500/20">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                style={{ width: `${syncProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Status Dashboard Banner */}
        <div className="p-4 bg-[#090D14] border-b border-[#1E293B] grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="bg-[#121926] p-3 rounded-xl border border-[#1C2738] flex flex-col justify-between">
            <span className="text-[10px] text-slate-500 uppercase font-mono">ZIP Status</span>
            <div className="flex items-center gap-1.5 font-bold text-slate-100 mt-1">
              {zipState.isLoading || isReloading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                  <span className="text-amber-400">Indexing ZIP...</span>
                </>
              ) : zipState.isLoaded ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300">Active in Memory</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                  <span className="text-rose-400">Not Loaded</span>
                </>
              )}
            </div>
          </div>

          <div className="bg-[#121926] p-3 rounded-xl border border-[#1C2738] flex flex-col justify-between">
            <span className="text-[10px] text-slate-500 uppercase font-mono">Indexed Files</span>
            <span className="text-sm font-extrabold text-sky-400 font-mono mt-1">
              {zipState.fileCount.toLocaleString()} items
            </span>
          </div>

          <div className="bg-[#121926] p-3 rounded-xl border border-[#1C2738] flex flex-col justify-between">
            <span className="text-[10px] text-slate-500 uppercase font-mono">Textures & Sounds</span>
            <div className="flex items-center gap-2 font-mono text-[11px] text-slate-300 mt-1">
              <span className="text-emerald-400">{zipState.texturesCount} Tex</span>
              <span>/</span>
              <span className="text-indigo-400">{zipState.soundsCount} Snd</span>
            </div>
          </div>

          <div className="bg-[#121926] p-3 rounded-xl border border-[#1C2738] flex flex-col justify-between">
            <span className="text-[10px] text-slate-500 uppercase font-mono">Auto-Download Status</span>
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1 mt-1">
              <Globe className="w-3.5 h-3.5" />
              <span>Mojang GitHub Sync ON</span>
            </span>
          </div>
        </div>

        {/* Toolbar & Filter Tabs */}
        <div className="p-3 bg-[#0D131D] border-b border-[#1E293B] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            {(['all', 'textures', 'sounds'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-lg font-medium capitalize transition-colors flex items-center gap-1.5 ${
                  activeTab === tab
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-[#141C26] hover:bg-[#1A2533] text-slate-400'
                }`}
              >
                {tab === 'textures' && <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />}
                {tab === 'sounds' && <Music className="w-3.5 h-3.5 text-indigo-400" />}
                {tab === 'all' && <Layers className="w-3.5 h-3.5 text-slate-400" />}
                <span>{tab}</span>
              </button>
            ))}
          </div>

          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter ZIP contents (e.g. acacia, stone, .png)..."
              className="w-full pl-9 pr-3 py-1.5 bg-[#070A0F] border border-[#1E293B] rounded-lg text-slate-200 placeholder:text-slate-600 outline-none focus:border-emerald-400 font-mono text-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Sync Official Mojang Pack */}
            <button
              onClick={handleSyncOfficial}
              disabled={isSyncing}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-lg transition-all shadow-md shadow-emerald-950/40"
              title="Download full official vanilla asset pack from Mojang repository"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>Sync Official Pack</span>
            </button>

            <label className="flex items-center gap-1.5 px-3 py-1.5 bg-[#16212E] hover:bg-[#1C2A3B] border border-[#1E293B] text-sky-300 rounded-lg cursor-pointer transition-colors font-medium">
              <Upload className="w-3.5 h-3.5" />
              <span>Import ZIP</span>
              <input
                type="file"
                accept=".zip,.mcpack"
                onChange={handleCustomZipUpload}
                className="hidden"
              />
            </label>

            <button
              onClick={handleDownloadZip}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-lg transition-colors font-medium"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export ZIP</span>
            </button>
          </div>
        </div>

        {/* Content Entries Grid / Table */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredEntries.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-slate-500 font-mono text-xs gap-2">
              <Package className="w-8 h-8 stroke-1 text-slate-600" />
              <span>No entries matching search criteria inside the ZIP index</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {filteredEntries.map((item) => {
                const isTex = item.category === 'textures';
                const isSnd = item.category === 'sounds';

                return (
                  <div
                    key={item.path}
                    className="bg-[#0B0F15] border border-[#1A2433] hover:border-slate-600 p-2.5 rounded-xl flex items-center gap-3 transition-colors group"
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isTex
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : isSnd
                          ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {isTex && <ImageIcon className="w-4 h-4" />}
                      {isSnd && <Music className="w-4 h-4" />}
                      {!isTex && !isSnd && <FileText className="w-4 h-4" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-slate-200 truncate group-hover:text-white">
                        {item.name}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono truncate">
                        {item.path}
                      </div>
                    </div>

                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#151E2B] text-slate-400 font-mono border border-[#1E293B] shrink-0">
                      ZIP entry
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#111822] border-t border-[#1E293B] flex items-center justify-between text-xs text-slate-400 font-mono">
          <span>
            Displaying {filteredEntries.length} of {entries.length} indexed files
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#1E293B] hover:bg-slate-700 text-slate-200 rounded-lg transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
