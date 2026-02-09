import React, { useRef, useEffect, useCallback, useState } from 'react';
import ControlsGuidance from './ControlsGuidance';
import { GameState, GameObject, ObstacleType, PowerupType, PlayerState, Particle, Star, Credit, Laser, FloatingText, BossState, BossPhase } from '../types';
import {
  PLAYER_X, PLAYER_WIDTH, PLAYER_HEIGHT_STANDING, PLAYER_HEIGHT_DUCKING,
  COLORS, INITIAL_LIVES, INVINCIBILITY_FRAMES,
  SYNERGY_DURATION, SYNERGY_CREDIT_VALUE, LIFE_RECOVERY_THRESHOLD,
  PORTRAIT_PLAYER_Y_OFFSET, PORTRAIT_PLAYER_SIZE, PORTRAIT_LANE_COUNT, PORTRAIT_LANE_WIDTH_PERCENT,
  CREDIT_SCORE_VALUE, LANDSCAPE_CONFIG, PORTRAIT_CONFIG,
  LASER_COOLDOWN_FRAMES, LASER_COOLDOWN_REDUCTION,
  BIOMES, BOSS_CONFIG, RARE_OBSTACLE_CONFIG, POWERUP_CONFIG
} from '../constants';
import { generatePsychologicalTriggers } from '../services/geminiService';
import { soundService } from '../services/soundEffects';
import { useDeviceOrientation } from '../hooks/useDeviceOrientation';
import { useDeviceType } from '../hooks/useDeviceType';

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

const lerpColor = (start: string, end: string, t: number): string => {
  const parse = (c: string) => {
    if (c.startsWith('rgba')) {
      const parts = c.match(/[\d.]+/g);
      return parts ? parts.map(Number) : [0, 0, 0, 1];
    }
    if (c.startsWith('#')) {
      const hex = c.slice(1);
      const bigint = parseInt(hex, 16);
      if (hex.length === 3) {
        return [((bigint >> 8) & 0xF) * 17, ((bigint >> 4) & 0xF) * 17, (bigint & 0xF) * 17, 1];
      }
      return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255, 1];
    }
    return [0, 0, 0, 1];
  };
  const c1 = parse(start);
  const c2 = parse(end);
  const r = Math.round(c1[0] + (c2[0] - c1[0]) * t);
  const g = Math.round(c1[1] + (c2[1] - c1[1]) * t);
  const b = Math.round(c1[2] + (c2[2] - c1[2]) * t);
  const alpha = (c1[3] + (c2[3] - c1[3]) * t);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const GameCanvas: React.FC<GameCanvasProps> = ({ gameState, setGameState, setScore, setLives, setSynergy, setIsSynergyActive, setDeathCause, showTutorial }) => {
  const { isPortrait } = useDeviceOrientation();
  const config = isPortrait ? PORTRAIT_CONFIG : LANDSCAPE_CONFIG;
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);

  const dimensionsRef = useRef({ width: 800, height: 400, groundY: 320 });
  const [guideVisible, setGuideVisible] = useState(showTutorial);
  const [bossHint, setBossHint] = useState<string>('');
  const [bossHintOpacity, setBossHintOpacity] = useState(0);
  const [introPhase, setIntroPhase] = useState<'logo' | 'brief' | 'transition' | null>(null);
  const [introOpacity, setIntroOpacity] = useState(0);
  const { isMobile } = useDeviceType();
  const guideTimerRef = useRef<number | null>(null);
  const prevGameState = useRef(gameState);

  const scoreRef = useRef(0);
  const speedRef = useRef(config.baseSpeed);
  const framesRef = useRef(0);
  const lastTimeRef = useRef<number>(0);
  const lastScoreUpdateRef = useRef<number>(0);
  const animTimeRef = useRef<number>(0);
  const shakeRef = useRef(0);
  const stageRef = useRef(0);
  const livesRef = useRef(INITIAL_LIVES);
  const invincibleFramesRef = useRef(0);
  const subliminalTimerRef = useRef(0);
  const triggersRef = useRef<string[]>(["OBEY", "WORK", "CONSUME", "PRODUCE", "COMPLY", "ASCEND"]);

  // Biome State
  const currentBiomeIndexRef = useRef(0);
  const nextBiomeIndexRef = useRef(0);
  const biomeTransitionRef = useRef(0);

  // Synergy System Refs
  const synergyMeterRef = useRef(0);
  const synergyActiveFramesRef = useRef(0);

  // Laser Cooldown
  const laserCooldownRef = useRef(0);

  // Boss State
  const bossRef = useRef<BossState | null>(null);
  const nextBossTriggerScoreRef = useRef(BOSS_CONFIG.TRIGGER_SCORE);
  const bossEncounterCountRef = useRef(0);

  // Shield State
  const hasShieldRef = useRef(false);

  // Effect States
  const controlsInvertedFramesRef = useRef(0);
  const activeEffectFramesRef = useRef(0);
  const activeEffectTypeRef = useRef<PowerupType | null>(null);

  const floatingTextsRef = useRef<FloatingText[]>([]);

  const playerRef = useRef<PlayerState>({
    y: 0, vy: 0,
    isDucking: false,
    isGrounded: true,
    lane: 1,
    laneX: 0,
    altitude: 0,
    hasShield: false,
    activeEffectType: null,
    activeEffectFrames: 0
  });

  const laneRef = useRef(1);
  const obstaclesRef = useRef<GameObject[]>([]);
  const creditsRef = useRef<Credit[]>([]);
  const lasersRef = useRef<Laser[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const starsRef = useRef<Star[]>([]);
  const lastMilestoneLevelRef = useRef(0);

  const touchStartRef = useRef<{ y: number, x: number } | null>(null);
  const isDraggingRef = useRef(false);
  const lastTapTimeRef = useRef<number>(0);
  const SWIPE_THRESHOLD = 30;

  const activeSubliminalRef = useRef<{ text: string, opacity: number, x: number, y: number, scale: number } | null>(null);

  // --- Resize Handling ---
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current || !canvasRef.current) return;
      const { width, height } = containerRef.current.getBoundingClientRect();
      canvasRef.current.width = width;
      canvasRef.current.height = height;
      dimensionsRef.current = {
        width,
        height,
        groundY: isPortrait ? height - 50 : height - 80
      };
      // Re-center player on resize
      if (isPortrait) {
        laneRef.current = 1;
        playerRef.current.laneX = width / 2;
      } else {
        playerRef.current.y = dimensionsRef.current.groundY - PLAYER_HEIGHT_STANDING;
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [isPortrait]);

  // --- Utility Functions ---

  const createParticles = (x: number, y: number, count: number, color: string) => {
    for (let i = 0; i < count; i++) {
      particlesRef.current.push({ x, y, vx: (Math.random() - 0.5) * 10, vy: (Math.random() - 0.5) * 10, life: 1.0, color });
    }
  };

  const createFloatingText = (x: number, y: number, text: string, color: string, fontSize: number = 20) => {
    floatingTextsRef.current.push({ x, y, text, color, life: 1.0, vy: -2, fontSize });
  };

  const handleCollision = useCallback((finalScore: number, cause: string) => {
    if (invincibleFramesRef.current > 0) return;
    if (activeEffectTypeRef.current === PowerupType.REFLECT) return;

    if (hasShieldRef.current) {
      hasShieldRef.current = false;
      playerRef.current.hasShield = false;
      invincibleFramesRef.current = 60;
      soundService.playCollision(ObstacleType.DRONE_LOW);
      createFloatingText(playerRef.current.laneX || dimensionsRef.current.width / 2, playerRef.current.y, "SHIELD BROKEN", COLORS.NEON_CYAN, 24);
      shakeRef.current = 15;
      return;
    }

    if (livesRef.current > 1) {
      livesRef.current--;
      setLives(livesRef.current);
      invincibleFramesRef.current = INVINCIBILITY_FRAMES;
      soundService.playCollision(ObstacleType.DRONE_LOW);
      shakeRef.current = 20;
      createParticles(PLAYER_X, playerRef.current.y, 10, COLORS.NEON_RED);
    } else {
      setGameState(GameState.GAME_OVER);
      setDeathCause(Math.floor(scoreRef.current), cause);
    }
  }, [setLives, setGameState, setDeathCause, soundService]);

  const damageBoss = useCallback(() => {
    if (!bossRef.current || bossRef.current.phase === BossPhase.DEFEATED || bossRef.current.phase === BossPhase.ENTERING) return;
    bossRef.current.health--;
    bossRef.current.phase = BossPhase.TAKING_DAMAGE;
    createParticles(bossRef.current.x, bossRef.current.y, 30, COLORS.NEON_RED);
    soundService.playCollision(ObstacleType.DRONE_LOW);
    shakeRef.current += 10;
    if (bossRef.current.health <= 0) {
      bossRef.current.phase = BossPhase.DEFEATED;
      createFloatingText(bossRef.current.x, bossRef.current.y, "THREAT NEUTRALIZED", COLORS.NEON_GREEN, 40);
      scoreRef.current += 10000;
      createParticles(bossRef.current.x, bossRef.current.y, 100, COLORS.NEON_GREEN);
      soundService.playSynergyStart();
    }
  }, [soundService]);

  const fireLaser = useCallback(() => {
    if (gameState !== GameState.PLAYING || laserCooldownRef.current > 0) return;
    setGuideVisible(false);
    setBossHint('');
    soundService.playLaser();
    laserCooldownRef.current = LASER_COOLDOWN_FRAMES;
    if (bossRef.current && bossRef.current.phase !== BossPhase.DEFEATED && bossRef.current.phase !== BossPhase.ENTERING) damageBoss();

    for (let l = 0; l < PORTRAIT_LANE_COUNT; l++) {
      lasersRef.current.push({ id: Math.random().toString(36), lane: l, life: 15, maxLife: 15 });
    }

    obstaclesRef.current.forEach(obs => {
      if (obs.shattered || obs.passed) return;
      obs.shattered = true;
      createParticles(obs.x + obs.width / 2, obs.y + obs.height / 2, 15, COLORS.NEON_CYAN);
      shakeRef.current = 5;
    });
  }, [gameState, damageBoss, soundService]);

  const spawnBoss = useCallback(() => {
    const { width, height } = dimensionsRef.current;
    activeSubliminalRef.current = { text: "AUDIT IN PROGRESS", opacity: 1, x: width / 2, y: height / 2, scale: 1.5 };
    shakeRef.current = 30;
    const bossDim = isPortrait ? BOSS_CONFIG.DIMENSIONS.PORTRAIT : BOSS_CONFIG.DIMENSIONS.LANDSCAPE;

    const encounterCount = bossEncounterCountRef.current;
    bossEncounterCountRef.current++;
    nextBossTriggerScoreRef.current += 10000; // Next boss 10k points later

    bossRef.current = {
      x: width / 2, y: -200,
      width: bossDim.width, height: bossDim.height,
      health: BOSS_CONFIG.MAX_HEALTH + encounterCount,
      maxHealth: BOSS_CONFIG.MAX_HEALTH + encounterCount,
      phase: BossPhase.ENTERING, attackTimer: 120, targetLane: 0, attacksMade: 0,
      beamChargeLevel: 0, frame: 0, attacksPerformed: 0, maxAttacks: BOSS_CONFIG.BASE_ATTACKS + encounterCount
    };

    if (encounterCount === 0) {
      setBossHint(isMobile ? "DOUBLE TAP TO FIRE LASER" : "PRESS SPACE TO FIRE LASER");
    }

    soundService.playSynergyStart();
  }, [isPortrait, soundService, isMobile]);

  const spawnPowerup = () => {
    const { width, groundY } = dimensionsRef.current;
    const type = Math.random() < 0.6 ? PowerupType.SHIELD : PowerupType.REFLECT;
    if (isPortrait) {
      const lane = Math.floor(Math.random() * PORTRAIT_LANE_COUNT);
      const laneWidth = width * (PORTRAIT_LANE_WIDTH_PERCENT / 100);
      obstaclesRef.current.push({ x: (lane * laneWidth) + (laneWidth / 2) - 20, y: -200, width: 40, height: 40, type: ObstacleType.POWERUP, powerupType: type, passed: false, lane });
    } else {
      obstaclesRef.current.push({ x: width + 100, y: groundY - 120 - Math.random() * 80, width: 40, height: 40, type: ObstacleType.POWERUP, powerupType: type, passed: false });
    }
  };

  const spawnObstacle = () => {
    const { width, groundY } = dimensionsRef.current;
    const currentBiome = currentBiomeIndexRef.current;

    // Rare Obstacles
    if (RARE_OBSTACLE_CONFIG.GLASS_CEILING.biomes.includes(currentBiome) && Math.random() < RARE_OBSTACLE_CONFIG.GLASS_CEILING.spawnChance) {
      if (isPortrait) {
        const lane = Math.floor(Math.random() * PORTRAIT_LANE_COUNT);
        const laneWidth = width * (PORTRAIT_LANE_WIDTH_PERCENT / 100);
        obstaclesRef.current.push({ x: lane * laneWidth, y: -200, width: laneWidth, height: 80, type: ObstacleType.GLASS_CEILING, passed: false, lane, descendTimer: 0 });
      } else {
        obstaclesRef.current.push({ x: width + 100, y: groundY - 180, width: 120, height: 80, type: ObstacleType.GLASS_CEILING, passed: false, descendTimer: 0 });
      }
      return;
    }

    if (RARE_OBSTACLE_CONFIG.DATA_CORRUPTER.biomes.includes(currentBiome) && Math.random() < RARE_OBSTACLE_CONFIG.DATA_CORRUPTER.spawnChance) {
      const size = RARE_OBSTACLE_CONFIG.DATA_CORRUPTER.size;
      if (isPortrait) {
        const lane = Math.floor(Math.random() * PORTRAIT_LANE_COUNT);
        const laneWidth = width * (PORTRAIT_LANE_WIDTH_PERCENT / 100);
        obstaclesRef.current.push({ x: (lane * laneWidth) + (laneWidth / 2) - size / 2, y: -200, width: size, height: size, type: ObstacleType.DATA_CORRUPTER, passed: false, lane });
      } else {
        obstaclesRef.current.push({ x: width + 100, y: groundY - size - 30, width: size, height: size, type: ObstacleType.DATA_CORRUPTER, passed: false });
      }
      return;
    }

    let type = ObstacleType.DRONE_LOW;
    const isSynergy = synergyActiveFramesRef.current > 0;
    const typeRoll = Math.random();
    if (typeRoll > (1 - (isSynergy ? config.lifePackSynergyChance : config.lifePackBaseChance))) type = ObstacleType.LIFE_PACK;
    else if (typeRoll > 0.7) type = ObstacleType.HOVER_MINE;
    else if (typeRoll > 0.4) type = ObstacleType.DRONE_HIGH;

    if (isPortrait) {
      const lane = Math.floor(Math.random() * PORTRAIT_LANE_COUNT);
      const laneWidth = width * (PORTRAIT_LANE_WIDTH_PERCENT / 100);
      obstaclesRef.current.push({ x: (lane * laneWidth) + (laneWidth / 2) - 20, y: -200, width: 40, height: 40, type, passed: false, lane });
      if (Math.random() < POWERUP_CONFIG.SPAWN_CHANCE) spawnPowerup();
      else if (Math.random() < config.creditSpawnChance) {
        let cl = (lane === 0) ? 1 : ((lane === 2) ? 1 : (Math.random() > 0.5 ? lane - 1 : lane + 1));
        const cx = (cl * laneWidth) + (laneWidth / 2) - 4;
        for (let i = 0; i < 3; i++) creditsRef.current.push({ id: Math.random().toString(36), x: cx, y: -250 - (i * 40), collected: false });
      }
    } else {
      let y = groundY - 40;
      if (type === ObstacleType.DRONE_HIGH) y = groundY - 110;
      else if (type === ObstacleType.HOVER_MINE) y = groundY - 60 - Math.random() * 60;
      obstaclesRef.current.push({ x: width + 100, y, width: 40, height: 40, type, passed: false, frameOffset: Math.random() * 100 });
      if (Math.random() < POWERUP_CONFIG.SPAWN_CHANCE) spawnPowerup();
      else if (Math.random() < config.creditSpawnChance) {
        const sx = width + 150;
        for (let i = 0; i < 4; i++) creditsRef.current.push({ id: Math.random().toString(36), x: sx + (i * 40), y: groundY - 40 - Math.random() * 40, collected: false });
      }
    }
  };

  const updateBoss = (relativeDelta: number) => {
    if (!bossRef.current) return;
    const boss = bossRef.current;
    const { width, height, groundY } = dimensionsRef.current;
    boss.frame += relativeDelta;

    switch (boss.phase) {
      case BossPhase.ENTERING:
        const ty = isPortrait ? 200 : groundY - 200;
        boss.y += (ty - boss.y) * 0.05 * relativeDelta;
        if (Math.abs(boss.y - ty) < 5) boss.phase = BossPhase.IDLE;
        break;
      case BossPhase.IDLE:
        boss.attackTimer -= relativeDelta;
        if (boss.attackTimer <= 0) {
          if (boss.attacksPerformed >= boss.maxAttacks) boss.phase = BossPhase.LEAVING;
          else {
            boss.phase = BossPhase.PREPARING_ATTACK;
            boss.targetLane = isPortrait ? Math.floor(Math.random() * 3) : playerRef.current.y + PLAYER_HEIGHT_STANDING / 2;
            boss.attackTimer = BOSS_CONFIG.CHARGE_DURATION;
          }
        }
        break;
      case BossPhase.PREPARING_ATTACK:
        boss.attackTimer -= relativeDelta;
        boss.beamChargeLevel = 1 - (boss.attackTimer / BOSS_CONFIG.CHARGE_DURATION);
        if (boss.attackTimer <= 0) {
          boss.phase = BossPhase.ATTACKING;
          boss.attackTimer = BOSS_CONFIG.BEAM_DURATION;
          soundService.playLaser();
          shakeRef.current = 10;
        }
        break;
      case BossPhase.ATTACKING:
        boss.attackTimer -= relativeDelta;
        let hit = false;
        if (isPortrait) {
          const lw = width * (PORTRAIT_LANE_WIDTH_PERCENT / 100);
          if (Math.floor(playerRef.current.laneX! / lw) === boss.targetLane) hit = true;
        } else {
          if (Math.abs(playerRef.current.y + PLAYER_HEIGHT_STANDING / 2 - boss.targetLane) < 40) hit = true;
        }
        if (hit && invincibleFramesRef.current <= 0) handleCollision(0, "TERMINATED BY AUDITOR");
        if (boss.attackTimer <= 0) { boss.phase = BossPhase.IDLE; boss.attackTimer = BOSS_CONFIG.ATTACK_COOLDOWN; boss.attacksPerformed++; }
        break;
      case BossPhase.TAKING_DAMAGE:
        boss.attackTimer = (boss.attackTimer || 0) + relativeDelta;
        if (boss.attackTimer > 20) { boss.phase = BossPhase.IDLE; boss.attackTimer = 10; }
        break;
      case BossPhase.LEAVING:
        boss.y -= 10 * relativeDelta;
        if (boss.y < -300) bossRef.current = null;
        break;
      case BossPhase.DEFEATED:
        boss.y += 5 * relativeDelta;
        boss.x += (Math.random() - 0.5) * 5;
        if (boss.y > height + 300) bossRef.current = null;
        break;
    }
  };

  const resetGame = useCallback(() => {
    if (!containerRef.current) return;
    const { width, height } = containerRef.current.getBoundingClientRect();
    const groundY = isPortrait ? height - 50 : height - 80;
    dimensionsRef.current = { width, height, groundY };

    scoreRef.current = 0; speedRef.current = config.baseSpeed; framesRef.current = 0; shakeRef.current = 0;
    stageRef.current = 0; livesRef.current = INITIAL_LIVES; invincibleFramesRef.current = 0;
    synergyMeterRef.current = 0; synergyActiveFramesRef.current = 0;
    obstaclesRef.current = []; creditsRef.current = []; lasersRef.current = []; particlesRef.current = [];

    // Initialize Stars
    starsRef.current = Array.from({ length: 50 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: 0.5 + Math.random() * 1.5,
      speed: 0.1 + Math.random() * 0.5,
      opacity: 0.3 + Math.random() * 0.7
    }));

    bossRef.current = null; nextBossTriggerScoreRef.current = BOSS_CONFIG.TRIGGER_SCORE; bossEncounterCountRef.current = 0;
    playerRef.current = {
      y: groundY - PLAYER_HEIGHT_STANDING, vy: 0, isDucking: false, isGrounded: true,
      hasShield: false, activeEffectFrames: 0, activeEffectType: null, lane: 1, laneX: width / 2, altitude: 0
    };
    activeEffectFramesRef.current = 0; activeEffectTypeRef.current = null; controlsInvertedFramesRef.current = 0; laneRef.current = 1;
    hasShieldRef.current = false;
    setScore(0); setLives(INITIAL_LIVES); setSynergy(0);
  }, [config.baseSpeed, isPortrait, setScore, setLives, setSynergy]);

  const startJump = useCallback(() => {
    if (gameState !== GameState.PLAYING) return;
    if (playerRef.current.isGrounded) {
      playerRef.current.vy = config.jumpForce; playerRef.current.isGrounded = false;
      soundService.playJump();
    }
  }, [gameState, config.jumpForce]);

  const endJump = useCallback(() => {
    if (gameState !== GameState.PLAYING) return;
    if (!isPortrait && !playerRef.current.isGrounded && playerRef.current.vy < -5) playerRef.current.vy *= 0.4;
  }, [gameState, isPortrait]);

  const startDuck = useCallback(() => {
    if (gameState !== GameState.PLAYING) return;
    playerRef.current.isDucking = true; setGuideVisible(false);
    if (!playerRef.current.isGrounded) playerRef.current.vy += 10;
    soundService.playDuck();
  }, [gameState]);

  const endDuck = useCallback(() => {
    if (gameState !== GameState.PLAYING) return;
    playerRef.current.isDucking = false;
  }, [gameState]);

  // --- Main Update Loop ---

  const update = useCallback((relativeDelta: number) => {
    if (gameState !== GameState.PLAYING) return;
    const { width, height, groundY } = dimensionsRef.current;

    if (invincibleFramesRef.current > 0) invincibleFramesRef.current = Math.max(0, invincibleFramesRef.current - relativeDelta);

    const timeScale = 1 + (Math.floor(scoreRef.current / config.speedMilestone) * config.timeScaleIncrement);
    const actualTimeScale = Math.min(timeScale, config.maxSpeed / config.baseSpeed);
    speedRef.current = config.baseSpeed * actualTimeScale;

    // Throttle React state updates to ~30fps to save performance
    if (Date.now() - lastScoreUpdateRef.current > 33) {
      setScore(Math.floor(scoreRef.current));
      lastScoreUpdateRef.current = Date.now();
    }

    framesRef.current += relativeDelta;
    animTimeRef.current += relativeDelta / 60;
    shakeRef.current = Math.max(0, shakeRef.current - 0.5 * relativeDelta);

    if (controlsInvertedFramesRef.current > 0) controlsInvertedFramesRef.current = Math.max(0, controlsInvertedFramesRef.current - relativeDelta);
    if (laserCooldownRef.current > 0) laserCooldownRef.current = Math.max(0, laserCooldownRef.current - relativeDelta);

    if (synergyActiveFramesRef.current > 0) {
      synergyActiveFramesRef.current -= relativeDelta;
      setSynergy((synergyActiveFramesRef.current / SYNERGY_DURATION) * 100);
      if (synergyActiveFramesRef.current <= 0) { setSynergy(0); setIsSynergyActive(false); }
    }

    if (activeEffectFramesRef.current > 0) {
      activeEffectFramesRef.current -= relativeDelta;
      if (activeEffectFramesRef.current <= 0) { activeEffectTypeRef.current = null; playerRef.current.activeEffectType = null; }
    }
    playerRef.current.activeEffectType = activeEffectTypeRef.current;
    playerRef.current.activeEffectFrames = activeEffectFramesRef.current;
    playerRef.current.hasShield = hasShieldRef.current;

    const currentScore = Math.floor(scoreRef.current);
    if (!bossRef.current && currentScore >= nextBossTriggerScoreRef.current) spawnBoss();
    if (bossRef.current) updateBoss(relativeDelta);

    if (currentBiomeIndexRef.current < BIOMES.length - 1 && currentScore >= BIOMES[currentBiomeIndexRef.current + 1].threshold) {
      nextBiomeIndexRef.current = currentBiomeIndexRef.current + 1;
    }
    if (nextBiomeIndexRef.current > currentBiomeIndexRef.current) {
      biomeTransitionRef.current += 0.01 * relativeDelta;
      if (biomeTransitionRef.current >= 1) { biomeTransitionRef.current = 0; currentBiomeIndexRef.current = nextBiomeIndexRef.current; }
    }
    stageRef.current = currentBiomeIndexRef.current;

    // Subliminal Spawning
    subliminalTimerRef.current += relativeDelta;
    if (subliminalTimerRef.current > 180) { // Every ~3 seconds
      subliminalTimerRef.current = 0;
      const text = triggersRef.current[Math.floor(Math.random() * triggersRef.current.length)];
      activeSubliminalRef.current = {
        text,
        opacity: 0.15,
        x: Math.random() * width,
        y: Math.random() * height,
        scale: 0.8 + Math.random() * 0.5
      };
    }

    if (activeSubliminalRef.current) {
      activeSubliminalRef.current.opacity -= 0.002 * relativeDelta;
      if (activeSubliminalRef.current.opacity <= 0) activeSubliminalRef.current = null;
    }

    // Stars
    starsRef.current.forEach(s => {
      if (isPortrait) { s.y += speedRef.current * s.speed * relativeDelta; if (s.y > height) { s.y = -10; s.x = Math.random() * width; } }
      else { s.x -= speedRef.current * s.speed * relativeDelta; if (s.x < -10) { s.x = width + 10; s.y = Math.random() * height; } }
    });

    const player = playerRef.current;
    const isSynergy = synergyActiveFramesRef.current > 0;

    if (isPortrait) {
      const lw = width * (PORTRAIT_LANE_WIDTH_PERCENT / 100);
      const targetX = (laneRef.current * lw) + (lw / 2);
      player.laneX = player.laneX ? player.laneX + (targetX - player.laneX) * 0.2 * relativeDelta : targetX;
      player.vy += config.gravity * actualTimeScale * relativeDelta;
      player.altitude! -= player.vy * actualTimeScale * relativeDelta;
      if (player.altitude! < 0) { player.altitude = 0; player.vy = 0; player.isGrounded = true; }

      const spawnDist = 250 + speedRef.current * 4;
      if (!bossRef.current) {
        if (!obstaclesRef.current[obstaclesRef.current.length - 1] || obstaclesRef.current[obstaclesRef.current.length - 1].y > spawnDist) {
          if (Math.random() < ((config.obstacleSpawnRate + stageRef.current * 0.05) * relativeDelta)) spawnObstacle();
        }
      } else {
        // Allow powerups to spawn during boss fight (rare)
        if (Math.random() < 0.001 * relativeDelta) spawnPowerup();
      }

      for (let i = obstaclesRef.current.length - 1; i >= 0; i--) {
        const obs = obstaclesRef.current[i];
        if (obs.shattered) { obs.y += speedRef.current * relativeDelta; if (obs.y > height + 100) obstaclesRef.current.splice(i, 1); continue; }
        obs.y += speedRef.current * relativeDelta;

        // Glass Ceiling Descent Logic (Portrait)
        if (obs.type === ObstacleType.GLASS_CEILING && !obs.shattered) {
          const triggerDist = height * RARE_OBSTACLE_CONFIG.GLASS_CEILING.descendAt;
          if (obs.y > -triggerDist + height) { // Coming from top, so check if it has passed a certain point?
            // Actually in portrait, it spawns at y: -200 and moves down.
            // Let's make it descend faster when it reaches top of screen.
            const targetY = 50; // Just below the top
            if (obs.y < targetY) {
              obs.y += RARE_OBSTACLE_CONFIG.GLASS_CEILING.descendSpeed * relativeDelta;
            }
          }
        }

        const py = height - PORTRAIT_PLAYER_Y_OFFSET;
        const collided = Math.abs(obs.x + obs.width / 2 - player.laneX!) < lw / 2 && Math.abs(obs.y + obs.height / 2 - py) < 30;

        if (collided) {
          // Check for beneficial items first (powerups, life packs) before destructive effects
          if (obs.type === ObstacleType.POWERUP) {
            if (obs.powerupType === PowerupType.SHIELD) { hasShieldRef.current = true; playerRef.current.hasShield = true; createFloatingText(obs.x, obs.y, "FIREWALL BUFFER", POWERUP_CONFIG.SHIELD.color, 24); }
            else { activeEffectTypeRef.current = PowerupType.REFLECT; activeEffectFramesRef.current = POWERUP_CONFIG.REFLECT.duration; createFloatingText(obs.x, obs.y, "REFLECTIVE BURST", POWERUP_CONFIG.REFLECT.color, 24); soundService.playSynergyStart(); }
            obstaclesRef.current.splice(i, 1); soundService.playLifeUp(); continue;
          }
          if (obs.type === ObstacleType.LIFE_PACK) {
            livesRef.current = Math.min(3, livesRef.current + 1);
            setLives(livesRef.current);
            obstaclesRef.current.splice(i, 1);
            soundService.playLifeUp();
            createFloatingText(obs.x, obs.y, "+1 LIFE", COLORS.NEON_GREEN, 24);
            continue;
          }
          // Apply destructive effects (REFLECT/synergy) to harmful obstacles
          if (activeEffectTypeRef.current === PowerupType.REFLECT || isSynergy) {
            obs.shattered = true; scoreRef.current += 500; soundService.playScore(); createFloatingText(obs.x, obs.y, "+500", "#fff", 24); continue;
          }
          if (obs.type === ObstacleType.DATA_CORRUPTER) {
            controlsInvertedFramesRef.current = RARE_OBSTACLE_CONFIG.DATA_CORRUPTER.invertDuration;
            createFloatingText(obs.x, obs.y, "CONTROLS INVERTED", COLORS.NEON_PURPLE, 24);
            obstaclesRef.current.splice(i, 1);
            soundService.playCollision(ObstacleType.DATA_CORRUPTER);
            continue;
          }
          handleCollision(0, "CRITICAL ERROR");
        }
        if (obs.y > height + 200) obstaclesRef.current.splice(i, 1);
      }

      for (let i = creditsRef.current.length - 1; i >= 0; i--) {
        const c = creditsRef.current[i]; c.y += speedRef.current * relativeDelta;
        if (!c.collected && Math.abs(c.x - player.laneX!) < 30 && Math.abs(c.y - (height - PORTRAIT_PLAYER_Y_OFFSET)) < 30) {
          c.collected = true; scoreRef.current += 100; soundService.playCredit();
          synergyMeterRef.current += SYNERGY_CREDIT_VALUE;
          if (synergyMeterRef.current >= 100 && !isSynergy) { setIsSynergyActive(true); synergyActiveFramesRef.current = SYNERGY_DURATION; synergyMeterRef.current = 0; }
        }
        if (c.y > height + 200 || c.collected) creditsRef.current.splice(i, 1);
      }
    } else {
      player.vy += config.gravity * actualTimeScale * relativeDelta;
      player.y += player.vy * actualTimeScale * relativeDelta;
      const ph = player.isDucking ? PLAYER_HEIGHT_DUCKING : PLAYER_HEIGHT_STANDING;
      if (player.y > groundY - ph) { player.y = groundY - ph; player.vy = 0; player.isGrounded = true; }

      const minDistance = 300 + speedRef.current * 10;
      if (!bossRef.current) {
        if (!obstaclesRef.current[obstaclesRef.current.length - 1] || width - obstaclesRef.current[obstaclesRef.current.length - 1].x > minDistance) {
          if (Math.random() < ((config.obstacleSpawnRate + stageRef.current * 0.05) * relativeDelta)) spawnObstacle();
        }
      } else {
        // Allow powerups to spawn during boss fight (rare)
        if (Math.random() < 0.001 * relativeDelta) spawnPowerup();
      }

      for (let i = obstaclesRef.current.length - 1; i >= 0; i--) {
        const obs = obstaclesRef.current[i];
        if (obs.shattered) { obs.x -= speedRef.current * relativeDelta; if (obs.x < -100) obstaclesRef.current.splice(i, 1); continue; }
        obs.x -= speedRef.current * relativeDelta;

        // Glass Ceiling Descent Logic
        if (obs.type === ObstacleType.GLASS_CEILING && !obs.shattered) {
          const triggerDist = width * RARE_OBSTACLE_CONFIG.GLASS_CEILING.descendAt;
          if (obs.x < triggerDist) {
            const targetY = groundY - RARE_OBSTACLE_CONFIG.GLASS_CEILING.initialHeight;
            if (obs.y < targetY) {
              obs.y += RARE_OBSTACLE_CONFIG.GLASS_CEILING.descendSpeed * relativeDelta;
              if (obs.y > targetY) obs.y = targetY;
            }
          }
        }

        const collided = PLAYER_X + PLAYER_WIDTH > obs.x && PLAYER_X < obs.x + obs.width && player.y + ph > obs.y && player.y < obs.y + obs.height;
        if (collided) {
          // Check for beneficial items first (powerups, life packs) before destructive effects
          if (obs.type === ObstacleType.POWERUP) {
            if (obs.powerupType === PowerupType.SHIELD) { hasShieldRef.current = true; playerRef.current.hasShield = true; createFloatingText(obs.x, obs.y, "FIREWALL BUFFER", POWERUP_CONFIG.SHIELD.color, 24); }
            else { activeEffectTypeRef.current = PowerupType.REFLECT; activeEffectFramesRef.current = POWERUP_CONFIG.REFLECT.duration; createFloatingText(obs.x, obs.y, "REFLECTIVE BURST", POWERUP_CONFIG.REFLECT.color, 24); soundService.playSynergyStart(); }
            obstaclesRef.current.splice(i, 1); soundService.playLifeUp(); continue;
          }
          if (obs.type === ObstacleType.LIFE_PACK) {
            livesRef.current = Math.min(3, livesRef.current + 1);
            setLives(livesRef.current);
            obstaclesRef.current.splice(i, 1);
            soundService.playLifeUp();
            createFloatingText(obs.x, obs.y, "+1 LIFE", COLORS.NEON_GREEN, 24);
            continue;
          }
          // Apply destructive effects (REFLECT/synergy) to harmful obstacles
          if (activeEffectTypeRef.current === PowerupType.REFLECT || isSynergy) {
            obs.shattered = true; scoreRef.current += 500; continue;
          }
          if (obs.type === ObstacleType.DATA_CORRUPTER) {
            controlsInvertedFramesRef.current = RARE_OBSTACLE_CONFIG.DATA_CORRUPTER.invertDuration;
            createFloatingText(obs.x, obs.y, "CONTROLS INVERTED", COLORS.NEON_PURPLE, 24);
            obstaclesRef.current.splice(i, 1);
            soundService.playCollision(ObstacleType.DATA_CORRUPTER);
            continue;
          }
          handleCollision(0, "COLLISION");
        }
        if (obs.x < -200) obstaclesRef.current.splice(i, 1);
      }

      for (let i = creditsRef.current.length - 1; i >= 0; i--) {
        const c = creditsRef.current[i]; c.x -= speedRef.current * relativeDelta;
        if (!c.collected && Math.abs(c.x - PLAYER_X) < 40 && Math.abs(c.y - player.y) < 60) {
          c.collected = true; scoreRef.current += 100; soundService.playCredit();
          synergyMeterRef.current += SYNERGY_CREDIT_VALUE;
        }
        if (c.x < -100 || c.collected) creditsRef.current.splice(i, 1);
      }
    }

    lasersRef.current.forEach((l, i) => { l.life -= relativeDelta; if (l.life <= 0) lasersRef.current.splice(i, 1); });
    particlesRef.current.forEach((p, i) => { p.x += p.vx * relativeDelta; p.y += p.vy * relativeDelta; p.life -= 0.05 * relativeDelta; if (p.life <= 0) particlesRef.current.splice(i, 1); });
    floatingTextsRef.current.forEach((t, i) => { t.y += t.vy * relativeDelta; t.life -= 0.015 * relativeDelta; if (t.life <= 0) floatingTextsRef.current.splice(i, 1); });

  }, [gameState, config, setScore, isPortrait, handleCollision, spawnBoss, fireLaser, setIsSynergyActive, setSynergy]);

  // --- Psychological Triggers ---
  useEffect(() => {
    if (gameState !== GameState.PLAYING) return;
    const fetchTriggers = async () => {
      try {
        const newTriggers = await generatePsychologicalTriggers();
        if (newTriggers && newTriggers.length > 0) {
          triggersRef.current = [...new Set([...triggersRef.current, ...newTriggers])];
        }
      } catch (e) { console.error("Trigger fetch failed", e); }
    };
    fetchTriggers();
    const interval = setInterval(fetchTriggers, 30000);
    return () => clearInterval(interval);
  }, [gameState]);

  // --- Input Handlers ---
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        fireLaser();
      }
      if (e.code === 'ArrowUp' || e.code === 'KeyW') startJump();
      if (e.code === 'ArrowDown' || e.code === 'KeyS') startDuck();
      if (isPortrait) {
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') laneRef.current = invertLane(Math.max(0, laneRef.current - 1));
        if (e.code === 'ArrowRight' || e.code === 'KeyD') laneRef.current = invertLane(Math.min(2, laneRef.current + 1));
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'ArrowUp' || e.code === 'KeyW') endJump();
      if (e.code === 'ArrowDown' || e.code === 'KeyS') endDuck();
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => { window.removeEventListener('keydown', onKeyDown); window.removeEventListener('keyup', onKeyUp); };
  }, [fireLaser, startJump, endJump, startDuck, endDuck, isPortrait]);

  const invertLane = (lane: number) => {
    if (controlsInvertedFramesRef.current <= 0) return lane;
    if (lane === 0) return 2;
    if (lane === 2) return 0;
    return 1;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const now = Date.now();
    const isDoubleTap = now - lastTapTimeRef.current < 250;
    lastTapTimeRef.current = now;

    touchStartRef.current = { y: e.touches[0].clientY, x: e.touches[0].clientX };
    isDraggingRef.current = true;
    if (isPortrait) {
      if (isDoubleTap) fireLaser();
      const pct = e.touches[0].clientX / dimensionsRef.current.width;
      laneRef.current = (pct < 0.33) ? 0 : (pct > 0.66 ? 2 : 1);
    } else {
      if (isDoubleTap) fireLaser();
      else startJump();
    }
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    if (isPortrait) {
      const pct = e.touches[0].clientX / dimensionsRef.current.width;
      laneRef.current = (pct < 0.33) ? 0 : (pct > 0.66 ? 2 : 1);
    } else {
      if (e.touches[0].clientY - touchStartRef.current.y > SWIPE_THRESHOLD) startDuck();
    }
  };
  const handleTouchEnd = () => { isDraggingRef.current = false; endJump(); endDuck(); touchStartRef.current = null; };

  const handleMouseDown = () => {
    const now = Date.now();
    const isDoubleTap = now - lastTapTimeRef.current < 250;
    lastTapTimeRef.current = now;
    isDraggingRef.current = true;
    if (isPortrait) {
      if (isDoubleTap) fireLaser();
    } else {
      if (isDoubleTap) fireLaser();
      else startJump();
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    endJump();
  };

  // --- Rendering ---
  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    const { width, height, groundY } = dimensionsRef.current;
    if (!ctx) return;

    const isSynergy = synergyActiveFramesRef.current > 0;
    const biome = BIOMES[currentBiomeIndexRef.current];
    const nextBiome = BIOMES[nextBiomeIndexRef.current];
    const transitionP = biomeTransitionRef.current;

    const p = {
      background: lerpColor(biome.palette.background, nextBiome.palette.background, transitionP),
      grid: lerpColor(biome.palette.grid, nextBiome.palette.grid, transitionP),
      gridHighlight: lerpColor(biome.palette.gridHighlight, nextBiome.palette.gridHighlight, transitionP),
      text: lerpColor(biome.palette.text, nextBiome.palette.text, transitionP),
      obstacle: lerpColor(biome.palette.obstacle, nextBiome.palette.obstacle, transitionP),
      primary: lerpColor(biome.palette.particlePrimary, nextBiome.palette.particlePrimary, transitionP),
      secondary: lerpColor(biome.palette.particleSecondary, nextBiome.palette.particleSecondary, transitionP),
    };

    ctx.save();
    if (shakeRef.current > 0) ctx.translate((Math.random() - 0.5) * shakeRef.current, (Math.random() - 0.5) * shakeRef.current);

    // Background
    ctx.fillStyle = p.background;
    ctx.fillRect(0, 0, width, height);

    // Grid Rendering
    const scroll = (framesRef.current * speedRef.current * 0.8) % 60;
    const gridType = biome.atmosphere.gridType;

    if (gridType === 'digital') {
      ctx.fillStyle = p.grid; ctx.font = "12px 'Share Tech Mono'";
      for (let x = 0; x < width; x += 40) {
        const charScroll = (framesRef.current * 2 + x) % height;
        ctx.fillText(Math.random() > 0.5 ? "1010" : "0101", x, charScroll);
      }
    } else {
      ctx.strokeStyle = p.grid; ctx.lineWidth = 1;
      if (isPortrait) {
        for (let y = -scroll; y < height; y += 60) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke(); }
        const lw = width * (PORTRAIT_LANE_WIDTH_PERCENT / 100);
        ctx.strokeStyle = p.gridHighlight; ctx.lineWidth = 2;
        for (let i = 1; i < 3; i++) { ctx.beginPath(); ctx.moveTo(i * lw, 0); ctx.lineTo(i * lw, height); ctx.stroke(); }
      } else {
        for (let x = -scroll; x < width; x += 60) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke(); }
        ctx.strokeStyle = p.gridHighlight; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(0, groundY); ctx.lineTo(width, groundY); ctx.stroke();
      }
    }

    // Stars
    starsRef.current.forEach(s => { ctx.fillStyle = `rgba(255, 255, 255, ${s.opacity})`; ctx.beginPath(); ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2); ctx.fill(); });

    // Subliminal
    if (activeSubliminalRef.current) {
      const msg = activeSubliminalRef.current;
      ctx.save(); ctx.globalAlpha = msg.opacity; ctx.fillStyle = p.text;
      ctx.font = `900 ${Math.floor(60 * msg.scale)}px 'Share Tech Mono'`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(msg.text, msg.x, msg.y); ctx.restore();
    }

    // Credits
    creditsRef.current.forEach(c => {
      ctx.save(); ctx.shadowBlur = 10; ctx.shadowColor = COLORS.NEON_YELLOW; ctx.fillStyle = COLORS.NEON_YELLOW;
      const spin = Math.sin(animTimeRef.current * 10);
      ctx.translate(c.x, c.y); ctx.scale(spin, 1);
      ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(6, 0); ctx.lineTo(0, 8); ctx.lineTo(-6, 0); ctx.closePath(); ctx.fill();
      ctx.restore();
    });

    // Obstacles
    obstaclesRef.current.forEach(obs => {
      if (obs.shattered) return;
      ctx.save();
      const obsColor = (obs.type === ObstacleType.POWERUP) ? POWERUP_CONFIG[obs.powerupType!].color : p.obstacle;
      ctx.shadowBlur = 15; ctx.shadowColor = obsColor; ctx.fillStyle = obsColor;

      if (obs.type === ObstacleType.LIFE_PACK) {
        ctx.shadowColor = COLORS.NEON_GREEN; ctx.shadowBlur = 15; ctx.fillStyle = '#0f0';
        const scale = 1 + Math.sin(animTimeRef.current * 6) * 0.2;
        const centerX = obs.x + obs.width / 2;
        const centerY = obs.y + obs.height / 2;
        ctx.save(); ctx.translate(centerX, centerY); ctx.scale(scale, scale);
        ctx.fillRect(-obs.width / 3, -obs.height / 8, obs.width / 1.5, obs.height / 4);
        ctx.fillRect(-obs.width / 8, -obs.height / 3, obs.width / 4, obs.height / 1.5);
        ctx.restore();
      } else if (obs.type === ObstacleType.HOVER_MINE) {
        const bob = Math.sin((animTimeRef.current * 5) + (obs.frameOffset || 0)) * 5;
        ctx.shadowColor = COLORS.NEON_RED; ctx.fillStyle = '#333';
        const cx = obs.x + obs.width / 2;
        const cy = obs.y + obs.height / 2 + (isPortrait ? 0 : bob);
        const rad = Math.min(obs.width, obs.height) / 2.5;

        ctx.beginPath(); ctx.arc(cx, cy, rad, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = COLORS.NEON_RED; ctx.lineWidth = 2;
        for (let i = 0; i < 8; i++) {
          const a = i * Math.PI / 4;
          ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad);
          ctx.lineTo(cx + Math.cos(a) * rad * 1.5, cy + Math.sin(a) * rad * 1.5); ctx.stroke();
        }
      } else if (obs.type === ObstacleType.GLASS_CEILING) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'; ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        ctx.strokeStyle = p.obstacle; ctx.lineWidth = 4; ctx.strokeRect(obs.x, obs.y, obs.width, obs.height);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'; ctx.lineWidth = 1;
        for (let gy = obs.y + 5; gy < obs.y + obs.height; gy += 10) {
          ctx.beginPath(); ctx.moveTo(obs.x, gy); ctx.lineTo(obs.x + obs.width, gy); ctx.stroke();
        }
      } else if (obs.type === ObstacleType.DATA_CORRUPTER) {
        const size = obs.width;
        ctx.save(); ctx.translate(obs.x + size / 2, obs.y + size / 2);
        ctx.rotate(animTimeRef.current * 5); ctx.shadowBlur = 25; ctx.shadowColor = COLORS.NEON_PURPLE;
        ctx.fillStyle = Math.sin(animTimeRef.current * 20) > 0 ? COLORS.NEON_PURPLE : '#fff';
        ctx.fillRect(-size / 2, -size / 2, size, size); ctx.restore();
      } else if (obs.type === ObstacleType.POWERUP) {
        const pType = obs.powerupType || PowerupType.SHIELD;
        const color = POWERUP_CONFIG[pType].color;
        const centerX = obs.x + obs.width / 2;
        const centerY = obs.y + obs.height / 2;
        const rad = Math.min(obs.width, obs.height) / 2;

        ctx.shadowColor = color; ctx.shadowBlur = 20;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.beginPath(); ctx.arc(centerX, centerY, rad, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.stroke();

        // Icon Symbol
        ctx.fillStyle = color; ctx.font = `bold ${Math.floor(rad * 1.2)}px 'Share Tech Mono'`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(pType === PowerupType.SHIELD ? 'S' : 'R', centerX, centerY);
      } else {
        // Standard Drone / Obstacle
        ctx.shadowColor = p.obstacle; ctx.fillStyle = '#111';
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        const blink = Math.sin(animTimeRef.current * 12) > 0;
        ctx.fillStyle = blink ? p.obstacle : '#000';
        ctx.beginPath(); ctx.arc(obs.x + obs.width / 2, obs.y + obs.height / 2, 4, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    });

    // Lasers
    lasersRef.current.forEach(l => {
      ctx.save(); ctx.globalAlpha = l.life / l.maxLife; ctx.shadowBlur = 20; ctx.shadowColor = COLORS.NEON_CYAN;
      ctx.fillStyle = '#fff'; ctx.strokeStyle = COLORS.NEON_CYAN; ctx.lineWidth = 4;
      if (isPortrait) {
        const lw = width * (PORTRAIT_LANE_WIDTH_PERCENT / 100);
        const lx = l.lane * lw + lw / 2;
        ctx.beginPath(); ctx.moveTo(lx, 0); ctx.lineTo(lx, height); ctx.stroke();
      } else {
        ctx.beginPath(); ctx.moveTo(PLAYER_X + PLAYER_WIDTH, playerRef.current.y + 15); ctx.lineTo(width, playerRef.current.y + 15); ctx.stroke();
      }
      ctx.restore();
    });

    // Player
    const pl = playerRef.current;
    ctx.save();
    if (invincibleFramesRef.current > 0) ctx.globalAlpha = 0.5 + Math.sin(animTimeRef.current * 30) * 0.3;

    if (isPortrait) {
      const cx = pl.laneX!;
      const cy = height - PORTRAIT_PLAYER_Y_OFFSET - (pl.altitude || 0);

      const isLaserReady = laserCooldownRef.current === 0;
      if (isSynergy || pl.activeEffectType || isLaserReady) {
        let auraColor = '#fff';
        if (isSynergy) auraColor = '#fff';
        else if (pl.activeEffectType === PowerupType.REFLECT) auraColor = POWERUP_CONFIG.REFLECT.color;
        else if (isLaserReady) auraColor = '#ff0080'; // Neon pink for laser ready

        ctx.save(); ctx.shadowBlur = 30; ctx.shadowColor = auraColor; ctx.fillStyle = auraColor + '44';
        ctx.beginPath(); ctx.arc(cx, cy, 30 + Math.sin(animTimeRef.current * 15) * 5, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      }

      ctx.fillStyle = p.primary; ctx.shadowBlur = 20; ctx.shadowColor = p.primary;
      ctx.beginPath(); ctx.moveTo(cx, cy - 20); ctx.lineTo(cx + 20, cy); ctx.lineTo(cx, cy + 20); ctx.lineTo(cx - 20, cy); ctx.closePath(); ctx.fill();

      // Trail
      if (!pl.isGrounded || (pl.altitude || 0) > 5) {
        const trailIntensity = Math.min((pl.altitude || 0) / 50, 1);
        for (let i = 0; i < 3; i++) {
          ctx.save(); ctx.globalAlpha = (1 - i * 0.3) * trailIntensity * 0.5;
          ctx.beginPath(); ctx.arc(cx, cy + 25 + i * 10, 8 - i * 2, 0, Math.PI * 2); ctx.fill(); ctx.restore();
        }
      }

      if (pl.hasShield) {
        ctx.strokeStyle = POWERUP_CONFIG.SHIELD.color; ctx.lineWidth = 3; ctx.beginPath();
        for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; ctx.lineTo(cx + 35 * Math.cos(a), cy + 35 * Math.sin(a)); }
        ctx.closePath(); ctx.stroke();
      }
      if (pl.activeEffectType === PowerupType.REFLECT) {
        ctx.save();
        ctx.strokeStyle = POWERUP_CONFIG.REFLECT.color; ctx.lineWidth = 4; ctx.setLineDash([5, 5]);
        ctx.beginPath();
        for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; ctx.lineTo(cx + 45 * Math.cos(a), cy + 45 * Math.sin(a)); }
        ctx.closePath(); ctx.stroke();
        ctx.restore();
      }
    } else {
      const ph = pl.isDucking ? PLAYER_HEIGHT_DUCKING : PLAYER_HEIGHT_STANDING;

      // Laser ready glow for landscape
      const isLaserReady = laserCooldownRef.current === 0;
      if (isLaserReady) {
        ctx.save();
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#ff0080';
        ctx.fillStyle = 'rgba(255, 0, 128, 0.2)';
        ctx.fillRect(PLAYER_X - 5, pl.y - 5, PLAYER_WIDTH + 10, ph + 10);
        ctx.restore();
      }

      ctx.fillStyle = p.primary; ctx.shadowBlur = 15; ctx.shadowColor = p.primary;
      ctx.fillRect(PLAYER_X, pl.y, PLAYER_WIDTH, ph);

      if (pl.hasShield) {
        ctx.strokeStyle = POWERUP_CONFIG.SHIELD.color; ctx.lineWidth = 3;
        ctx.strokeRect(PLAYER_X - 5, pl.y - 5, PLAYER_WIDTH + 10, ph + 10);
      }
      if (pl.activeEffectType === PowerupType.REFLECT) {
        ctx.strokeStyle = POWERUP_CONFIG.REFLECT.color; ctx.lineWidth = 4; ctx.setLineDash([5, 5]);
        ctx.strokeRect(PLAYER_X - 10, pl.y - 10, PLAYER_WIDTH + 20, ph + 20);
      }
    }
    ctx.restore();

    // Boss
    if (bossRef.current) {
      const b = bossRef.current;
      ctx.save(); ctx.shadowBlur = 30; ctx.shadowColor = b.phase === BossPhase.ATTACKING ? COLORS.NEON_RED : COLORS.NEON_PURPLE;
      ctx.fillStyle = b.phase === BossPhase.ATTACKING ? COLORS.NEON_RED : COLORS.NEON_PURPLE;
      ctx.fillRect(b.x - b.width / 2, b.y - b.height / 2, b.width, b.height);

      const hpy = b.y - b.height / 2 - 20;
      const barWidth = 120; const segmentGap = 4;
      const segmentWidth = (barWidth - (b.maxHealth - 1) * segmentGap) / b.maxHealth;
      for (let i = 0; i < b.maxHealth; i++) {
        ctx.fillStyle = i < b.health ? COLORS.NEON_RED : '#333';
        ctx.fillRect(b.x - barWidth / 2 + i * (segmentWidth + segmentGap), hpy, segmentWidth, 8);
      }

      if (b.phase === BossPhase.PREPARING_ATTACK) {
        ctx.fillStyle = `rgba(255,0,0, ${0.1 + b.beamChargeLevel * 0.4})`;
        if (isPortrait) { const lw = width * (PORTRAIT_LANE_WIDTH_PERCENT / 100); ctx.fillRect(b.targetLane * lw, 0, lw, height); }
        else { ctx.fillRect(0, b.targetLane - 30, width, 60); }
      } else if (b.phase === BossPhase.ATTACKING) {
        ctx.fillStyle = '#fff'; ctx.shadowBlur = 40; ctx.shadowColor = COLORS.NEON_RED;
        if (isPortrait) { const lw = width * (PORTRAIT_LANE_WIDTH_PERCENT / 100); ctx.fillRect(b.targetLane * lw + lw / 2 - 10, 0, 20, height); }
        else { ctx.fillRect(0, b.targetLane - 10, width, 20); }
      }
      ctx.restore();
    }

    // SYSTEM VERIFICATION
    ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.font = "bold 24px 'Share Tech Mono'"; ctx.textAlign = 'right';
    ctx.fillText("V-CORP OS v2.0.6-MASTER", width - 20, 20);

    // Floating Texts
    floatingTextsRef.current.forEach(t => {
      ctx.save(); ctx.globalAlpha = t.life; ctx.fillStyle = t.color; ctx.font = `${t.fontSize}px "Share Tech Mono"`;
      ctx.textAlign = 'center'; ctx.fillText(t.text, t.x, t.y); ctx.restore();
    });

    // Particles
    particlesRef.current.forEach(part => { ctx.fillStyle = part.color; ctx.globalAlpha = part.life; ctx.fillRect(part.x, part.y, 4, 4); });

    // Synergy Vignette
    if (isSynergy) {
      ctx.save();
      const gradient = ctx.createRadialGradient(width / 2, height / 2, Math.min(width, height) * 0.3, width / 2, height / 2, Math.max(width, height) * 0.7);
      const pulse = Math.sin(animTimeRef.current * 6) * 0.3 + 0.5;
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
      gradient.addColorStop(1, `rgba(0, 240, 255, ${pulse * 0.3})`);
      ctx.fillStyle = gradient; ctx.fillRect(0, 0, width, height); ctx.restore();
    }

    ctx.restore();
  }, [isPortrait, synergyActiveFramesRef, currentBiomeIndexRef, nextBiomeIndexRef, biomeTransitionRef, framesRef, speedRef, animTimeRef, starsRef, creditsRef, obstaclesRef, lasersRef, playerRef, invincibleFramesRef, bossRef, floatingTextsRef, particlesRef]);

  const loop = useCallback((time: number) => {
    if (!lastTimeRef.current) lastTimeRef.current = time;
    const deltaTimeLimit = 2.0;
    const dt = Math.min(deltaTimeLimit, (time - lastTimeRef.current) / (1000 / 60));
    lastTimeRef.current = time;
    if (gameState === GameState.PLAYING) update(dt);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) draw(ctx);
    requestRef.current = requestAnimationFrame(loop);
  }, [gameState, update, draw]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(requestRef.current);
  }, [loop]);

  useEffect(() => {
    if (gameState === GameState.PLAYING && prevGameState.current === GameState.MENU) {
      resetGame();
    }
    prevGameState.current = gameState;
  }, [gameState, resetGame]);

  useEffect(() => {
    resetGame();
  }, [resetGame]);

  // Boss hint fade animation
  useEffect(() => {
    if (bossHint) {
      // Fade in
      setBossHintOpacity(0);
      const fadeIn = setInterval(() => {
        setBossHintOpacity(prev => {
          if (prev >= 1) {
            clearInterval(fadeIn);
            return 1;
          }
          return prev + 0.05;
        });
      }, 16);
      return () => clearInterval(fadeIn);
    } else if (bossHintOpacity > 0) {
      // Fade out
      const fadeOut = setInterval(() => {
        setBossHintOpacity(prev => {
          if (prev <= 0) {
            clearInterval(fadeOut);
            return 0;
          }
          return prev - 0.1;
        });
      }, 16);
      return () => clearInterval(fadeOut);
    }
  }, [bossHint]);

  // Intro sequence controller
  useEffect(() => {
    if (gameState === GameState.PLAYING && prevGameState.current === GameState.MENU) {
      // Start intro sequence
      setIntroPhase('logo');
      setIntroOpacity(0);

      // Fade in logo
      let opacity = 0;
      const logoFadeIn = setInterval(() => {
        opacity += 0.05;
        setIntroOpacity(opacity);
        if (opacity >= 1) clearInterval(logoFadeIn);
      }, 16);

      // Phase 1: Logo (1.5s)
      setTimeout(() => {
        clearInterval(logoFadeIn);
        // Fade out logo
        const logoFadeOut = setInterval(() => {
          opacity -= 0.1;
          setIntroOpacity(opacity);
          if (opacity <= 0) {
            clearInterval(logoFadeOut);
            setIntroPhase('brief');
            opacity = 0;
            // Fade in brief
            const briefFadeIn = setInterval(() => {
              opacity += 0.05;
              setIntroOpacity(opacity);
              if (opacity >= 1) clearInterval(briefFadeIn);
            }, 16);
          }
        }, 16);
      }, 1500);

      // Phase 2: Mission Brief (3s from start)
      setTimeout(() => {
        // Fade out brief
        opacity = 1;
        const briefFadeOut = setInterval(() => {
          opacity -= 0.1;
          setIntroOpacity(opacity);
          if (opacity <= 0) {
            clearInterval(briefFadeOut);
            setIntroPhase('transition');
            opacity = 0;
            // Fade in transition
            const transitionFadeIn = setInterval(() => {
              opacity += 0.05;
              setIntroOpacity(opacity);
              if (opacity >= 1) clearInterval(transitionFadeIn);
            }, 16);
          }
        }, 16);
      }, 3000);

      // Phase 3: Complete intro (4s total)
      setTimeout(() => {
        opacity = 1;
        const finalFadeOut = setInterval(() => {
          opacity -= 0.05;
          setIntroOpacity(opacity);
          if (opacity <= 0) {
            clearInterval(finalFadeOut);
            setIntroPhase(null);
          }
        }, 16);
      }, 4000);
    }
  }, [gameState]);

  return (
    <div ref={containerRef} className="w-full h-full relative bg-black overflow-hidden font-tech">
      <canvas ref={canvasRef} className="block w-full h-full"
        onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} />

      {gameState === GameState.PAUSED && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-md z-50">
          <div className="text-center animate-in zoom-in duration-300">
            <h2 className="text-5xl font-cyber font-black text-white italic tracking-tighter mb-8">SYSTEM PAUSED</h2>
            <button onClick={() => setGameState(GameState.PLAYING)} className="px-12 py-4 bg-cyan-500 text-black font-black uppercase skew-x-[-12deg] hover:bg-white transition-colors">RESUME MISSION</button>
          </div>
        </div>
      )}

      {bossHint && gameState === GameState.PLAYING && bossHintOpacity > 0 && (
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 z-40 pointer-events-none transition-opacity duration-300" style={{ opacity: bossHintOpacity }}>
          <div className="relative">
            {/* Corner brackets */}
            <div className="absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 border-cyan-400"></div>
            <div className="absolute -top-2 -right-2 w-4 h-4 border-t-2 border-r-2 border-cyan-400"></div>
            <div className="absolute -bottom-2 -left-2 w-4 h-4 border-b-2 border-l-2 border-cyan-400"></div>
            <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 border-cyan-400"></div>

            {/* Glow effect */}
            <div className="absolute inset-0 bg-cyan-500/20 blur-xl animate-pulse"></div>

            {/* Main content */}
            <div className="relative bg-gradient-to-br from-cyan-950/60 to-black/80 border border-cyan-400/50 backdrop-blur-md px-6 sm:px-8 py-3 sm:py-4 skew-x-[-8deg]">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-cyan-400 animate-pulse rounded-full shadow-[0_0_10px_rgba(34,211,238,0.8)]"></div>
                <span className="text-cyan-400 font-black uppercase tracking-[0.3em] text-xs sm:text-base md:text-lg whitespace-nowrap drop-shadow-[0_0_15px_rgba(34,211,238,0.6)]">
                  {bossHint}
                </span>
                <div className="w-2 h-2 bg-cyan-400 animate-pulse rounded-full shadow-[0_0_10px_rgba(34,211,238,0.8)]"></div>
              </div>

              {/* Scan line effect */}
              <div className="absolute inset-0 overflow-hidden opacity-30">
                <div className="absolute w-full h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-[scan_2s_ease-in-out_infinite]"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Intro Phases */}
      {introPhase === 'logo' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-50 pointer-events-none" style={{ opacity: introOpacity }}>
          <h1 className="text-4xl sm:text-6xl md:text-8xl font-cyber font-black text-transparent bg-clip-text bg-gradient-to-r from-neon-yellow via-neon-blue to-neon-yellow animate-pulse tracking-tighter">
            V-CORP
          </h1>
        </div>
      )}

      {introPhase === 'brief' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-50 pointer-events-none" style={{ opacity: introOpacity }}>
          <div className="max-w-2xl px-8 text-center space-y-4">
            <h2 className="text-2xl sm:text-4xl font-cyber text-neon-red tracking-widest uppercase mb-2">MISSION BRIEFING</h2>
            <p className="text-sm sm:text-lg font-tech text-neon-cyan leading-relaxed">
              OPERATIVE: YOUR QUOTA IS CRITICAL.<br />
              AVOID DRONES. COLLECT CREDITS.<br />
              <span className="text-neon-yellow">COMPLY OR BE TERMINATED.</span>
            </p>
          </div>
        </div>
      )}

      {introPhase === 'transition' && (
        <div className="absolute inset-0 bg-black z-50 pointer-events-none" style={{ opacity: 1 - introOpacity }} />
      )}

      {/* Controls Guidance Overlay (Tutorial) */}
      {guideVisible && (
        <div className="absolute inset-0 z-20 pointer-events-none">
          <ControlsGuidance mode="overlay" />
        </div>
      )}
    </div>
  );
};

export default React.memo(GameCanvas);