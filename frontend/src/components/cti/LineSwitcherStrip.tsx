import React from 'react';
import { Plus } from 'lucide-react';
import type { CallSession } from '../../types';

interface LineSwitcherStripProps {
  lines: [CallSession | null, CallSession | null, CallSession | null];
  activeLineIndex: number | null;
  onSelectLine: (index: number) => void;
  onNewOutgoingLine: (index: number) => void;
}

export const LineSwitcherStrip: React.FC<LineSwitcherStripProps> = ({
  lines,
  activeLineIndex,
  onSelectLine,
  onNewOutgoingLine,
}) => {
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-2 p-2 bg-slate-950/80 border-b border-slate-800 text-xs select-none">
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
        Lines:
      </span>
      {lines.map((call, index) => {
        const isActive = activeLineIndex === index;
        return (
          <div key={index} className="flex-1">
            {call ? (
              <button
                onClick={() => onSelectLine(index)}
                className={`w-full px-2.5 py-1.5 rounded-lg border text-left transition flex items-center justify-between ${
                  isActive
                    ? 'bg-sky-950/60 border-sky-500/80 text-white shadow-sm ring-1 ring-sky-500/30'
                    : call.isOnHold
                    ? 'bg-amber-950/30 border-amber-600/40 text-amber-200 hover:bg-amber-900/40'
                    : call.status === 'RINGING'
                    ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300 animate-pulse'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${
                    call.isOnHold 
                      ? 'bg-amber-400' 
                      : call.status === 'CONNECTED' 
                      ? 'bg-emerald-400' 
                      : 'bg-indigo-400'
                  }`} />
                  <div className="truncate">
                    <div className="font-semibold leading-tight truncate text-[11px]">
                      L{index + 1}: {call.callerName}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {call.isOnHold ? 'ON HOLD' : call.status}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-slate-400 shrink-0 ml-1.5">
                  {formatTimer(call.durationSeconds)}
                </span>
              </button>
            ) : (
              <button
                onClick={() => onNewOutgoingLine(index)}
                className="w-full px-2 py-1.5 rounded-lg border border-dashed border-slate-800 hover:border-slate-700 bg-slate-950/40 text-slate-500 hover:text-slate-300 transition flex items-center justify-center gap-1 text-[11px]"
              >
                <Plus className="w-3 h-3" />
                <span>Line {index + 1} (Idle)</span>
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};
