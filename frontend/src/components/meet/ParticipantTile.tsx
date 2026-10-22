import React from 'react';
import { 
  Mic, 
  MicOff, 
  Pause, 
  Sun, 
  BatteryCharging, 
  ShieldCheck,
  Smile,
  Meh,
  Frown,
  PhoneCall
} from 'lucide-react';
import { SoundwaveVisualizer } from './SoundwaveVisualizer';
import type { CallSession, CustomerSite, CustomerSentiment } from '../../types';

interface ParticipantTileProps {
  call: CallSession | null;
  lineIndex: number;
  isActive: boolean;
  site: CustomerSite;
  isDark: boolean;
  noiseCancellationEnabled: boolean;
  onSelectLine: () => void;
  onDialOutbound?: (phone: string) => void;
}

export const ParticipantTile: React.FC<ParticipantTileProps> = ({
  call,
  lineIndex,
  isActive,
  site,
  isDark,
  noiseCancellationEnabled,
  onSelectLine,
  onDialOutbound,
}) => {
  if (!call) {
    return (
      <div 
        onClick={onSelectLine}
        className={`flex-1 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-6 text-center select-none transition cursor-pointer group ${
          isDark
            ? 'bg-[#181d18]/60 border-[#2f3d2f] hover:bg-[#202920] hover:border-[#425442]'
            : 'bg-[#3b4b35]/70 border-[#55694c] hover:bg-[#3b4b35]/90 hover:border-[#a3b899]'
        }`}
      >
        <div className={`w-16 h-16 rounded-full flex items-center justify-center group-hover:scale-105 transition mb-3 ${
          isDark ? 'bg-[#242e24] text-[#869b86]' : 'bg-[#2e3b2a] text-[#a3b899]'
        }`}>
          <span className="text-xl font-bold font-mono text-white">L{lineIndex + 1}</span>
        </div>
        <div className={`text-sm font-bold ${isDark ? 'text-[#d6ded6]' : 'text-white'}`}>
          Line {lineIndex + 1} Idle
        </div>
        <div className={`text-xs mt-1 ${isDark ? 'text-[#6f826f]' : 'text-[#c2cfc2]'}`}>
          Click to select line or dial outbound
        </div>

        {onDialOutbound && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDialOutbound('+1 (555) 392-1092');
            }}
            className="mt-3 px-3 py-1 rounded-full bg-[#22c55e]/15 text-[#22c55e] border border-[#22c55e]/30 font-bold text-xs flex items-center gap-1.5 hover:bg-[#22c55e]/25 transition"
          >
            <PhoneCall className="w-3 h-3" />
            <span>Quick Dial Hotline</span>
          </button>
        )}
      </div>
    );
  }

  const initials = call.callerName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const sentiment: CustomerSentiment = call.sentiment || (lineIndex === 0 ? 'NEUTRAL' : lineIndex === 1 ? 'FRUSTRATED' : 'POSITIVE');

  const getSentimentPill = () => {
    switch (sentiment) {
      case 'POSITIVE':
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Smile className="w-3 h-3" />
            Positive
          </span>
        );
      case 'FRUSTRATED':
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse">
            <Frown className="w-3 h-3" />
            Frustrated
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-500/20 text-slate-300 border border-slate-500/30">
            <Meh className="w-3 h-3" />
            Neutral
          </span>
        );
    }
  };

  return (
    <div 
      onClick={onSelectLine}
      className={`flex-1 relative rounded-2xl overflow-hidden border-2 flex flex-col items-center justify-center p-6 select-none transition-all cursor-pointer ${
        isActive 
          ? 'ring-4 ring-[#22c55e] border-transparent shadow-2xl shadow-green-950/40' 
          : 'border-[#2d3a2d] hover:border-[#425442]'
      } ${
        isDark 
          ? 'bg-gradient-to-b from-[#182018] to-[#0c100c]' 
          : 'bg-gradient-to-b from-[#3b4b35] to-[#253021]'
      }`}
    >
      {/* Top Header inside Tile */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-black/50 text-[#86efac] border border-[#22c55e]/30">
            L{lineIndex + 1}
          </span>
          <span className={`text-xs font-medium truncate max-w-[140px] ${isDark ? 'text-[#8aa08a]' : 'text-[#c2cfc2]'}`}>
            {call.queue}
          </span>
        </div>

        {/* Call Status & Sentiment */}
        <div className="flex items-center gap-2">
          {getSentimentPill()}

          {call.isOnHold ? (
            <span className={`text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1 border shadow-sm ${
              isDark 
                ? 'bg-[#4b6043]/40 border-[#4b6043] text-[#a3b899]' 
                : 'bg-[#2d3826] border-[#4b6043] text-[#d6ded6]'
            }`}>
              <Pause className="w-3.5 h-3.5" />
              ON HOLD
            </span>
          ) : (
            <span className={`text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1 border shadow-sm ${
              isDark 
                ? 'bg-[#22c55e]/20 border-[#22c55e]/50 text-[#4ade80]' 
                : 'bg-[#22c55e]/20 border-[#22c55e] text-white'
            }`}>
              <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
              CONNECTED
            </span>
          )}
        </div>
      </div>

      {/* Center: Google Meet Caller Avatar + Soundwave Color Spectrum Visualizer */}
      <div className="relative flex flex-col items-center justify-center my-auto gap-3">
        {/* Caller Avatar */}
        <div className="relative flex items-center justify-center">
          <div className={`w-24 h-24 rounded-full flex items-center justify-center font-bold text-2xl text-white shadow-2xl transition-all ${
            call.isOnHold
              ? isDark ? 'bg-[#4b6043]' : 'bg-[#2f3d2a]'
              : isActive
              ? isDark ? 'bg-[#15803d]' : 'bg-[#15803d] ring-4 ring-white/30'
              : isDark ? 'bg-[#2e3b2e]' : 'bg-[#364431]'
          }`}>
            {initials}
          </div>
        </div>

        {/* Dynamic Equalizer Soundwaves with Loudness Color Spectrum */}
        <div className="flex flex-col items-center gap-1">
          <SoundwaveVisualizer 
            isActive={isActive && call.status === 'CONNECTED'}
            isMuted={call.isMuted}
            isOnHold={call.isOnHold}
            noiseCancellationEnabled={noiseCancellationEnabled}
          />
          <div className="text-[10px] font-mono tracking-wider uppercase font-semibold text-[#86efac]/80">
            {call.isOnHold 
              ? 'MOH Injected' 
              : call.isMuted 
              ? 'Mic Muted' 
              : noiseCancellationEnabled 
              ? 'Voice Active (AI Filtered)' 
              : 'Voice Stream Active'}
          </div>
        </div>
      </div>

      {/* DER Quick Telemetry Pills on Tile */}
      <div className={`flex items-center gap-2 my-2 px-3.5 py-1.5 rounded-full border text-xs shadow-md ${
        isDark 
          ? 'bg-[#182018] border-[#2d3a2d] text-[#e3ece3]' 
          : 'bg-[#33422e] border-[#55694c] text-white font-medium'
      }`}>
        <div className={`flex items-center gap-1 font-bold ${isDark ? 'text-[#22c55e]' : 'text-[#4ade80]'}`}>
          <Sun className="w-3.5 h-3.5" />
          <span>0.0 kW</span>
        </div>
        <span className={isDark ? 'text-[#3f503f]' : 'text-[#8fa38f]'}>•</span>
        <div className={`flex items-center gap-1 font-bold ${isDark ? 'text-[#4ade80]' : 'text-[#86efac]'}`}>
          <BatteryCharging className="w-3.5 h-3.5" />
          <span>74% SoC</span>
        </div>
        <span className={isDark ? 'text-[#3f503f]' : 'text-[#8fa38f]'}>•</span>
        <div className={`flex items-center gap-1 font-bold ${isDark ? 'text-[#86efac]' : 'text-white'}`}>
          <ShieldCheck className="w-3.5 h-3.5 text-[#22c55e]" />
          <span>{site.slaTier}</span>
        </div>
      </div>

      {/* Bottom Name Bar inside Tile */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs backdrop-blur-md shadow-md ${
          isDark 
            ? 'bg-[#111411]/90 border-[#2d3a2d] text-white' 
            : 'bg-[#293625]/90 border-[#55694c] text-white'
        }`}>
          <span className="font-bold truncate max-w-[200px]">
            {call.callerName}
          </span>
          <span className="font-mono text-[#86efac]/80 text-[10px]">
            {call.callerNumber}
          </span>
        </div>

        {/* Mic Indicator */}
        <div className={`w-8 h-8 rounded-full flex items-center justify-center border shadow-sm ${
          call.isMuted 
            ? 'bg-[#b91c1c] border-[#dc2626] text-white' 
            : isDark ? 'bg-[#15803d] border-[#22c55e]/40 text-white' : 'bg-[#15803d] border-[#22c55e] text-white'
        }`}>
          {call.isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </div>
      </div>
    </div>
  );
};
