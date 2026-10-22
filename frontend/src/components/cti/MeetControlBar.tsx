import React, { useState, useEffect } from 'react';
import { 
  Mic, 
  MicOff, 
  Pause, 
  Play, 
  PhoneOff, 
  PhoneForwarded, 
  Grid, 
  Volume2,
  Clock,
  Radio
} from 'lucide-react';
import type { CallSession } from '../../types';

interface MeetControlBarProps {
  currentCall: CallSession | null;
  onToggleMute: () => void;
  onToggleHold: () => void;
  onEndCall: () => void;
  onInitiateTransfer: () => void;
  activeLineIndex: number | null;
}

export const MeetControlBar: React.FC<MeetControlBarProps> = ({
  currentCall,
  onToggleMute,
  onToggleHold,
  onEndCall,
  onInitiateTransfer,
  activeLineIndex,
}) => {
  const [showKeypad, setShowKeypad] = useState<boolean>(false);
  const [dialpadInput, setDialpadInput] = useState<string>('');
  const [audioLevel, setAudioLevel] = useState<number>(0.2);

  const isSilent = !currentCall || currentCall.isMuted || currentCall.isOnHold || currentCall.status !== 'CONNECTED';
  const effectiveAudioLevel = isSilent ? 0 : audioLevel;

  // Simulate Google Meet ambient speech activity detection (VAD) wave
  useEffect(() => {
    if (isSilent) return;
    const interval = setInterval(() => {
      // Natural oscillating voice amplitude simulation
      setAudioLevel(0.15 + Math.random() * 0.75);
    }, 180);
    return () => clearInterval(interval);
  }, [isSilent]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleKeypadPress = (key: string) => {
    setDialpadInput(prev => prev + key);
  };

  return (
    <div className="relative">
      {/* Google Meet Floating Center HUD Bar */}
      <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-full px-4 py-2 flex items-center gap-2.5 shadow-2xl shadow-black/80 transition-all select-none">
        {/* Call Info Pill Left */}
        {currentCall ? (
          <div className="flex items-center gap-2 px-3 py-1 bg-slate-950/70 border border-slate-800 rounded-full text-xs font-mono">
            <span className={`w-2 h-2 rounded-full ${
              currentCall.isOnHold 
                ? 'bg-amber-400' 
                : currentCall.isMuted 
                ? 'bg-rose-400' 
                : 'bg-emerald-400 animate-pulse'
            }`} />
            <span className="text-slate-200 font-semibold truncate max-w-[120px]">
              {currentCall.callerName}
            </span>
            <span className="text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3 text-sky-400" />
              {formatTimer(currentCall.durationSeconds)}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1 bg-slate-950/70 border border-slate-800 rounded-full text-xs text-slate-400">
            <Radio className="w-3 h-3 text-slate-500" />
            <span>Ready for Inbound Line</span>
          </div>
        )}

        <div className="h-5 w-px bg-slate-800 mx-1" />

        {/* Microphone Button with Dynamic Voice Activity Ring */}
        <div className="relative flex items-center justify-center">
          {currentCall && !currentCall.isMuted && !currentCall.isOnHold && (
            <span 
              className="absolute -inset-1 rounded-full bg-emerald-500/20 pointer-events-none transition-all duration-75"
              style={{ transform: `scale(${1 + effectiveAudioLevel * 0.4})`, opacity: effectiveAudioLevel }}
            />
          )}
          <button
            onClick={onToggleMute}
            disabled={!currentCall}
            title={currentCall?.isMuted ? 'Unmute microphone (M)' : 'Mute microphone (M)'}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition shadow-md relative ${
              !currentCall 
                ? 'bg-slate-800/50 text-slate-600 cursor-not-allowed'
                : currentCall.isMuted
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/50'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
          >
            {currentCall?.isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
        </div>

        {/* Hold / Unhold Button */}
        <button
          onClick={onToggleHold}
          disabled={!currentCall}
          title={currentCall?.isOnHold ? 'Resume Call from Hold (H)' : 'Place Call on Hold (H)'}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition shadow-md ${
            !currentCall 
              ? 'bg-slate-800/50 text-slate-600 cursor-not-allowed'
              : currentCall.isOnHold
              ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-950/50'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
          }`}
        >
          {currentCall?.isOnHold ? <Play className="w-4 h-4 ml-0.5" /> : <Pause className="w-4 h-4" />}
        </button>

        {/* Transfer Button */}
        <button
          onClick={onInitiateTransfer}
          disabled={!currentCall}
          title="Transfer Call (Consult / Blind)"
          className={`w-10 h-10 rounded-full flex items-center justify-center transition shadow-md ${
            !currentCall 
              ? 'bg-slate-800/50 text-slate-600 cursor-not-allowed' 
              : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
          }`}
        >
          <PhoneForwarded className="w-4 h-4" />
        </button>

        {/* Keypad Modal Toggle */}
        <button
          onClick={() => setShowKeypad(!showKeypad)}
          title="Toggle DTMF Dialpad"
          className={`w-10 h-10 rounded-full flex items-center justify-center transition shadow-md ${
            showKeypad 
              ? 'bg-sky-600 text-white' 
              : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
          }`}
        >
          <Grid className="w-4 h-4" />
        </button>

        {/* Speaker Volume Indicator */}
        <div className="w-10 h-10 rounded-full bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-300">
          <Volume2 className="w-4 h-4" />
        </div>

        <div className="h-5 w-px bg-slate-800 mx-1" />

        {/* Google Meet Red Pill Hang Up / Disconnect */}
        <button
          onClick={onEndCall}
          disabled={!currentCall}
          title="Hang Up Active Line (Esc)"
          className={`px-4 h-10 rounded-full font-semibold text-xs flex items-center gap-2 transition shadow-lg ${
            !currentCall
              ? 'bg-slate-800/40 text-slate-600 cursor-not-allowed'
              : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/60 hover:scale-[1.02]'
          }`}
        >
          <PhoneOff className="w-4 h-4" />
          <span>{activeLineIndex !== null ? `End Line ${activeLineIndex + 1}` : 'End Call'}</span>
        </button>
      </div>

      {/* DTMF Dialpad Popover */}
      {showKeypad && (
        <div className="absolute bottom-16 right-0 w-64 bg-slate-900 border border-slate-700 rounded-2xl p-4 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
            <span className="text-xs font-semibold text-slate-200">DTMF Dialpad</span>
            <button 
              onClick={() => setDialpadInput('')}
              className="text-[10px] text-slate-400 hover:text-slate-200"
            >
              Clear
            </button>
          </div>
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-center text-base font-mono text-sky-400 mb-3 h-10 flex items-center justify-center">
            {dialpadInput || <span className="text-slate-600 text-xs">Enter digits...</span>}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((key) => (
              <button
                key={key}
                onClick={() => handleKeypadPress(key)}
                className="h-10 bg-slate-800 hover:bg-slate-700 active:bg-sky-600 active:text-white rounded-lg text-sm font-semibold text-slate-200 transition"
              >
                {key}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
