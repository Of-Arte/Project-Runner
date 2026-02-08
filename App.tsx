import React, { useState, useEffect } from "react";
import GameCanvas from "./components/GameCanvas";
import CorporateTicker from "./components/CorporateTicker";
import TerminationScreen from "./components/TerminationScreen";
import MainMenu from "./components/MainMenu";
import QuitModal from "./components/QuitModal";
import { GameState } from "./types";
import { COLORS, INITIAL_LIVES } from "./constants";
import {
  Smartphone,
  RotateCw,
  HeartPulse,
  Award,
  Volume2,
  VolumeX,
  Pause,
  Play,
  LogOut,
} from "lucide-react";
import { submitScore } from "./services/leaderboard";
import { subscribeToAuth, UserProfile } from "./services/auth";
import AuthModal from "./components/AuthModal";

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(INITIAL_LIVES);
  const [synergy, setSynergy] = useState(0);
  const [isSynergyActive, setIsSynergyActive] = useState(false);
  const [deathCause, setDeathCause] = useState("Unknown");

  const [isFirstRun, setIsFirstRun] = useState(true);
  const [deathStreak, setDeathStreak] = useState(0);
  const [showTutorial, setShowTutorial] = useState(true);

  // User State
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showQuitModal, setShowQuitModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Audio State
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  // Subscribe to Auth Changes
  useEffect(() => {
    try {
      const unsubscribe = subscribeToAuth((userProfile) => {
        setUser(userProfile);
        setAuthLoading(false);
      });
      return () => unsubscribe();
    } catch (e) {
      console.error("Auth subscription failed:", e);
      setAuthLoading(false);
      return () => { };
    }
  }, []);

  const toggleAudio = () => {
    if (!audioRef.current) return;

    if (isAudioEnabled) {
      audioRef.current.pause();
      setIsAudioEnabled(false);
    } else {
      audioRef.current
        .play()
        .catch((e) => console.error("Audio playback failed:", e));
      setIsAudioEnabled(true);
    }
  };

  // Ensure audio loops and persists
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.loop = true;
      audioRef.current.volume = 0.5;
    }
  }, []);

  // Prevent context menu (right click / long press)
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
    };

    document.addEventListener("contextmenu", handleContextMenu);
    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
    };
  }, []);

  const handleGameOver = async (finalScore: number, cause: string) => {
    setScore(finalScore);
    setDeathCause(cause);
    setGameState(GameState.GAME_OVER);
    if (finalScore < 150) setDeathStreak((prev) => prev + 1);
    else setDeathStreak(0);

    // Submit score to Firebase if user is logged in
    if (user) {
      try {
        await submitScore(user.username, Math.floor(finalScore)); // Updated signature
      } catch (error) {
        console.error("Failed to submit score:", error);
      }
    }
  };

  const handlePause = () => {
    if (gameState === GameState.PLAYING) setGameState(GameState.PAUSED);
    else if (gameState === GameState.PAUSED) setGameState(GameState.PLAYING);
  };

  const handleQuit = () => {
    setGameState(GameState.PAUSED);
    setShowQuitModal(true);
  };

  const handleConfirmQuit = () => {
    setShowQuitModal(false);
    setGameState(GameState.MENU);
  };

  const handleCancelQuit = () => {
    setShowQuitModal(false);
    setGameState(GameState.PLAYING);
  };

  const handleStart = () => {
    if (isFirstRun || deathStreak >= 2) setShowTutorial(true);
    else setShowTutorial(false);

    setLives(INITIAL_LIVES);
    setSynergy(0);
    setIsSynergyActive(false);
    if (isFirstRun) setIsFirstRun(false);
    setGameState(GameState.PLAYING);
  };

  return (
    <div
      className="h-[100dvh] w-screen flex flex-col items-center justify-between relative overflow-hidden touch-none selection:bg-none safe-top safe-bottom safe-left safe-right animate-in fade-in duration-1000"
      style={{ backgroundColor: COLORS.DARK_BG }}
    >
      {/* Global Audio Element */}
      <audio ref={audioRef} src="/soundtrack.mp3" preload="auto" />

      {/* Rotation Warning Removed for Portrait Mode Support */}

      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900 via-black to-black"></div>
      <div className="scanline z-50 pointer-events-none"></div>

      {/* HUD Layer */}
      {gameState === GameState.PLAYING && (
        <div className="absolute inset-0 z-50 pointer-events-none flex flex-col justify-between p-4 safe-area-inset-top">

          {/* Top Header */}
          <div className="flex justify-between items-start pointer-events-auto">
            <div className="flex flex-col gap-2">
              {/* Lives Area */}
              <div className="flex items-center gap-1">
                {Array.from({ length: 3 }).map((_, i) => (
                  <HeartPulse
                    key={i}
                    size={24}
                    className={`transition-all ${i < lives ? 'text-cyan-400 fill-cyan-400/20 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]' : 'text-gray-800'}`}
                  />
                ))}
              </div>

              {/* Score Area */}
              <div className="bg-black/60 backdrop-blur-sm border border-white/10 px-4 py-2 rounded-lg">
                <div className="text-[10px] text-gray-400 font-mono uppercase tracking-widest">Evaluation Score</div>
                <div className="text-2xl font-black text-white font-mono tracking-tighter tabular-nums drop-shadow-md">
                  {Math.floor(score).toLocaleString()}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={toggleAudio}
                className="p-3 bg-black/40 border border-white/10 rounded-full text-white/80 hover:bg-white/10 active:scale-95 transition-all backdrop-blur-sm"
              >
                {isAudioEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
              </button>
              <button
                onClick={() => setGameState(GameState.PAUSED)}
                className="p-3 bg-black/40 border border-white/10 rounded-full text-white/80 hover:bg-white/10 active:scale-95 transition-all backdrop-blur-sm"
              >
                <Pause size={20} />
              </button>
            </div>
          </div>

          {/* Bottom Area - Aura Removed, moved to Player */}
        </div>
      )}

      <div
        className={`relative w-full flex-grow overflow-hidden z-10 flex items-center justify-center min-h-0 bg-black transition-all duration-500 ${isSynergyActive ? "scale-105 saturate-150" : ""}`}
      >
        <GameCanvas
          gameState={gameState}
          setGameState={setGameState}
          setScore={setScore}
          setLives={setLives}
          setSynergy={setSynergy}
          setIsSynergyActive={setIsSynergyActive}
          setDeathCause={handleGameOver}
          showTutorial={showTutorial}
        />

        {gameState === GameState.MENU && (
          <MainMenu
            onStart={handleStart}
            isAudioEnabled={isAudioEnabled}
            toggleAudio={toggleAudio}
            user={user}
            authLoading={authLoading}
            onLogin={() => setShowAuthModal(true)}
          />
        )}

        {gameState === GameState.GAME_OVER && (
          <TerminationScreen
            score={score}
            cause={deathCause}
            onRestart={() => setGameState(GameState.MENU)}
            user={user}
            onLogin={() => setShowAuthModal(true)}
          />
        )}

        {showQuitModal && (
          <QuitModal
            onConfirm={handleConfirmQuit}
            onCancel={handleCancelQuit}
          />
        )}

        {/* Auth Modal Global */}
        {showAuthModal && (
          <AuthModal
            onSuccess={() => setShowAuthModal(false)}
            onCancel={() => setShowAuthModal(false)}
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
