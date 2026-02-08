import React, { useRef, useEffect, useCallback, useState } from 'react';
import ControlsGuidance from './ControlsGuidance';
import { GameState, GameObject, ObstacleType, PlayerState, Particle, Star, Credit, Laser, FloatingText } from '../types';
import {
  PLAYER_X, PLAYER_WIDTH, PLAYER_HEIGHT_STANDING, PLAYER_HEIGHT_DUCKING,
  COLORS, DEPARTMENTS, INITIAL_LIVES, INVINCIBILITY_FRAMES,
  SYNERGY_DURATION, SYNERGY_CREDIT_VALUE, LIFE_RECOVERY_THRESHOLD,
  PORTRAIT_PLAYER_Y_OFFSET, PORTRAIT_PLAYER_SIZE, PORTRAIT_LANE_COUNT, PORTRAIT_LANE_WIDTH_PERCENT,
  CREDIT_SCORE_VALUE, LANDSCAPE_CONFIG, PORTRAIT_CONFIG,
  LASER_COOLDOWN_FRAMES, LASER_COOLDOWN_REDUCTION,
  BIOMES // Added BIOMES import
} from '../constants';
import { generatePsychologicalTriggers } from '../services/geminiService';
import { soundService } from '../services/soundEffects';
import { useDeviceOrientation } from '../hooks/useDeviceOrientation';

interface GameCanvasProps {
  gameState: GameState;
  setGameState: (state: GameState) => void;
  setScore: (score: number) => void;
  setLives: (lives: number) => void;
  setSynergy: (synergy: number) => void;
  setIsSynergyActive: (active: boolean) => void;
  setDeathCause: (finalScore: number, cause: string) => void;
  showTutorial: boolean;
}

// Helper for color interpolation
const lerpColor = (start: string, end: string, t: number): string => {
  // Simple hex to rgb lerp
  let a = start.startsWith('#') ? start : '#000000';
  let b = end.startsWith('#') ? end : '#000000';

  // Handle rgba if needed, but for now assuming hex or simple colors. 
  // If inputs are rgba, we might need a better parser. 
  // For safety with existing constants, let's implement a robust one or use a library? NO library.
  // quick hex parser:
  const parse = (c: string) => {
    if (c.startsWith('rgba')) {
      const parts = c.match(/[\d.]+/g);
      return parts ? parts.map(Number) : [0, 0, 0, 1];
    }
    if (c.startsWith('#')) {
      const hex = c.slice(1);
      const bigint = parseInt(hex, 16);
      if (hex.length === 3) {
        return [
          ((bigint >> 8) & 0xF) * 17,
          ((bigint >> 4) & 0xF) * 17,
          (bigint & 0xF) * 17,
          1
        ];
      }
      return [
        (bigint >> 16) & 255,
        (bigint >> 8) & 255,
        bigint & 255,
        1
      ];
    }
    return [0, 0, 0, 1];
  };

  const c1 = parse(a);
  const c2 = parse(b);

  const r = Math.round(c1[0] + (c2[0] - c1[0]) * t);
  const g = Math.round(c1[1] + (c2[1] - c1[1]) * t);
  const _b = Math.round(c1[2] + (c2[2] - c1[2]) * t); // _b to avoid blocking scope variable 'b'
  const alpha = (c1[3] + (c2[3] - c1[3]) * t);

  return `rgba(${r}, ${g}, ${_b}, ${alpha})`;
};

const GameCanvas: React.FC<GameCanvasProps> = ({ gameState, setGameState, setScore, setLives, setSynergy, setIsSynergyActive, setDeathCause, showTutorial }) => {
  const { isPortrait } = useDeviceOrientation();
  const config = isPortrait ? PORTRAIT_CONFIG : LANDSCAPE_CONFIG;
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);

  const dimensionsRef = useRef({ width: 800, height: 400, groundY: 320 });
  const [guideVisible, setGuideVisible] = useState(showTutorial);
  const prevGameState = useRef(gameState);

  const scoreRef = useRef(0);
  const speedRef = useRef(isPortrait ? PORTRAIT_CONFIG.baseSpeed : LANDSCAPE_CONFIG.baseSpeed);
  const framesRef = useRef(0);
  const lastTimeRef = useRef<number>(0);
  const animTimeRef = useRef<number>(0);
  const shakeRef = useRef(0);
  const stageRef = useRef(0);
  const livesRef = useRef(INITIAL_LIVES);
  const invincibleFramesRef = useRef(0);
  const subliminalTimerRef = useRef(0);
  const lastMilestoneLevelRef = useRef(0);

  // Biome State
  const currentBiomeIndexRef = useRef(0);
  const nextBiomeIndexRef = useRef(0);
  const biomeTransitionRef = useRef(0); // 0.0 to 1.0

  // Synergy System Refs
  const synergyMeterRef = useRef(0);
  const synergyActiveFramesRef = useRef(0);
  const totalCreditsCollectedRef = useRef(0);
  const sessionCreditsRef = useRef(0);

  // Laser Cooldown
  const laserCooldownRef = useRef(0);
  const creditsSinceLastReductionRef = useRef(0);

  // Input State Refs
  const isJumpingInputActive = useRef(false);
  const isDuckingInputActive = useRef(false);

  const playerRef = useRef<PlayerState>({
    y: 0,
    vy: 0,
    isDucking: false,
    isGrounded: true,
    lane: 1,
    laneX: 0,
    altitude: 0
  });

  // Portrait Mode Refs
  const laneRef = useRef(1);
  const laneXRef = useRef(0);
  const altitudeRef = useRef(0);
  const portraitSpeedRef = useRef(PORTRAIT_CONFIG.baseSpeed);

  const obstaclesRef = useRef<GameObject[]>([]);
  const creditsRef = useRef<Credit[]>([]);
  const lasersRef = useRef<Laser[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const starsRef = useRef<Star[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const lastLaneXRef = useRef(0);

  const touchStartRef = useRef<{ y: number } | null>(null);
  const SWIPE_THRESHOLD = 30;

  const triggersRef = useRef<string[]>(["OBEY", "WORK", "CONSUME"]);
  const activeSubliminalRef = useRef<{ text: string, opacity: number, x: number, y: number, scale: number } | null>(null);
  const isSwipeActionActive = useRef(false);
  const lastTapTimeRef = useRef(0);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current && canvasRef.current) {
        const { offsetWidth, offsetHeight } = containerRef.current;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvasRef.current.width = offsetWidth * dpr;
        canvasRef.current.height = offsetHeight * dpr;
        canvasRef.current.style.width = `${offsetWidth}px`;
        canvasRef.current.style.height = `${offsetHeight}px`;
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) ctx.scale(dpr, dpr);
        const newGroundY = offsetHeight - 80;
        dimensionsRef.current = { width: offsetWidth, height: offsetHeight, groundY: newGroundY };
        if (playerRef.current.isGrounded) playerRef.current.y = newGroundY - PLAYER_HEIGHT_STANDING;
        if (starsRef.current.length === 0) {
          const stars: Star[] = [];
          for (let i = 0; i < 150; i++) {
            stars.push({ x: Math.random() * offsetWidth, y: Math.random() * offsetHeight, size: Math.random() * 2, speed: 0.1 + Math.random() * 0.8, opacity: 0.2 + Math.random() * 0.8 });
          }
          starsRef.current = stars;
        }
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    generatePsychologicalTriggers().then(words => {
      if (words && words.length > 0) triggersRef.current = words;
    });
  }, []);

  useEffect(() => {
    setGuideVisible(showTutorial);
  }, [showTutorial, gameState]);

  useEffect(() => {
    speedRef.current = config.baseSpeed;
    lastMilestoneLevelRef.current = 0;
  }, [isPortrait]);

  const startJump = useCallback(() => {
    if (gameState !== GameState.PLAYING) return;
    setGuideVisible(false);
    if (playerRef.current.isGrounded) {
      playerRef.current.vy = config.jumpForce;
      playerRef.current.isGrounded = false;
      createParticles(PLAYER_X + PLAYER_WIDTH / 2, playerRef.current.y + PLAYER_HEIGHT_STANDING, 8, COLORS.NEON_BLUE);
      soundService.playJump();
    }
  }, [gameState]);

  const endJump = useCallback(() => {
    if (gameState !== GameState.PLAYING) return;
    if (!isPortrait && !playerRef.current.isGrounded && playerRef.current.vy < -5) playerRef.current.vy = playerRef.current.vy * 0.4;
  }, [gameState, isPortrait]);

  const startDuck = useCallback(() => {
    if (gameState !== GameState.PLAYING) return;
    if (!playerRef.current.isDucking) soundService.playDuck();
    setGuideVisible(false);
    playerRef.current.isDucking = true;
    if (!playerRef.current.isGrounded) playerRef.current.vy += 10;
  }, [gameState]);

  const endDuck = useCallback(() => {
    if (gameState !== GameState.PLAYING) return;
    playerRef.current.isDucking = false;
  }, [gameState]);

  const moveLeft = useCallback(() => {
    if (gameState !== GameState.PLAYING) return;
    setGuideVisible(false);
    if (laneRef.current > 0) laneRef.current--;
  }, [gameState]);

  const moveRight = useCallback(() => {
    if (gameState !== GameState.PLAYING) return;
    setGuideVisible(false);
    if (laneRef.current < PORTRAIT_LANE_COUNT - 1) laneRef.current++;
  }, [gameState]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') isJumpingInputActive.current = true;
      if (e.code === 'ArrowDown') isDuckingInputActive.current = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') { isJumpingInputActive.current = false; endJump(); }
      if (e.code === 'ArrowDown') { isDuckingInputActive.current = false; endDuck(); }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [startJump, endJump, startDuck, endDuck]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = { y: e.touches[0].clientY };
    isSwipeActionActive.current = false;

    if (isPortrait) {
      const now = Date.now();
      if (now - lastTapTimeRef.current < 300) {
        // Double Tap Detected
        console.log("Double Tap Laser Triggered!");
        fireLaser();
        lastTapTimeRef.current = 0; // Reset to prevent triple-tap firing
        return;
      }
      lastTapTimeRef.current = now;

      const { width } = dimensionsRef.current;
      const touchX = e.touches[0].clientX;
      if (touchX < width / 2) moveLeft();
      else moveRight();
    } else {
      isJumpingInputActive.current = true;
      isDuckingInputActive.current = false;
    }
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const diffY = e.touches[0].clientY - touchStartRef.current.y;

    if (isPortrait) {
      if (diffY < -SWIPE_THRESHOLD) { // Swipe Up -> Laser REMOVED, now Double Tap
        // Double tap handled in touchStart, swipe up does nothing or maybe shield later?
      } else if (diffY > SWIPE_THRESHOLD) { // Swipe Down -> Duck
        startDuck();
      }
    } else {
      if (diffY > SWIPE_THRESHOLD) {
        isDuckingInputActive.current = true;
        isJumpingInputActive.current = false;
      } else {
        isJumpingInputActive.current = true;
        isDuckingInputActive.current = false;
      }
    }
  };
  const handleTouchEnd = () => {
    touchStartRef.current = null;
    isJumpingInputActive.current = false;
    isDuckingInputActive.current = false;
    endJump();
    endDuck();
  };

  const handleMouseDown = () => { isJumpingInputActive.current = true; };
  const handleMouseUp = () => { isJumpingInputActive.current = false; endJump(); };
  const handleMouseLeave = () => { isJumpingInputActive.current = false; endJump(); };

  const createParticles = (x: number, y: number, count: number, color: string) => {
    for (let i = 0; i < count; i++) {
      particlesRef.current.push({ x, y, vx: (Math.random() - 0.5) * 10, vy: (Math.random() - 0.5) * 10, life: 1.0, color });
    }
  };

  const createFloatingText = (x: number, y: number, text: string, color: string, fontSize: number = 20) => {
    floatingTextsRef.current.push({ x, y, text, color, life: 1.0, vy: -2, fontSize });
  };

  const fireLaser = useCallback(() => {
    if (gameState !== GameState.PLAYING) return;
    setGuideVisible(false);

    // Cooldown Check
    if (laserCooldownRef.current > 0) return;

    soundService.playLaser();

    // Set Cooldown
    laserCooldownRef.current = LASER_COOLDOWN_FRAMES;

    // Instant Beam - ALL LANES
    for (let l = 0; l < PORTRAIT_LANE_COUNT; l++) {
      lasersRef.current.push({
        id: Math.random().toString(36),
        lane: l,
        life: 15,
        maxLife: 15
      });
    }

    // Instant Collision Check (Hitscan) - ALL LANES
    // Destroy all obstacles in ANY lane (or valid lanes)
    let hitCount = 0;
    obstaclesRef.current.forEach(obs => {
      if (obs.shattered || obs.passed) return;

      // Hit everything in portrait logic since we blast all lanes
      // Technically we should check if it's within lane bounds if we want to be pedantic,
      // but "zap all 3 lanes" implies screen wipe for obstacles in those lanes.
      obs.shattered = true;
      createParticles(obs.x + obs.width / 2, obs.y + obs.height / 2, 15, COLORS.NEON_CYAN);
      shakeRef.current = 5;
      hitCount++;
    });

    if (hitCount > 0) {
      soundService.playCollision(ObstacleType.DRONE_LOW);
    }

  }, [gameState]);

  const spawnObstacle = () => {
    const { width, groundY, height } = dimensionsRef.current;

    let type = ObstacleType.DRONE_LOW;
    let x = 0;
    let y = 0;
    let w = 40;
    let h = 40;

    if (isPortrait) {
      // Portrait Spawning Logic
      const typeRoll = Math.random();

      // In portrait, types mean:
      // DRONE_LOW = Ground Obstacle
      // DRONE_HIGH = Aerial Obstacle (fly over head if ducking? or simple fly over?)
      // For top down, maybe "High" means it obscures vision or you must duck to go under a beam?

      const isSynergy = synergyActiveFramesRef.current > 0;
      if (typeRoll > (1 - (isSynergy ? config.lifePackSynergyChance : config.lifePackBaseChance))) type = ObstacleType.LIFE_PACK;
      else if (typeRoll > 0.7) type = ObstacleType.HOVER_MINE;
      else if (typeRoll > 0.4) type = ObstacleType.DRONE_HIGH;
      else type = ObstacleType.DRONE_LOW;

      const lane = Math.floor(Math.random() * PORTRAIT_LANE_COUNT);
      const laneWidth = width * (PORTRAIT_LANE_WIDTH_PERCENT / 100);
      x = (lane * laneWidth) + (laneWidth / 2) - (PORTRAIT_PLAYER_SIZE / 2);
      y = -100; // Start above screen
      w = PORTRAIT_PLAYER_SIZE;
      h = PORTRAIT_PLAYER_SIZE;

      obstaclesRef.current.push({
        x, y, width: w, height: h, type, passed: false, lane
      } as any);

      // Portrait Credits - Smart Spawning
      if (Math.random() < config.creditSpawnChance) {
        const clusterCount = 2 + Math.floor(Math.random() * 2);
        // Spawn in DIFFERENT lane to avoid stacking behind obstacles
        let creditLane = lane;
        // Try to find a safe adjacent lane
        if (lane === 0) creditLane = 1;
        else if (lane === PORTRAIT_LANE_COUNT - 1) creditLane = PORTRAIT_LANE_COUNT - 2;
        else creditLane = Math.random() > 0.5 ? lane - 1 : lane + 1;

        const creditX = (creditLane * laneWidth) + (laneWidth / 2) - 4; // Center in new lane

        for (let i = 0; i < clusterCount; i++) {
          creditsRef.current.push({
            id: Math.random().toString(36),
            x: creditX,
            y: y - 50 - (i * 40), // Spread out vertically
            collected: false
          });
        }
      }

    } else {
      // Landscape Spawning Logic
      const typeRoll = Math.random();
      y = groundY - h;

      const isSynergy = synergyActiveFramesRef.current > 0;
      if (typeRoll > (1 - (isSynergy ? config.lifePackSynergyChance : config.lifePackBaseChance))) { type = ObstacleType.LIFE_PACK; w = 30; h = 30; y = groundY - 40; }
      else if (typeRoll > 0.7) { type = ObstacleType.HOVER_MINE; w = 30; h = 30; y = groundY - 50 - Math.random() * 60; }
      else if (typeRoll > 0.4) { type = ObstacleType.DRONE_HIGH; y = groundY - 110; w = 50; h = 30; }
      else { type = ObstacleType.DRONE_LOW; w = 35; h = 35; y = groundY - h; }

      x = width + 100;

      obstaclesRef.current.push({ x, y, width: w, height: h, type, passed: false, frameOffset: Math.random() * 100 });

      // Landscape Credits
      if (Math.random() < config.creditSpawnChance) {
        const clusterCount = 3 + Math.floor(Math.random() * 3);
        const startX = width + 150;
        for (let i = 0; i < clusterCount; i++) {
          creditsRef.current.push({
            id: Math.random().toString(36),
            x: startX + (i * 40),
            y: type === ObstacleType.DRONE_HIGH ? groundY - 20 : y - 20 - (Math.random() * 40),
            collected: false
          });
        }
      }
    }
  };

  const resetGame = () => {
    const { groundY } = dimensionsRef.current;
    scoreRef.current = 0;
    speedRef.current = config.baseSpeed;
    framesRef.current = 0;
    shakeRef.current = 0;
    stageRef.current = 0;
    livesRef.current = INITIAL_LIVES;
    invincibleFramesRef.current = 0;
    synergyMeterRef.current = 0;
    synergyActiveFramesRef.current = 0;
    sessionCreditsRef.current = 0;
    obstaclesRef.current = [];
    creditsRef.current = [];
    lasersRef.current = [];
    particlesRef.current = [];
    playerRef.current = {
      y: groundY - PLAYER_HEIGHT_STANDING,
      vy: 0,
      isDucking: false,
      isGrounded: true,
      lane: 1,
      laneX: dimensionsRef.current.width / 2,
      altitude: 0
    };
    laneRef.current = 1;
    laneXRef.current = dimensionsRef.current.width / 2;
    altitudeRef.current = 0;
    setScore(0);
    setLives(INITIAL_LIVES);
    setSynergy(0);
  };

  const update = useCallback((relativeDelta: number) => {
    if (gameState !== GameState.PLAYING) return;
    const { width, height, groundY } = dimensionsRef.current;

    // Input Handling
    if (isJumpingInputActive.current && playerRef.current.isGrounded) startJump();
    if (isDuckingInputActive.current && !playerRef.current.isDucking) startDuck();

    const synergyMultiplier = synergyActiveFramesRef.current > 0 ? 1.5 : 1;

    // Time Scale Calculation
    // Scale = 1 + (Score / Milestone) * Increment
    const timeScale = 1 + (Math.floor(scoreRef.current / config.speedMilestone) * config.timeScaleIncrement);

    // Cap timeScale indirectly via maxSpeed if needed? 
    // Or just let it run? Let's cap max effective speed.
    // effectiveSpeed = base * timeScale.
    // if effectiveSpeed > maxSpeed -> cap timeScale.
    const effectiveSpeed = config.baseSpeed * timeScale;
    const actualTimeScale = effectiveSpeed > config.maxSpeed ? (config.maxSpeed / config.baseSpeed) : timeScale;

    // Apply Time Scale to global Speed Ref (used for scrolling)
    speedRef.current = config.baseSpeed * actualTimeScale;

    // Check Milestone for Sound/Visuals ONLY
    const currentMilestoneLevel = Math.floor(scoreRef.current / config.speedMilestone);
    if (currentMilestoneLevel > lastMilestoneLevelRef.current) {
      lastMilestoneLevelRef.current = currentMilestoneLevel;
      soundService.playSynergyStart();
      activeSubliminalRef.current = { text: "SPEED UP", opacity: 1, x: width / 2, y: height / 2, scale: 2 };
    }

    // setScore(Math.floor(scoreRef.current)); // Logic moved to credit collection?
    // Actually, setScore should be called whenever scoreRef changes.
    // Since score only changes on collection, we can just call setScore loop in case? 
    // Or better, let's keep setScore here to sync refs to state, but scoreRef won't change unless events happen.
    setScore(Math.floor(scoreRef.current));
    framesRef.current += relativeDelta;
    shakeRef.current = Math.max(0, shakeRef.current - 0.5 * relativeDelta);

    if (invincibleFramesRef.current > 0) invincibleFramesRef.current = Math.max(0, invincibleFramesRef.current - relativeDelta);

    // Laser Cooldown Logic
    if (laserCooldownRef.current > 0) {
      laserCooldownRef.current = Math.max(0, laserCooldownRef.current - relativeDelta);
    }

    if (synergyActiveFramesRef.current > 0) {
      synergyActiveFramesRef.current -= relativeDelta;
      setSynergy((synergyActiveFramesRef.current / SYNERGY_DURATION) * 100);
      if (synergyActiveFramesRef.current <= 0) {
        synergyMeterRef.current = 0;
        setSynergy(0);
        setIsSynergyActive(false);
      }
    }

    const currentScore = Math.floor(scoreRef.current);

    // Biome Logic
    const maxBiome = BIOMES.length - 1;
    if (currentBiomeIndexRef.current < maxBiome) {
      const nextBiome = BIOMES[currentBiomeIndexRef.current + 1];
      if (currentScore >= nextBiome.threshold) {
        if (nextBiomeIndexRef.current === currentBiomeIndexRef.current) {
          nextBiomeIndexRef.current = currentBiomeIndexRef.current + 1;
        }
      }
    }

    // Handle Transition
    if (nextBiomeIndexRef.current > currentBiomeIndexRef.current) {
      biomeTransitionRef.current += 0.01 * relativeDelta; // Transition speed
      if (biomeTransitionRef.current >= 1) {
        biomeTransitionRef.current = 0;
        currentBiomeIndexRef.current = nextBiomeIndexRef.current;
      }
    }

    stageRef.current = currentBiomeIndexRef.current; // Sync legacy stage ref

    // Subliminal Text Trigger Logic
    subliminalTimerRef.current += relativeDelta;
    if (subliminalTimerRef.current >= 180 && Math.random() > 0.4) {
      subliminalTimerRef.current = 0; // Reset timer
      const word = triggersRef.current[Math.floor(Math.random() * triggersRef.current.length)];
      activeSubliminalRef.current = { text: word, opacity: 0.1 + (speedRef.current / config.maxSpeed) * 0.5, x: width / 2, y: height / 2, scale: 1 };
      shakeRef.current += 3;
    } else if (subliminalTimerRef.current >= 180) {
      subliminalTimerRef.current = 0; // Reset anyway if random check failed, to prevent rapid firing
    }

    if (activeSubliminalRef.current) {
      activeSubliminalRef.current.opacity -= 0.02 * relativeDelta;
      activeSubliminalRef.current.scale += 0.01 * relativeDelta;
      if (activeSubliminalRef.current.opacity <= 0) activeSubliminalRef.current = null;
    }

    starsRef.current.forEach(star => {
      if (isPortrait) {
        star.y += speedRef.current * star.speed * relativeDelta; // Stars move down
        if (star.y > height) { star.y = -10; star.x = Math.random() * width; }
      } else {
        star.x -= speedRef.current * star.speed * relativeDelta;
        if (star.x < 0) { star.x = width + Math.random() * 50; star.y = Math.random() * height; }
      }
    });

    const player = playerRef.current;

    if (isPortrait) {
      // --- PORTRAIT PHYSICS ---

      // 1. Lane Movement smoothing
      const laneWidth = width * (PORTRAIT_LANE_WIDTH_PERCENT / 100);
      const targetX = (laneRef.current * laneWidth) + (laneWidth / 2);
      // Lerp adjustment for delta time: approximate
      player.laneX = player.laneX ? player.laneX + (targetX - player.laneX) * (0.2 * relativeDelta) : targetX;

      // Dash Trail Effect
      if (Math.abs(player.laneX - lastLaneXRef.current) > 5) {
        const playerY = height - PORTRAIT_PLAYER_Y_OFFSET;
        createParticles(lastLaneXRef.current, playerY + PORTRAIT_PLAYER_SIZE / 2, 3, COLORS.NEON_CYAN);
      }
      lastLaneXRef.current = player.laneX;

      // 2. Altitude Physics (Jump) using standard gravity
      // Apply timeScale to gravity and velocity integration
      player.vy += config.gravity * actualTimeScale * relativeDelta;
      player.altitude = (player.altitude || 0) - (player.vy * actualTimeScale * relativeDelta);
      // In landscape, ground is high Y, jump decreases Y. So Y += vy makes sense.
      // Here, altitude is height ABOVE ground. So velocity should be subtracted? 
      // Jump force is -22. So negative vy means moving UP in landscape (smaller Y). 
      // So for altitude: altitude should INCREASE when vy is negative.
      // So altitude -= vy.
      // Gravity increases vy (makes it positive). So altitude decreases. Correct.

      if (player.altitude < 0) {
        player.altitude = 0;
        player.vy = 0;
        player.isGrounded = true;
      }

      // 2.5 Laser Logic (Beam Duration)
      for (let i = lasersRef.current.length - 1; i >= 0; i--) {
        const laser = lasersRef.current[i];
        laser.life -= relativeDelta;
        if (laser.life <= 0) {
          lasersRef.current.splice(i, 1);
        }
      }

      // 3. Obstacle Logic
      const minDistance = 200 + (speedRef.current * 2);
      if (!obstaclesRef.current[obstaclesRef.current.length - 1] || (obstaclesRef.current[obstaclesRef.current.length - 1].y > minDistance)) {
        // Spawn rate adjusted for delta time
        if (Math.random() < ((config.obstacleSpawnRate + stageRef.current * 0.05) * relativeDelta)) spawnObstacle();
      }

      for (let i = obstaclesRef.current.length - 1; i >= 0; i--) {
        const obs = obstaclesRef.current[i];
        if (obs.shattered) {
          obs.y += speedRef.current * relativeDelta; // Move shattered pieces down
          if (obs.y > height + 50) obstaclesRef.current.splice(i, 1);
          continue;
        }
        obs.y += speedRef.current * relativeDelta;

        // Collision Detection
        const playerY = height - PORTRAIT_PLAYER_Y_OFFSET;
        const playerSize = PORTRAIT_PLAYER_SIZE;

        // Simple lane check first
        const laneMatch = Math.abs(obs.x + obs.width / 2 - player.laneX!) < (laneWidth / 2); // Rough lane check or exact lane matches?
        // Better: Check rect intersection + Z 

        // Obstacle Rect
        const obsRect = { l: obs.x, r: obs.x + obs.width, t: obs.y, b: obs.y + obs.height };
        // Player Rect
        const playRect = {
          l: player.laneX! - playerSize / 2 + 10,
          r: player.laneX! + playerSize / 2 - 10,
          t: playerY + 10,
          b: playerY + playerSize - 10
        };

        let collided = !(obsRect.r < playRect.l || obsRect.l > playRect.r || obsRect.b < playRect.t || obsRect.t > playRect.b);

        if (collided) {
          // Check Z-axis / State
          if (obs.type === ObstacleType.DRONE_LOW) {
            // Jump over
            if (player.altitude! > 40) collided = false;
          } else if (obs.type === ObstacleType.DRONE_HIGH) {
            // Duck under
            if (player.isDucking) collided = false;
          }
        }

        if (collided) {
          if (obs.type === ObstacleType.LIFE_PACK) {
            obs.shattered = true;
            if (livesRef.current < INITIAL_LIVES) {
              livesRef.current++;
              setLives(livesRef.current);
              soundService.playLifeUp();
              createParticles(obs.x + obs.width / 2, obs.y + obs.height / 2, 20, COLORS.NEON_GREEN);
              createFloatingText(obs.x + obs.width / 2, obs.y, "+1 LIFE", COLORS.NEON_GREEN, 24);
            } else {
              scoreRef.current += 1000;
              soundService.playScore();
              createParticles(obs.x + obs.width / 2, obs.y + obs.height / 2, 10, COLORS.NEON_BLUE);
              createFloatingText(obs.x + obs.width / 2, obs.y, "+1000", COLORS.NEON_BLUE, 28);
            }
            return;
          }

          if (synergyActiveFramesRef.current > 0) {
            obs.shattered = true;
            scoreRef.current += 500;
            createParticles(obs.x + obs.width / 2, obs.y + obs.height / 2, 20, COLORS.SYNERGY_WHITE);
            createFloatingText(obs.x + obs.width / 2, obs.y, "+500", COLORS.SYNERGY_WHITE, 26);
            soundService.playScore();
            shakeRef.current = 5;
            continue;
          }

          if (invincibleFramesRef.current === 0) {
            soundService.playCollision(obs.type);
            createParticles(player.laneX!, playerY, 30, COLORS.NEON_RED);
            shakeRef.current = 25;
            if (livesRef.current > 1) {
              livesRef.current--; setLives(livesRef.current);
              invincibleFramesRef.current = INVINCIBILITY_FRAMES;
              soundService.playRespawn();
              // In portrait, maybe clear nearby obstacles?
              obstaclesRef.current.forEach(o => { if (Math.abs(o.y - playerY) < 300) o.shattered = true; });
            } else {
              livesRef.current = 0; setLives(0);
              setDeathCause(Math.floor(scoreRef.current), "OPERATIONAL ERROR");
              setGameState(GameState.GAME_OVER);
            }
            return;
          }
        }

        if (!obs.passed && obs.y > playerY + playerSize) {
          obs.passed = true;
        }
        if (obs.y > height + 100) obstaclesRef.current.splice(i, 1);
      }

      // Credits Update
      for (let i = creditsRef.current.length - 1; i >= 0; i--) {
        const c = creditsRef.current[i];
        c.y += speedRef.current * relativeDelta;

        const playerY = height - PORTRAIT_PLAYER_Y_OFFSET;
        const dist = Math.sqrt(Math.pow(c.x - player.laneX!, 2) + Math.pow(c.y - playerY, 2));

        if (dist < 30 && !c.collected) {
          c.collected = true;
          soundService.playCredit();
          sessionCreditsRef.current++;
          const creditScore = CREDIT_SCORE_VALUE * synergyMultiplier;
          scoreRef.current += creditScore;
          createFloatingText(c.x, c.y, `+${Math.floor(creditScore)}`, synergyMultiplier > 1 ? COLORS.SYNERGY_WHITE : COLORS.NEON_CYAN, 18);
          // ...Synergy logic (same as landscape)
          if (synergyActiveFramesRef.current === 0) {
            synergyMeterRef.current += SYNERGY_CREDIT_VALUE;
            setSynergy(synergyMeterRef.current);
            if (synergyMeterRef.current >= 100) {
              synergyActiveFramesRef.current = SYNERGY_DURATION;
              setIsSynergyActive(true);
              soundService.playSynergyStart();
              createFloatingText(width / 2, height / 2, "SYNERGY!", COLORS.SYNERGY_WHITE, 48);
              shakeRef.current = 10;
            }
          }
          // Laser Cooldown Reduction Logic
          if (laserCooldownRef.current > 0) {
            creditsSinceLastReductionRef.current++;
            if (creditsSinceLastReductionRef.current >= 2) {
              creditsSinceLastReductionRef.current = 0;
              laserCooldownRef.current = Math.max(0, laserCooldownRef.current - LASER_COOLDOWN_REDUCTION);
            }
          }

          if (sessionCreditsRef.current >= LIFE_RECOVERY_THRESHOLD) {
            sessionCreditsRef.current = 0;
            if (livesRef.current < INITIAL_LIVES) {
              livesRef.current++;
              setLives(livesRef.current);
              soundService.playLifeUp();
            }
          }
        }
        if (c.y > height + 50 || c.collected) creditsRef.current.splice(i, 1);
      }

    } else {
      // --- LANDSCAPE PHYSICS (Existing) ---
      player.vy += config.gravity * actualTimeScale * relativeDelta;
      player.y += player.vy * actualTimeScale * relativeDelta;
      const currentHeight = player.isDucking ? PLAYER_HEIGHT_DUCKING : PLAYER_HEIGHT_STANDING;
      const playerGround = groundY - currentHeight;
      if (player.y > playerGround) { player.y = playerGround; player.vy = 0; player.isGrounded = true; }

      const minDistance = 300 + (speedRef.current * 10);
      if (!obstaclesRef.current[obstaclesRef.current.length - 1] || (width - obstaclesRef.current[obstaclesRef.current.length - 1].x > minDistance)) {
        if (Math.random() < ((config.obstacleSpawnRate + stageRef.current * 0.05) * relativeDelta)) spawnObstacle();
      }

      // Credits Update
      for (let i = creditsRef.current.length - 1; i >= 0; i--) {
        const c = creditsRef.current[i];
        c.x -= speedRef.current * relativeDelta;
        const dist = Math.sqrt(Math.pow(c.x - (PLAYER_X + PLAYER_WIDTH / 2), 2) + Math.pow(c.y - (player.y + currentHeight / 2), 2));
        if (dist < 40 && !c.collected) {
          c.collected = true;
          soundService.playCredit();
          sessionCreditsRef.current++;
          const creditScore = CREDIT_SCORE_VALUE * synergyMultiplier;
          scoreRef.current += creditScore;
          createFloatingText(c.x, c.y, `+${Math.floor(creditScore)}`, synergyMultiplier > 1 ? COLORS.SYNERGY_WHITE : COLORS.NEON_CYAN, 18);

          // Synergy Meter
          if (synergyActiveFramesRef.current === 0) {
            synergyMeterRef.current += SYNERGY_CREDIT_VALUE;
            setSynergy(synergyMeterRef.current);
            if (synergyMeterRef.current >= 100) {
              synergyActiveFramesRef.current = SYNERGY_DURATION;
              setIsSynergyActive(true);
              soundService.playSynergyStart();
              createFloatingText(width / 2, height / 2, "SYNERGY!", COLORS.SYNERGY_WHITE, 48);
              shakeRef.current = 10;
            }
          }

          // Laser Cooldown Reduction Logic
          if (laserCooldownRef.current > 0) {
            creditsSinceLastReductionRef.current++;
            if (creditsSinceLastReductionRef.current >= 2) {
              creditsSinceLastReductionRef.current = 0;
              laserCooldownRef.current = Math.max(0, laserCooldownRef.current - LASER_COOLDOWN_REDUCTION);
            }
          }

          // Life Recovery
          if (sessionCreditsRef.current >= LIFE_RECOVERY_THRESHOLD) {
            sessionCreditsRef.current = 0;
            if (livesRef.current < INITIAL_LIVES) {
              livesRef.current++;
              setLives(livesRef.current);
              soundService.playLifeUp();
            }
          }
        }
        if (c.x < -100 || c.collected) creditsRef.current.splice(i, 1);
      }

      // Obstacles Update
      for (let i = obstaclesRef.current.length - 1; i >= 0; i--) {
        const obs = obstaclesRef.current[i];
        if (obs.shattered) {
          obs.x -= speedRef.current * relativeDelta;
          if (obs.x < -150) obstaclesRef.current.splice(i, 1);
          continue;
        }
        obs.x -= speedRef.current * relativeDelta;

        const pBox = { l: PLAYER_X + 10, r: PLAYER_X + PLAYER_WIDTH - 10, t: player.y + 5, b: player.y + currentHeight - 5 };
        const oBox = { l: obs.x, r: obs.x + obs.width, t: obs.y, b: obs.y + obs.height };
        let collided = pBox.r > oBox.l && pBox.l > oBox.r === false && pBox.b > oBox.t && pBox.t < oBox.b;

        if (!collided && obs.type === ObstacleType.DRONE_HIGH && !player.isDucking && PLAYER_X > obs.x - 120 && PLAYER_X < obs.x + obs.width) collided = true;

        if (collided) {
          if (synergyActiveFramesRef.current > 0) {
            obs.shattered = true;
            scoreRef.current += 500;
            createParticles(obs.x + obs.width / 2, obs.y + obs.height / 2, 20, COLORS.SYNERGY_WHITE);
            createFloatingText(obs.x + obs.width / 2, obs.y, "+500", COLORS.SYNERGY_WHITE, 26);
            soundService.playScore();
            shakeRef.current = 5;
            continue;
          }

          if (obs.type === ObstacleType.LIFE_PACK) {
            obs.shattered = true;
            if (livesRef.current < INITIAL_LIVES) {
              livesRef.current++;
              setLives(livesRef.current);
              soundService.playLifeUp();
              createParticles(obs.x + obs.width / 2, obs.y + obs.height / 2, 20, COLORS.NEON_GREEN);
              createFloatingText(obs.x + obs.width / 2, obs.y, "+1 LIFE", COLORS.NEON_GREEN, 24);
            } else {
              scoreRef.current += 1000;
              soundService.playScore();
              createParticles(obs.x + obs.width / 2, obs.y + obs.height / 2, 10, COLORS.NEON_BLUE);
              createFloatingText(obs.x + obs.width / 2, obs.y, "+1000", COLORS.NEON_BLUE, 28);
            }
            return;
          }

          if (invincibleFramesRef.current === 0) {
            soundService.playCollision(obs.type);
            createParticles(PLAYER_X, player.y, 30, COLORS.NEON_RED);
            shakeRef.current = 25;
            if (livesRef.current > 1) {
              livesRef.current--; setLives(livesRef.current);
              invincibleFramesRef.current = INVINCIBILITY_FRAMES;
              soundService.playRespawn();
              obstaclesRef.current.forEach(o => { if (o.x < width / 2) o.x -= width; });
            } else {
              livesRef.current = 0; setLives(0);
              setDeathCause(Math.floor(scoreRef.current), "OPERATIONAL ERROR");
              setGameState(GameState.GAME_OVER);
            }
            return;
          }
        }

        if (!obs.passed && obs.x + obs.width < PLAYER_X) { obs.passed = true; }
        if (obs.x < -150) obstaclesRef.current.splice(i, 1);
      }
    }

    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
      const p = particlesRef.current[i];
      p.x += p.vx * relativeDelta;
      p.y += p.vy * relativeDelta;
      p.life -= 0.05 * relativeDelta;
      if (p.life <= 0) particlesRef.current.splice(i, 1);
    }

    // Floating Text Update
    for (let i = floatingTextsRef.current.length - 1; i >= 0; i--) {
      const t = floatingTextsRef.current[i];
      t.y += t.vy * relativeDelta;
      t.life -= 0.015 * relativeDelta;
      if (t.life <= 0) floatingTextsRef.current.splice(i, 1);
    }
  }, [gameState, setScore, setGameState, setDeathCause, setLives, setSynergy, setIsSynergyActive]);

  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    const { width, height, groundY } = dimensionsRef.current;
    const isSynergy = synergyActiveFramesRef.current > 0;

    // --- BIOME PALETTE CALCULATION ---
    const currentBiome = BIOMES[currentBiomeIndexRef.current];
    const nextBiome = BIOMES[nextBiomeIndexRef.current];
    const t = biomeTransitionRef.current;

    const p = {
      background: t <= 0 ? currentBiome.palette.background : (t >= 1 ? nextBiome.palette.background : lerpColor(currentBiome.palette.background, nextBiome.palette.background, t)),
      grid: t <= 0 ? currentBiome.palette.grid : (t >= 1 ? nextBiome.palette.grid : lerpColor(currentBiome.palette.grid, nextBiome.palette.grid, t)),
      gridHighlight: t <= 0 ? currentBiome.palette.gridHighlight : (t >= 1 ? nextBiome.palette.gridHighlight : lerpColor(currentBiome.palette.gridHighlight, nextBiome.palette.gridHighlight, t)),
      text: t <= 0 ? currentBiome.palette.text : (t >= 1 ? nextBiome.palette.text : lerpColor(currentBiome.palette.text, nextBiome.palette.text, t)),
      obstacle: t <= 0 ? currentBiome.palette.obstacle : (t >= 1 ? nextBiome.palette.obstacle : lerpColor(currentBiome.palette.obstacle, nextBiome.palette.obstacle, t)),
      particlePrimary: t <= 0 ? currentBiome.palette.particlePrimary : (t >= 1 ? nextBiome.palette.particlePrimary : lerpColor(currentBiome.palette.particlePrimary, nextBiome.palette.particlePrimary, t)),
      particleSecondary: t <= 0 ? currentBiome.palette.particleSecondary : (t >= 1 ? nextBiome.palette.particleSecondary : lerpColor(currentBiome.palette.particleSecondary, nextBiome.palette.particleSecondary, t)),
    };

    const gridType = t > 0.5 ? nextBiome.atmosphere.gridType : currentBiome.atmosphere.gridType;

    ctx.save();
    ctx.translate((Math.random() - 0.5) * shakeRef.current, (Math.random() - 0.5) * shakeRef.current);

    // Background Fill
    ctx.fillStyle = p.background;
    ctx.fillRect(-20, -20, width + 40, height + 40);

    // --- DYNAMIC BACKGROUND GRID ---
    ctx.lineWidth = 1;
    const gridSize = 60;
    const scroll = (framesRef.current * speedRef.current * 0.8);

    if (gridType === 'hex') {
      // HEXAGONAL GRID (For Logistics/Management)
      const hexTime = animTimeRef.current;
      for (let i = 0; i < 5; i++) {
        const hx = (width * 0.2 * i + hexTime * 50) % width;
        const hy = (height * 0.3 * i + Math.sin(hexTime + i) * 50) % height;
        ctx.strokeStyle = p.gridHighlight;
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let j = 0; j < 6; j++) {
          const ang = j * Math.PI / 3;
          const rx = hx + Math.cos(ang) * 30;
          const ry = hy + Math.sin(ang) * 30;
          if (j === 0) ctx.moveTo(rx, ry); else ctx.lineTo(rx, ry);
        }
        ctx.closePath(); ctx.stroke();
      }

      ctx.strokeStyle = p.grid; ctx.lineWidth = 1;
      const gridOffset = scroll % gridSize;
      if (isPortrait) {
        for (let y = -gridOffset; y < height; y += gridSize) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke(); }
      } else {
        for (let x = -gridOffset; x < width; x += gridSize) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke(); }
      }

    } else if (gridType === 'digital') {
      // DIGITAL/MATRIX RAIN
      ctx.fillStyle = p.grid;
      const colWidth = 20;
      const numCols = Math.ceil(width / colWidth);
      for (let i = 0; i < numCols; i++) {
        if (i % 3 === 0) {
          const streamY = (framesRef.current * (speedRef.current * 0.5 + Math.sin(i) * 2)) % (height + 200) - 100;
          ctx.fillRect(i * colWidth, streamY, 2, 40);
          if (Math.random() > 0.98) {
            ctx.fillStyle = p.gridHighlight;
            ctx.fillText(Math.random() > 0.5 ? "1" : "0", i * colWidth, streamY + 50);
            ctx.fillStyle = p.grid;
          }
        }
      }
      ctx.strokeStyle = p.grid; ctx.lineWidth = 1;
      const gridOffset = scroll % gridSize;
      if (isPortrait) {
        for (let y = -gridOffset; y < height; y += gridSize) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke(); }
      } else {
        for (let x = -gridOffset; x < width; x += gridSize) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke(); }
      }

    } else {
      // CLASSIC GRID
      ctx.strokeStyle = isSynergy ? 'rgba(255,255,255,0.2)' : p.grid;
      const gridOffset = scroll % gridSize;

      if (isPortrait) {
        for (let y = -gridOffset; y < height; y += gridSize) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke(); }
        for (let x = 0; x <= width; x += gridSize) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke(); }
        const laneWidth = width * (PORTRAIT_LANE_WIDTH_PERCENT / 100);
        ctx.strokeStyle = p.gridHighlight; ctx.lineWidth = 2;
        for (let i = 1; i < PORTRAIT_LANE_COUNT; i++) {
          const x = i * laneWidth;
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
        }
      } else {
        for (let y = 0; y <= height; y += gridSize) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke(); }
        for (let x = -gridOffset; x < width; x += gridSize) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke(); }
      }
    }

    // Draw Lasers (Beams) - Only in Portrait mode logic in original, but here we can keep it shared or check isPortrait
    if (isPortrait) {
      lasersRef.current.forEach(laser => {
        const alpha = laser.life / laser.maxLife;
        const beamWidth = width * (PORTRAIT_LANE_WIDTH_PERCENT / 100);
        const x = laser.lane * beamWidth + (beamWidth / 2);
        ctx.save();
        ctx.globalAlpha = alpha;
        const playerY = height - PORTRAIT_PLAYER_Y_OFFSET;
        ctx.fillStyle = p.particlePrimary; // Use biome color
        ctx.fillRect(x - 2, 0, 4, playerY);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(x - 1, 0, 2, playerY);
        ctx.shadowBlur = 20; ctx.shadowColor = p.particlePrimary;
        ctx.fillRect(x - 2, 0, 4, height);
        ctx.restore();
      });
    }

    starsRef.current.forEach(star => {
      ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
      // Optional: Tint stars?
      // ctx.fillStyle = isSynergy ? '#fff' : p.particleSecondary;
      ctx.beginPath(); ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2); ctx.fill();
    });

    if (gameState === GameState.MENU) { ctx.restore(); return; }

    if (activeSubliminalRef.current) {
      const msg = activeSubliminalRef.current;
      ctx.save(); ctx.globalAlpha = msg.opacity;
      ctx.fillStyle = isSynergy ? '#fff' : p.text;
      const fontSize = isPortrait ? 60 : 120;
      ctx.font = `900 ${fontSize}px 'Rajdhani'`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.translate(width / 2, height / 2); ctx.scale(msg.scale, msg.scale); ctx.fillText(msg.text, 0, 0); ctx.restore();
    }

    if (!isPortrait) {
      // Landscape Ground Line
      ctx.strokeStyle = isSynergy ? '#fff' : p.gridHighlight;
      ctx.lineWidth = 2;
      ctx.shadowBlur = 15; ctx.shadowColor = ctx.strokeStyle;
      ctx.beginPath(); ctx.moveTo(0, groundY); ctx.lineTo(width, groundY); ctx.stroke(); ctx.shadowBlur = 0;
    }

    // Credits Draw
    creditsRef.current.forEach(c => {
      ctx.save();
      ctx.shadowBlur = 10; ctx.shadowColor = COLORS.NEON_YELLOW;
      ctx.fillStyle = COLORS.NEON_YELLOW;
      const spin = Math.sin(animTimeRef.current * 8);
      ctx.translate(c.x, c.y);
      ctx.scale(spin, 1);
      ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(8, 0); ctx.lineTo(0, 10); ctx.lineTo(-8, 0); ctx.closePath(); ctx.fill();
      ctx.restore();
    });

    const pl = playerRef.current; // Renamed from 'p' to 'pl' to avoid conflict with palette 'p'

    if (isPortrait) {
      // --- ENHANCED PORTRAIT PLAYER DRAW ---
      const playerY = height - PORTRAIT_PLAYER_Y_OFFSET;
      const size = PORTRAIT_PLAYER_SIZE;
      const centerX = pl.laneX!;
      const centerY = playerY + size / 2;

      ctx.save();

      // Jump Scale Effect
      const jumpScale = 1 + (pl.altitude || 0) / 100;
      const tiltAngle = (pl.altitude || 0) * 0.002;

      ctx.translate(centerX, centerY);
      ctx.rotate(tiltAngle);
      ctx.scale(jumpScale, jumpScale);
      ctx.translate(-centerX, -centerY);

      // --- MULTI-LAYERED AURA SYSTEM ---
      const meterRatio = Math.min(synergyMeterRef.current, 100) / 100;
      const hasAura = synergyMeterRef.current > 0 || isSynergy;

      if (hasAura) {
        // Outer Aura Ring
        const outerPulse = 0.9 + Math.sin(animTimeRef.current * 8) * 0.1;
        const outerRadius = (size / 2) * (2.2 * outerPulse);
        const outerGlow = ctx.createRadialGradient(centerX, centerY, size / 2, centerX, centerY, outerRadius);

        if (isSynergy) {
          outerGlow.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
          outerGlow.addColorStop(0.5, 'rgba(120, 220, 255, 0.15)');
          outerGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
        } else {
          // Use biome primary color alpha for aura
          // Handle both rgb and rgba
          let color = p.particlePrimary;
          if (color.startsWith('rgba')) {
            // Just replace the alpha value (last number)
            // simplified: replace the last number with 0.3
            // or just replace ')' with ', 0.3)' IS WRONG for rgba.
            // safest quick hack: parse it or just blindly use it?
            // The error was rgbaa, implies replace('rgb', 'rgba') ran on 'rgba'.
            // If we just want 0.3 alpha, and it's already rgba, we need to replace the existing alpha.
            // Hack: force it to be a specific overlay color or just use a simple string replacement that works for both.
            // If we assume standard format:
            color = color.replace('rgb(', 'rgba(').replace('rgbaa', 'rgba').replace(')', ', 0.3)').replace(', 1, 0.3)', ', 0.3)');
            // That's getting messy. 
            // Better: Use the lerpColor helper? No, that mixes two colors.
            // Let's just hardcode a known good visual equivalent for now or correct the replacement.
            // If input is "rgba(r, g, b, 1)", replacing 'rgb' -> 'rgba' gives "rgbaa(r, g, b, 1)".
            // We want "rgba(r, g, b, 0.3)".

            // Clean fix:
            if (color.startsWith('rgb(')) {
              color = color.replace('rgb(', 'rgba(').replace(')', ', 0.3)');
            } else if (color.startsWith('rgba(')) {
              // assume format rgba(r,g,b,a) -> replace last number?
              // Easier: just replace the 'a' part.
              const lastComma = color.lastIndexOf(',');
              if (lastComma !== -1) {
                color = color.substring(0, lastComma) + ', 0.3)';
              }
            }
            outerGlow.addColorStop(0, color);
          } else {
            // Fallback or hex?
            outerGlow.addColorStop(0, 'rgba(34, 211, 238, 0.3)');
          }
          outerGlow.addColorStop(1, 'rgba(0,0,0,0)');
        }

        ctx.fillStyle = outerGlow;
        ctx.beginPath(); ctx.arc(centerX, centerY, outerRadius, 0, Math.PI * 2); ctx.fill();

        // Particles
        const particleCount = isSynergy ? 12 : Math.floor(8 * meterRatio);
        for (let i = 0; i < particleCount; i++) {
          const angle = (i / particleCount) * Math.PI * 2 + animTimeRef.current * 3;
          const radius = size * (isSynergy ? 1.4 : 1.2);
          const px = centerX + Math.cos(angle) * radius;
          const py = centerY + Math.sin(angle) * radius;
          ctx.save();
          ctx.globalAlpha = isSynergy ? 0.8 : 0.4 * meterRatio;
          ctx.shadowBlur = 15;
          ctx.shadowColor = isSynergy ? '#fff' : p.particlePrimary;
          ctx.fillStyle = isSynergy ? '#fff' : p.particlePrimary;
          ctx.beginPath(); ctx.arc(px, py, isSynergy ? 3 : 2, 0, Math.PI * 2); ctx.fill();
          ctx.restore();
        }

        // Energy Rings
        if (isSynergy) {
          for (let ring = 0; ring < 2; ring++) {
            const ringOffset = ring * Math.PI;
            const ringRadius = size * (1.1 + ring * 0.15);
            const ringAlpha = 0.6 - ring * 0.2;
            ctx.save();
            ctx.globalAlpha = ringAlpha + Math.sin(animTimeRef.current * 6 + ringOffset) * 0.2;
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.shadowBlur = 20; ctx.shadowColor = '#fff';
            ctx.beginPath(); ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2); ctx.stroke();
            ctx.restore();
          }
        }
      }

      // Laser Cooldown Arc
      if (laserCooldownRef.current > 0) {
        ctx.save();
        const cooldownPct = laserCooldownRef.current / LASER_COOLDOWN_FRAMES;
        ctx.translate(centerX, centerY);
        // Background
        ctx.beginPath(); ctx.arc(0, 0, size * 0.85, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(100, 100, 100, 0.3)'; ctx.lineWidth = 4; ctx.stroke();
        // Progress
        ctx.beginPath(); ctx.arc(0, 0, size * 0.85, -Math.PI / 2, (-Math.PI / 2) + (Math.PI * 2 * (1 - cooldownPct)));
        const arcGlow = ctx.createLinearGradient(0, -size, 0, size);
        arcGlow.addColorStop(0, COLORS.NEON_CYAN);
        arcGlow.addColorStop(1, 'rgba(34, 211, 238, 0.6)');
        ctx.strokeStyle = arcGlow; ctx.lineWidth = 4; ctx.shadowBlur = 10; ctx.shadowColor = COLORS.NEON_CYAN;
        ctx.globalAlpha = 0.9; ctx.stroke();
        ctx.restore();
      }

      // Player Body
      if (isSynergy) {
        ctx.save();
        ctx.shadowBlur = 40; ctx.shadowColor = '#fff'; ctx.fillStyle = '#fff';
        const synergyPulse = 1 + Math.sin(animTimeRef.current * 15) * 0.05;
        ctx.translate(centerX, centerY); ctx.scale(synergyPulse, synergyPulse); ctx.translate(-centerX, -centerY);
        ctx.beginPath(); ctx.moveTo(centerX, centerY - size / 2); ctx.lineTo(centerX + size / 2, centerY); ctx.lineTo(centerX, centerY + size / 2); ctx.lineTo(centerX - size / 2, centerY); ctx.closePath(); ctx.fill();
        ctx.restore();
      } else {
        // Normal Mode - Biome Colored
        ctx.save();
        ctx.fillStyle = p.particlePrimary; // Body main color
        ctx.shadowBlur = 20; ctx.shadowColor = p.particlePrimary;
        ctx.beginPath(); ctx.moveTo(centerX, centerY - size / 2); ctx.lineTo(centerX + size / 2, centerY); ctx.lineTo(centerX, centerY + size / 2); ctx.lineTo(centerX - size / 2, centerY); ctx.closePath(); ctx.fill();

        // Inner Detail
        ctx.fillStyle = p.particleSecondary;
        ctx.beginPath(); ctx.arc(centerX, centerY, size / 4, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }

      // Trail
      if (!pl.isGrounded || (pl.altitude || 0) > 5) {
        const trailIntensity = Math.min((pl.altitude || 0) / 50, 1);
        const trailY = centerY + size / 2 + 5;
        for (let i = 0; i < 3; i++) {
          const offset = i * 8;
          ctx.save();
          ctx.globalAlpha = (1 - i * 0.3) * trailIntensity * 0.7;
          ctx.fillStyle = p.particlePrimary;
          ctx.beginPath(); ctx.arc(centerX, trailY + offset, (8 - i * 2), 0, Math.PI * 2); ctx.fill();
          ctx.restore();
        }
      }

      ctx.restore();

    } else {
      // --- LANDSCAPE PLAYER DRAW ---
      const ph = pl.isDucking ? PLAYER_HEIGHT_DUCKING : PLAYER_HEIGHT_STANDING;
      const pulse = Math.sin(animTimeRef.current * 10) * 2;

      ctx.save();
      if (invincibleFramesRef.current > 0) ctx.globalAlpha = Math.sin(animTimeRef.current * 30) * 0.5 + 0.5;

      // Aura
      if (synergyMeterRef.current > 0 || isSynergy) {
        ctx.save();
        const meterRatio = Math.min(synergyMeterRef.current, 100) / 100;
        const auraOpacity = isSynergy ? 0.5 + Math.sin(animTimeRef.current * 12) * 0.2 : meterRatio * 0.3;
        const auraBaseColor = isSynergy ? '255, 255, 255' : '34, 211, 238'; // Maybe use biome color too?
        ctx.shadowBlur = isSynergy ? 30 : 15 * meterRatio;
        ctx.shadowColor = `rgba(${auraBaseColor}, ${isSynergy ? 1 : meterRatio})`;
        ctx.fillStyle = `rgba(${auraBaseColor}, ${auraOpacity})`;
        ctx.fillRect(PLAYER_X - 5, pl.y - 5, PLAYER_WIDTH + 10, ph + 10);
        ctx.restore();
      }

      if (isSynergy) {
        ctx.shadowBlur = 30; ctx.shadowColor = '#fff'; ctx.fillStyle = '#fff';
        ctx.fillRect(PLAYER_X - pulse, pl.y - pulse, PLAYER_WIDTH + pulse * 2, ph + pulse * 2);
      } else {
        ctx.shadowBlur = 15; ctx.shadowColor = p.particlePrimary; ctx.fillStyle = p.particlePrimary;
        ctx.fillRect(PLAYER_X, pl.y, PLAYER_WIDTH, ph);
      }
      ctx.restore();
    }

    obstaclesRef.current.forEach(obs => {
      if (obs.shattered) return;
      ctx.save();
      ctx.shadowBlur = 15;

      if (obs.type === ObstacleType.HOVER_MINE) {
        // Mine
        const bob = Math.sin((animTimeRef.current * 5) + obs.frameOffset) * 5;
        ctx.shadowColor = COLORS.NEON_RED; ctx.fillStyle = '#333';
        // Mines stay red/danger color usually? Or use biome obstacle color?
        // Let's keep mines RED for danger, but maybe tint?
        // Using biome obstacle color might be better for cohesion.
        const obsColor = p.obstacle;
        ctx.shadowColor = obsColor;

        const cx = isPortrait ? obs.x + obs.width / 2 : obs.x + 15;
        const cy = isPortrait ? obs.y + obs.height / 2 : obs.y + 15 + bob;
        const rad = isPortrait ? obs.width / 2 : 15;

        ctx.beginPath(); ctx.arc(cx, cy, rad, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = obsColor; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(cx, cy, rad, 0, Math.PI * 2); ctx.stroke();

      } else if (obs.type === ObstacleType.LIFE_PACK) {
        ctx.shadowColor = COLORS.NEON_GREEN; ctx.shadowBlur = 15; ctx.fillStyle = '#0f0';
        const scale = 1 + Math.sin(animTimeRef.current * 6) * 0.2;
        const centerX = obs.x + obs.width / 2;
        const centerY = obs.y + obs.height / 2;
        ctx.translate(centerX, centerY); ctx.scale(scale, scale);
        ctx.fillRect(-obs.width / 3, -obs.height / 8, obs.width / 1.5, obs.height / 4);
        ctx.fillRect(-obs.width / 8, -obs.height / 3, obs.width / 4, obs.height / 1.5);
        ctx.translate(-centerX, -centerY);
      } else {
        // Standard Drone / Obstacle
        ctx.shadowColor = p.obstacle; ctx.fillStyle = '#111';
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        ctx.fillStyle = p.obstacle;
        ctx.beginPath(); ctx.arc(obs.x + obs.width / 2, obs.y + obs.height / 2, 4, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    });

    particlesRef.current.forEach(pt => { // Renamed 'p' to 'pt'
      ctx.fillStyle = pt.color;
      ctx.globalAlpha = pt.life; ctx.fillRect(pt.x, pt.y, 4, 4); ctx.globalAlpha = 1;
    });

    // Floating Text
    floatingTextsRef.current.forEach(t => {
      ctx.save();
      ctx.globalAlpha = t.life;
      ctx.font = `900 ${t.fontSize}px 'Rajdhani'`;
      ctx.fillStyle = t.color;
      ctx.strokeStyle = '#000'; ctx.lineWidth = 3;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.strokeText(t.text, t.x, t.y);
      ctx.fillText(t.text, t.x, t.y);
      ctx.restore();
    });

    // Vignette
    if (isSynergy) {
      ctx.save();
      const gradient = ctx.createRadialGradient(width / 2, height / 2, Math.min(width, height) * 0.3, width / 2, height / 2, Math.max(width, height) * 0.7);
      const pulse = Math.sin(animTimeRef.current * 6) * 0.3 + 0.5;
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
      gradient.addColorStop(1, `rgba(0, 240, 255, ${pulse * 0.3})`);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }

    // Biome Transition Overlay (Flash effect on change?)
    // Could add here if we want a full screen flash when biome changes
    if (biomeTransitionRef.current > 0 && biomeTransitionRef.current < 1) {
      // Optional: Subtle white flash at peak transition?
    }

    ctx.restore();
  }, [gameState, isPortrait]);

  const loop = useCallback((time: number) => {
    if (!lastTimeRef.current) lastTimeRef.current = time;
    const deltaTime = time - lastTimeRef.current;
    lastTimeRef.current = time;

    // Target 60 FPS (16.67ms per frame). 
    // If deltaTime is 16.67ms, relativeDelta = 1.0.
    // If 144Hz (6.94ms), relativeDelta = 0.41.
    const relativeDelta = deltaTime / (1000 / 60);

    // Update animation time (independent of game speed logic, strictly real-time seconds)
    animTimeRef.current += deltaTime / 1000;

    if (gameState === GameState.PLAYING) update(relativeDelta);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) draw(ctx);
    requestRef.current = requestAnimationFrame(loop);
  }, [gameState, update, draw]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(requestRef.current!);
  }, [loop]);

  useEffect(() => {
    if (gameState === GameState.PLAYING && prevGameState.current !== GameState.PAUSED) {
      resetGame();
    } else if (gameState === GameState.MENU) {
      resetGame();
    }
    prevGameState.current = gameState;
  }, [gameState]);

  return (
    <div ref={containerRef} className="w-full h-full relative bg-black touch-none">
      <canvas ref={canvasRef} className="block w-full h-full outline-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      />
      {guideVisible && gameState === GameState.PLAYING && (
        <ControlsGuidance mode="overlay" isPortrait={isPortrait} />
      )}
      {gameState === GameState.PAUSED && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-[60] backdrop-blur-[2px]">
          <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300">
            <h2 className="text-4xl font-black text-white tracking-[0.2em] uppercase italic">System Paused</h2>
            <p className="text-cyan-400 font-mono text-xs tracking-widest animate-pulse">Awaiting Interaction to Resume</p>
          </div>
        </div>
      )}
      {gameState === GameState.PLAYING && (
        <div className="absolute top-24 right-4 text-right pointer-events-none">
          <div className="text-[8px] text-gray-500 font-mono tracking-widest uppercase">Dept. Zone</div>
          <div className="text-xl font-bold font-mono animate-pulse" style={{ color: BIOMES[stageRef.current].palette.text }}>
            {BIOMES[stageRef.current].name}
          </div>
        </div>
      )}
    </div>
  );
};

export default GameCanvas;