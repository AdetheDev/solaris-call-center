import React from 'react';
import { 
  X, 
  Sparkles, 
  Wrench, 
  Truck, 
  Sun, 
  BatteryCharging, 
  Zap, 
  MapPin, 
  Mail, 
  ShieldCheck, 
  Plus, 
  Phone, 
  PhoneCall 
} from 'lucide-react';
import type { CustomerSite, DiagnosticRecommendation, Ticket } from '../../types';
import { CallScratchpad } from '../cti/CallScratchpad';

interface SideDrawerProps {
  type: 'INFO' | 'COPILOT' | 'DIALPAD' | 'NOTES' | 'NONE';
  onClose: () => void;
  site: CustomerSite;
  recommendation: DiagnosticRecommendation;
  tickets: Ticket[];
  isDark: boolean;
  onExecuteSafeTest: () => void;
  onDispatchTech: () => void;
  onCreateTicket: () => void;
  callId?: string;
  callerName?: string;
  onDialOutbound?: (phone: string) => void;
}

export const SideDrawer: React.FC<SideDrawerProps> = ({
  type,
  onClose,
  site,
  recommendation,
  tickets,
  isDark,
  onExecuteSafeTest,
  onDispatchTech,
  onCreateTicket,
  callId,
  callerName,
  onDialOutbound,
}) => {
  if (type === 'NONE') return null;

  return (
    <aside className={`w-96 flex flex-col h-full z-30 select-none border-l animate-in slide-in-from-right duration-200 ${
      isDark 
        ? 'bg-[#0f140f] border-[#253225] text-[#e3ece3]' 
        : 'bg-white border-[#d2ded2] text-[#141b14] shadow-xl'
    }`}>
      {/* Header */}
      <div className={`h-16 px-6 border-b flex items-center justify-between shrink-0 ${
        isDark ? 'border-[#253225] bg-[#141b14]' : 'border-[#d2ded2] bg-[#f8faf8]'
      }`}>
        <h2 className={`font-semibold text-base ${isDark ? 'text-white' : 'text-black'}`}>
          {type === 'INFO' && 'Site & Customer Details'}
          {type === 'COPILOT' && 'AI Diagnostic Copilot'}
          {type === 'DIALPAD' && 'Keypad (DTMF)'}
          {type === 'NOTES' && 'Solaris Desk Call Scratchpad'}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition ${
            isDark 
              ? 'text-[#8aa08a] hover:text-white hover:bg-[#253225]' 
              : 'text-[#4b6043] hover:text-black hover:bg-[#e4ece4]'
          }`}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Body Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5 text-sm">
        {/* NOTES DRAWER (Solaris Desk) */}
        {type === 'NOTES' && (
          <div className="h-full">
            <CallScratchpad 
              callId={callId || 'CALL-ACTIVE'} 
              callerName={callerName || site.customerName} 
              site={site} 
              isDark={isDark} 
            />
          </div>
        )}

        {/* INFO DRAWER (Solaris PhoneBridge Screen Pop) */}
        {type === 'INFO' && (
          <div className="space-y-5">
            {/* Customer Identity Card */}
            <div className={`rounded-xl p-4 border space-y-2.5 ${
              isDark 
                ? 'bg-[#182018] border-[#2d3a2d]' 
                : 'bg-[#f4f7f4] border-[#d2ded2]'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs uppercase font-mono font-bold ${isDark ? 'text-[#8fa38f]' : 'text-[#4b6043]'}`}>
                  Customer Account
                </span>
                <span className="text-[#22c55e] bg-[#22c55e]/10 px-2 py-0.5 rounded text-xs font-mono flex items-center gap-1 font-semibold border border-[#22c55e]/30">
                  <ShieldCheck className="w-3.5 h-3.5" /> ANI Matched
                </span>
              </div>
              <div className={`font-bold text-base ${isDark ? 'text-white' : 'text-black'}`}>
                {site.customerName}
              </div>
              <div className={`text-xs flex items-center gap-1.5 ${isDark ? 'text-[#a3b8a3]' : 'text-[#3f4f3f]'}`}>
                <MapPin className="w-3.5 h-3.5 text-[#4b6043]" />
                <span>{site.address}</span>
              </div>
              <div className={`text-xs flex items-center gap-1.5 ${isDark ? 'text-[#a3b8a3]' : 'text-[#3f4f3f]'}`}>
                <Mail className="w-3.5 h-3.5 text-[#4b6043]" />
                <span>{site.customerEmail}</span>
              </div>

              {/* Click-to-Dial Phone Number */}
              <div className={`text-xs flex items-center justify-between pt-1 border-t ${
                isDark ? 'border-[#2d3a2d]' : 'border-[#e0ebe0]'
              }`}>
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#4b6043]" />
                  <span className="font-mono font-semibold">{site.customerPhone}</span>
                </div>
                <button
                  type="button"
                  onClick={() => onDialOutbound?.(site.customerPhone)}
                  title="Solaris PhoneBridge: Click-to-Dial"
                  className="px-2 py-0.5 rounded bg-[#22c55e]/15 hover:bg-[#22c55e]/25 text-[#4ade80] border border-[#22c55e]/40 flex items-center gap-1 font-bold text-[10px] transition"
                >
                  <PhoneCall className="w-3 h-3" />
                  <span>Click-to-Dial</span>
                </button>
              </div>
            </div>

            {/* Live Assets Telemetry Summary */}
            <div className="space-y-3">
              <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-[#8fa38f]' : 'text-[#4b6043]'}`}>
                Active DER Hardware Assets
              </span>
              {site.assets.map((asset) => (
                <div key={asset.id} className={`rounded-xl p-3.5 border space-y-2 ${
                  isDark ? 'bg-[#182018] border-[#2d3a2d]' : 'bg-[#f4f7f4] border-[#d2ded2]'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {asset.type === 'SOLAR_INVERTER' && <Sun className="w-4 h-4 text-[#22c55e]" />}
                      {asset.type === 'BESS_BATTERY' && <BatteryCharging className="w-4 h-4 text-[#4ade80]" />}
                      {asset.type === 'EV_CHARGER' && <Zap className="w-4 h-4 text-[#86efac]" />}
                      <span className={`font-medium text-xs ${isDark ? 'text-white' : 'text-black'}`}>
                        {asset.model}
                      </span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      asset.status === 'NOMINAL'
                        ? 'bg-[#15803d]/20 text-[#4ade80] border-[#15803d]'
                        : asset.status === 'WARNING'
                        ? 'bg-amber-950/40 text-amber-400 border-amber-600'
                        : 'bg-rose-950/40 text-rose-400 border-rose-600'
                    }`}>
                      {asset.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {asset.metrics.map((m, idx) => (
                      <div key={idx} className={`p-2 rounded border ${
                        isDark ? 'bg-[#121612] border-[#253225]' : 'bg-white border-[#e0ebe0]'
                      }`}>
                        <div className={`text-[10px] ${isDark ? 'text-[#7d927d]' : 'text-[#5a6b5a]'}`}>{m.label}</div>
                        <div className="font-mono font-bold mt-0.5">
                          {m.value} {m.unit || ''}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* COPILOT DRAWER */}
        {type === 'COPILOT' && (
          <div className="space-y-5">
            <div className={`p-4 rounded-xl border space-y-3 ${
              isDark 
                ? 'bg-gradient-to-br from-[#1b271b] to-[#121a12] border-[#2d3a2d]' 
                : 'bg-gradient-to-br from-[#e8efe8] to-white border-[#cbd5cb]'
            }`}>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#22c55e]" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-[#22c55e]">
                  Active Telemetry Anomaly
                </h3>
              </div>
              <div className={`text-sm font-semibold leading-tight ${isDark ? 'text-white' : 'text-black'}`}>
                {recommendation.issue}
              </div>
              <div className="text-xs text-[#8aa08a]">
                Diagnostic Evidence:
                <ul className="list-disc list-inside mt-1 space-y-1">
                  {recommendation.evidence.map((e, idx) => (
                    <li key={idx} className="font-mono text-[11px] text-[#9cb09c]">{e}</li>
                  ))}
                </ul>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={onExecuteSafeTest}
                  className="w-full bg-[#1e2e1e] hover:bg-[#253925] text-[#22c55e] border border-[#22c55e]/40 p-2.5 rounded-lg font-bold flex items-center justify-center gap-2 transition text-xs"
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>Execute Remote Isolation Test</span>
                </button>
                <button
                  type="button"
                  onClick={onDispatchTech}
                  className="w-full bg-[#4b6043] hover:bg-[#3d4f36] text-white p-2.5 rounded-lg font-bold flex items-center justify-center gap-2 shadow-md transition text-xs"
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>Dispatch Field Tech Dave</span>
                </button>
              </div>
            </div>

            {/* Ticket Log */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-[#8aa08a]' : 'text-[#4b6043]'}`}>
                  Open Support Tickets
                </span>
                <button
                  type="button"
                  onClick={onCreateTicket}
                  className="text-xs text-[#22c55e] hover:underline flex items-center gap-1 font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Ticket</span>
                </button>
              </div>

              <div className="space-y-2">
                {tickets.map((t) => (
                  <div key={t.id} className={`p-3 rounded-lg border space-y-1 ${
                    isDark ? 'bg-[#182018] border-[#2d3a2d]' : 'bg-[#f4f7f4] border-[#d2ded2]'
                  }`}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-[#22c55e] font-bold">{t.id}</span>
                      <span className="text-[10px] bg-[#4b6043]/30 text-[#a3b899] border border-[#4b6043] px-2 py-0.5 rounded font-mono font-semibold">
                        {t.status}
                      </span>
                    </div>
                    <div className={`text-xs leading-tight font-medium ${isDark ? 'text-white' : 'text-black'}`}>{t.title}</div>
                    <div className={`text-[10px] ${isDark ? 'text-[#8aa08a]' : 'text-[#5a6b5a]'}`}>{t.createdAt} • {t.category}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* DIALPAD DRAWER */}
        {type === 'DIALPAD' && (
          <div className="flex flex-col items-center space-y-4">
            <div className={`w-full border rounded-xl p-3 text-center text-xl font-mono h-12 flex items-center justify-center font-bold ${
              isDark ? 'bg-[#182018] border-[#2d3a2d] text-[#22c55e]' : 'bg-[#f4f7f4] border-[#d2ded2] text-[#15803d]'
            }`}>
              Enter number or DTMF tone
            </div>
            <div className="grid grid-cols-3 gap-3 w-full">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map(k => (
                <button
                  key={k}
                  type="button"
                  className={`h-14 rounded-2xl text-lg font-bold transition flex items-center justify-center border ${
                    isDark 
                      ? 'bg-[#182018] hover:bg-[#253225] active:bg-[#22c55e] active:text-black border-[#2d3a2d] text-white' 
                      : 'bg-white hover:bg-[#f0f4f0] active:bg-[#15803d] active:text-white border-[#d2ded2] text-[#141b14] shadow-sm'
                  }`}
                >
                  {k}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
