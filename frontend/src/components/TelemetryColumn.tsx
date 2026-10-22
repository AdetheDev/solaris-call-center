import React from 'react';
import { 
  Sun, 
  BatteryCharging, 
  Zap, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  Radio, 
  SlidersHorizontal
} from 'lucide-react';
import type { CustomerSite, RenewableAsset, HealthStatus } from '../types';

interface TelemetryProps {
  site: CustomerSite;
  isStreaming: boolean;
  onRefreshTelemetry: () => void;
}

export const TelemetryColumn: React.FC<TelemetryProps> = ({
  site,
  isStreaming,
  onRefreshTelemetry,
}) => {
  const getStatusBadge = (status: HealthStatus) => {
    switch (status) {
      case 'NOMINAL':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-950/70 border border-emerald-500/40 text-emerald-400 px-2 py-0.5 rounded-full">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            Nominal
          </span>
        );
      case 'WARNING':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-amber-950/70 border border-amber-500/40 text-amber-400 px-2 py-0.5 rounded-full">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            Warning
          </span>
        );
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-rose-950/80 border border-rose-500/50 text-rose-300 px-2 py-0.5 rounded-full animate-pulse">
            <AlertTriangle className="w-3 h-3 text-rose-400" />
            Critical Fault
          </span>
        );
      case 'STALE':
      case 'OFFLINE':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-slate-800 border border-slate-600/50 text-slate-400 px-2 py-0.5 rounded-full">
            Offline / Stale
          </span>
        );
    }
  };

  const getAssetIcon = (type: RenewableAsset['type']) => {
    switch (type) {
      case 'SOLAR_INVERTER':
        return <Sun className="w-4 h-4 text-amber-400" />;
      case 'BESS_BATTERY':
        return <BatteryCharging className="w-4 h-4 text-emerald-400" />;
      case 'EV_CHARGER':
        return <Zap className="w-4 h-4 text-sky-400" />;
      default:
        return <Radio className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="flex-1 bg-slate-950 flex flex-col h-full overflow-hidden">
      {/* Site Header & Live Telemetry Bar */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-100">{site.name}</h2>
            <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
              {site.id}
            </span>
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            {site.address} • {site.timezone}
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 text-xs text-slate-300">
            <span className={`w-2 h-2 rounded-full ${isStreaming ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
            <span className="font-mono text-slate-400 text-[11px]">
              {isStreaming ? 'MQTT: 1Hz Live Stream' : 'Stream Paused'}
            </span>
          </div>
          <button 
            onClick={onRefreshTelemetry}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition"
            title="Poll Latest Telemetry"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Critical Alert Ribbon if any asset has a fault */}
      <div className="bg-rose-950/60 border-b border-rose-900/60 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 animate-bounce" />
          <div className="text-xs text-rose-200">
            <strong className="font-semibold text-rose-100">Active DER Tripping Event:</strong> Inverter Isolation Fault detected at 08:41 AM. Generation is 0.0 kW (Expected: 6.4 kW).
          </div>
        </div>
        <span className="text-[10px] uppercase tracking-wider font-mono text-rose-300 bg-rose-900/40 px-2 py-0.5 rounded border border-rose-700">
          Code: 18x3B
        </span>
      </div>

      {/* Main Asset Telemetry Cards List */}
      <div className="p-4 flex-1 overflow-y-auto space-y-4">
        {/* Instant Energy Balance Flow Diagram */}
        <div className="grid grid-cols-4 gap-3 bg-slate-900/50 border border-slate-800/80 rounded-xl p-3">
          <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Solar Output</span>
              <Sun className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-xl font-bold font-mono text-rose-400 mt-1">0.00 <span className="text-xs font-normal text-slate-400">kW</span></div>
            <div className="text-[10px] text-rose-400 font-mono mt-0.5">Tripped (0%)</div>
          </div>

          <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Home Load</span>
              <Zap className="w-3.5 h-3.5 text-sky-400" />
            </div>
            <div className="text-xl font-bold font-mono text-slate-100 mt-1">2.14 <span className="text-xs font-normal text-slate-400">kW</span></div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">Nominal Draw</div>
          </div>

          <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>BESS Storage</span>
              <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-xl font-bold font-mono text-emerald-400 mt-1">74 <span className="text-xs font-normal text-slate-400">%</span></div>
            <div className="text-[10px] text-amber-400 font-mono mt-0.5">Reserve Protect</div>
          </div>

          <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Grid Import</span>
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="text-xl font-bold font-mono text-slate-100 mt-1">2.14 <span className="text-xs font-normal text-slate-400">kW</span></div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">Utility Feed (242V)</div>
          </div>
        </div>

        {/* Individual Hardware Assets Cards */}
        <div className="space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Hardware Fleet Telemetry (SunSpec Modbus / BMS)</span>
            <span className="text-[11px] font-normal text-slate-500">3 Installed Devices</span>
          </div>

          {site.assets.map((asset) => (
            <div 
              key={asset.id} 
              className={`bg-slate-900 border rounded-xl p-4 transition ${
                asset.status === 'CRITICAL'
                  ? 'border-rose-600/60 shadow-lg shadow-rose-950/20'
                  : asset.status === 'WARNING'
                  ? 'border-amber-600/50'
                  : 'border-slate-800'
              }`}
            >
              {/* Asset Title Bar */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                    {getAssetIcon(asset.type)}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-100 text-sm">{asset.model}</div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      S/N: {asset.serialNumber} • FW: {asset.firmwareVersion} • Heartbeat: {asset.lastHeartbeat}
                    </div>
                  </div>
                </div>
                {getStatusBadge(asset.status)}
              </div>

              {/* Asset Dynamic Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                {asset.metrics.map((metric, idx) => (
                  <div 
                    key={idx} 
                    className={`p-2.5 rounded-lg border text-xs ${
                      metric.isAlert 
                        ? 'bg-rose-950/40 border-rose-600/40 text-rose-200' 
                        : 'bg-slate-950/50 border-slate-800/80 text-slate-300'
                    }`}
                  >
                    <div className="text-[11px] text-slate-400">{metric.label}</div>
                    <div className="text-sm font-semibold font-mono mt-0.5 flex items-baseline gap-1">
                      <span className={metric.isAlert ? 'text-rose-400 font-bold' : 'text-slate-100'}>
                        {metric.value}
                      </span>
                      {metric.unit && <span className="text-[10px] text-slate-500 font-normal">{metric.unit}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
