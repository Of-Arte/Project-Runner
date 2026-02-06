import React, { useState, useEffect } from 'react';
import GameCanvas from './components/GameCanvas';
import CorporateTicker from './components/CorporateTicker';
import TerminationScreen from './components/TerminationScreen';
import MainMenu from './components/MainMenu';
import { GameState } from './types';
import { COLORS, INITIAL_LIVES } from './constants';
import { Smartphone, RotateCw, Zap, Activity } from 'lucide-react';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(INITIAL_LIVES);
  const [synergy, setSynergy] = useState(0);
  const [deathCause, setDeathCause] = useState("Unknown");
  
  const [isFirstRun, setIsFirstRun] = useState(true);
  const [deathStreak, setDeathStreak] = useState(0);
  const [showTutorial, setShowTutorial] = useState(true);

  const handleGameOver = (finalScore: number, cause: string) => {
    setScore(finalScore);
    setDeathCause(cause);
    setGameState(GameState.GAME_OVER);
    if (finalScore < 150) setDeathStreak(prev => prev + 1);
    else setDeathStreak(0);
  };

  const handleStart = () => {
    if (isFirstRun || deathStreak >= 2) setShowTutorial(true);
    else setShowTutorial(false);
    
    setLives(INITIAL_LIVES);
    setSynergy(0);
    if (isFirstRun) setIsFirstRun(false);
    setGameState(GameState.PLAYING);
  };

  return (
    <div className="h-[100dvh] w-screen flex flex-col items-center justify-between relative overflow-hidden touch-none selection:bg-none"
         style={{ backgroundColor: COLORS.DARK_BG }}>
      
      {gameState === GameState.PLAYING && (
        <div className="fixed inset-0 z-[100] bg-black flex-col items-center justify-center p-6 text-center hidden portrait:flex lg:hidden">
            <div className="relative mb-4">
              <Smartphone className="w-16 h-16 md:w-24 md:h-24 text-gray-600" />
              <RotateCw className="w-8 h-8 md:w-12 md:h-12 text-yellow-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin" style={{ animationDuration: '3s' }} />
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-yellow-400 mb-2 tracking-widest uppercase">Rotation Required</h2>
            <p className="text-gray-400 font-mono text-xs md:text-sm max-w-xs leading-relaxed">
                Optical sensors detect insufficient horizontal clearance. 
                <br/><br/>
                <span className="text-cyan-400 font-bold uppercase">Please rotate device to LANDSCAPE MODE.</span>
            </p>
        </div>
      )}

      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900 via-black to-black"></div>
      <div className="scanline z-50 pointer-events-none"></div>

      {/* Header HUD */}
      <div className="w-full flex justify-between items-center px-4 py-2 border-b-2 border-gray-800 bg-black/50 backdrop-blur z-20 shrink-0 h-16">
          <div className="flex flex-col gap-1">
              <span className="text-[8px] text-gray-500 font-mono leading-none uppercase tracking-widest">Biological Integrity</span>
              <div className="flex gap-1">
                {[...Array(INITIAL_LIVES)].map((_, i) => (
                  <Zap 
                    key={i} 
                    size={14} 
                    className={`transition-all duration-500 ${i < lives ? 'text-cyan-400 fill-cyan-400' : 'text-gray-800 opacity-20'}`} 
                  />
                ))}
              </div>
          </div>

          <div className="flex flex-col items-center w-1/3 max-w-[200px]">
              <div className="flex items-center gap-1 mb-1">
                  <Activity size={10} className={synergy >= 100 ? "text-white animate-pulse" : "text-gray-500"} />
                  <span className="text-[8px] text-gray-500 font-mono uppercase tracking-widest">Synergy Drive</span>
              </div>
              <div className="w-full h-2 bg-gray-900 border border-gray-800 relative overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${synergy >= 100 ? 'bg-white animate-pulse shadow-[0_0_10px_#fff]' : 'bg-cyan-500'}`}
                    style={{ width: `${Math.min(synergy, 100)}%` }}
                  />
              </div>
          </div>
          
          <div className="flex flex-col items-end">
              <span className="text-[8px] text-gray-500 font-mono leading-none uppercase tracking-widest">Output Metric</span>
              <span className="text-yellow-400 font-bold text-xl md:text-3xl font-mono tabular-nums leading-none">
                  {score.toString().padStart(6, '0')}
              </span>
          </div>
      </div>

      <div className="relative w-full flex-grow overflow-hidden z-10 flex items-center justify-center min-h-0 bg-black">
          <GameCanvas 
              gameState={gameState} 
              setGameState={setGameState}
              setScore={setScore}
              setLives={setLives}
              setSynergy={setSynergy}
              setDeathCause={handleGameOver}
              showTutorial={showTutorial}
          />

          {gameState === GameState.MENU && (
              <MainMenu onStart={handleStart} />
          )}

          {gameState === GameState.GAME_OVER && (
              <TerminationScreen 
                  score={score} 
                  cause={deathCause}
                  onRestart={() => setGameState(GameState.MENU)} 
              />
          )}
      </div>

      <div className="w-full shrink-0 z-20 h-8">
        <CorporateTicker />
      </div>
    </div>
  );
};

export default App;