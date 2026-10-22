import React from 'react';
import { 
  Mic, 
  MicOff, 
  Pause, 
  Play, 
  PhoneOff, 
  PhoneForwarded, 
  Route, 
  Grid, 
  Info, 
  Clock, 
  Sparkles, 
  Sliders,
  ShieldAlert,
  FileText
} from 'lucide-react';
import type { CallSession } from '../../types';

interface MeetBottomBarProps {
  currentCall: CallSession | null;
  onToggleMute: () => void;
  onToggleHold: () => void;
  onEndCall: () => void;
  onOpenTransfer: () => void;
  onOpenReroute?: () => void;
  activeSideDrawer: 'NONE' | 'INFO' | 'COPILOT' | 'DIALPAD' | 'NOTES';
  onToggleDrawer: (drawer: 'NONE' | 'INFO' | 'COPILOT' | 'DIALPAD' | 'NOTES') => void;
  isDark: boolean;
  noiseCancellationEnabled: boolean;
  onToggleNoiseCancellation: () => void;
  onRequestSupervisorSos?: () => void;
  isSosActive?: boolean;
}

export const MeetBottomBar: React.FC<MeetBottomBarProps> = ({
  currentCall,
  onToggleMute,
  onToggleHold,
  onEndCall,
  onOpenTransfer,
  onOpenReroute,
  activeSideDrawer,
  onToggleDrawer,
  isDark,
  noiseCancellationEnabled,
  onToggleNoiseCancellation,
  onRequestSupervisorSos,
  isSosActive = false,
}) => {
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <footer className={`h-20 px-6 flex items-center justify-between z-40 select-none shrink-0 border-t transition-colors ${
      isDark 
        ? 'bg-[#0f140f] border-[#253225]' 
        : 'bg-white border-[#d2ded2] shadow-md'
    }`}>
      {/* Left: Meeting / Call Detail Info */}
      <div className="flex items-center gap-3 min-w-[220px]">
        {currentCall ? (
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className={`font-semibold text-sm truncate max-w-[160px] ${isDark ? 'text-white' : 'text-black'}`}>
                {currentCall.callerName}
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold uppercase border ${
                currentCall.isOnHold 
                  ? isDark ? 'bg-[#4b6043]/30 text-[#a3b899] border-[#4b6043]' : 'bg-[#eef2ec] text-[#2d3a28] border-[#4b6043]'
                  : isDark ? 'bg-[#22c55e]/20 text-[#4ade80] border-[#22c55e]/50' : 'bg-[#dcfce7] text-[#166534] border-[#86efac]'
              }`}>
                Line {currentCall.lineIndex + 1} • {currentCall.isOnHold ? 'Hold' : 'Active'}
              </span>
            </div>
            <div className={`text-xs font-mono flex items-center gap-1.5 ${isDark ? 'text-[#8aa08a]' : 'text-[#4b6043]'}`}>
              <Clock className="w-3.5 h-3.5 text-[#22c55e]" />
              <span>{formatTimer(currentCall.durationSeconds)}</span>
              <span>•</span>
              <span className="truncate">{currentCall.callerNumber}</span>
            </div>
          </div>
        ) : (
          <div className={`flex items-center gap-2 text-sm ${isDark ? 'text-[#8aa08a]' : 'text-[#4b6043]'}`}>
            <span className="w-2.5 h-2.5 rounded-full bg-[#22c55e] animate-pulse" />
            <span>Ready for incoming call</span>
          </div>
        )}
      </div>

      {/* Center: Iconic Google Meet Round Pill Buttons */}
      <div className="flex items-center gap-3">
        {/* Mic Toggle */}
        <button
          type="button"
          onClick={onToggleMute}
          disabled={!currentCall}
          title={currentCall?.isMuted ? 'Turn on microphone (m)' : 'Turn off microphone (m)'}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
            !currentCall
              ? isDark ? 'bg-[#1e271e] text-[#4d5e4d] cursor-not-allowed' : 'bg-[#e8efe8] text-[#9cb09c] cursor-not-allowed'
              : currentCall.isMuted
              ? 'bg-[#b91c1c] hover:bg-[#991b1b] text-white shadow-lg'
              : isDark ? 'bg-[#22c55e] hover:bg-[#16a34a] text-black font-bold' : 'bg-[#15803d] hover:bg-[#166534] text-white'
          }`}
        >
          {currentCall?.isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        {/* Noise Cancellation Toggle Button */}
        <button
          type="button"
          onClick={onToggleNoiseCancellation}
          title={noiseCancellationEnabled ? 'Disable AI Noise Cancellation' : 'Enable AI Noise Cancellation'}
          className={`h-12 px-4 rounded-full flex items-center gap-2 font-semibold text-xs transition-all border ${
            noiseCancellationEnabled
              ? 'bg-[#22c55e] border-[#16a34a] text-black shadow-lg shadow-green-950/40'
              : isDark
              ? 'bg-[#1c241c] hover:bg-[#253225] border-[#2f3d2f] text-[#8aa08a]'
              : 'bg-[#f0f5f0] hover:bg-[#e4ece4] border-[#cbd5cb] text-[#2e3b2e]'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>{noiseCancellationEnabled ? 'ANC Active' : 'ANC Off'}</span>
        </button>

        {/* Hold / Resume Toggle (Army Green) */}
        <button
          type="button"
          onClick={onToggleHold}
          disabled={!currentCall}
          title={currentCall?.isOnHold ? 'Resume call (h)' : 'Put call on hold (h)'}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
            !currentCall
              ? isDark ? 'bg-[#1e271e] text-[#4d5e4d] cursor-not-allowed' : 'bg-[#e8efe8] text-[#9cb09c] cursor-not-allowed'
              : currentCall.isOnHold
              ? 'bg-[#4b6043] hover:bg-[#3d4f36] text-white font-bold shadow-lg ring-2 ring-[#a3b899]'
              : isDark ? 'bg-[#273527] hover:bg-[#344634] text-[#d6ded6]' : 'bg-[#f0f5f0] hover:bg-[#e2ebe2] text-[#243024] border border-[#cbd5cb]'
          }`}
        >
          {currentCall?.isOnHold ? <Play className="w-5 h-5 ml-0.5 text-[#a3b899]" /> : <Pause className="w-5 h-5" />}
        </button>

        {/* Transfer Button */}
        <button
          type="button"
          onClick={onOpenTransfer}
          disabled={!currentCall}
          title="Transfer call to specialist"
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
            !currentCall
              ? isDark ? 'bg-[#1e271e] text-[#4d5e4d] cursor-not-allowed' : 'bg-[#e8efe8] text-[#9cb09c] cursor-not-allowed'
              : isDark ? 'bg-[#273527] hover:bg-[#344634] text-[#d6ded6]' : 'bg-[#f0f5f0] hover:bg-[#e2ebe2] text-[#243024] border border-[#cbd5cb]'
          }`}
        >
          <PhoneForwarded className="w-5 h-5" />
        </button>

        {/* Call Re-routing Button */}
        {onOpenReroute && (
          <button
            type="button"
            onClick={onOpenReroute}
            disabled={!currentCall}
            title="Re-route call to another Help Desk queue"
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              !currentCall
                ? isDark ? 'bg-[#1e271e] text-[#4d5e4d] cursor-not-allowed' : 'bg-[#e8efe8] text-[#9cb09c] cursor-not-allowed'
                : 'bg-[#1e2e1e] hover:bg-[#283e28] text-[#4ade80] border border-[#22c55e]/40 shadow-sm'
            }`}
          >
            <Route className="w-5 h-5" />
          </button>
        )}

        {/* Keypad Dialpad Drawer Toggle */}
        <button
          type="button"
          onClick={() => onToggleDrawer(activeSideDrawer === 'DIALPAD' ? 'NONE' : 'DIALPAD')}
          title="Dialpad (DTMF)"
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
            activeSideDrawer === 'DIALPAD'
              ? 'bg-[#22c55e] text-black font-bold shadow-lg'
              : isDark ? 'bg-[#273527] hover:bg-[#344634] text-[#d6ded6]' : 'bg-[#f0f5f0] hover:bg-[#e2ebe2] text-[#243024] border border-[#cbd5cb]'
          }`}
        >
          <Grid className="w-5 h-5" />
        </button>

        {/* Solaris Supervisor SOS / Hand Raise */}
        {onRequestSupervisorSos && (
          <button
            type="button"
            onClick={onRequestSupervisorSos}
            disabled={!currentCall}
            title="Solaris Supervisor SOS: Request silent assistance"
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              !currentCall
                ? 'opacity-30 cursor-not-allowed bg-slate-800 text-slate-500'
                : isSosActive
                ? 'bg-rose-600 text-white animate-pulse ring-4 ring-rose-500/40 shadow-lg'
                : 'bg-rose-950/40 border border-rose-500/50 text-rose-400 hover:bg-rose-900/50'
            }`}
          >
            <ShieldAlert className="w-5 h-5" />
          </button>
        )}

        {/* End Call Button */}
        <button
          type="button"
          onClick={onEndCall}
          disabled={!currentCall}
          title="Leave call"
          className={`h-12 px-6 rounded-full flex items-center gap-2 font-medium text-sm transition-all ${
            !currentCall
              ? isDark ? 'bg-[#1e271e] text-[#4d5e4d] cursor-not-allowed' : 'bg-[#e8efe8] text-[#9cb09c] cursor-not-allowed'
              : 'bg-[#b91c1c] hover:bg-[#991b1b] text-white shadow-lg'
          }`}
        >
          <PhoneOff className="w-5 h-5" />
          <span>{currentCall ? `End Line ${currentCall.lineIndex + 1}` : 'End'}</span>
        </button>
      </div>

      {/* Right: Drawer Toggles */}
      <div className="flex items-center gap-2 min-w-[220px] justify-end">
        {/* Solaris Live Notes Drawer */}
        <button
          type="button"
          onClick={() => onToggleDrawer(activeSideDrawer === 'NOTES' ? 'NONE' : 'NOTES')}
          title="Solaris Desk Live Call Scratchpad"
          className={`p-3 rounded-full transition-all ${
            activeSideDrawer === 'NOTES'
              ? 'bg-[#22c55e] text-black font-bold'
              : isDark ? 'text-[#d6ded6] hover:bg-[#273527]' : 'text-[#243024] hover:bg-[#e4ece4]'
          }`}
        >
          <FileText className="w-5 h-5" />
        </button>

        {/* Telemetry / Site Info Drawer */}
        <button
          type="button"
          onClick={() => onToggleDrawer(activeSideDrawer === 'INFO' ? 'NONE' : 'INFO')}
          title="Site Diagnostics & Telemetry"
          className={`p-3 rounded-full transition-all ${
            activeSideDrawer === 'INFO'
              ? 'bg-[#22c55e] text-black font-bold'
              : isDark ? 'text-[#d6ded6] hover:bg-[#273527]' : 'text-[#243024] hover:bg-[#e4ece4]'
          }`}
        >
          <Info className="w-5 h-5" />
        </button>

        {/* AI Copilot & Work Order Drawer */}
        <button
          type="button"
          onClick={() => onToggleDrawer(activeSideDrawer === 'COPILOT' ? 'NONE' : 'COPILOT')}
          title="AI Diagnostic Copilot & Work Orders"
          className={`p-3 rounded-full transition-all flex items-center gap-1.5 ${
            activeSideDrawer === 'COPILOT'
              ? 'bg-[#4b6043] text-white ring-2 ring-[#a3b899]'
              : isDark ? 'text-[#d6ded6] hover:bg-[#273527]' : 'text-[#243024] hover:bg-[#e4ece4]'
          }`}
        >
          <Sparkles className="w-5 h-5 text-[#22c55e]" />
        </button>
      </div>
    </footer>
  );
};
