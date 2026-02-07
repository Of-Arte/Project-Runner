import React, { useMemo } from 'react';
import { COLORS } from '../constants';
import { Recycle, RefreshCw, LogIn, User, Award } from 'lucide-react';
import { UserProfile } from '../services/auth';

interface TerminationScreenProps {
  score: number;
  cause: string;
  onRestart: () => void;
  user: UserProfile | null;
  onLogin: () => void;
}

const TerminationScreen: React.FC<TerminationScreenProps> = ({ score, cause, onRestart, user, onLogin }) => {
  
  const manifest = useMemo(() => {
    const intScore = Math.floor(score);
    if (intScore < 10000) {
      return {
        title: "RECYCLING PROTOCOL",
        message: "Your run shows early potential but needs refinement. We're reassigning you to our observation program where you can study the patterns without the pressure. Take your time. Learn the rhythm. Come back stronger.",
        rating: "IN TRAINING",
        allocation: "Observation Program",
        id: "EVAL-0089"
      };
    } else if (intScore < 20000) {
      return {
        title: "OPERATIONAL ASSET",
        message: "You've proven you can survive the basics. Now you need to push further. Your reflexes are there but your timing needs work. The next level requires precision. Get back in and show us what you learned.",
        rating: "baseline met",
        allocation: "Active Training",
        id: "EVAL-0214"
      };
    } else if (intScore < 30000) {
      return {
        title: "PROFICIENCY CANDIDATE",
        message: "Strong performance. You're adapting to the simulation faster than most. Your pattern recognition is solid and your reaction time is improving. You're ready for the advanced scenarios. Keep this momentum going.",
        rating: "PROFICIENT",
        allocation: "Evolution Track",
        id: "EVAL-0432"
      };
    } else if (intScore < 40000) {
      return {
        title: "VALUED RESOURCE",
        message: "Your efficiency rating is officially climbing. You've hit a stride that most units fail to ever see. Management is impressed with your tactical navigation. Don't let up now—greatness is within reach.",
        rating: "VALUED",
        allocation: "Tier 2 Command",
        id: "EVAL-0612"
      };
    } else if (intScore < 50000) {
      return {
        title: "ELITE CONTENDER",
        message: "Exceptional run. You've demonstrated mastery of the fundamentals and you're pushing into expert territory. This level of performance puts you in the top tier. You're ready for the next phase of evolution. Let's see how far you can go.",
        rating: "ELITE",
        allocation: "Elite Program",
        id: "EVAL-0954"
      };
    } else if (intScore < 60000) {
      return {
        title: "SENIOR EVALUATOR",
        message: "You are no longer just an asset; you are a benchmark. Your results are being used to calibrate new units. Your understanding of the system's weaknesses is becoming a strength we can't ignore. Continue your path.",
        rating: "SENIOR",
        allocation: "Strategic Review",
        id: "EVAL-1248"
      };
    } else if (intScore < 70000) {
      return {
        title: "EXECUTIVE CLASS",
        message: "Management has taken direct notice of your output. Your performance curves are unprecedented in this sector. You're handling complexity with a grace that suggests organic limitations are behind you.",
        rating: "EXECUTIVE",
        allocation: "Global Operations",
        id: "EVAL-1590"
      };
    } else if (intScore < 80000) {
      return {
        title: "SYSTEM OVERSEER",
        message: "You've reached a level of field expertise that makes traditional monitoring obsolete. You are anticipating system adjustments before they occur. Your contribution to V-Corp is now considered vital infrastructure.",
        rating: "OVERSEER",
        allocation: "Autonomous Command",
        id: "EVAL-2100"
      };
    } else if (intScore < 90000) {
      return {
        title: "INFRASTRUCTURE PILLAR",
        message: "Your existence is now woven into the core logic of the simulation. You have surpassed standard survival metrics and reached a state of perpetual optimization. Your data is our most prized structural asset.",
        rating: "VITAL",
        allocation: "Core Foundation",
        id: "EVAL-3500"
      };
    } else if (intScore < 100000) {
      return {
        title: "ASCENSION PENDING",
        message: "The threshold is near. You are vibrating at the frequency of the system itself. Every movement you make is a perfect expression of corporate intent. Prepare for the final integration—you are almost ready.",
        rating: "ASCENDING",
        allocation: "Transcendence Protocol",
        id: "EVAL-ALPHA"
      };
    } else {
      return {
        title: "TRANSCENDENT AUTHORITY",
        message: "You have broken the scale. The simulation can no longer contain your potential. You are the system. You are V-Corp. Your mastery is absolute, and your status is eternal. Welcome to the pinnacle of evolution.",
        rating: "GOD-TIER",
        allocation: "Infinite Domain",
        id: "EVAL-OMEGA"
      };
    }
  }, [score]);

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black p-2 sm:p-6 overflow-hidden select-none">
      {/* Immersive CRT/Background Layer */}
      <div className="absolute inset-0 bg-[#050505] pointer-events-none">
        <div className="absolute inset-0 opacity-[0.05] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] animate-scanline"></div>
        <div className="absolute inset-0 shadow-[inset_0_0_150px_rgba(255,0,0,0.15)]"></div>
      </div>

      {/* Main Manifest Container - Full bleed on mobile, manifest look on desktop */}
      <div className="relative w-full max-w-5xl h-full landscape:h-auto landscape:max-h-[95vh] flex flex-col landscape:flex-row gap-0 sm:gap-6 z-10 animate-in fade-in zoom-in duration-500 overflow-hidden border-red-500/10 landscape:border-2 landscape:overflow-y-auto">
        
        {/* Left Section: Identity & Corporate Header */}
        <div className="flex flex-col w-full landscape:w-60 landscape:sm:w-72 gap-0 sm:gap-4 shrink-0 bg-black/40 landscape:bg-transparent border-b landscape:border-b-0 border-red-500/20">
          <div className="p-3 sm:p-6 landscape:p-4 relative flex flex-row landscape:flex-col items-center gap-4 landscape:gap-2 text-left landscape:text-center border-2 border-transparent landscape:border-red-500/30">
             <div className="hidden landscape:block absolute -top-1 -left-1 w-2 h-2 bg-red-500"></div>
             <div className="hidden landscape:block absolute -bottom-1 -right-1 w-2 h-2 bg-red-500"></div>
             
             <div className="relative shrink-0">
                <Recycle className="w-10 h-10 sm:w-16 sm:h-16 landscape:w-8 landscape:h-8 text-red-500/80 animate-spin-slow" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
                </div>
             </div>
             
             <div className="flex-grow">
               <h2 className="text-lg sm:text-2xl landscape:text-xl font-black italic tracking-tighter text-red-500 uppercase leading-none mb-1">
                  {manifest.title}
               </h2>
               <div className="inline-block bg-red-500 text-black px-2 py-0.5 text-[10px] sm:text-xs font-black uppercase tracking-widest">
                  Performance Review
               </div>
             </div>
          </div>

          <div className="hidden landscape:flex flex-col border border-gray-800 bg-black/40 p-5 flex-grow">
             <div className="w-full space-y-3 font-mono mb-6">
                <div className="flex justify-between items-center border-b border-red-500/10 pb-1">
                    <span className="text-[7px] text-gray-500 uppercase font-bold tracking-widest">Host Unit</span>
                    <span className="text-[9px] text-white truncate max-w-[120px]">{user?.username || 'ANONYMOUS-404'}</span>
                </div>
                <div className="flex justify-between items-center border-b border-red-500/10 pb-1">
                    <span className="text-[7px] text-gray-500 uppercase font-bold tracking-widest">Manifest</span>
                    <span className="text-[9px] text-red-400 font-bold">{manifest.id}</span>
                </div>
             </div>
             <p className="text-[9px] text-gray-500 font-mono leading-relaxed italic border-t border-gray-800 pt-4">
                "Your physical contribution is essential. V-Corp handles all reassignments with maximum dignity."
             </p>
          </div>
        </div>

        {/* Right Section: Core Report & Data */}
        <div className="flex-grow flex flex-col h-full landscape:h-auto border-t-0 landscape:border-2 border-white/10 bg-black/60 relative p-4 sm:p-8 landscape:p-6 overflow-hidden">
            <div className="hidden landscape:block absolute -top-1 -right-1 w-2 h-2 bg-red-500"></div>
            <div className="hidden landscape:block absolute -bottom-1 -left-1 w-2 h-2 bg-red-500"></div>

            {/* Top Bar for Mobile */}
            <div className="flex landscape:hidden justify-between items-center mb-4 border-b border-gray-800 pb-2">
                <div className="text-[8px] font-mono text-gray-500 uppercase tracking-[0.2em]">{manifest.id}</div>
                <div className="text-[8px] font-mono text-white uppercase tracking-[0.2em]">{user?.username || 'ANONYMOUS-404'}</div>
            </div>

            {/* Metrics Section */}
            <div className="grid grid-cols-1 landscape:grid-cols-2 gap-3 sm:gap-6 landscape:gap-4 mb-4 sm:mb-8 landscape:mb-4">
                <div className="bg-white/5 border border-white/10 p-3 sm:p-5 landscape:p-4 relative group overflow-hidden">
                    <div className="absolute top-0 right-0 w-8 h-8 opacity-10"><Award className="w-full h-full text-white" /></div>
                    <div className="text-[10px] sm:text-xs text-gray-500 uppercase font-bold tracking-widest mb-1">Final Score</div>
                    <div className="text-2xl sm:text-4xl landscape:text-3xl font-black text-white font-mono leading-none">{Math.floor(score).toLocaleString()}<span className="text-red-500 text-sm sm:text-lg ml-1">m</span></div>
                </div>
                <div className="col-span-1 bg-black/40 border-l-4 border-white/20 p-3 sm:p-5 landscape:p-4">
                    <div className="text-[10px] sm:text-xs text-gray-500 uppercase font-bold tracking-widest mb-1">Ended By</div>
                    <div className="text-xs sm:text-base text-red-200 font-bold uppercase truncate tracking-tight">{cause}</div>
                </div>
            </div>

            {/* Performance Assessment */}
            <div className="flex-grow flex flex-col justify-start mb-4 sm:mb-10 landscape:mb-6 min-h-0">
                <div className="text-[8px] sm:text-[10px] text-red-500/60 font-black uppercase tracking-[0.3em] mb-2 sm:mb-4 flex items-center gap-2">
                </div>
                <div className="overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-red-900/50 max-h-48 landscape:max-h-32">
                  <p className="text-sm sm:text-xl landscape:text-lg text-gray-300 leading-relaxed font-serif italic border-l border-gray-800 pl-4 sm:pl-8 landscape:pl-6 py-2">
                      {manifest.message}
                  </p>
                </div>
            </div>

            {/* Footer Actions */}
            <div className="flex flex-col sm:flex-row gap-3 mt-auto shrink-0 pt-4 landscape:pt-4 border-t border-gray-800">
                {!user && (
                    <button 
                        onClick={onLogin}
                        className="flex-shrink-0 flex items-center justify-center gap-2 px-6 py-3 landscape:py-2 border border-cyan-500/40 hover:bg-cyan-900/20 text-cyan-400 transition-all text-[9px] sm:text-[11px] landscape:text-[8px] font-black uppercase tracking-widest group"
                    >
                        <LogIn size={16} className="landscape:w-3 landscape:h-3 group-hover:translate-x-1 transition-transform" /> Link Alias
                    </button>
                )}
                <button 
                   onClick={onRestart}
                   className="flex-grow flex items-center justify-center gap-3 py-3 sm:py-5 landscape:py-3 bg-red-600 hover:bg-red-500 active:scale-[0.98] text-black font-black transition-all uppercase tracking-[0.25em] text-[10px] sm:text-sm landscape:text-[9px] group relative overflow-hidden"
                   style={{ boxShadow: '0 0 40px rgba(220,38,38,0.25)' }}
                >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 skew-y-12"></div>
                    <RefreshCw size={18} className="landscape:w-4 landscape:h-4 group-hover:rotate-180 transition-transform duration-700" />
                    <span>CONTINUE TRAINING</span>
                </button>
            </div>
        </div>
      </div>

      <style jsx>{`
        .animate-spin-slow {
          animation: spin 15s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default TerminationScreen;