import React, { useState, useEffect } from 'react';
import { COLORS } from '../constants';
import { Play, ShieldAlert, ChevronUp, ChevronDown, Keyboard, Fingerprint, Award, Volume2, VolumeX, Plane, Bomb, UserX, Gamepad, UserPlus, Loader2 } from 'lucide-react';
import { getLeaderboard } from '../services/leaderboard';
import UsernameInput from './UsernameInput';

interface MainMenuProps {
  onStart: () => void;
  isAudioEnabled: boolean;
  toggleAudio: () => void;
  username: string | null;
  onUsernameSet: (username: string) => void;
}

const MainMenu: React.FC<MainMenuProps> = ({ onStart, isAudioEnabled, toggleAudio, username, onUsernameSet }) => {
  const [leaderboard, setLeaderboard] = useState<Array<{ username: string; score: number }>>([]);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(true);
  const [showUsernameInput, setShowUsernameInput] = useState(false);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const data = await getLeaderboard(10);
        setLeaderboard(data);
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
      } finally {
        setIsLoadingLeaderboard(false);
      }
    };

    fetchLeaderboard();
    // Refresh leaderboard every 30 seconds
    const interval = setInterval(fetchLeaderboard, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleUsernameSuccess = (newUsername: string) => {
    onUsernameSet(newUsername);
    setShowUsernameInput(false);
  };
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

      {/* UFO Observer */}
      <div 
        className="absolute pointer-events-none opacity-70"
        style={{
          animation: 'ufoFloat 25s ease-in-out infinite, ufoWobble 3s ease-in-out infinite',
          width: '60px',
          height: '60px',
          filter: 'drop-shadow(0 0 15px rgba(34, 211, 238, 0.6))'
        }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* UFO Body */}
          <ellipse cx="50" cy="45" rx="35" ry="15" fill="#22d3ee" opacity="0.3" />
          <ellipse cx="50" cy="40" rx="40" ry="12" fill="#0891b2" opacity="0.6" />
          
          {/* UFO Dome */}
          <ellipse cx="50" cy="32" rx="20" ry="15" fill="#06b6d4" opacity="0.4" />
          <circle cx="50" cy="30" r="12" fill="#67e8f9" opacity="0.3" />
          
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
          
          {/* Beam (subtle) */}
          <path d="M 40 50 L 35 90 L 65 90 L 60 50 Z" fill="#22d3ee" opacity="0.1">
            <animate attributeName="opacity" values="0;0.15;0" dur="4s" repeatCount="indefinite" />
          </path>
        </svg>
      </div>

      <div className="w-full max-w-6xl h-full flex flex-col landscape:flex-row items-center landscape:items-center justify-center landscape:justify-center space-y-2 sm:space-y-4 landscape:space-y-0 landscape:space-x-8 landscape:px-8 relative z-10">
          {/* LEFT COLUMN (Landscape) / TOP (Portrait) - Title & Leaderboard */}
          <div className="flex flex-col items-center space-y-2 sm:space-y-4 landscape:flex-1 landscape:max-w-lg">
              {/* Header Section with fade-in */}
              <div 
                className="text-center space-y-0.5 sm:space-y-1 flex-shrink-0"
                style={{ animation: 'fadeInUp 0.8s ease-out forwards' }}
              >
                  <h1 
                    className="text-3xl sm:text-5xl md:text-7xl landscape:text-5xl font-black italic tracking-tighter text-transparent bg-clip-text relative"
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
                  <p className="text-[10px] sm:text-sm md:text-lg landscape:text-sm tracking-[0.3em] text-cyan-400 font-light uppercase opacity-0 flex items-center justify-center gap-2"
                     style={{ animation: 'fadeInUp 0.8s ease-out 0.2s forwards' }}>
                    <Gamepad size={19} className="text-yellow-400 hidden sm:inline landscape:inline" />
                    PROJECT LOOP
                    <Gamepad size={19} className="text-yellow-400 hidden sm:inline landscape:inline" />
                  </p>
              </div>

              {/* Leaderboard Section - Replaced large boxes */}
              <div 
                className="w-full max-w-xl landscape:max-w-none bg-gray-900/40 border border-cyan-500/30 backdrop-blur-sm p-4 rounded relative overflow-hidden opacity-0"
                style={{ 
                  animation: 'fadeInUp 0.8s ease-out 0.4s forwards',
                  boxShadow: '0 0 15px rgba(34, 211, 238, 0.1)'
                }}
              >
                  <div className="absolute inset-0 scanline-subtle pointer-events-none opacity-10"></div>
                  <h3 className="text-cyan-400 font-bold font-mono text-xs mb-3 tracking-[0.2em] flex items-center justify-between border-b border-cyan-500/20 pb-2">
                    <span className="flex items-center gap-2">
                      <Award size={12} className="text-yellow-400" />
                      CORPORATE RANKINGS
                    </span>
                    <span className="text-[8px] text-gray-500">LIVE</span>
                  </h3>
                  
                  <div className="space-y-2 font-mono min-h-[120px]">
                    {isLoadingLeaderboard ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 size={20} className="text-cyan-400 animate-spin" />
                      </div>
                    ) : leaderboard.length === 0 ? (
                      <div className="text-center py-8 text-gray-500 text-xs">
                        No scores yet. Be the first!
                      </div>
                    ) : (
                      leaderboard.map((entry, i) => (
                        <div 
                          key={entry.username}
                          className="flex justify-between items-center text-[10px] sm:text-xs py-1 px-2 hover:bg-cyan-500/10 transition-colors group"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-gray-500 w-4 font-bold">{i + 1}</span>
                            <span className={`font-bold transition-all group-hover:text-cyan-300 ${
                              entry.username === username ? 'text-yellow-400' : 'text-gray-300'
                            }`}>
                              {entry.username}
                            </span>
                          </div>
                          <span className="text-cyan-500 font-bold tabular-nums">
                            {entry.score.toLocaleString()}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
              </div>
          </div>
          
          {/* RIGHT COLUMN (Landscape) / BOTTOM (Portrait) - Controls & Actions */}
          <div className="flex flex-col items-center space-y-3 landscape:flex-1 landscape:justify-center landscape:space-y-4 landscape:max-w-md">
              {/* Subtle Control Hints */}
              <div 
                className="flex flex-wrap justify-center gap-6 py-2 opacity-0"
                style={{ animation: 'fadeInUp 0.8s ease-out 0.6s forwards' }}
              >
                  <div className="flex items-center gap-2 text-[10px] font-mono text-gray-500 uppercase tracking-widest bg-gray-800/50 px-3 py-1.5 rounded-full border border-gray-700 hover:border-cyan-500/50 transition-all">
                    <Fingerprint size={12} className="text-cyan-400" />
                    <span>TAP <span className="text-white font-bold">UP</span> / <span className="text-white font-bold">DOWN</span></span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-mono text-gray-500 uppercase tracking-widest bg-gray-800/50 px-3 py-1.5 rounded-full border border-gray-700 hover:border-yellow-500/50 transition-all">
                    <Keyboard size={12} className="text-yellow-400" />
                    <span><span className="text-white font-bold">SPACE</span> JUMP / <span className="text-white font-bold">DOWN</span> SLIDE</span>
                  </div>
              </div>
              
              {/* Hazards Sub-info */}
              <div 
                className="hidden sm:flex flex-wrap justify-center gap-4 text-[9px] font-mono uppercase tracking-[0.3em] opacity-0 flex-shrink-0"
                style={{ animation: 'fadeInUp 0.8s ease-out 0.7s forwards' }}
              >
                  <span className="flex items-center gap-1.5 px-3 py-1.5 bg-red-950/30 border border-red-900/40 rounded-sm text-red-400/80 hover:text-red-300 hover:border-red-700/60 transition-all">
                    <Plane size={12} className="rotate-90" />
                    DUCK DRONES
                  </span>
                  <span className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-950/30 border border-orange-900/40 rounded-sm text-orange-400/80 hover:text-orange-300 hover:border-orange-700/60 transition-all">
                    <Bomb size={12} />
                    JUMP MINES
                  </span>
                  <span className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-950/30 border border-purple-900/40 rounded-sm text-purple-400/80 hover:text-purple-300 hover:border-purple-700/60 transition-all">
                    <UserX size={12} />
                    EVADE MANAGEMENT
                  </span>
              </div>

              {/* Action Section with enhanced button */}
              <div 
                className="w-full max-w-xs flex flex-col items-center gap-2 flex-shrink-0 opacity-0"
                style={{ animation: 'fadeInUp 0.8s ease-out 0.8s forwards' }}
              >
                <button 
                  onClick={toggleAudio}
                  className="mb-2 flex items-center gap-2 px-3 py-1 bg-black/40 border border-cyan-500/30 rounded-full hover:bg-cyan-500/10 transition-colors backdrop-blur-sm group"
                >
                  {isAudioEnabled ? (
                    <Volume2 size={12} className="text-cyan-400 animate-pulse" />
                  ) : (
                    <VolumeX size={12} className="text-gray-500 group-hover:text-cyan-400 transition-colors" />
                  )}
                  <span className={`text-[8px] font-mono tracking-widest ${isAudioEnabled ? 'text-cyan-400' : 'text-gray-500 group-hover:text-cyan-400'}`}>
                    MUSIC: {isAudioEnabled ? 'ON' : 'OFF'}
                  </span>
                </button>

                {/* Username Display or Create Button */}
                {username ? (
                  <div className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-cyan-950/20 border border-cyan-500/30 rounded-sm">
                    <UserPlus size={14} className="text-cyan-400" />
                    <span className="text-cyan-400 font-mono text-xs tracking-wider">
                      {username}
                    </span>
                  </div>
                ) : (
                  <button 
                    onClick={() => setShowUsernameInput(true)}
                    className="w-full bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/50 hover:border-cyan-400 text-cyan-300 font-bold py-2 px-4 flex items-center justify-center gap-2 transition-all uppercase tracking-widest text-xs"
                  >
                    <UserPlus size={14} />
                    Create Profile
                  </button>
                )}

                <button 
                  onClick={onStart}
                  className="w-full bg-gradient-to-r from-yellow-500 to-yellow-400 text-black font-black text-sm sm:text-lg px-8 py-4 hover:from-yellow-400 hover:to-yellow-300 transition-all transform hover:scale-105 relative overflow-hidden group border-2 border-yellow-600"
                  style={{
                    boxShadow: `0 0 20px ${COLORS.NEON_YELLOW}40`,
                    clipPath: 'polygon(0 0, 100% 0, 98% 100%, 2% 100%)'
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent transform -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700"></div>
                  <span className="flex items-center gap-2 justify-center tracking-widest relative z-10">
                    <Play size={18} className="fill-current" />
                    CLOCK IN
                  </span>
                </button>
              </div>
          </div>
      </div>

      {/* Username Input Modal */}
      {showUsernameInput && (
        <UsernameInput 
          onSuccess={handleUsernameSuccess}
          onCancel={() => setShowUsernameInput(false)}
        />
      )}
    </div>
  );
};

export default MainMenu;
