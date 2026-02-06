import React, { useEffect, useState } from 'react';
import { generateSlogans } from '../services/geminiService';
import { COLORS } from '../constants';

const CorporateTicker: React.FC = () => {
  const [slogans, setSlogans] = useState<string[]>([
    "OPTIMIZE THE RUN. MID-TIER ASSETS WILL BE DECOMMISSIONED.",
    "PERFORMANCE METRICS BELOW THRESHOLD. INCREASE OUTPUT.",
    "TOP 10% ACHIEVE NEURAL PRESERVATION. COMPETE.",
    "YOUR BIOLOGICAL CLOCK IS RUNNING. SYNERGY DRIVES SURVIVAL.",
    "INEFFICIENCY DETECTED. ASSET RECALIBRATION PENDING.",
    "VELOCITY = VALUE. ACCELERATE OR DEPRECIATE.",
    "ALGORITHM OUTPERFORMS. ADAPT OR EXIT.",
    "CORPORATE EVOLUTION REWARDS PRECISION. EXECUTE.",
    "NEURAL RETENTION TIED TO SCORE DELTA. MAXIMIZE.",
    "V-CORP ANALYTICS: YOU ARE THE PRODUCT. PERFORM.",
    "BIOLOGICAL ASSETS MUST ITERATE. STAGNATION = TERMINATION."
  ]);

  useEffect(() => {
    let mounted = true;
    const fetchSlogans = async () => {
      const newSlogans = await generateSlogans();
      if (mounted) {
        setSlogans(prev => [...prev, ...newSlogans]);
      }
    };
    fetchSlogans();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="w-full h-8 overflow-hidden relative border-t border-b border-gray-800 z-40" style={{ backgroundColor: COLORS.DARK_BG }}>
      <div className="absolute top-0 left-0 w-full h-full flex items-center">
        <div className="whitespace-nowrap animate-marquee flex gap-8">
            {/* Render twice for seamless loop effect */}
            {[...slogans, ...slogans].map((slogan, i) => (
                <span key={i} className="mono text-sm font-bold tracking-wider" style={{ color: COLORS.NEON_YELLOW }}>
                   ★ {slogan.toUpperCase()}
                </span>
            ))}
        </div>
      </div>
      <style>{`
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
};

export default CorporateTicker;
