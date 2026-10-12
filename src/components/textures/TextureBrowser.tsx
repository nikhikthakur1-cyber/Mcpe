import React, { useMemo, useState, useEffect } from 'react';
import { Search, Filter, Sparkles, CheckCircle2, ChevronUp, X, Eye, SlidersHorizontal } from 'lucide-react';
import { TextureSlot, TextureCategory, ProjectFile } from '../../types';
import { TEXTURE_CATALOG, CATEGORY_LABELS } from '../../data/textureCatalog';
import { TextureCard } from './TextureCard';
import { CanvasPixelPreview } from './CanvasPixelPreview';
import { TextureInspector } from './TextureInspector';

interface TextureBrowserProps {
  customSlots: Record<string, string>; // slotId -> filePath
  files: Record<string, ProjectFile>;
  selectedSlot: TextureSlot | null;
  onSelectSlot: (slot: TextureSlot) => void;
  onUploadTexture: (slot: TextureSlot, file: File) => Promise<void>;
  onRemoveCustomTexture: (slot: TextureSlot) => void;
  onJumpToExplorer?: (path: string) => void;
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
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showCustomOnly, setShowCustomOnly] = useState<boolean>(false);
  const [displayCount, setDisplayCount] = useState<number>(PAGE_CHUNK);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState<boolean>(false);

  // Reset pagination limit on filter change
  useEffect(() => {
    setDisplayCount(PAGE_CHUNK);
  }, [searchQuery, selectedCategory, showCustomOnly]);

  // Filter slots
  const filteredSlots = useMemo(() => {
    return TEXTURE_CATALOG.filter((slot) => {
      if (selectedCategory !== 'all' && slot.category !== selectedCategory) {
        return false;
      }

      const isCustom = Boolean(customSlots[slot.id]);
      if (showCustomOnly && !isCustom) {
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
  }, [searchQuery, selectedCategory, showCustomOnly, customSlots]);

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
        <div className="p-3 md:p-4 bg-[#111822] border-b border-[#1E293B] flex flex-wrap items-center justify-between gap-3 md:gap-4 shrink-0">
          {/* Search bar */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search textures (e.g. diamond, stone, crafter)..."
              className="w-full pl-9 pr-4 py-2 md:py-1.5 bg-[#0B0F14] border border-[#1E293B] focus:border-emerald-500 rounded-md text-xs text-slate-100 placeholder-slate-500 outline-none transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 hover:text-slate-300"
              >
                Clear
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto max-w-full p-1 bg-[#0B0F14] rounded-lg border border-[#1E293B] scrollbar-none">
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => {
              const isActive = selectedCategory === key;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedCategory(key)}
                  className={`px-2.5 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap min-h-[32px] ${
                    isActive
                      ? 'bg-[#1E293B] text-emerald-400 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Customized filter toggle */}
          <button
            onClick={() => setShowCustomOnly((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap min-h-[36px] ${
              showCustomOnly
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                : 'bg-[#0B0F14] border-[#1E293B] text-slate-400 hover:text-slate-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Customized ({customizedCount})</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* Left Grid: Texture Cards */}
          <div className="flex-1 overflow-y-auto p-3 md:p-4 pb-20 lg:pb-4">
            <div className="flex items-center justify-between mb-3 text-xs text-slate-400">
              <span>
                Showing <strong className="text-slate-200">{Math.min(visibleSlots.length, filteredSlots.length)}</strong> of {filteredSlots.length} texture slots
              </span>
              {selectedCategory !== 'all' && (
                <span className="text-slate-500 hidden sm:inline">
                  Category: <span className="text-slate-300 capitalize">{selectedCategory}</span>
                </span>
              )}
            </div>

            {filteredSlots.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
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
                      />
                    );
                  })}
                </div>

                {/* Load More Button for Large Packs */}
                {visibleSlots.length < filteredSlots.length && (
                  <div className="pt-6 pb-2 text-center">
                    <button
                      onClick={() => setDisplayCount((c) => c + PAGE_CHUNK)}
                      className="px-5 py-2.5 bg-[#161F29] hover:bg-[#1E293B] text-slate-200 font-semibold text-xs border border-[#1E293B] rounded-lg transition-colors"
                    >
                      Load More Textures ({filteredSlots.length - visibleSlots.length} remaining)
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 border border-dashed border-[#1E293B] rounded-lg">
                <Filter className="w-8 h-8 text-slate-600 mb-2" />
                <p className="text-sm font-semibold text-slate-300">No texture slots found</p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm">
                  {showCustomOnly
                    ? 'You have not uploaded any custom textures yet in this category.'
                    : 'Try searching with a different keyword or selecting "All Textures".'}
                </p>
                {showCustomOnly && (
                  <button
                    onClick={() => setShowCustomOnly(false)}
                    className="mt-3 px-3 py-1.5 text-xs font-medium text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 rounded border border-emerald-500/30"
                  >
                    Show all vanilla slots
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Desktop Right Side Split Preview (Visible on large screens >= 1024px) */}
          {selectedSlot && (
            <div className="hidden lg:flex w-80 xl:w-96 border-l border-[#1E293B] p-4 flex-col h-full bg-[#0E141E] shrink-0">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200 truncate">
                  {selectedSlot.name} Preview
                </span>
                <span className="text-[11px] font-mono text-slate-500 truncate ml-2">
                  {selectedSlot.path}
                </span>
              </div>
              <div className="flex-1 min-h-[300px]">
                <CanvasPixelPreview
                  imageData={activeCustomFile ? activeCustomFile.data : null}
                  recommendedDimensions={{
                    width: selectedSlot.recommendedWidth,
                    height: selectedSlot.recommendedHeight,
                  }}
                  sampleColor={selectedSlot.sampleColor}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Desktop Far Right: Texture Inspector Panel (Hidden on screens < 1024px) */}
      <div className="hidden lg:block shrink-0">
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
