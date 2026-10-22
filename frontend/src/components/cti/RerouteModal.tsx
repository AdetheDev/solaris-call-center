import React, { useState } from 'react';
import { 
  Route, 
  X, 
  ArrowRight, 
  Sun, 
  BatteryCharging, 
  Zap, 
  Truck, 
  Receipt, 
  ShieldAlert, 
  Users, 
  Clock, 
  AlertTriangle
} from 'lucide-react';
import type { CallSession } from '../../types';

export interface HelpDeskQueue {
  id: string;
  name: string;
  category: string;
  currentWait: string;
  availableAgents: number;
  status: 'OPTIMAL' | 'MODERATE' | 'BUSY' | 'CRITICAL';
  icon: React.ElementType;
}

const CLEAN_ENERGY_QUEUES: HelpDeskQueue[] = [
  {
    id: 'queue-solar-tier1',
    name: 'Solar & Inverter Tier-1',
    category: 'PV Fault Isolation & Firmware',
    currentWait: '< 30s',
    availableAgents: 4,
    status: 'OPTIMAL',
    icon: Sun,
  },
  {
    id: 'queue-bess-thermal',
    name: 'BESS Battery & Thermal Response',
    category: 'Cell Chemistry & Over-temperature',
    currentWait: '45s',
    availableAgents: 2,
    status: 'MODERATE',
    icon: BatteryCharging,
  },
  {
    id: 'queue-microgrid',
    name: 'Microgrid & High-Voltage Interconnect',
    category: 'Island Mode & Substation Intertie',
    currentWait: 'Immediate',
    availableAgents: 3,
    status: 'OPTIMAL',
    icon: Zap,
  },
  {
    id: 'queue-field-dispatch',
    name: 'Field Engineering & Truck Roll',
    category: 'On-site RMA & Hardware Replacement',
    currentWait: '2m 10s',
    availableAgents: 1,
    status: 'BUSY',
    icon: Truck,
  },
  {
    id: 'queue-commercial-tariff',
    name: 'Commercial Tariffs & Net Metering',
    category: 'NEM 3.0 & Utility Interconnect Billing',
    currentWait: '1m 20s',
    availableAgents: 5,
    status: 'OPTIMAL',
    icon: Receipt,
  },
  {
    id: 'queue-emergency-shutdown',
    name: 'Emergency Arc-Flash & Rapid Shutdown',
    category: 'Fire Service / 911 Utility Coordination',
    currentWait: 'Immediate',
    availableAgents: 6,
    status: 'CRITICAL',
    icon: ShieldAlert,
  },
];

const REROUTE_REASONS = [
  { id: 'SKILL_MISMATCH', label: 'Technical Specialization Required' },
  { id: 'SAFETY_ESCALATION', label: 'Safety Hazard / Thermal Risk Escalation' },
  { id: 'BILLING_COMMERCIAL', label: 'Commercial Tariff & Grid Interconnect Query' },
  { id: 'TRUCK_ROLL_DISPATCH', label: 'Requires On-Site Field Truck Roll' },
  { id: 'CUSTOMER_REQUEST', label: 'Customer Specific Department Request' },
];

interface RerouteModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeCall: CallSession | null;
  onExecuteReroute: (queueId: string, queueName: string, reason: string, isPriorityBump: boolean) => void;
}

export const RerouteModal: React.FC<RerouteModalProps> = ({
  isOpen,
  onClose,
  activeCall,
  onExecuteReroute,
}) => {
  const [selectedQueueId, setSelectedQueueId] = useState<string>('queue-bess-thermal');
  const [selectedReason, setSelectedReason] = useState<string>('SKILL_MISMATCH');
  const [isPriorityBump, setIsPriorityBump] = useState<boolean>(false);

  if (!isOpen || !activeCall) return null;

  const targetQueue = CLEAN_ENERGY_QUEUES.find(q => q.id === selectedQueueId) || CLEAN_ENERGY_QUEUES[0];

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in select-none">
      <div className="bg-[#121612] border border-[#2d3a2d] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-[#e3ece3]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#2d3a2d] bg-[#182018] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#22c55e]/20 border border-[#22c55e]/40 flex items-center justify-center text-[#4ade80]">
              <Route className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                Re-route Call • Line {activeCall.lineIndex + 1}
              </h3>
              <p className="text-xs text-[#8aa08a]">
                Handoff caller to specialized clean energy queue
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#8aa08a] hover:text-white transition p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-xs">
          {/* Active Call Summary Pill */}
          <div className="p-3 bg-[#182018] border border-[#2d3a2d] rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[10px] text-[#8aa08a] uppercase font-mono">Current Caller</span>
              <div className="font-bold text-white text-sm">{activeCall.callerName} ({activeCall.callerNumber})</div>
              <div className="text-[11px] text-[#7d927d]">Active Queue: {activeCall.queue}</div>
            </div>
            <div className="text-right">
              <span className="font-mono text-[#22c55e] bg-[#22c55e]/10 px-2 py-0.5 rounded border border-[#22c55e]/30 text-[11px] font-bold">
                Site: {activeCall.siteId}
              </span>
            </div>
          </div>

          {/* Select Target Queue */}
          <div>
            <div className="text-[11px] font-bold text-[#8aa08a] uppercase tracking-wider mb-2">
              Select Destination Help Desk Queue
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
              {CLEAN_ENERGY_QUEUES.map((q) => {
                const Icon = q.icon;
                const isSelected = selectedQueueId === q.id;

                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setSelectedQueueId(q.id)}
                    className={`p-2.5 rounded-xl border text-left transition flex items-start gap-2.5 ${
                      isSelected
                        ? 'bg-[#1e2e1e] border-[#22c55e] text-white ring-1 ring-[#22c55e]/50'
                        : 'bg-[#161d16] border-[#273527] text-[#a9bca9] hover:bg-[#1d271d]'
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                      isSelected ? 'bg-[#22c55e]/20 text-[#4ade80]' : 'bg-black/30 text-[#8aa08a]'
                    }`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`font-semibold text-xs truncate ${isSelected ? 'text-white' : 'text-[#d4e2d4]'}`}>
                        {q.name}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[10px] font-mono text-[#7d927d]">
                        <span className="flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          {q.currentWait}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-0.5">
                          <Users className="w-2.5 h-2.5" />
                          {q.availableAgents} reps
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reason Code Dropdown */}
          <div>
            <label htmlFor="reroute-reason" className="block text-[11px] font-bold text-[#8aa08a] uppercase tracking-wider mb-1.5">
              Re-routing Reason Code
            </label>
            <select
              id="reroute-reason"
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              className="w-full bg-[#182018] border border-[#2d3a2d] rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#22c55e] transition"
            >
              {REROUTE_REASONS.map(r => (
                <option key={r.id} value={r.id} className="bg-[#121612] text-white">
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Bump Checkbox */}
          <div className="p-3 bg-[#182018] border border-[#2d3a2d] rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className={`w-4 h-4 ${isPriorityBump ? 'text-amber-400' : 'text-[#8aa08a]'}`} />
              <div>
                <div className="font-semibold text-xs text-white">Priority SLA Queue Override</div>
                <div className="text-[10px] text-[#8aa08a]">Bump caller to top of destination queue</div>
              </div>
            </div>
            <input 
              type="checkbox"
              checked={isPriorityBump}
              onChange={(e) => setIsPriorityBump(e.target.checked)}
              className="w-4 h-4 accent-[#22c55e] rounded cursor-pointer"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-[#2d3a2d] bg-[#182018] flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={onClose}
            className="text-[#8aa08a] hover:text-white transition px-3 py-1.5 rounded-lg"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() => onExecuteReroute(targetQueue.id, targetQueue.name, selectedReason, isPriorityBump)}
            className="bg-[#15803d] hover:bg-[#166534] text-white font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-lg transition"
          >
            <span>Execute Queue Re-route</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
