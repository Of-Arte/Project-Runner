import React, { useMemo } from 'react';
import { COLORS } from '../constants';
import { RefreshCw, FileWarning } from 'lucide-react';

interface TerminationScreenProps {
  score: number;
  cause: string;
  onRestart: () => void;
}

const TerminationScreen: React.FC<TerminationScreenProps> = ({ score, cause, onRestart }) => {
  
  const review = useMemo(() => {
    const intScore = Math.floor(score);
    if (intScore < 500) {
      return {
        title: "STRAIGHT COOKED",
        body: "Bro really thought he could run. That's an L + ratio. Touch grass and try again fr fr.",
        grade: "F",
        severance: "Negative Aura Points: -1000"
      };
    } else if (intScore < 1500) {
      return {
        title: "MID PERFORMANCE",
        body: "Giving NPC energy. Main character arc cancelled. You're literally the side quest nobody asked for.",
        grade: "D-",
        severance: "Participation Trophy (Digital)"
      };
    } else if (intScore < 3000) {
      return {
        title: "LOWKEY COOKED",
        body: "Had potential but fumbled the bag. That's what we call a certified bruh moment, no cap.",
        grade: "C",
        severance: "5% Off Copium Subscription"
      };
    } else {
      return {
        title: "ALMOST VALID",
        body: "Respectfully, you ate but then choked. Skill issue detected. Run it back and lock in this time.",
        grade: "B+",
        severance: "Rare W Badge (Expired)"
      };
    }
  }, [score]);

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-2 sm:p-4 overflow-hidden">
      {/* Container scales based on container-query style logic via tailwind height breakpoints */}
      <div 
        className="max-w-md w-full max-h-full border-2 p-3 sm:p-5 relative flex flex-col gap-2 sm:gap-4 shadow-[0_0_60px_rgba(255,0,0,0.6)] animate-[pulse_3s_infinite]"
        style={{ borderColor: COLORS.NEON_RED, backgroundColor: '#050505', boxShadow: '0 0 40px rgba(255, 42, 42, 0.3), inset 0 0 20px rgba(255, 0, 0, 0.1)' }}
      >
        {/* Decorative Corners */}
        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-red-500"></div>
        <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-red-500"></div>
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-red-500"></div>
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-red-500"></div>

        {/* Header - Shinks on small height */}
        <div className="text-center border-b border-red-900/50 pb-2 flex-shrink-0">
          <FileWarning className="w-6 h-6 sm:w-10 sm:h-10 text-red-500 mx-auto mb-1 animate-pulse hidden min-h-[400px]:block" />
          <h2 className="text-lg sm:text-2xl font-black tracking-[0.2em] text-red-500 uppercase leading-tight">
            {review.title}
          </h2>
          <p className="text-[8px] text-red-400/60 uppercase font-mono tracking-tighter">V-Corp Asset Termination Notice</p>
        </div>

        {/* Metrics Section - Compact Grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[10px] sm:text-xs font-mono border border-red-900/20 p-2 bg-red-950/5 flex-shrink-0">
            <div className="flex justify-between items-end border-b border-red-900/10 pb-1">
                <span className="text-gray-500 text-[8px] uppercase">Score</span>
                <span className="text-white font-bold">{Math.floor(score)}m</span>
            </div>
            <div className="flex justify-between items-end border-b border-red-900/10 pb-1">
                <span className="text-gray-500 text-[8px] uppercase">Grade</span>
                <span className="text-red-500 font-black text-sm">{review.grade}</span>
            </div>
            <div className="col-span-2 pt-1">
                <span className="text-gray-500 text-[8px] uppercase block">Reason for termination</span>
                <span className="text-red-400 font-bold uppercase truncate block text-[9px] sm:text-[11px]">{cause}</span>
                <span className="text-red-500/80 font-mono text-[8px] uppercase tracking-tight block mt-0.5 animate-pulse">
                  &gt; It's giving skill issue.
                </span>
            </div>
        </div>

        {/* Evaluation Text - Scrollable if content is too long, or hidden if screen is tiny */}
        <div className="text-gray-400 text-[10px] sm:text-xs leading-tight italic border-l-2 border-red-900 pl-3 py-1 overflow-y-auto min-h-[40px] flex-grow max-h-[100px] hidden min-h-[300px]:block">
            "{review.body}"
        </div>

        {/* Footer & Actions - Always visible */}
        <div className="flex flex-col gap-2 flex-shrink-0">
            <div className="bg-red-950/20 p-2 border border-red-900/30 text-[9px] sm:text-[10px] hidden min-h-[350px]:block">
                <span className="text-red-500 font-bold block mb-0.5 uppercase tracking-tighter">Severance Package</span>
                <span className="text-white italic">{review.severance}</span>
            </div>

            <button 
                onClick={onRestart}
                className="w-full bg-red-600 hover:bg-red-500 active:scale-95 text-black font-black py-3 sm:py-4 px-4 flex items-center justify-center gap-3 transition-all uppercase tracking-[0.15em] text-xs sm:text-sm group relative overflow-hidden"
                style={{ 
                  boxShadow: '0 0 30px rgba(220,38,38,0.6)',
                  animation: 'bounce 2s infinite'
                }}
            >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 skew-y-12"></div>
                <RefreshCw size={16} className="animate-spin" style={{ animationDuration: '4s' }} /> RE-ENTER QUEUE
            </button>
        </div>
      </div>
    </div>
  );
};

export default TerminationScreen;