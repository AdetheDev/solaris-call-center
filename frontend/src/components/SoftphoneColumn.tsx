import React from 'react';
import { 
  Phone, 
  PhoneCall, 
  PhoneOff, 
  Mic, 
  MicOff, 
  Pause, 
  Play, 
  Clock, 
  ShieldCheck, 
  User, 
  MapPin, 
  Mail, 
  Activity,
  Sparkles,
  PhoneForwarded
} from 'lucide-react';
import type { CallSession, CustomerSite } from '../types';

interface SoftphoneProps {
  call: CallSession | null;
  site: CustomerSite;
  onAnswerCall: () => void;
  onEndCall: () => void;
  onToggleMute: () => void;
  onToggleHold: () => void;
  onSimulateInbound: () => void;
  onOpenTransfer: () => void;
}

export const SoftphoneColumn: React.FC<SoftphoneProps> = ({
  call,
  site,
  onAnswerCall,
  onEndCall,
  onToggleMute,
  onToggleHold,
  onSimulateInbound,
  onOpenTransfer,
}) => {
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-80 bg-slate-900 border-r border-slate-800 flex flex-col h-full select-none">
      {/* Softphone Control Panel Header */}
      <div className="p-3 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Line {call ? call.lineIndex + 1 : '1'} Softphone
          </span>
        </div>
        <span className="text-[11px] bg-slate-800 px-2 py-0.5 rounded text-sky-400 font-mono">
          WebRTC: Connected
        </span>
      </div>

      {/* Active Call / Incoming Call State Banner */}
      <div className="p-4 border-b border-slate-800">
        {call ? (
          <div className={`rounded-xl p-3.5 border transition-all ${
            call.status === 'RINGING' 
              ? 'bg-amber-950/30 border-amber-600/50 animate-pulse' 
              : call.isOnHold
              ? 'bg-indigo-950/30 border-indigo-500/40'
              : 'bg-emerald-950/20 border-emerald-500/30'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded tracking-wider uppercase ${
                call.status === 'RINGING' 
                  ? 'bg-amber-500 text-slate-950' 
                  : call.isOnHold
                  ? 'bg-indigo-500 text-white'
                  : 'bg-emerald-500 text-slate-950'
              }`}>
                {call.status}
              </span>
              <div className="flex items-center space-x-1 text-slate-400 text-xs font-mono">
                <Clock className="w-3 h-3" />
                <span>{formatTimer(call.durationSeconds)}</span>
              </div>
            </div>

            <div className="font-semibold text-slate-100 text-base leading-tight truncate">
              {call.callerName}
            </div>
            <div className="text-xs text-slate-400 font-mono mt-0.5">
              {call.callerNumber}
            </div>
            <div className="text-[11px] text-sky-400 mt-1 flex items-center gap-1">
              <Activity className="w-3 h-3" />
              Queue: {call.queue}
            </div>

            {/* In-Call Telephony Controls */}
            {call.status === 'CONNECTED' || call.status === 'ON_HOLD' ? (
              <div className="mt-3 grid grid-cols-4 gap-1.5 pt-2 border-t border-slate-800">
                <button
                  onClick={onToggleMute}
                  title="Toggle Mute (M)"
                  className={`flex flex-col items-center justify-center p-2 rounded-lg text-xs font-medium transition ${
                    call.isMuted 
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' 
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {call.isMuted ? <MicOff className="w-4 h-4 mb-1 text-rose-400" /> : <Mic className="w-4 h-4 mb-1" />}
                  <span className="text-[10px]">{call.isMuted ? 'Muted' : 'Mute'}</span>
                </button>

                <button
                  onClick={onToggleHold}
                  title="Toggle Hold (H)"
                  className={`flex flex-col items-center justify-center p-2 rounded-lg text-xs font-medium transition ${
                    call.isOnHold 
                      ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' 
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {call.isOnHold ? <Play className="w-4 h-4 mb-1 text-indigo-400" /> : <Pause className="w-4 h-4 mb-1" />}
                  <span className="text-[10px]">{call.isOnHold ? 'Unhold' : 'Hold'}</span>
                </button>

                <button
                  onClick={onOpenTransfer}
                  title="Transfer Call"
                  className="flex flex-col items-center justify-center p-2 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
                >
                  <PhoneForwarded className="w-4 h-4 mb-1 text-sky-400" />
                  <span className="text-[10px]">Transfer</span>
                </button>

                <button
                  onClick={onEndCall}
                  title="Hang Up (Esc)"
                  className="flex flex-col items-center justify-center p-2 rounded-lg text-xs font-medium bg-rose-600 hover:bg-rose-500 text-white transition shadow-sm"
                >
                  <PhoneOff className="w-4 h-4 mb-1" />
                  <span className="text-[10px]">End</span>
                </button>
              </div>
            ) : call.status === 'RINGING' ? (
              <div className="mt-3 flex gap-2">
                <button
                  onClick={onAnswerCall}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/40"
                >
                  <PhoneCall className="w-4 h-4" />
                  Answer (Ctrl+A)
                </button>
                <button
                  onClick={onEndCall}
                  className="bg-slate-800 hover:bg-slate-700 text-rose-400 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center"
                >
                  <PhoneOff className="w-4 h-4" />
                </button>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-3 text-center">
            <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-400 mb-2">
              <Phone className="w-4 h-4" />
            </div>
            <div className="text-xs font-semibold text-slate-300">Ready for Inbound Calls</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Tier-1 Solar & Storage Queue</div>
            <button
              onClick={onSimulateInbound}
              className="mt-3 w-full bg-sky-600/20 hover:bg-sky-600/30 border border-sky-500/30 text-sky-400 text-xs py-1.5 px-3 rounded-lg font-medium transition flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Simulate Inbound Call
            </button>
          </div>
        )}
      </div>

      {/* Customer Verification & Identity Card */}
      <div className="p-4 flex-1 overflow-y-auto space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-sky-400" />
              Customer Details
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-950/60 border border-emerald-600/40 text-emerald-400 px-1.5 py-0.5 rounded font-mono">
              <ShieldCheck className="w-3 h-3" />
              ANI Match
            </span>
          </div>

          <div className="bg-slate-950/40 border border-slate-800 rounded-lg p-3 space-y-2 text-xs">
            <div>
              <div className="text-slate-400 text-[11px]">Primary Account Holder</div>
              <div className="font-semibold text-slate-100 text-sm">{site.customerName}</div>
            </div>

            <div className="flex items-start gap-1.5 text-slate-300">
              <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
              <span className="leading-tight text-[11px] text-slate-300">{site.address}</span>
            </div>

            <div className="flex items-center gap-1.5 text-slate-300">
              <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="text-[11px] truncate text-slate-400">{site.customerEmail}</span>
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-[11px]">
              <span className="text-slate-400">SLA Contract</span>
              <span className="font-semibold text-sky-400 bg-sky-950/50 px-2 py-0.5 rounded border border-sky-800/40">
                {site.slaTier}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Dialpad / Transfer Helper */}
        <div>
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Speed Transfer
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-xs">
            <button 
              onClick={onOpenTransfer}
              className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700/50 p-2 rounded text-left transition"
            >
              <div className="font-medium text-slate-200">Tier-2 DER Tech</div>
              <div className="text-[10px] text-emerald-400">Marcus Available</div>
            </button>
            <button 
              onClick={onOpenTransfer}
              className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700/50 p-2 rounded text-left transition"
            >
              <div className="font-medium text-slate-200">Field Dispatch</div>
              <div className="text-[10px] text-emerald-400">Dave Ready</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
