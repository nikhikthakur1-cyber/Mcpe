import React from 'react';
import { AlertTriangle, Download, ArrowRight, ShieldAlert } from 'lucide-react';

interface MissingZipAlertModalProps {
  isOpen: boolean;
  errorMessage?: string | null;
  onSkip: () => void;
  onRetry: () => void;
}

export const MissingZipAlertModal: React.FC<MissingZipAlertModalProps> = ({
  isOpen,
  errorMessage,
  onSkip,
  onRetry,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200 select-none">
      <div className="bg-[#111722] border border-amber-500/40 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col">
        {/* Banner Header */}
        <div className="p-5 bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent border-b border-amber-500/30 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-amber-300">
              Vanilla Assets ZIP Archive Missing
            </h3>
            <p className="text-xs text-amber-200/80 font-mono">
              public/vanilla_assets.zip could not be loaded
            </p>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 text-xs text-slate-300 leading-relaxed">
          <p>
            The application is configured in <strong className="text-amber-300 font-semibold">Strict ZIP Mode</strong>, which loads textures and sounds directly from compressed <code className="text-amber-300 bg-[#0A0E17] px-1.5 py-0.5 rounded font-mono border border-amber-500/20">vanilla_assets.zip</code>.
          </p>

          {errorMessage && (
            <div className="p-3 bg-[#080C14] rounded-xl border border-amber-500/20 font-mono text-[11px] text-amber-400/90 break-all">
              Error: {errorMessage}
            </div>
          )}

          <div className="p-3.5 bg-[#16202E] rounded-xl border border-[#1E293B] space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-200 text-xs">
              <ShieldAlert className="w-4 h-4 text-sky-400" />
              <span>What would you like to do?</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px]">
              <li>You can <strong>skip</strong> to proceed with built-in procedural graphics & synth sounds.</li>
              <li>Or click <strong>retry</strong> to attempt reloading <code className="font-mono text-slate-300">vanilla_assets.zip</code>.</li>
            </ul>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="p-4 bg-[#0A0E17] border-t border-[#1E293B] flex items-center justify-between gap-3">
          <button
            onClick={onRetry}
            className="flex items-center gap-2 px-4 py-2 bg-[#1C2838] hover:bg-[#243347] border border-[#2B3B52] text-slate-200 font-semibold text-xs rounded-xl transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-sky-400" />
            <span>Retry Loading ZIP</span>
          </button>

          <button
            onClick={onSkip}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition-all"
          >
            <span>Skip & Proceed</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
