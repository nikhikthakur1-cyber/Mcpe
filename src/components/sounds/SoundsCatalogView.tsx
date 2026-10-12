import React, { useState, useMemo, useRef } from 'react';
import {
  Volume2,
  Search,
  Filter,
  Plus,
  Copy,
  Check,
  FileCode,
  Music,
  Play,
  Upload,
  Trash2,
  Sliders,
  Sparkles,
  VolumeX,
} from 'lucide-react';
import rawSounds from '../../data/vanillaSoundCatalog.json';
import { soundEngine } from '../../utils/soundEngine';
import { ProjectFile } from '../../types';

interface SoundEntry {
  id: string;
  name: string;
  category: string;
  events: string[];
  pitch: number;
  volume: number;
  path: string;
}

interface SoundsCatalogViewProps {
  files?: Record<string, ProjectFile>;
  onAddSoundToJsonPack?: (soundId: string, eventName: string) => void;
  onOpenJsonEditor?: (path: string) => void;
  onUploadCustomSound?: (soundId: string, eventName: string, file: File) => Promise<void>;
  onRemoveCustomSound?: (soundId: string) => void;
}

export const SoundsCatalogView: React.FC<SoundsCatalogViewProps> = ({
  files = {},
  onAddSoundToJsonPack,
  onOpenJsonEditor,
  onUploadCustomSound,
  onRemoveCustomSound,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activePlayingId, setActivePlayingId] = useState<string | null>(null);
  const [testPitch, setTestPitch] = useState<number>(1.0);
  const [testVolume, setTestVolume] = useState<number>(1.0);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [targetUploadSound, setTargetUploadSound] = useState<{ soundId: string; eventName: string } | null>(null);

  const sounds = rawSounds as SoundEntry[];

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const s of sounds) {
      if (s.category) set.add(s.category);
    }
    return ['all', ...Array.from(set).sort()];
  }, [sounds]);

  const filteredSounds = useMemo(() => {
    return sounds.filter((s) => {
      if (selectedCategory !== 'all' && s.category !== selectedCategory) return false;
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        return (
          s.id.toLowerCase().includes(q) ||
          s.name.toLowerCase().includes(q) ||
          s.events.some((e) => e.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [sounds, selectedCategory, search]);

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Play test sound
  const handlePlaySound = async (snd: SoundEntry, eventName: string) => {
    setActivePlayingId(snd.id);

    // Check if custom audio file exists for this sound
    const customKey = Object.keys(files).find(
      (k) => k.startsWith('sounds/') && (k.includes(snd.id.replace(/\./g, '/')) || k.includes(snd.name.replace(/\s+/g, '_')))
    );

    if (customKey && files[customKey]) {
      await soundEngine.playBuffer(files[customKey].data, testVolume * snd.volume, testPitch * snd.pitch);
    } else {
      await soundEngine.playSoundEvent(snd.id, eventName || 'default', testVolume * snd.volume, testPitch * snd.pitch);
    }

    setTimeout(() => {
      setActivePlayingId(null);
    }, 600);
  };

  // Handle custom audio file upload (.ogg, .wav, .mp3)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !targetUploadSound || !onUploadCustomSound) return;

    await onUploadCustomSound(targetUploadSound.soundId, targetUploadSound.eventName, file);
    setTargetUploadSound(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="flex flex-col h-full bg-[#0B0F14] text-slate-100 select-none">
      {/* Top Header */}
      <div className="p-4 bg-[#111822] border-b border-[#1E293B] flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.15)]">
            <Volume2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-100">
                Bedrock Sounds Testing & Replacement Studio
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                {sounds.length} Sound Events
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Audition game sounds with Web Audio synthesizer, test pitch/volume variations, and upload custom .ogg files to replace sounds in your resource pack
            </p>
          </div>
        </div>

        {/* Global Pitch & Volume Test Modulation */}
        <div className="flex items-center gap-4 bg-[#080B10] p-2 rounded-xl border border-[#1E293B] self-start md:self-auto text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500 font-mono">Pitch: {testPitch.toFixed(2)}x</span>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.05"
              value={testPitch}
              onChange={(e) => setTestPitch(parseFloat(e.target.value))}
              className="w-20 accent-indigo-400 cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500 font-mono">Vol: {Math.round(testVolume * 100)}%</span>
            <input
              type="range"
              min="0.1"
              max="1.5"
              step="0.05"
              value={testVolume}
              onChange={(e) => setTestVolume(parseFloat(e.target.value))}
              className="w-20 accent-indigo-400 cursor-pointer"
            />
          </div>

          {onOpenJsonEditor && (
            <button
              onClick={() => onOpenJsonEditor('sounds.json')}
              className="flex items-center gap-1.5 px-3 py-1 bg-[#182332] hover:bg-[#1E293B] border border-[#1E293B] text-slate-200 text-xs font-semibold rounded-lg transition-colors ml-1"
            >
              <FileCode className="w-3.5 h-3.5 text-indigo-400" />
              <span>sounds.json</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3 bg-[#0F1622] border-b border-[#1E293B] flex flex-wrap items-center gap-3 text-xs">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search sound ID (e.g. amethyst_block, explode, break, click)..."
            className="w-full pl-9 pr-3 py-1.5 bg-[#080B0F] border border-[#1E293B] rounded-lg text-slate-200 placeholder:text-slate-600 outline-none focus:border-indigo-400 font-mono text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          <Filter className="w-3.5 h-3.5 text-slate-500 mr-1" />
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg text-xs capitalize transition-colors ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white font-medium shadow-xs'
                  : 'bg-[#141C26] hover:bg-[#1A2533] text-slate-400'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <span className="text-[11px] text-slate-500 font-mono ml-auto">
          Showing {filteredSounds.length} sounds
        </span>
      </div>

      {/* Sounds Grid / List */}
      <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredSounds.map((snd) => {
          const isCopied = copiedId === snd.id;
          const isPlaying = activePlayingId === snd.id;

          // Check if custom audio file exists
          const customKey = Object.keys(files).find(
            (k) => k.startsWith('sounds/') && (k.includes(snd.id.replace(/\./g, '/')) || k.includes(snd.name.replace(/\s+/g, '_')))
          );
          const hasCustomSound = Boolean(customKey);

          return (
            <div
              key={snd.id}
              className={`border rounded-xl p-3.5 flex flex-col justify-between transition-all group ${
                hasCustomSound
                  ? 'bg-[#121926] border-indigo-500/40 shadow-[0_0_15px_rgba(99,102,241,0.1)]'
                  : 'bg-[#101722] border-[#1C2738] hover:border-slate-600 hover:bg-[#131D2A]'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePlaySound(snd, snd.events[0] || 'default')}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                        isPlaying
                          ? 'bg-indigo-500 text-white animate-pulse'
                          : 'bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20'
                      }`}
                      title="Test Audio Playback"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                    </button>
                    <div>
                      <h4 className="text-xs font-bold text-slate-100 capitalize">
                        {snd.name}
                      </h4>
                      <span className="text-[9px] uppercase font-mono text-slate-500">
                        {snd.category}
                      </span>
                    </div>
                  </div>

                  {hasCustomSound && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold font-mono">
                      Custom Sound
                    </span>
                  )}
                </div>

                <div className="font-mono text-[11px] text-slate-300 bg-[#080B10] px-2.5 py-1.5 rounded-lg border border-[#1E293B] mb-2.5 truncate select-all">
                  {snd.id}
                </div>

                {/* Event tags & quick test buttons */}
                {snd.events && snd.events.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2.5">
                    {snd.events.slice(0, 5).map((evt) => (
                      <button
                        key={evt}
                        onClick={() => handlePlaySound(snd, evt)}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 font-mono transition-colors flex items-center gap-1"
                        title={`Audition event "${evt}"`}
                      >
                        <Play className="w-2.5 h-2.5 fill-current" />
                        <span>{evt}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Bottom Actions: Upload custom sound, copy ID, delete custom */}
              <div className="flex items-center justify-between pt-2.5 border-t border-[#1C2738] text-xs">
                <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                  <span>P: {snd.pitch}</span>
                  <span>V: {snd.volume}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleCopyId(snd.id)}
                    title="Copy Bedrock sound identifier"
                    className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-[#1E293B] rounded-md transition-colors flex items-center gap-1"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-[10px] text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span className="text-[10px]">Copy ID</span>
                      </>
                    )}
                  </button>

                  {/* Upload custom sound replacement (.ogg, .wav, .mp3) */}
                  <button
                    onClick={() => {
                      setTargetUploadSound({ soundId: snd.id, eventName: snd.events[0] || 'default' });
                      fileInputRef.current?.click();
                    }}
                    title="Replace with custom sound file (.ogg, .wav, .mp3)"
                    className="p-1.5 text-indigo-400 hover:text-indigo-200 hover:bg-indigo-500/20 border border-indigo-500/30 rounded-md transition-colors flex items-center gap-1"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span className="text-[10px]">Replace</span>
                  </button>

                  {hasCustomSound && onRemoveCustomSound && (
                    <button
                      onClick={() => onRemoveCustomSound(snd.id)}
                      title="Revert to vanilla sound"
                      className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-md transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Hidden file input for uploading custom audio */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".ogg,.wav,.mp3,audio/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};
