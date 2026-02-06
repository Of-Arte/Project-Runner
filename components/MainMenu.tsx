import React from 'react';
import { COLORS } from '../constants';
import { Play, ShieldAlert, ChevronUp, ChevronDown, Keyboard, Fingerprint } from 'lucide-react';

interface MainMenuProps {
  onStart: () => void;
}

const MainMenu: React.FC<MainMenuProps> = ({ onStart }) => {
  return (
    <div className="absolute inset-0 z-40 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-2 sm:p-4 overflow-hidden">
      {/* Holographic background effect */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          background: 'linear-gradient(45deg, #22d3ee, #facc15, #22d3ee, #facc15)',
          backgroundSize: '400% 400%',
          animation: 'holographicShimmer 8s ease infinite'
        }}
      />
      
      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-cyan-400 rounded-full opacity-40"
            style={{
              left: `${20 + i * 15}%`,
              top: `${10 + i * 12}%`,
              animation: `float ${3 + i * 0.5}s ease-in-out infinite`,
              animationDelay: `${i * 0.3}s`
            }}
          />
        ))}
      </div>

      <div className="w-full max-w-4xl h-full flex flex-col items-center justify-center space-y-2 sm:space-y-4 relative z-10">
          {/* Header Section with fade-in */}
          <div 
            className="text-center space-y-0.5 sm:space-y-1 flex-shrink-0"
            style={{ animation: 'fadeInUp 0.8s ease-out forwards' }}
          >
              <h1 
                className="text-3xl sm:text-5xl md:text-7xl font-black italic tracking-tighter text-transparent bg-clip-text relative"
                style={{ 
                  textShadow: `0 0 15px ${COLORS.NEON_YELLOW}`,
                  background: 'linear-gradient(90deg, #facc15, #fbbf24, #22d3ee, #fbbf24, #facc15)',
                  backgroundSize: '200% auto',
                  animation: 'holographicShimmer 3s linear infinite, glitchText 8s infinite',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                  V-CORP
              </h1>
              <p className="text-[10px] sm:text-sm md:text-lg tracking-[0.3em] text-cyan-400 font-light uppercase opacity-0"
                 style={{ animation: 'fadeInUp 0.8s ease-out 0.2s forwards' }}>
                Endless Grind Simulation
              </p>
          </div>

          {/* Controls Container with staggered fade-in and pulsing borders */}
          <div 
            className="grid grid-cols-2 gap-2 sm:gap-4 w-full max-w-2xl font-mono flex-shrink min-h-0 overflow-hidden opacity-0"
            style={{ animation: 'fadeInUp 0.8s ease-out 0.4s forwards' }}
          >
              
              {/* Input Protocols (Touch) */}
              <div 
                className="bg-gray-900/90 border border-gray-700 p-2 sm:p-3 relative overflow-hidden rounded flex flex-col justify-center transition-all hover:scale-105"
                style={{ animation: 'pulseGlow 3s ease-in-out infinite, borderPulse 3s ease-in-out infinite' }}
              >
                  <Fingerprint 
                    className="absolute top-1 right-1 w-8 h-8 sm:w-12 sm:h-12 text-cyan-400 opacity-5" 
                    style={{ animation: 'float 4s ease-in-out infinite' }}
                  />
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
              <div 
                className="bg-gray-900/90 border border-gray-700 p-2 sm:p-3 relative overflow-hidden rounded flex flex-col justify-center transition-all hover:scale-105"
                style={{ animation: 'pulseGlow 3s ease-in-out infinite 0.5s, borderPulse 3s ease-in-out infinite 0.5s' }}
              >
                  <Keyboard 
                    className="absolute top-1 right-1 w-8 h-8 sm:w-12 sm:h-12 text-yellow-400 opacity-5"
                    style={{ animation: 'float 4s ease-in-out infinite 0.5s' }}
                  />
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
          
          {/* Hazards with fade-in */}
          <div 
            className="hidden sm:flex flex-wrap justify-center gap-4 text-[10px] text-red-400 font-mono uppercase tracking-widest opacity-0 flex-shrink-0"
            style={{ animation: 'fadeInUp 0.8s ease-out 0.6s forwards' }}
          >
              <span className="flex items-center gap-1"><ShieldAlert size={10}/> DRONES</span>
              <span className="flex items-center gap-1"><ShieldAlert size={10}/> MINES</span>
              <span className="flex items-center gap-1"><ShieldAlert size={10}/> HR</span>
          </div>

          {/* Action Section with enhanced button */}
          <div 
            className="w-full max-w-xs flex flex-col items-center gap-2 flex-shrink-0 opacity-0"
            style={{ animation: 'fadeInUp 0.8s ease-out 0.8s forwards' }}
          >
            <button 
                onClick={onStart}
                className="group relative px-6 py-3 sm:px-10 sm:py-4 bg-yellow-400 text-black font-black text-lg sm:text-xl tracking-widest uppercase hover:bg-yellow-300 transition-all w-full overflow-hidden rounded-sm active:scale-95 hover:scale-105 hover:shadow-[0_0_30px_rgba(250,204,21,0.6)]"
                style={{ 
                  boxShadow: '0 0 20px rgba(250,204,21,0.3)',
                  animation: 'pulseGlow 2s ease-in-out infinite'
                }}
            >
                <span className="relative z-10 flex items-center justify-center gap-2">
                    <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-black" /> CLOCK IN
                </span>
                <div className="absolute inset-0 bg-white/40 translate-y-full group-hover:translate-y-0 transition-transform duration-300 skew-y-12"></div>
                {/* Holographic shimmer overlay */}
                <div 
                  className="absolute inset-0 opacity-20"
                  style={{
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)',
                    backgroundSize: '200% 100%',
                    animation: 'holographicShimmer 2s linear infinite'
                  }}
                />
            </button>
            <p className="text-[8px] sm:text-[10px] text-gray-600 font-mono uppercase tracking-tighter opacity-60">
                Asset #8080: Status: Pending...
            </p>
          </div>
      </div>
    </div>
  );
};

export default MainMenu;