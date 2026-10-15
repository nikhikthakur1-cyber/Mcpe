import React, { useMemo, useState, useEffect } from 'react';
import { Search, Filter, Sparkles, CheckCircle2, ChevronUp, X, Eye, SlidersHorizontal, RefreshCw } from 'lucide-react';
import { TextureSlot, TextureCategory, ProjectFile } from '../../types';
import { TEXTURE_CATALOG, CATEGORY_LABELS } from '../../data/textureCatalog';
import { TextureCard } from './TextureCard';
import { CanvasPixelPreview } from './CanvasPixelPreview';
import { TextureInspector } from './TextureInspector';
import { getVanillaTextureUrl } from '../../utils/vanillaTextureGenerator';

interface TextureBrowserProps {
  customSlots: Record<string, string>; // slotId -> filePath
  files: Record<string, ProjectFile>;
  selectedSlot: TextureSlot | null;
  onSelectSlot: (slot: TextureSlot) => void;
  onUploadTexture: (slot: TextureSlot, file: File) => Promise<void>;
  onRemoveCustomTexture: (slot: TextureSlot) => void;
  onJumpToExplorer?: (path: string) => void;
  onOpenZipModal?: () => void;
}

const PAGE_CHUNK = 36;

export const TextureBrowser: React.FC<TextureBrowserProps> = ({
  customSlots,
  files,
  selectedSlot,
  onSelectSlot,
  onUploadTexture,
  onRemoveCustomTexture,
  onJumpToExplorer,
  onOpenZipModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  // View mode: 'all' shows all vanilla defaults + customized, 'custom' shows only customized
  const [viewMode, setViewMode] = useState<'all' | 'custom'>('all');
  // Card density mode: 'comfortable' vs 'compact'
  const [cardSize, setCardSize] = useState<'comfortable' | 'compact'>('comfortable');
  const [displayCount, setDisplayCount] = useState<number>(PAGE_CHUNK);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState<boolean>(false);

  // Reset pagination limit on filter change
  useEffect(() => {
    setDisplayCount(PAGE_CHUNK);
  }, [searchQuery, selectedCategory, viewMode]);

  // Filter slots
  const filteredSlots = useMemo(() => {
    return TEXTURE_CATALOG.filter((slot) => {
      if (selectedCategory !== 'all' && slot.category !== selectedCategory) {
        return false;
      }

      const isCustom = Boolean(customSlots[slot.id]);
      // When 'custom' is selected, show ONLY customized textures
      // When 'all' is selected (default), show all vanilla textures (plus customized replacements)
      if (viewMode === 'custom' && !isCustom) {
        return false;
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = slot.name.toLowerCase().includes(query);
        const matchesPath = slot.path.toLowerCase().includes(query);
        const matchesCategory = slot.category.toLowerCase().includes(query);
        const matchesId = slot.id.toLowerCase().includes(query);
        if (!matchesName && !matchesPath && !matchesCategory && !matchesId) {
          return false;
        }
      }

      return true;
    });
  }, [searchQuery, selectedCategory, viewMode, customSlots]);

  // Windowed visible slots
  const visibleSlots = useMemo(() => {
    return filteredSlots.slice(0, displayCount);
  }, [filteredSlots, displayCount]);

  const activeCustomFile = selectedSlot && customSlots[selectedSlot.id]
    ? files[customSlots[selectedSlot.id]]
    : undefined;

  const customizedCount = Object.keys(customSlots).length;

  const handleCardSelect = (slot: TextureSlot) => {
    onSelectSlot(slot);
    // On small screens, automatically show mobile drawer
    if (window.innerWidth < 1024) {
      setIsMobileDrawerOpen(true);
    }
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-[#0B0F14] relative">
      {/* Main Center Area: Catalog browser + Pixel Preview */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Search & Filter Toolbar */}
        <div className="p-3 md:p-4 bg-[#0F1622] border-b border-[#1E293B] flex flex-wrap items-center justify-between gap-3 md:gap-4 shrink-0 shadow-sm">
          {/* Search bar */}
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search 4,880 textures (e.g. crafter, pale oak, mace, gui)..."
              className="w-full pl-9 pr-8 py-2 bg-[#090D14] border border-[#223044] focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/20 rounded-lg text-xs text-slate-100 placeholder-slate-500 outline-none transition-all shadow-inner font-sans"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto max-w-full p-1 bg-[#090D14] rounded-xl border border-[#1E293B] scrollbar-none shadow-inner">
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => {
              const isActive = selectedCategory === key;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedCategory(key)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap min-h-[30px] ${
                    isActive
                      ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-semibold shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#141C26]'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Mode Switcher: All Textures vs Customized + Compact Toggle */}
          <div className="flex items-center gap-2">
            <div className="flex items-center p-1 bg-[#090D14] rounded-xl border border-[#1E293B] shadow-inner">
              <button
                onClick={() => setCardSize('comfortable')}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition-all ${
                  cardSize === 'comfortable'
                    ? 'bg-[#1E293B] text-slate-100 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Comfortable card view"
              >
                Standard
              </button>
              <button
                onClick={() => setCardSize('compact')}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition-all ${
                  cardSize === 'compact'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Compact card view for mobile/tablet density"
              >
                Compact List
              </button>
            </div>

            <div className="flex items-center p-1 bg-[#090D14] rounded-xl border border-[#1E293B] shadow-inner">
              <button
                onClick={() => setViewMode('all')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap min-h-[30px] ${
                  viewMode === 'all'
                    ? 'bg-sky-500/20 border border-sky-500/40 text-sky-300 font-semibold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#141C26]'
                }`}
                title="Show all Minecraft Bedrock 1.26.52.3 vanilla default textures"
              >
                <span>All ({TEXTURE_CATALOG.length})</span>
              </button>

              <button
                onClick={() => setViewMode('custom')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap min-h-[30px] ${
                  viewMode === 'custom'
                    ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-semibold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#141C26]'
                }`}
                title="Show only your customized textures that will be packaged into .mcpack"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Custom ({customizedCount})</span>
              </button>
            </div>

            {onOpenZipModal && (
              <button
                onClick={onOpenZipModal}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600/30 to-teal-600/20 hover:from-emerald-600/40 hover:to-teal-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-semibold rounded-xl transition-all whitespace-nowrap min-h-[30px] shadow-sm"
                title="Download missing textures or sync official vanilla pack"
              >
                <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Sync Vanilla Pack</span>
                <span className="sm:hidden">Sync</span>
              </button>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* Left Grid: Texture Cards */}
          <div className="flex-1 overflow-y-auto p-3 md:p-4 pb-20 lg:pb-4">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3 text-xs text-slate-400">
              <div className="flex flex-wrap items-center gap-2 min-w-0">
                <span className="truncate">
                  Showing <strong className="text-slate-200">{Math.min(visibleSlots.length, filteredSlots.length)}</strong> of {filteredSlots.length} game textures
                </span>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-mono hidden sm:inline">
                  {customizedCount} custom
                </span>
              </div>
            </div>

            {filteredSlots.length > 0 ? (
              <>
                <div
                  className={`grid gap-1.5 sm:gap-2 md:gap-3 ${
                    cardSize === 'compact'
                      ? 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8'
                      : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'
                  }`}
                >
                  {visibleSlots.map((slot) => {
                    const isSelected = selectedSlot?.id === slot.id;
                    const isCustomized = Boolean(customSlots[slot.id]);
                    const customFile = isCustomized ? files[customSlots[slot.id]] : undefined;

                    return (
                      <TextureCard
                        key={slot.id}
                        slot={slot}
                        isSelected={isSelected}
                        isCustomized={isCustomized}
                        customImageData={customFile?.data}
                        onSelect={handleCardSelect}
                        isCompact={cardSize === 'compact'}
                      />
                    );
                  })}
                </div>

                {/* Infinite Scroll Automatic Load Trigger */}
                {visibleSlots.length < filteredSlots.length && (
                  <div
                    ref={(node) => {
                      if (!node) return;
                      const observer = new IntersectionObserver(
                        (entries) => {
                          if (entries[0].isIntersecting) {
                            setDisplayCount((c) => Math.min(filteredSlots.length, c + PAGE_CHUNK));
                          }
                        },
                        { threshold: 0.1 }
                      );
                      observer.observe(node);
                    }}
                    className="py-8 flex flex-col items-center justify-center gap-2 text-slate-500 font-mono text-xs"
                  >
                    <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
                    <span>Dynamically loading textures ({filteredSlots.length - visibleSlots.length} remaining)...</span>
                  </div>
                )}
              </>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 border border-dashed border-[#1E293B] rounded-lg">
                <Filter className="w-8 h-8 text-slate-600 mb-2" />
                <p className="text-sm font-semibold text-slate-300">No texture slots found</p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm">
                  {viewMode === 'custom'
                    ? 'You have not uploaded any custom textures yet in this category.'
                    : 'Try searching with a different keyword or selecting "All Textures".'}
                </p>
                {viewMode === 'custom' && (
                  <button
                    onClick={() => setViewMode('all')}
                    className="mt-3 px-3 py-1.5 text-xs font-medium text-sky-400 hover:text-sky-300 bg-sky-500/10 rounded border border-sky-500/30 transition-colors"
                  >
                    Switch to All Textures (Show All Vanilla Defaults)
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Desktop Right Side: Texture Inspector Panel with Live Pixel Canvas & Comparison */}
      <div className="hidden lg:block shrink-0 h-full border-l border-[#1E293B]">
        <TextureInspector
          selectedSlot={selectedSlot}
          customFile={activeCustomFile}
          onUploadTexture={onUploadTexture}
          onRemoveCustomTexture={onRemoveCustomTexture}
          onJumpToExplorer={onJumpToExplorer}
        />
      </div>

      {/* Mobile Floating Action Bar (when slot is selected on small screens) */}
      {selectedSlot && !isMobileDrawerOpen && (
        <div className="lg:hidden fixed bottom-8 left-3 right-3 z-30 bg-[#161F29] border border-sky-500/40 rounded-xl p-3 shadow-2xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-9 h-9 rounded bg-[#0B0F14] border border-[#232F40] shrink-0 flex items-center justify-center text-emerald-400 font-bold text-xs"
              style={{ backgroundColor: `${selectedSlot.sampleColor}20` }}
            >
              16x
            </div>
            <div className="truncate">
              <h4 className="text-xs font-bold text-white truncate">{selectedSlot.name}</h4>
              <p className="text-[10px] font-mono text-slate-400 truncate">{selectedSlot.path}</p>
            </div>
          </div>

          <button
            onClick={() => setIsMobileDrawerOpen(true)}
            className="flex items-center gap-1 px-3.5 py-2 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold rounded-lg text-xs whitespace-nowrap min-h-[44px]"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Inspect / Upload</span>
          </button>
        </div>
      )}

      {/* Mobile Collapsible Bottom Drawer (Sheets on small screens < 1024px) */}
      {isMobileDrawerOpen && selectedSlot && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex flex-col justify-end">
          <div className="bg-[#111822] border-t border-[#1E293B] rounded-t-2xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Grab Handle Header */}
            <div className="p-3 bg-[#141C26] border-b border-[#1E293B] flex items-center justify-between">
              <div className="w-8" />
              <div className="w-10 h-1 bg-slate-600 rounded-full" />
              <button
                onClick={() => setIsMobileDrawerOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="p-4 overflow-y-auto space-y-4">
              <div className="h-60 border border-[#1E293B] rounded-lg overflow-hidden">
                <CanvasPixelPreview
                  imageData={activeCustomFile ? activeCustomFile.data : null}
                  imageUrl={activeCustomFile ? null : getVanillaTextureUrl(selectedSlot.path)}
                  recommendedDimensions={{
                    width: selectedSlot.recommendedWidth,
                    height: selectedSlot.recommendedHeight,
                  }}
                  sampleColor={selectedSlot.sampleColor}
                />
              </div>

              <TextureInspector
                selectedSlot={selectedSlot}
                customFile={activeCustomFile}
                onUploadTexture={async (slot, file) => {
                  await onUploadTexture(slot, file);
                }}
                onRemoveCustomTexture={(slot) => {
                  onRemoveCustomTexture(slot);
                }}
                onJumpToExplorer={(path) => {
                  setIsMobileDrawerOpen(false);
                  onJumpToExplorer?.(path);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
