import React from 'react';
import { COLORS } from '../constants';
import { Play, ShieldAlert, ChevronUp, ChevronDown, Keyboard, Fingerprint } from 'lucide-react';

interface MainMenuProps {
  onStart: () => void;
}

const MainMenu: React.FC<MainMenuProps> = ({ onStart }) => {
  return (
    <div className="absolute inset-0 z-40 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-2 sm:p-4 overflow-hidden">
      <div className="w-full max-w-4xl h-full flex flex-col items-center justify-center space-y-2 sm:space-y-4">
          {/* Header Section - Shrinks on small heights */}
          <div className="text-center space-y-0.5 sm:space-y-1 flex-shrink-0">
              <h1 className="text-3xl sm:text-5xl md:text-7xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600"
                  style={{ textShadow: `0 0 15px ${COLORS.NEON_YELLOW}` }}>
                  V-CORP
              </h1>
              <p className="text-[10px] sm:text-sm md:text-lg tracking-[0.3em] text-cyan-400 font-light uppercase">Endless Grind Simulation</p>
          </div>

          {/* Controls Container - Responsive sizing */}
          <div className="grid grid-cols-2 gap-2 sm:gap-4 w-full max-w-2xl font-mono flex-shrink min-h-0 overflow-hidden">
              
              {/* Input Protocols (Touch) */}
              <div className="bg-gray-900/90 border border-gray-700 p-2 sm:p-3 relative overflow-hidden rounded flex flex-col justify-center">
                  <Fingerprint className="absolute top-1 right-1 w-8 h-8 sm:w-12 sm:h-12 text-cyan-400 opacity-5" />
                  <h3 className="text-cyan-400 font-bold border-b border-gray-700 pb-1 mb-1 flex items-center gap-1.5 text-[10px] sm:text-xs">
                      <Fingerprint size={12} /> TOUCH
                  </h3>
                  <div className="space-y-1 text-[9px] sm:text-xs text-gray-400">
                      <div className="flex justify-between items-center">
                          <span className="truncate mr-1">JUMP</span>
                          <span className="text-yellow-400 font-bold flex items-center whitespace-nowrap">UP <ChevronUp size={10}/></span>
                      </div>
                      <div className="flex justify-between items-center">
                          <span className="truncate mr-1">DUCK</span>
                          <span className="text-yellow-400 font-bold flex items-center whitespace-nowrap">DOWN <ChevronDown size={10}/></span>
                      </div>
                  </div>
              </div>

              {/* Manual Override (Desktop) */}
              <div className="bg-gray-900/90 border border-gray-700 p-2 sm:p-3 relative overflow-hidden rounded flex flex-col justify-center">
                  <Keyboard className="absolute top-1 right-1 w-8 h-8 sm:w-12 sm:h-12 text-yellow-400 opacity-5" />
                  <h3 className="text-yellow-400 font-bold border-b border-gray-700 pb-1 mb-1 flex items-center gap-1.5 text-[10px] sm:text-xs">
                      <Keyboard size={12} /> DESKTOP
                  </h3>
                  <div className="space-y-1 text-[9px] sm:text-xs text-gray-400">
                      <div className="flex justify-between items-center">
                          <span className="truncate mr-1">JUMP</span>
                          <span className="bg-gray-800 px-1 py-0.5 rounded text-[8px] sm:text-[10px] border border-gray-600">SPACE</span>
                      </div>
                      <div className="flex justify-between items-center">
                          <span className="truncate mr-1">DUCK</span>
                          <span className="bg-gray-800 px-1 py-0.5 rounded text-[8px] sm:text-[10px] border border-gray-600">DOWN</span>
                      </div>
                  </div>
              </div>
          </div>
          
          {/* Hazards (Extra Compact) */}
          <div className="hidden sm:flex flex-wrap justify-center gap-4 text-[10px] text-red-400 font-mono uppercase tracking-widest opacity-60 flex-shrink-0">
              <span className="flex items-center gap-1"><ShieldAlert size={10}/> DRONES</span>
              <span className="flex items-center gap-1"><ShieldAlert size={10}/> MINES</span>
              <span className="flex items-center gap-1"><ShieldAlert size={10}/> HR</span>
          </div>

          {/* Action Section */}
          <div className="w-full max-w-xs flex flex-col items-center gap-2 flex-shrink-0">
            <button 
                onClick={onStart}
                className="group relative px-6 py-3 sm:px-10 sm:py-4 bg-yellow-400 text-black font-black text-lg sm:text-xl tracking-widest uppercase hover:bg-yellow-300 transition-all w-full overflow-hidden shadow-[0_0_20px_rgba(250,204,21,0.3)] rounded-sm active:scale-95"
            >
                <span className="relative z-10 flex items-center justify-center gap-2">
                    <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-black" /> CLOCK IN
                </span>
                <div className="absolute inset-0 bg-white/40 translate-y-full group-hover:translate-y-0 transition-transform duration-300 skew-y-12"></div>
            </button>
            <p className="text-[8px] sm:text-[10px] text-gray-600 font-mono uppercase tracking-tighter">
                Asset #8080: Status: Pending...
            </p>
          </div>
      </div>
    </div>
  );
};

export default MainMenu;