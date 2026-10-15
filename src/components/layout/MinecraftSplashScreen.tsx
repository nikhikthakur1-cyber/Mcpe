import React from 'react';
import { ZipAssetLoaderState } from '../../services/zipAssetService';

interface MinecraftSplashScreenProps {
  zipState: ZipAssetLoaderState;
  onSkip: () => void;
}

export const MinecraftSplashScreen: React.FC<MinecraftSplashScreenProps> = ({
  zipState,
  onSkip,
}) => {
  const isComplete = zipState.isLoaded && !zipState.isPreloading && zipState.extractionProgress >= 100;
  const progressPercent = zipState.isLoading
    ? 15
    : zipState.isPreloading
    ? Math.max(20, zipState.extractionProgress)
    : 100;

  return (
    <div className="fixed inset-0 z-50 bg-[#090D12] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#131D28] via-[#0B0F15] to-[#05080C] text-slate-100 flex flex-col items-center justify-center p-6 select-none font-sans overflow-hidden">
      {/* Background Subtle Minecraft Dirt Pixel Overlay */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#1E293B_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

      {/* Main Glassmorphic Container */}
      <div className="relative z-10 max-w-lg w-full bg-[#101722]/90 backdrop-blur-md border border-[#223044] rounded-2xl p-8 shadow-2xl flex flex-col items-center text-center space-y-6">
        
        {/* Minecraft Bedrock Logo Title */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-semibold uppercase tracking-widest animate-pulse">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            <span>Minecraft Bedrock Studio v1.26.52.3</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-100 via-sky-200 to-emerald-300 font-mono">
            BEDROCK ASSET ENGINE
          </h1>
          <p className="text-xs text-slate-400 max-w-sm">
            Streaming {zipState.fileCount > 0 ? `${zipState.fileCount.toLocaleString()}+` : '6,800+'} vanilla textures with on-demand zero-lag viewport loading.
          </p>
        </div>

        {/* Animated Progress Bar */}
        <div className="w-full space-y-2.5">
          <div className="flex items-center justify-between text-xs font-mono text-slate-300 px-1">
            <span className="flex items-center gap-1.5 text-slate-300 font-semibold">
              {zipState.isLoading ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping" />
                  Loading vanilla_assets.zip...
                </>
              ) : zipState.isPreloading ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Extracting assets...
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Ready!
                </>
              )}
            </span>
            <span className="text-emerald-400 font-bold">{progressPercent}%</span>
          </div>

          {/* Minecraft Custom Progress Track */}
          <div className="w-full h-4 bg-[#0A0E14] border-2 border-[#1E2C3D] rounded-lg p-0.5 overflow-hidden shadow-inner relative">
            <div
              className="h-full bg-gradient-to-r from-emerald-600 via-emerald-400 to-green-300 rounded-sm transition-all duration-300 ease-out shadow-[0_0_12px_rgba(52,211,153,0.5)] relative"
              style={{ width: `${progressPercent}%` }}
            >
              <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.2)_50%,transparent_100%)] animate-shimmer" />
            </div>
          </div>

          {/* Extraction Details */}
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 px-1">
            <span className="truncate max-w-[240px]">
              {zipState.currentExtractingFile ? (
                <span className="text-slate-400">
                  Current: <span className="text-slate-200">{zipState.currentExtractingFile}</span>
                </span>
              ) : (
                <span>Indexing catalog entries...</span>
              )}
            </span>
            <span>
              {zipState.extractedCount} / {zipState.texturesCount || 2680}
            </span>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2 w-full flex items-center justify-center gap-3">
          <button
            onClick={onSkip}
            className="w-full py-2.5 px-4 bg-[#1A2432] hover:bg-[#223044] active:bg-[#151D28] text-slate-200 text-xs font-mono font-bold rounded-xl border border-slate-700/60 shadow-lg transition-all flex items-center justify-center gap-2 group"
          >
            <span>{isComplete ? 'Enter Studio Now' : 'Skip & Enter Studio'}</span>
            <svg
              className="w-4 h-4 text-emerald-400 group-hover:translate-x-0.5 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
