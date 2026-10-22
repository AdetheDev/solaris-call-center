import React, { useState } from 'react';
import { 
  Sparkles, 
  Wrench, 
  CheckCircle, 
  Truck, 
  FileText, 
  Check
} from 'lucide-react';
import type { DiagnosticRecommendation, Ticket } from '../types';

interface CopilotProps {
  recommendation: DiagnosticRecommendation;
  tickets: Ticket[];
  onExecuteSafeTest: () => void;
  onDispatchTech: () => void;
  onCreateTicket: () => void;
}

export const CopilotColumn: React.FC<CopilotProps> = ({
  recommendation,
  tickets,
  onExecuteSafeTest,
  onDispatchTech,
  onCreateTicket,
}) => {
  const [activeTab, setActiveTab] = useState<'COPILOT' | 'TICKETS' | 'DISPATCH'>('COPILOT');
  const [testStatus, setTestStatus] = useState<'IDLE' | 'RUNNING' | 'COMPLETED'>('IDLE');

  const handleRunTest = () => {
    setTestStatus('RUNNING');
    setTimeout(() => {
      setTestStatus('COMPLETED');
      onExecuteSafeTest();
    }, 2500);
  };

  return (
    <div className="w-96 bg-slate-900 border-l border-slate-800 flex flex-col h-full select-none">
      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 bg-slate-950/60 p-1">
        <button
          onClick={() => setActiveTab('COPILOT')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded flex items-center justify-center gap-1.5 transition ${
            activeTab === 'COPILOT'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          AI Copilot
        </button>

        <button
          onClick={() => setActiveTab('TICKETS')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded flex items-center justify-center gap-1.5 transition ${
            activeTab === 'TICKETS'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Tickets ({tickets.length})
        </button>

        <button
          onClick={() => setActiveTab('DISPATCH')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded flex items-center justify-center gap-1.5 transition ${
            activeTab === 'DISPATCH'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Truck className="w-3.5 h-3.5" />
          Dispatch
        </button>
      </div>

      {/* Tab 1: AI Diagnostic Copilot */}
      {activeTab === 'COPILOT' && (
        <div className="p-4 flex-1 overflow-y-auto space-y-4">
          {/* Diagnostic Root Cause Assessment */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                Root Cause Synthesis
              </span>
              <span className="bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono">
                {recommendation.confidence}% Confidence
              </span>
            </div>

            <div>
              <div className="text-sm font-semibold text-slate-100 leading-snug">
                {recommendation.issue}
              </div>
              <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                Manufacturer Code: {recommendation.code}
              </div>
            </div>

            {/* Evidence Checklist */}
            <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                Telemetry & Environmental Evidence:
              </div>
              {recommendation.evidence.map((point, idx) => (
                <div key={idx} className="flex items-start gap-1.5 text-xs text-slate-300">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="leading-tight text-[11px]">{point}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Trigger Box */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-3">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Recommended Agent Action</span>
              <span className="text-[10px] bg-slate-800 text-sky-300 px-1.5 py-0.5 rounded font-mono">
                Safety L1 Remote
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
              {recommendation.suggestedAction}
            </p>

            {/* Safe Remote Command Execution Button */}
            <div className="space-y-2 pt-1">
              {testStatus === 'IDLE' ? (
                <button
                  onClick={handleRunTest}
                  className="w-full bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold py-2.5 px-3 rounded-lg shadow-sm transition flex items-center justify-center gap-2"
                >
                  <Wrench className="w-4 h-4" />
                  Trigger Safe Remote Insulation Test
                </button>
              ) : testStatus === 'RUNNING' ? (
                <div className="w-full bg-sky-950/40 border border-sky-600/40 text-sky-300 text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-2">
                  <div className="w-3.5 h-3.5 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
                  Querying SunSpec Modbus Bus... (1.8s)
                </div>
              ) : (
                <div className="w-full bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  Self-Test Tripped: DC R-iso = 0.12 MΩ (Truck roll required)
                </div>
              )}

              <button
                onClick={onDispatchTech}
                className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium py-2 px-3 rounded-lg transition flex items-center justify-center gap-1.5"
              >
                <Truck className="w-3.5 h-3.5 text-amber-400" />
                Schedule Field Technician (Truck Roll)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Incident Tickets */}
      {activeTab === 'TICKETS' && (
        <div className="p-4 flex-1 overflow-y-auto space-y-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Site Tickets</span>
            <button
              onClick={onCreateTicket}
              className="text-xs text-sky-400 hover:text-sky-300 font-semibold"
            >
              + New Ticket
            </button>
          </div>

          {tickets.map((t) => (
            <div key={t.id} className="bg-slate-950/60 border border-slate-800 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-slate-400">{t.id}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  t.priority === 'HIGH' ? 'bg-rose-950 text-rose-400 border border-rose-800/40' : 'bg-slate-800 text-slate-300'
                }`}>
                  {t.priority}
                </span>
              </div>
              <div className="text-xs font-medium text-slate-200">{t.title}</div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-800">
                <span>{t.category}</span>
                <span>{t.createdAt}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Field Service Dispatch */}
      {activeTab === 'DISPATCH' && (
        <div className="p-4 flex-1 overflow-y-auto space-y-3">
          <div className="text-xs font-bold uppercase text-slate-400 tracking-wider">
            Field Technician Scheduling
          </div>
          <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3 space-y-2 text-xs">
            <div className="text-slate-400 text-[11px]">Recommended Service Skill</div>
            <div className="font-semibold text-slate-100">Solar DC Insulation & MC4 Connector Repair</div>
            <div className="text-slate-400 text-[11px] mt-2">Next Available Window</div>
            <div className="text-sky-400 font-mono">Today, 01:30 PM - 03:30 PM</div>
            <button
              onClick={onDispatchTech}
              className="mt-3 w-full bg-amber-600 hover:bg-amber-500 text-slate-950 font-semibold py-2 rounded text-xs transition"
            >
              Confirm Tech Dispatch (Work Order #WO-491)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
