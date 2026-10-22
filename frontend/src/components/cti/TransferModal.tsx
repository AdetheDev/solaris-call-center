import React, { useState } from 'react';
import { 
  PhoneForwarded, 
  UserCheck, 
  X, 
  ArrowRight,
  CheckCircle2,
  PhoneCall
} from 'lucide-react';
import type { CallSession, TransferDestination } from '../../types';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeCall: CallSession | null;
  onExecuteColdTransfer: (targetName: string, queue: string) => void;
  onExecuteWarmTransfer: (targetName: string, queue: string) => void;
  isConsulting?: boolean;
  consultantName?: string;
  onCompleteWarmTransfer?: () => void;
  onCancelWarmTransfer?: () => void;
}

const TRANSFER_DESTINATIONS: TransferDestination[] = [
  { 
    id: 'dest-marcus', 
    name: 'Marcus Vance', 
    role: 'Tier-2 DER Specialist', 
    queue: 'Tier-2 Escalations', 
    status: 'Available' 
  },
  { 
    id: 'dest-elena', 
    name: 'Elena Rostova', 
    role: 'Contact Centre Supervisor', 
    queue: 'Supervisor Desk', 
    status: 'Available' 
  },
  { 
    id: 'dest-dave', 
    name: 'Dave Miller', 
    role: 'Field Service Dispatch', 
    queue: 'Field Logistics', 
    status: 'In Shift' 
  },
  { 
    id: 'dest-safety', 
    name: 'BESS Safety Response', 
    role: 'Thermal Runaway Response Desk', 
    queue: 'Critical Safety', 
    status: 'Immediate' 
  },
];

export const TransferModal: React.FC<TransferModalProps> = ({
  isOpen,
  onClose,
  activeCall,
  onExecuteColdTransfer,
  onExecuteWarmTransfer,
  isConsulting = false,
  consultantName = '',
  onCompleteWarmTransfer,
  onCancelWarmTransfer,
}) => {
  const [transferType, setTransferType] = useState<'WARM' | 'COLD'>('WARM');
  const [selectedDestId, setSelectedDestId] = useState<string>('dest-marcus');

  if (!isOpen || !activeCall) return null;

  const selectedDestination = TRANSFER_DESTINATIONS.find(d => d.id === selectedDestId) || TRANSFER_DESTINATIONS[0];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150 select-none">
      <div className="bg-[#121612] border border-[#2d3a2d] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-[#e3ece3]">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#2d3a2d] bg-[#182018] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PhoneForwarded className="w-4 h-4 text-[#22c55e]" />
            <h3 className="text-sm font-bold text-white">
              {isConsulting ? 'Active Consultative Transfer' : `Transfer Call • Line ${activeCall.lineIndex + 1}`}
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="text-[#8aa08a] hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Transfer Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* Active Call Summary */}
          <div className="p-3 bg-[#182018] border border-[#2d3a2d] rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[10px] text-[#8aa08a] uppercase font-mono font-bold">Customer on Line:</span>
              <div className="font-bold text-white text-sm">{activeCall.callerName}</div>
            </div>
            <div className="text-right">
              <span className="font-mono text-[#22c55e] bg-[#22c55e]/10 px-2 py-0.5 rounded border border-[#22c55e]/30 text-[11px] font-bold">
                {activeCall.callerNumber}
              </span>
              <div className="text-[10px] text-[#8aa08a] mt-0.5">Site: {activeCall.siteId}</div>
            </div>
          </div>

          {/* If In Consult Phase, show the active 2-leg bridge status */}
          {isConsulting ? (
            <div className="p-4 bg-[#1b251b] border border-[#22c55e]/40 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <CheckCircle2 className="w-4 h-4" />
                <span>Leg 2 Consultation in Progress</span>
              </div>
              <p className="text-[11px] text-[#a3b8a3]">
                Customer is currently placed on hold hearing comfort audio. You are privately speaking with{' '}
                <strong className="text-white">{consultantName || selectedDestination.name}</strong>.
              </p>
              
              <div className="grid grid-cols-2 gap-2 pt-2">
                <div className="p-2.5 rounded-lg bg-black/40 border border-white/5">
                  <span className="text-[10px] text-amber-400 uppercase font-mono font-bold">Leg 1 (Customer)</span>
                  <div className="text-xs font-semibold text-white mt-0.5">{activeCall.callerName}</div>
                  <div className="text-[10px] text-amber-300 font-mono">STATUS: ON HOLD</div>
                </div>

                <div className="p-2.5 rounded-lg bg-black/40 border border-emerald-500/30">
                  <span className="text-[10px] text-emerald-400 uppercase font-mono font-bold">Leg 2 (Specialist)</span>
                  <div className="text-xs font-semibold text-white mt-0.5">{consultantName || selectedDestination.name}</div>
                  <div className="text-[10px] text-emerald-300 font-mono">STATUS: CONNECTED</div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Mode Selector */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTransferType('WARM')}
                  className={`p-3 rounded-xl border text-left transition ${
                    transferType === 'WARM'
                      ? 'bg-[#1e2e1e] border-[#22c55e] text-white ring-1 ring-[#22c55e]/50'
                      : 'bg-[#182018] border-[#2d3a2d] text-[#8aa08a] hover:bg-[#202920]'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs text-[#22c55e] mb-1">
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Warm (Consultative)</span>
                  </div>
                  <p className="text-[11px] text-[#a3b8a3] leading-tight">
                    Hold customer, consult specialist on secondary line, then bridge together.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setTransferType('COLD')}
                  className={`p-3 rounded-xl border text-left transition ${
                    transferType === 'COLD'
                      ? 'bg-[#2b3528] border-[#4b6043] text-white ring-1 ring-[#4b6043]'
                      : 'bg-[#182018] border-[#2d3a2d] text-[#8aa08a] hover:bg-[#202920]'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs text-[#a3b899] mb-1">
                    <PhoneForwarded className="w-3.5 h-3.5" />
                    <span>Cold (Blind)</span>
                  </div>
                  <p className="text-[11px] text-[#a3b8a3] leading-tight">
                    Instantly redirect the customer directly to the target destination queue.
                  </p>
                </button>
              </div>

              {/* Destination List */}
              <div>
                <div className="text-[11px] font-bold text-[#8aa08a] uppercase tracking-wider mb-2">
                  Select Enterprise Destination
                </div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {TRANSFER_DESTINATIONS.map(dest => (
                    <button
                      key={dest.id}
                      type="button"
                      onClick={() => setSelectedDestId(dest.id)}
                      className={`w-full p-2.5 rounded-lg border text-left transition flex items-center justify-between ${
                        selectedDestId === dest.id
                          ? 'bg-[#223022] border-[#22c55e] text-white ring-1 ring-[#22c55e]/30'
                          : 'bg-[#182018] border-[#2d3a2d] text-[#d6ded6] hover:bg-[#202920]'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-xs text-white">{dest.name}</div>
                        <div className="text-[10px] text-[#8aa08a]">{dest.role} • {dest.queue}</div>
                      </div>
                      <span className="text-[10px] text-[#22c55e] bg-[#22c55e]/10 px-2 py-0.5 rounded font-mono border border-[#22c55e]/30 font-bold">
                        {dest.status}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-[#2d3a2d] bg-[#182018] flex items-center justify-between text-xs">
          {isConsulting ? (
            <>
              <button
                type="button"
                onClick={() => {
                  if (onCancelWarmTransfer) onCancelWarmTransfer();
                  onClose();
                }}
                className="px-3.5 py-2 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 font-semibold transition"
              >
                Abort & Resume Customer
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onCompleteWarmTransfer) onCompleteWarmTransfer();
                  onClose();
                }}
                className="bg-[#15803d] hover:bg-[#166534] text-white font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-md transition"
              >
                <span>Complete Transfer & Bridge</span>
                <CheckCircle2 className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-lg text-[#8aa08a] hover:text-white transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (transferType === 'WARM') {
                    onExecuteWarmTransfer(selectedDestination.name, selectedDestination.queue);
                  } else {
                    onExecuteColdTransfer(selectedDestination.name, selectedDestination.queue);
                    onClose();
                  }
                }}
                className={`font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-md transition ${
                  transferType === 'WARM'
                    ? 'bg-[#15803d] hover:bg-[#166534] text-white'
                    : 'bg-[#4b6043] hover:bg-[#3d4f36] text-white'
                }`}
              >
                {transferType === 'WARM' ? (
                  <>
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Dial Consult Leg 2</span>
                  </>
                ) : (
                  <>
                    <span>Execute Blind Transfer</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
