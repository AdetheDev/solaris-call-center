import React, { useState, useRef, useEffect } from 'react';
import { 
  CheckCircle2, 
  Coffee, 
  ShieldAlert, 
  Radio, 
  GraduationCap, 
  ChevronDown,
  Clock
} from 'lucide-react';
import type { AgentWorkState, AuxReasonCode, AgentAuxStatus } from '../../types';

interface AuxStateSelectorProps {
  status: AgentAuxStatus;
  onChangeStatus: (workState: AgentWorkState, auxReason?: AuxReasonCode) => void;
  isDark?: boolean;
}

export const AuxStateSelector: React.FC<AuxStateSelectorProps> = ({
  status,
  onChangeStatus,
  isDark = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getLabel = () => {
    if (status.workState === 'AUTO_IN') return 'Auto-In (Ready)';
    if (status.workState === 'ACW') return 'ACW (Wrap-Up)';
    switch (status.auxReason) {
      case 'AUX_LUNCH': return 'AUX: Lunch / Break';
      case 'AUX_SAFETY_DEBRIEF': return 'AUX: Safety Debrief';
      case 'AUX_FIELD_COORDINATION': return 'AUX: Field Coordination';
      case 'AUX_TRAINING': return 'AUX: System Training';
      default: return 'AUX: Not Ready';
    }
  };

  const getBadgeStyle = () => {
    if (status.workState === 'AUTO_IN') {
      return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 ring-1 ring-emerald-500/20';
    }
    if (status.workState === 'ACW') {
      return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    }
    return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
  };

  return (
    <div className="relative select-none text-xs" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition font-medium shadow-xs ${
          isDark 
            ? 'bg-[#141b14] hover:bg-[#1a231a] border-[#253225] text-white' 
            : 'bg-white hover:bg-[#f2f7f2] border-[#cbd5cb] text-black shadow-xs'
        }`}
      >
        <span className={`w-2 h-2 rounded-full ${
          status.workState === 'AUTO_IN' ? 'bg-[#22c55e] animate-pulse' : status.workState === 'ACW' ? 'bg-amber-400' : 'bg-purple-400'
        }`} />
        
        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${getBadgeStyle()}`}>
          {getLabel()}
        </span>

        <ChevronDown className="w-3.5 h-3.5 opacity-60 ml-0.5" />
      </button>

      {isOpen && (
        <div className={`absolute right-0 mt-2 w-64 rounded-xl shadow-2xl border p-2 z-50 animate-in fade-in slide-in-from-top-1 ${
          isDark 
            ? 'bg-[#0f140f] border-[#2d3a2d] text-[#e3ece3]' 
            : 'bg-white border-[#d2ded2] text-[#141b14] shadow-xl'
        }`}>
          <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#8aa08a]">
            Solaris WFM Telephony State
          </div>

          <div className="space-y-1 mt-1">
            {/* Auto-In Ready */}
            <button
              type="button"
              onClick={() => {
                onChangeStatus('AUTO_IN');
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition ${
                status.workState === 'AUTO_IN'
                  ? 'bg-[#1e2e1e] text-[#22c55e] font-bold'
                  : 'hover:bg-[#182318] text-[#c9d8c9]'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-[#22c55e]" />
              <div>
                <div className="text-xs">Auto-In (Ready)</div>
                <div className="text-[10px] text-[#7d927d]">Accept incoming queue calls</div>
              </div>
            </button>

            {/* ACW */}
            <button
              type="button"
              onClick={() => {
                onChangeStatus('ACW');
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition ${
                status.workState === 'ACW'
                  ? 'bg-amber-950/40 text-amber-300 font-bold'
                  : 'hover:bg-[#182318] text-[#c9d8c9]'
              }`}
            >
              <Clock className="w-4 h-4 text-amber-400" />
              <div>
                <div className="text-xs">After Call Work (ACW)</div>
                <div className="text-[10px] text-[#7d927d]">Post-call CRM & ticketing wrap-up</div>
              </div>
            </button>

            <div className={`h-px my-1.5 ${isDark ? 'bg-[#253225]' : 'bg-[#e4ece4]'}`} />

            <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-purple-400">
              Auxiliary (AUX) Reason Codes
            </div>

            {/* AUX 1: Safety Debrief */}
            <button
              type="button"
              onClick={() => {
                onChangeStatus('AUX', 'AUX_SAFETY_DEBRIEF');
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-left transition ${
                status.workState === 'AUX' && status.auxReason === 'AUX_SAFETY_DEBRIEF'
                  ? 'bg-purple-950/50 text-purple-300 font-bold'
                  : 'hover:bg-[#182318] text-[#c9d8c9]'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-xs">AUX: Safety & Arc Flash Debrief</span>
            </button>

            {/* AUX 2: Field Coordination */}
            <button
              type="button"
              onClick={() => {
                onChangeStatus('AUX', 'AUX_FIELD_COORDINATION');
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-left transition ${
                status.workState === 'AUX' && status.auxReason === 'AUX_FIELD_COORDINATION'
                  ? 'bg-purple-950/50 text-purple-300 font-bold'
                  : 'hover:bg-[#182318] text-[#c9d8c9]'
              }`}
            >
              <Radio className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-xs">AUX: Engineering Field Sync</span>
            </button>

            {/* AUX 3: Lunch / Break */}
            <button
              type="button"
              onClick={() => {
                onChangeStatus('AUX', 'AUX_LUNCH');
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-left transition ${
                status.workState === 'AUX' && status.auxReason === 'AUX_LUNCH'
                  ? 'bg-purple-950/50 text-purple-300 font-bold'
                  : 'hover:bg-[#182318] text-[#c9d8c9]'
              }`}
            >
              <Coffee className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-xs">AUX: Scheduled Meal / Break</span>
            </button>

            {/* AUX 4: Training */}
            <button
              type="button"
              onClick={() => {
                onChangeStatus('AUX', 'AUX_TRAINING');
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-left transition ${
                status.workState === 'AUX' && status.auxReason === 'AUX_TRAINING'
                  ? 'bg-purple-950/50 text-purple-300 font-bold'
                  : 'hover:bg-[#182318] text-[#c9d8c9]'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-xs">AUX: System Training & Compliance</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
