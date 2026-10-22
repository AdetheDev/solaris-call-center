import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Check, 
  Zap, 
  Copy,
  Clock
} from 'lucide-react';
import type { CustomerSite } from '../../types';

interface CallScratchpadProps {
  callId: string;
  callerName: string;
  site: CustomerSite;
  isDark?: boolean;
}

export const CallScratchpad: React.FC<CallScratchpadProps> = ({
  callId,
  callerName,
  site,
  isDark = true,
}) => {
  const [noteContent, setNoteContent] = useState<string>(
    `# Telephony Call Notes - ${callerName}\n- Inbound Inquiry: Intermittent inverter shutdown on cloudy-to-sunny transitions.\n- Hardware: ${site.assets[0]?.model || 'Solar Inverter'} (SN: ${site.assets[0]?.serialNumber || 'N/A'})\n`
  );
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [lastSaved, setLastSaved] = useState<string>('Just now');
  const [copied, setCopied] = useState<boolean>(false);

  // Debounced auto-save simulation (Solaris PhoneBridge sync)
  useEffect(() => {
    if (!isSaving) return;
    const handler = setTimeout(() => {
      setIsSaving(false);
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastSaved(time);
    }, 1200);

    return () => clearTimeout(handler);
  }, [isSaving]);

  const handleAppendTelemetrySnapshot = () => {
    const activeAsset = site.assets[0];
    const snapshotText = `\n### ⚡ IoT Telemetry Snapshot (${new Date().toLocaleTimeString()}):\n- Site ID: ${site.id}\n- Asset: ${activeAsset?.model || 'SolarEdge SE7600H-US'}\n- Health Status: ${activeAsset?.status || 'WARNING'}\n- Solar Generation: 5.4 kW | Battery SoC: 82% | Grid Voltage: 241.6V\n- Active Anomaly: Earth Isolation Fault (Code: 18x32-F)\n`;
    setNoteContent(prev => prev + snapshotText);
  };

  const handleCopyNotes = () => {
    navigator.clipboard.writeText(noteContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex flex-col h-full text-xs select-none ${
      isDark ? 'text-[#e3ece3]' : 'text-[#141b14]'
    }`}>
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#22c55e]" />
          <span className="font-bold uppercase font-mono tracking-wider text-[11px] text-[#8aa08a]">
            Solaris Desk Live Scratchpad
          </span>
        </div>

        {/* Sync Status Badge */}
        <div className="flex items-center gap-1.5 text-[10px] font-mono">
          {isSaving ? (
            <span className="text-amber-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
              Syncing to CRM...
            </span>
          ) : (
            <span className="text-emerald-400 flex items-center gap-1">
              <Check className="w-3 h-3 text-emerald-400" />
              Saved ({lastSaved})
            </span>
          )}
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="flex items-center gap-2 mb-2.5">
        <button
          type="button"
          onClick={handleAppendTelemetrySnapshot}
          className="flex-1 bg-[#1e2e1e] hover:bg-[#253925] text-[#22c55e] border border-[#22c55e]/40 px-3 py-1.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition text-[11px]"
        >
          <Zap className="w-3.5 h-3.5 fill-[#22c55e]" />
          <span>Insert IoT Telemetry Snapshot</span>
        </button>

        <button
          type="button"
          onClick={handleCopyNotes}
          className={`p-2 rounded-lg border transition flex items-center justify-center ${
            copied
              ? 'bg-[#15803d] text-white border-[#15803d]'
              : 'bg-[#161d16] border-[#273527] text-[#8aa08a] hover:text-white'
          }`}
          title="Copy markdown notes to clipboard"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Textarea Editor */}
      <div className="flex-1 flex flex-col">
        <textarea
          value={noteContent}
          onChange={(e) => {
            setNoteContent(e.target.value);
            setIsSaving(true);
          }}
          placeholder="Type notes during the call... Markdown supported."
          className={`flex-1 w-full p-3 rounded-xl border font-mono text-[11px] leading-relaxed resize-none focus:outline-none transition ${
            isDark 
              ? 'bg-[#121812] border-[#243324] text-[#e3ece3] focus:border-[#22c55e]' 
              : 'bg-[#f7faf7] border-[#d2ded2] text-black focus:border-[#22c55e]'
          }`}
        />
      </div>

      {/* Footer Info */}
      <div className="pt-2 text-[10px] text-[#718571] flex items-center justify-between font-mono">
        <span>Session ID: {callId}</span>
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3 text-[#22c55e]" />
          Auto-commits to Solaris Ticket on wrap-up
        </span>
      </div>
    </div>
  );
};
