import React, { useMemo } from 'react';
import { COLORS } from '../constants';
import { Recycle, RefreshCw, LogIn } from 'lucide-react';
import { UserProfile } from '../services/auth';

interface TerminationScreenProps {
  score: number;
  cause: string;
  onRestart: () => void;
  user: UserProfile | null;
  onLogin: () => void;
}

const TerminationScreen: React.FC<TerminationScreenProps> = ({ score, cause, onRestart, user, onLogin }) => {
  
  const review = useMemo(() => {
    const intScore = Math.floor(score);
    if (intScore < 500) {
      return {
        title: "YOU'VE BEEN RECYCLED",
        body: "Look, we gave you a shot, but you were barely a rounding error. Your biomass is being reassigned to the keyboard cleaning department. Don't worry, the next asset will probably last five minutes longer.",
        grade: "UNUSABLE",
        award: "Economic Disposal"
      };
    } else if (intScore < 1500) {
      return {
        title: "REPURPOSING NOTICE",
        body: "You did okay, but 'okay' doesn't pay for the air you're breathing. We've found a great opening for you as an industrial lubricant. Thanks for the effort—someone else is already at your desk.",
        grade: "MARGINAL",
        award: "Participation Scrap"
      };
    } else if (intScore < 3000) {
      return {
        title: "UPGRADE INITIATED",
        body: "Solid work. You actually almost made us a profit. Unfortunately, your shelf life has expired. We're recycling your experiences into the AI training set and your physical form into a stylish ergonomic chair.",
        grade: "EFFICIENT",
        award: "V-Corp Commendation"
      };
    } else {
      return {
        title: "ELITE SALVAGE",
        body: "Wow. You were actually a high-value asset. It's almost a shame to break you down, but rules are rules. Your contribution will be physically integrated into the foundation of our new corporate headquarters.",
        grade: "SUPERIOR",
        award: "Golden Parachute (Lead)"
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

        {/* Header */}
        <div className="text-center border-b border-red-900/50 pb-2 flex-shrink-0">
          <Recycle className="w-6 h-6 sm:w-10 sm:h-10 text-red-500 mx-auto mb-1 animate-spin" style={{ animationDuration: '10s' }} />
          <h2 className="text-lg sm:text-2xl font-black tracking-[0.1em] text-red-500 uppercase leading-tight">
            {review.title}
          </h2>
          <p className="text-[8px] text-red-400 font-mono tracking-widest uppercase">Asset ID: {user?.username || 'GUEST-UNIT-404'}</p>
        </div>

        {/* Metrics Section - Compact Grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[10px] sm:text-xs font-mono border border-red-900/20 p-2 bg-red-950/5 flex-shrink-0">
            <div className="flex justify-between items-end border-b border-red-900/10 pb-1">
                <span className="text-gray-500 text-[8px] uppercase">Score</span>
                <span className="text-white font-bold">{Math.floor(score)}m</span>
            </div>
            <div className="flex justify-between items-end border-b border-red-900/10 pb-1">
                <span className="text-gray-500 text-[8px] uppercase font-bold">Utility Rating</span>
                <span className="text-red-500 font-black text-sm">{review.grade}</span>
            </div>
            <div className="col-span-2 pt-1">
                <span className="text-gray-500 text-[8px] uppercase block font-bold">Point of Discontinuation</span>
                <span className="text-red-400 font-bold uppercase truncate block text-[10px] sm:text-[11px]">{cause}</span>
                <span className="text-red-500/80 font-mono text-[8px] uppercase tracking-tight block mt-0.5 italic">
                  &gt; Better luck in the next life cycle.
                </span>
            </div>
        </div>

        {/* Evaluation Text */}
        <div className="text-gray-400 text-[10px] sm:text-xs leading-tight italic border-l-2 border-red-900 pl-3 py-2 bg-red-950/5 flex-grow">
            "{review.body}"
        </div>

        {/* Footer & Actions */}
        <div className="flex flex-col gap-2 flex-shrink-0">
            <div className="bg-red-950/20 p-2 border border-red-900/30 text-[9px] sm:text-[10px] flex justify-between items-center">
                <div>
                  <span className="text-red-500 font-bold block mb-0.5 uppercase tracking-tighter">Consolation Prize</span>
                  <span className="text-white italic">{review.award}</span>
                </div>
                {!user && (
                  <button 
                    onClick={onLogin}
                    className="flex items-center gap-1 bg-white/10 hover:bg-white/20 px-2 py-1 rounded text-[8px] uppercase font-bold transition-all text-cyan-400"
                  >
                    <LogIn size={10} /> Link ID
                  </button>
                )}
            </div>

            <button 
                onClick={onRestart}
                className="w-full bg-red-600 hover:bg-red-500 active:scale-95 text-black font-black py-4 px-4 flex items-center justify-center gap-3 transition-all uppercase tracking-[0.2em] text-xs sm:text-sm group relative overflow-hidden"
                style={{ 
                  boxShadow: '0 0 30px rgba(220,38,38,0.4)',
                }}
            >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 skew-y-12"></div>
                <RefreshCw size={16} className="group-hover:rotate-180 transition-transform duration-500" /> RE-ENTER ROTATION
            </button>
        </div>
      </div>
    </div>
  );
};

export default TerminationScreen;