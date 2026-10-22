import React from 'react';
import { Eye, Mic, Users, Shield, ShieldAlert } from 'lucide-react';
import type { SupervisorMode } from '../../types';

export interface SupervisorControlBarProps {
  currentMode: SupervisorMode;
  onSetMode: (mode: SupervisorMode) => void;
  activeLineIndex?: number;
  agentName?: string;
  callerName?: string;
  isDark?: boolean;
  isSosActive?: boolean;
  onDismissSos?: () => void;
}

export const SupervisorControlBar: React.FC<SupervisorControlBarProps> = ({
  currentMode,
  onSetMode,
  activeLineIndex = 1,
  agentName = 'Sarah J. (Solaris Tier-1)',
  callerName = 'Jonathan Doe',
  isDark = true,
  isSosActive = false,
  onDismissSos,
}) => {
  return (
    <div className="flex flex-col">
      {/* High-Visibility Solaris SOS Hand-Raise Emergency Banner */}
      {isSosActive && (
        <div className="bg-rose-600 text-white px-5 py-2 flex items-center justify-between text-xs font-bold shadow-lg animate-pulse">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" />
            <span>🚨 PRIORITY SOS: {agentName} on Line {activeLineIndex} requested immediate supervisor assistance!</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onSetMode('BARGE')}
              className="bg-white text-rose-700 hover:bg-rose-50 px-3.5 py-1 rounded-lg text-xs font-bold shadow-sm transition"
            >
              Emergency Barge-In
            </button>
            {onDismissSos && (
              <button
                type="button"
                onClick={onDismissSos}
                className="bg-rose-800 hover:bg-rose-900 text-white px-2.5 py-1 rounded-lg text-xs transition"
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Supervisor Control Strip */}
      <div className={`px-5 py-2 flex items-center justify-between text-xs select-none border-b transition-colors ${
        isDark 
          ? 'bg-[#0f140f] border-[#253225] text-[#d6e4d6]' 
          : 'bg-white border-[#d2ded2] text-[#2c3d2c] shadow-xs'
      }`}>
        {/* Left: Supervisor Identity & Target Line */}
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
            <Shield className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-[11px] tracking-wide uppercase text-indigo-400">
                Supervisor Oversight
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                currentMode === 'OFF'
                  ? isDark ? 'bg-[#182018] text-[#8fa38f] border-[#253225]' : 'bg-[#eef3ee] text-[#556955] border-[#d2ded2]'
                  : currentMode === 'MONITOR'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  : currentMode === 'WHISPER'
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                  : 'bg-rose-500/20 text-rose-300 border-rose-500/30 animate-pulse'
              }`}>
                {currentMode === 'OFF' ? 'STANDBY' : currentMode}
              </span>
            </div>
            <p className="text-[11px] opacity-75 mt-0.5">
              Target: <strong className={isDark ? 'text-white' : 'text-black'}>{agentName}</strong> on Line {activeLineIndex} ({callerName})
            </p>
          </div>
        </div>

        {/* Middle: Audio Routing Explanation */}
        <div className="hidden md:flex items-center gap-2 text-[11px] text-slate-400">
          {currentMode === 'OFF' && (
            <span className="text-slate-500 italic">No audio tap active. Monitoring in standby.</span>
          )}
          {currentMode === 'MONITOR' && (
            <span className="text-amber-400 flex items-center gap-1.5 font-medium">
              <Eye className="w-3.5 h-3.5" />
              Silent Listen Only: 0dB talkback (caller & agent cannot hear supervisor)
            </span>
          )}
          {currentMode === 'WHISPER' && (
            <span className="text-purple-400 flex items-center gap-1.5 font-medium">
              <Mic className="w-3.5 h-3.5" />
              Whisper Active: Audio routes directly to agent headset only
            </span>
          )}
          {currentMode === 'BARGE' && (
            <span className="text-rose-400 flex items-center gap-1.5 font-medium">
              <Users className="w-3.5 h-3.5" />
              3-Way Conference: Caller, agent, and supervisor bridged
            </span>
          )}
        </div>

        {/* Right: Mode Selector Buttons */}
        <div className="flex items-center gap-1.5 bg-black/30 p-1 rounded-lg border border-white/10">
          <button
            type="button"
            onClick={() => onSetMode('OFF')}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition ${
              currentMode === 'OFF'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Disengage supervisor tap"
          >
            Off
          </button>

          <button
            type="button"
            onClick={() => onSetMode('MONITOR')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium transition ${
              currentMode === 'MONITOR'
                ? 'bg-amber-600 text-white shadow-xs ring-1 ring-amber-400'
                : 'text-amber-400/80 hover:text-amber-300 hover:bg-amber-950/40'
            }`}
            title="Listen in silently without transmitting audio"
          >
            <Eye className="w-3 h-3" />
            Monitor
          </button>

          <button
            type="button"
            onClick={() => onSetMode('WHISPER')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium transition ${
              currentMode === 'WHISPER'
                ? 'bg-purple-600 text-white shadow-xs ring-1 ring-purple-400'
                : 'text-purple-400/80 hover:text-purple-300 hover:bg-purple-950/40'
            }`}
            title="Speak privately to agent only"
          >
            <Mic className="w-3 h-3" />
            Whisper
          </button>

          <button
            type="button"
            onClick={() => onSetMode('BARGE')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium transition ${
              currentMode === 'BARGE'
                ? 'bg-rose-600 text-white shadow-xs ring-1 ring-rose-400'
                : 'text-rose-400/80 hover:text-rose-300 hover:bg-rose-950/40'
            }`}
            title="Join call as 3-way participant"
          >
            <Users className="w-3 h-3" />
            Barge-In
          </button>
        </div>
      </div>
    </div>
  );
};
