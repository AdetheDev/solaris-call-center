import React, { useEffect, useState } from 'react';

interface SoundwaveVisualizerProps {
  isActive: boolean;
  isMuted: boolean;
  isOnHold: boolean;
  noiseCancellationEnabled: boolean;
}

export const SoundwaveVisualizer: React.FC<SoundwaveVisualizerProps> = ({
  isActive,
  isMuted,
  isOnHold,
  noiseCancellationEnabled,
}) => {
  // 12-bar equalizer array representing voice frequency spectrum
  const [frequencies, setFrequencies] = useState<number[]>([
    0.2, 0.4, 0.6, 0.8, 1.0, 0.9, 0.7, 0.8, 0.6, 0.4, 0.3, 0.2
  ]);
  const [amplitude, setAmplitude] = useState<number>(0.5);

  const isSilent = !isActive || isMuted || isOnHold;
  const silentFrequencies = [0.08, 0.08, 0.08, 0.08, 0.08, 0.08, 0.08, 0.08, 0.08, 0.08, 0.08, 0.08];

  useEffect(() => {
    if (isSilent) return;

    const interval = setInterval(() => {
      // Natural speech rhythm with pauses and dynamic spikes
      const baseLoudness = Math.random() > 0.15 
        ? 0.3 + Math.random() * 0.7 // active speaking volume (0.3 to 1.0)
        : 0.08; // brief natural cadence pause

      // If noise cancellation is active, clamp ambient jitter floor
      const effectiveLoudness = noiseCancellationEnabled && baseLoudness < 0.25 
        ? 0.05 
        : baseLoudness;

      setAmplitude(effectiveLoudness);

      setFrequencies(prev => 
        prev.map((_, i) => {
          // Bell curve multiplier across speech frequencies (human speech peaks in middle-low bands)
          const weight = 1 - Math.abs(i - 5.5) / 6.5;
          const jitter = (Math.random() - 0.5) * 0.3;
          return Math.max(0.08, Math.min(1.0, effectiveLoudness * weight + jitter));
        })
      );
    }, 110);

    return () => clearInterval(interval);
  }, [isSilent, noiseCancellationEnabled]);

  // Color spectrum mapping depending on loudness:
  // Low (< 0.35) -> Deep Army Green (#4b6043) / Mint (#86efac)
  // Medium (0.35 - 0.7) -> Vibrant Clean Green (#22c55e)
  // High (> 0.7) -> Electric Lime & Bright Yellow-Green (#a3e635)
  const getSpectrumColor = (val: number) => {
    if (val < 0.3) {
      return 'from-[#4b6043] to-[#86efac]';
    } else if (val < 0.65) {
      return 'from-[#15803d] via-[#22c55e] to-[#4ade80]';
    } else {
      return 'from-[#22c55e] via-[#a3e635] to-[#facc15]';
    }
  };

  const activeFrequencies = isSilent ? silentFrequencies : frequencies;
  const activeAmplitude = isSilent ? 0 : amplitude;

  return (
    <div className="flex items-center justify-center gap-1.5 h-16 w-full max-w-[240px] px-2 select-none">
      {activeFrequencies.map((freq, idx) => {
        const heightPercent = Math.max(8, Math.round(freq * 100));
        return (
          <div
            key={idx}
            className="flex-1 flex items-center justify-center h-full"
          >
            <div
              className={`w-1.5 rounded-full bg-gradient-to-t ${getSpectrumColor(freq)} transition-all duration-100 shadow-sm ${
                activeAmplitude > 0.7 ? 'shadow-[#22c55e]/50 shadow-md' : ''
              }`}
              style={{
                height: `${heightPercent}%`,
                opacity: activeAmplitude === 0 ? 0.2 : 0.85 + freq * 0.15,
              }}
            />
          </div>
        );
      })}
    </div>
  );
};
