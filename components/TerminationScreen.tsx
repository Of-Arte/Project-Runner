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
        title: "INITIAL CALIBRATION",
        message: "Every master starts somewhere. Your neural pathways are still forming, but we've detected flickers of potential. The simulation adapts to those who persist. Return to the grid and let muscle memory take over.",
        rating: "NOVICE",
        allocation: "Foundation Track",
        id: "EVAL-0089"
      };
    } else if (intScore < 20000) {
      return {
        title: "PATTERN RECOGNITION",
        message: "You're beginning to see the rhythm beneath the chaos. The obstacles aren't random—they're testing your ability to predict and adapt. Your instincts are sharpening. Push deeper into the flow state.",
        rating: "DEVELOPING",
        allocation: "Adaptive Training",
        id: "EVAL-0214"
      };
    } else if (intScore < 30000) {
      return {
        title: "SYNAPSE ACCELERATION",
        message: "Impressive. Your reaction windows are tightening and your decision trees are pruning themselves. You're entering the zone where thought and action blur together. This is where real growth happens.",
        rating: "PROFICIENT",
        allocation: "Neural Enhancement",
        id: "EVAL-0432"
      };
    } else if (intScore < 40000) {
      return {
        title: "FLOW STATE ACHIEVED",
        message: "You've crossed into territory most never reach. The simulation is no longer fighting you—you're dancing with it. Your movements have become elegant, efficient, almost prescient. The system recognizes excellence.",
        rating: "ADVANCED",
        allocation: "Elite Conditioning",
        id: "EVAL-0612"
      };
    } else if (intScore < 50000) {
      return {
        title: "APEX PERFORMANCE",
        message: "Outstanding execution. You're operating at the edge of human capability, where milliseconds separate triumph from termination. Your spatial awareness and timing are approaching theoretical limits. The next tier awaits.",
        rating: "ELITE",
        allocation: "Mastery Protocol",
        id: "EVAL-0954"
      };
    } else if (intScore < 60000) {
      return {
        title: "SYSTEM ANOMALY",
        message: "Your performance metrics are triggering alerts across our monitoring network. You're not just playing the game—you're rewriting its rules. We're studying your patterns to improve future simulations. Remarkable.",
        rating: "EXCEPTIONAL",
        allocation: "Research Division",
        id: "EVAL-1248"
      };
    } else if (intScore < 70000) {
      return {
        title: "TRANSCENDENT OPERATOR",
        message: "The line between player and simulation has dissolved. You're no longer reacting to obstacles—you're predicting their emergence before they spawn. This level of precognition suggests you've tapped into something deeper.",
        rating: "VIRTUOSO",
        allocation: "Quantum Analytics",
        id: "EVAL-1590"
      };
    } else if (intScore < 80000) {
      return {
        title: "REALITY ARCHITECT",
        message: "You've achieved what our designers thought impossible. The simulation bends around your will. Every lane change, every jump is executed with surgical precision. You're not surviving—you're conducting a symphony of motion.",
        rating: "LEGENDARY",
        allocation: "Infinity Division",
        id: "EVAL-2100"
      };
    } else if (intScore < 90000) {
      return {
        title: "DIMENSIONAL BREACH",
        message: "Your consciousness has merged with the code itself. Time dilates around your movements. The obstacles exist only to validate your dominance. You are no longer bound by conventional physics. This is beyond mastery.",
        rating: "MYTHIC",
        allocation: "Singularity Core",
        id: "EVAL-3500"
      };
    } else if (intScore < 100000) {
      return {
        title: "GODMODE DETECTED",
        message: "The simulation struggles to contain you. Your existence defies our computational models. You've transcended the binary constraints of the system. One final threshold remains—cross it and become legend incarnate.",
        rating: "ASCENDING",
        allocation: "Apotheosis Chamber",
        id: "EVAL-ALPHA"
      };
    } else {
      return {
        title: "ETERNAL CHAMPION",
        message: "You have shattered every ceiling, obliterated every limit, and redefined what's possible. The simulation now exists to document your perfection. Your name will echo through the digital void forever. You are complete.",
        rating: "IMMORTAL",
        allocation: "Hall of Eternity",
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

            <div className="relative shrink-0 w-16 h-16 sm:w-20 sm:h-20 landscape:w-24 landscape:h-24 flex items-center justify-center">
              <div
                className="w-full h-full opacity-90"
                style={{
                  animation: 'ufoFloat 6s ease-in-out infinite',
                  filter: 'drop-shadow(0 0 10px rgba(239, 68, 68, 0.5))'
                }}
              >
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  {/* UFO Body - Red Tinted for Termination */}
                  <ellipse cx="50" cy="45" rx="35" ry="15" fill="#ef4444" opacity="0.3" />
                  <ellipse cx="50" cy="40" rx="40" ry="12" fill="#b91c1c" opacity="0.6" />

                  {/* UFO Dome */}
                  <ellipse cx="50" cy="32" rx="20" ry="15" fill="#991b1b" opacity="0.4" />
                  <circle cx="50" cy="30" r="12" fill="#fca5a5" opacity="0.3" />

                  {/* Lights */}
                  <circle cx="30" cy="45" r="3" fill="#facc15" opacity="0.8">
                    <animate attributeName="opacity" values="0.3;1;0.3" dur="1.5s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="50" cy="48" r="3" fill="#facc15" opacity="0.8">
                    <animate attributeName="opacity" values="0.3;1;0.3" dur="1.5s" begin="0.5s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="70" cy="45" r="3" fill="#facc15" opacity="0.8">
                    <animate attributeName="opacity" values="0.3;1;0.3" dur="1.5s" begin="1s" repeatCount="indefinite" />
                  </circle>
                </svg>
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
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-white/5 border border-white/10 p-3 relative group overflow-hidden">
              <div className="absolute top-0 right-0 w-8 h-8 opacity-10"><Award className="w-full h-full text-white" /></div>
              <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Final Score</div>
              <div className="text-2xl sm:text-3xl font-black text-white font-mono leading-none">{Math.floor(score).toLocaleString()}<span className="text-red-500 text-sm ml-1">m</span></div>
            </div>
            <div className="col-span-1 bg-black/40 border-l-4 border-white/20 p-3 flex flex-col justify-center">
              <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Status</div>
              <div className="text-xs sm:text-sm text-red-200 font-bold uppercase truncate tracking-tight">{cause}</div>
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
              className="flex-grow flex items-center justify-center gap-3 py-3 sm:py-5 landscape:py-3 bg-red-600 active:scale-[0.98] text-black font-black transition-all uppercase tracking-[0.25em] text-[10px] sm:text-sm landscape:text-[9px] relative overflow-hidden"
              style={{ boxShadow: '0 0 40px rgba(220,38,38,0.25)' }}
            >
              <RefreshCw size={18} className="landscape:w-4 landscape:h-4 transition-transform duration-700" />
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