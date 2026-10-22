import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Wrench, 
  RotateCcw, 
  Zap, 
  FileCheck2, 
  PlusCircle
} from 'lucide-react';
import type { CallDispositionCode } from '../../types';

interface ACWWrapUpModalProps {
  isOpen: boolean;
  callerName: string;
  callerNumber: string;
  durationSeconds: number;
  siteId: string;
  onSubmitDisposition: (code: CallDispositionCode, notes: string) => void;
  onExtendTimer: () => void;
}

const DISPOSITIONS: { code: CallDispositionCode; label: string; desc: string; icon: React.ElementType }[] = [
  {
    code: 'DISP_REBOOT_SUCCESS',
    label: 'Inverter Remote Reboot & Cleared',
    desc: 'Remotely power cycled inverter, earth-leakage fault cleared, grid tie established.',
    icon: RotateCcw,
  },
  {
    code: 'DISP_TRUCK_ROLL',
    label: 'BESS Thermal Anomaly - Truck Roll',
    desc: 'Cell temperature exceeded 52°C. Dispatched Tier-2 field engineering truck roll.',
    icon: Wrench,
  },
  {
    code: 'DISP_GRID_BILLING',
    label: 'Grid Interconnect & Tariff Query',
    desc: 'Clarified NEM 3.0 export credits and utility interconnect billing statement.',
    icon: Zap,
  },
  {
    code: 'DISP_WARRANTY_RMA',
    label: 'Hardware RMA Initiated',
    desc: 'Component failure verified against manufacturer specs; warranty replacement opened.',
    icon: FileCheck2,
  },
];

export const ACWWrapUpModal: React.FC<ACWWrapUpModalProps> = ({
  isOpen,
  callerName,
  callerNumber,
  durationSeconds,
  siteId,
  onSubmitDisposition,
  onExtendTimer,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(60);
  const [selectedCode, setSelectedCode] = useState<CallDispositionCode>('DISP_REBOOT_SUCCESS');
  const [notes, setNotes] = useState<string>('');

  // 60-Second ACW Countdown
  useEffect(() => {
    if (!isOpen) return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Auto submit on timer expiry to protect SLA
          onSubmitDisposition(selectedCode, notes || 'Auto-closed on ACW timer expiration');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, selectedCode, notes, onSubmitDisposition]);

  if (!isOpen) return null;

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  const handleExtend = () => {
    setSecondsRemaining((prev) => prev + 60);
    onExtendTimer();
  };

  const progressPercent = Math.max(0, Math.min(100, (secondsRemaining / 60) * 100));

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in select-none">
      <div className="bg-[#121612] border border-[#2d3a2d] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-[#e3ece3]">
        {/* Header with ACW Countdown Ring */}
        <div className="px-6 py-4 border-b border-[#2d3a2d] bg-[#182018] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
              <h3 className="text-sm font-bold text-white tracking-wide uppercase font-mono">
                Solaris ACW Wrap-Up Mode
              </h3>
            </div>
            <p className="text-xs text-[#8aa08a] mt-0.5">
              Select mandatory resolution disposition to return to Auto-In
            </p>
          </div>

          {/* Countdown Pill */}
          <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-full border border-amber-500/30">
            <span className="text-xs font-mono font-bold text-amber-400">
              {formatTimer(secondsRemaining)}
            </span>
            <button
              type="button"
              onClick={handleExtend}
              title="Extend ACW by 60 seconds"
              className="text-[#8aa08a] hover:text-amber-300 transition"
            >
              <PlusCircle className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-1 w-full bg-[#1e271e]">
          <div 
            className="h-full bg-amber-400 transition-all duration-1000"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Call Summary Banner */}
        <div className="p-5 space-y-4 text-xs">
          <div className="p-3 bg-[#182018] border border-[#2d3a2d] rounded-xl flex items-center justify-between">
            <div>
              <div className="text-[10px] text-[#8aa08a] uppercase font-mono">Completed Session</div>
              <div className="font-bold text-white text-sm">{callerName} ({callerNumber})</div>
              <div className="text-[11px] text-[#7d927d]">Site: {siteId}</div>
            </div>
            <div className="text-right">
              <span className="font-mono text-[#22c55e] bg-[#22c55e]/10 px-2 py-0.5 rounded border border-[#22c55e]/30 font-bold">
                Talk Time: {formatTimer(durationSeconds)}
              </span>
            </div>
          </div>

          {/* Dispositions List */}
          <div>
            <div className="text-[11px] font-bold text-[#8aa08a] uppercase tracking-wider mb-2">
              Select Clean Energy Call Disposition
            </div>
            <div className="space-y-2">
              {DISPOSITIONS.map((disp) => {
                const Icon = disp.icon;
                const isSelected = selectedCode === disp.code;
                return (
                  <button
                    key={disp.code}
                    type="button"
                    onClick={() => setSelectedCode(disp.code)}
                    className={`w-full p-3 rounded-xl border text-left transition flex items-start gap-3 ${
                      isSelected
                        ? 'bg-[#1e2e1e] border-[#22c55e] text-white ring-1 ring-[#22c55e]/50'
                        : 'bg-[#161d16] border-[#273527] text-[#a9bca9] hover:bg-[#1d271d]'
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                      isSelected ? 'bg-[#22c55e]/20 text-[#4ade80]' : 'bg-black/30 text-[#8aa08a]'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className={`font-semibold text-xs ${isSelected ? 'text-white' : 'text-[#d4e2d4]'}`}>
                        {disp.label}
                      </div>
                      <p className="text-[11px] opacity-75 mt-0.5 leading-tight">
                        {disp.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Wrap-up Notes */}
          <div>
            <label htmlFor="acw-notes" className="block text-[11px] font-bold text-[#8aa08a] uppercase tracking-wider mb-1.5">
              Resolution Notes (Synced to CRM / Ticket)
            </label>
            <textarea
              id="acw-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Verified firmware 4.19.0. Homeowner informed grid feed-in is normal."
              rows={2}
              className="w-full bg-[#182018] border border-[#2d3a2d] rounded-xl p-2.5 text-xs text-white placeholder-[#5a6d5a] focus:outline-none focus:border-[#22c55e] transition resize-none"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-[#2d3a2d] bg-[#182018] flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={handleExtend}
            className="text-amber-400 hover:text-amber-300 font-medium transition flex items-center gap-1.5"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Extend ACW (+60s)</span>
          </button>

          <button
            type="button"
            onClick={() => onSubmitDisposition(selectedCode, notes)}
            className="bg-[#15803d] hover:bg-[#166534] text-white font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-lg transition"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Submit Disposition & Auto-In</span>
          </button>
        </div>
      </div>
    </div>
  );
};
