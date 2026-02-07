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
  Zap,
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
    const unsubscribe = subscribeToAuth((userProfile) => {
      setUser(userProfile);
      setAuthLoading(false);
    });
    return () => unsubscribe();
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
      className="h-[100dvh] w-screen flex flex-col items-center justify-between relative overflow-hidden touch-none selection:bg-none safe-top safe-bottom safe-left safe-right"
      style={{ backgroundColor: COLORS.DARK_BG }}
    >
      {/* Global Audio Element */}
      <audio ref={audioRef} src="/soundtrack.mp3" preload="auto" />

      {(gameState === GameState.PLAYING || gameState === GameState.GAME_OVER) && (
        <div className="fixed inset-0 z-[100] bg-black flex-col items-center justify-center p-6 text-center hidden portrait:flex lg:hidden">
          <div className="relative mb-4">
            <Smartphone className="w-16 h-16 md:w-24 md:h-24 text-gray-600" />
            <RotateCw
              className="w-8 h-8 md:w-12 md:h-12 text-yellow-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            />
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-yellow-400 mb-2 tracking-widest uppercase">
            Rotation Required
          </h2>
          <p className="text-gray-400 font-mono text-xs md:text-sm max-w-xs leading-relaxed">
            Optical sensors detect insufficient horizontal clearance.
            <br />
            <br />
            <span className="text-cyan-400 font-bold uppercase">
              Please rotate device to LANDSCAPE MODE.
            </span>
          </p>
        </div>
      )}

      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900 via-black to-black"></div>
      <div className="scanline z-50 pointer-events-none"></div>

      {/* Header HUD */}
      <div className="absolute top-0 left-0 w-full flex justify-between items-center px-4 py-2 z-20 h-16 pointer-events-none">
        <div
          className="flex flex-col gap-1 px-3 py-2 rounded-lg border transition-all duration-300 pointer-events-auto"
          style={{
            textShadow: "0 0 10px rgba(0,0,0,0.8)",
            borderColor: isSynergyActive ? "#fff" : "rgba(34, 211, 238, 0.3)",
            boxShadow: isSynergyActive
              ? "0 0 25px #fff, inset 0 0 10px #fff"
              : "0 0 15px rgba(34, 211, 238, 0.2), inset 0 0 5px rgba(34, 211, 238, 0.1)",
            transform: isSynergyActive ? "scale(1.05)" : "scale(1)",
          }}
        >
          <span className="text-[8px] text-gray-300 font-mono leading-none uppercase tracking-widest">
            Lives
          </span>
          <div className="flex gap-1">
            {[...Array(INITIAL_LIVES)].map((_, i) => (
              <Zap
                key={i}
                size={14}
                className={`transition-all duration-500 ${i < lives ? (isSynergyActive ? "text-white fill-white animate-pulse" : "text-cyan-400 fill-cyan-400") : "text-gray-800 opacity-20"}`}
              />
            ))}
          </div>
        </div>

        <div
          className="absolute left-1/2 flex flex-col items-center w-1/3 max-w-[200px] px-3 py-2 rounded-lg border transition-all duration-300 pointer-events-auto"
          style={{
            textShadow: "0 0 10px rgba(0,0,0,0.8)",
            borderColor: isSynergyActive ? "#fff" : "rgba(168, 85, 247, 0.3)",
            boxShadow: isSynergyActive
              ? "0 0 25px #fff, inset 0 0 10px #fff"
              : "0 0 15px rgba(168, 85, 247, 0.2), inset 0 0 5px rgba(168, 85, 247, 0.1)",
            transform: isSynergyActive
              ? "translateX(-50%) scale(1.1)"
              : "translateX(-50%) scale(1)",
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <button
              onClick={toggleAudio}
              className="p-0.5 hover:bg-white/10 rounded-sm transition-colors group focus:outline-none"
              aria-label={isAudioEnabled ? "Mute Music" : "Enable Music"}
            >
              {isAudioEnabled ? (
                <Volume2
                  size={10}
                  className={isSynergyActive ? "text-white" : "text-cyan-400"}
                />
              ) : (
                <VolumeX
                  size={10}
                  className="text-gray-500 group-hover:text-cyan-400 transition-colors"
                />
              )}
            </button>
            <span className="text-[8px] text-gray-300 font-mono uppercase tracking-widest">
              Aura
            </span>
          </div>
          <div className="w-full h-2 bg-gray-900/60 border border-gray-700/50 relative overflow-hidden rounded-sm">
            <div
              className={`h-full transition-all duration-300 ${isSynergyActive ? "bg-white animate-pulse shadow-[0_0_15px_#fff]" : "bg-cyan-500"}`}
              style={{ width: `${Math.min(synergy, 100)}%` }}
            />
          </div>
        </div>

        <div
          className="flex flex-col items-end px-3 py-2 rounded-lg border transition-all duration-300 pointer-events-auto"
          style={{
            textShadow: "0 0 10px rgba(0,0,0,0.8)",
            borderColor: isSynergyActive ? "#fff" : "rgba(250, 204, 21, 0.3)",
            boxShadow: isSynergyActive
              ? "0 0 25px #fff, inset 0 0 10px #fff"
              : "0 0 15px rgba(250, 204, 21, 0.2), inset 0 0 5px rgba(250, 204, 21, 0.1)",
            transform: isSynergyActive
              ? "scale(1.1) translateY(5px)"
              : "scale(1)",
          }}
        >
          <div className="flex items-center gap-3">
            {(gameState === GameState.PLAYING ||
              gameState === GameState.PAUSED) && (
              <div className="flex items-center gap-1 border-r border-gray-700/50 pr-2 mr-1">
                <button
                  onClick={handlePause}
                  className="p-1 hover:bg-white/10 rounded-sm transition-colors text-gray-400 hover:text-white"
                  aria-label={
                    gameState === GameState.PAUSED
                      ? "Resume Game"
                      : "Pause Game"
                  }
                >
                  {gameState === GameState.PAUSED ? (
                    <Play size={12} fill="currentColor" />
                  ) : (
                    <Pause size={12} fill="currentColor" />
                  )}
                </button>
                <button
                  onClick={handleQuit}
                  className="p-1 hover:bg-red-500/20 rounded-sm transition-colors text-gray-400 hover:text-red-400"
                  aria-label="Quit to Menu"
                >
                  <LogOut size={12} />
                </button>
              </div>
            )}
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-2 leading-none">
                {isSynergyActive && (
                  <span className="text-[7px] bg-white text-black px-1 font-black animate-pulse rounded-sm">
                    MC MODE
                  </span>
                )}
                <span className="text-[8px] text-gray-300 font-mono leading-none uppercase tracking-widest">
                  Score
                </span>
              </div>
              <span
                className="text-yellow-400 font-bold text-xl md:text-3xl font-mono tabular-nums leading-none mt-1"
                style={{
                  textShadow: isSynergyActive
                    ? "0 0 20px #fff"
                    : "0 0 15px rgba(250,204,21,0.5)",
                  color: isSynergyActive ? "#fff" : "#facc15",
                }}
              >
                {score.toString().padStart(6, "0")}
              </span>
            </div>
          </div>
        </div>
      </div>

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
