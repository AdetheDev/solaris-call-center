import React from 'react';
import { Users, Clock, ShieldCheck, Activity } from 'lucide-react';
import type { QueueSlaMetric } from '../../types';

interface QueueWallboardStripProps {
  metrics: QueueSlaMetric[];
  isDark?: boolean;
}

export const QueueWallboardStrip: React.FC<QueueWallboardStripProps> = ({
  metrics,
  isDark = true,
}) => {
  return (
    <div className={`px-5 py-2 border-b flex items-center justify-between text-xs select-none transition-colors overflow-x-auto ${
      isDark 
        ? 'bg-[#090d09] border-[#1d271d] text-[#c9d8c9]' 
        : 'bg-[#f4f8f4] border-[#d2ded2] text-[#2c3d2c]'
    }`}>
      {/* Label Left */}
      <div className="flex items-center gap-2 shrink-0 pr-3 border-r border-white/10">
        <Activity className="w-3.5 h-3.5 text-[#22c55e]" />
        <span className="font-bold text-[10px] tracking-wider uppercase font-mono text-[#8aa08a]">
          Solaris CMS SLA Wallboard
        </span>
      </div>

      {/* Queue Chips Carousel */}
      <div className="flex items-center gap-4 px-3 flex-1 overflow-x-auto">
        {metrics.map((queue) => {
          const isLwtWarning = queue.longestWaitSeconds >= 45 && queue.longestWaitSeconds < 90;
          const isLwtCritical = queue.longestWaitSeconds >= 90;

          return (
            <div 
              key={queue.queueId} 
              className={`flex items-center gap-2.5 px-3 py-1 rounded-lg border shrink-0 text-[11px] ${
                isDark ? 'bg-[#121812] border-[#253225]' : 'bg-white border-[#d2ded2] shadow-xs'
              }`}
            >
              <div className="font-semibold text-white truncate max-w-[140px]">
                {queue.queueName}
              </div>

              {/* Waiting Count */}
              <div className="flex items-center gap-1 font-mono">
                <Users className="w-3 h-3 text-[#8aa08a]" />
                <span className={`font-bold ${queue.waitingCount > 0 ? 'text-amber-400' : 'text-[#8aa08a]'}`}>
                  {queue.waitingCount}
                </span>
              </div>

              {/* LWT Ticker with Color Thresholds */}
              <div className="flex items-center gap-1 font-mono">
                <Clock className="w-3 h-3 text-[#8aa08a]" />
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  isLwtCritical
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                    : isLwtWarning
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                }`}>
                  LWT {queue.longestWaitSeconds}s
                </span>
              </div>

              {/* SLA % */}
              <div className="flex items-center gap-1 text-[10px] font-mono text-[#8aa08a]">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>{queue.slaPercent}% SLA</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Aggregate Status Right */}
      <div className="hidden lg:flex items-center gap-2 shrink-0 pl-3 border-l border-white/10 text-[11px] font-mono">
        <span className="text-[#8aa08a]">ASA:</span>
        <strong className="text-emerald-400">14s</strong>
        <span className="text-[#8aa08a]">| Target:</span>
        <strong className="text-white">&lt;20s</strong>
      </div>
    </div>
  );
};
