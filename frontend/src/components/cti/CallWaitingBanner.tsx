import React from 'react';
import { PhoneIncoming, PhoneOff, PhoneCall, ArrowRightLeft } from 'lucide-react';
import type { CallSession } from '../../types';

interface CallWaitingBannerProps {
  incomingCall: CallSession | null;
  activeCall: CallSession | null;
  onHoldAndAnswer: () => void;
  onEndAndAnswer: () => void;
  onDecline: () => void;
}

export const CallWaitingBanner: React.FC<CallWaitingBannerProps> = ({
  incomingCall,
  activeCall,
  onHoldAndAnswer,
  onEndAndAnswer,
  onDecline,
}) => {
  if (!incomingCall) return null;

  return (
    <div className="bg-[#182318] border-y border-[#4b6043] px-6 py-3 flex items-center justify-between text-xs shadow-2xl z-30 select-none animate-in slide-in-from-top-2">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-[#4b6043]/30 border border-[#4b6043] flex items-center justify-center text-[#4ade80] animate-bounce">
          <PhoneIncoming className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-white text-sm">
              Incoming Call Waiting (Line {incomingCall.lineIndex + 1})
            </span>
            <span className="bg-[#4b6043] text-white text-[10px] px-2 py-0.5 rounded-full font-mono font-bold">
              {incomingCall.queue}
            </span>
          </div>
          <div className="text-[#a3b8a3] text-xs mt-0.5">
            <strong className="text-white">{incomingCall.callerName}</strong> ({incomingCall.callerNumber})
            {activeCall && (
              <span className="text-[#718571] ml-2">
                Active on Line {activeCall.lineIndex + 1}: {activeCall.callerName}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Hold Active & Answer Incoming (Green) */}
        <button
          onClick={onHoldAndAnswer}
          className="bg-[#15803d] hover:bg-[#166534] text-white font-bold px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 shadow-md transition"
        >
          <ArrowRightLeft className="w-3.5 h-3.5" />
          <span>Hold & Answer</span>
        </button>

        {/* End Active & Answer Incoming (Army Green) */}
        <button
          onClick={onEndAndAnswer}
          className="bg-[#4b6043] hover:bg-[#3d4f36] text-white font-bold px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 shadow-md transition"
        >
          <PhoneCall className="w-3.5 h-3.5" />
          <span>End & Answer</span>
        </button>

        {/* Decline Incoming */}
        <button
          onClick={onDecline}
          className="bg-[#1f291f] hover:bg-[#283528] text-rose-400 font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 border border-[#384838] transition"
        >
          <PhoneOff className="w-3.5 h-3.5" />
          <span>Decline</span>
        </button>
      </div>
    </div>
  );
};
