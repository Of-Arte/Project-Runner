import React, { useRef, useEffect, useCallback, useState } from 'react';
import { GameState, GameObject, ObstacleType, PlayerState, Particle, Star, Credit } from '../types';
import { 
  GRAVITY, JUMP_FORCE, 
  PLAYER_X, PLAYER_WIDTH, PLAYER_HEIGHT_STANDING, PLAYER_HEIGHT_DUCKING,
  INITIAL_SPEED, MAX_SPEED, SPEED_INCREMENT, COLORS, DEPARTMENTS, INITIAL_LIVES, INVINCIBILITY_FRAMES,
  SYNERGY_DURATION, SYNERGY_CREDIT_VALUE, LIFE_RECOVERY_THRESHOLD
} from '../constants';
import { generatePsychologicalTriggers } from '../services/geminiService';
import { soundService } from '../services/soundEffects';

interface GameCanvasProps {
  gameState: GameState;
  setGameState: (state: GameState) => void;
  setScore: (score: number) => void;
  setLives: (lives: number) => void;
  setSynergy: (synergy: number) => void;
  setDeathCause: (finalScore: number, cause: string) => void;
  showTutorial: boolean;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ gameState, setGameState, setScore, setLives, setSynergy, setDeathCause, showTutorial }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  
  const dimensionsRef = useRef({ width: 800, height: 400, groundY: 320 });
  const [guideVisible, setGuideVisible] = useState(showTutorial);
  
  const scoreRef = useRef(0);
  const speedRef = useRef(INITIAL_SPEED);
  const framesRef = useRef(0);
  const shakeRef = useRef(0); 
  const stageRef = useRef(0);
  const livesRef = useRef(INITIAL_LIVES);
  const invincibleFramesRef = useRef(0);
  
  // Synergy System Refs
  const synergyMeterRef = useRef(0);
  const synergyActiveFramesRef = useRef(0);
  const totalCreditsCollectedRef = useRef(0);
  const sessionCreditsRef = useRef(0);
  
  const playerRef = useRef<PlayerState>({
    y: 0, 
    vy: 0,
    isDucking: false,
    isGrounded: true
  });
  
  const obstaclesRef = useRef<GameObject[]>([]);
  const creditsRef = useRef<Credit[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const starsRef = useRef<Star[]>([]);
  
  const touchStartRef = useRef<{y: number} | null>(null);
  const SWIPE_THRESHOLD = 30;

  const triggersRef = useRef<string[]>(["OBEY", "WORK", "CONSUME"]);
  const activeSubliminalRef = useRef<{text: string, opacity: number, x: number, y: number, scale: number} | null>(null);

  useEffect(() => {
    const handleResize = () => {
        if (containerRef.current && canvasRef.current) {
            const { offsetWidth, offsetHeight } = containerRef.current;
            canvasRef.current.width = offsetWidth;
            canvasRef.current.height = offsetHeight;
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

  const startJump = useCallback(() => {
    if (gameState !== GameState.PLAYING) return;
    setGuideVisible(false);
    if (playerRef.current.isGrounded) {
      playerRef.current.vy = JUMP_FORCE;
      playerRef.current.isGrounded = false;
      createParticles(PLAYER_X + PLAYER_WIDTH/2, playerRef.current.y + PLAYER_HEIGHT_STANDING, 8, COLORS.NEON_BLUE);
      soundService.playJump();
    }
  }, [gameState]);

  const endJump = useCallback(() => {
    if (gameState !== GameState.PLAYING) return;
    if (!playerRef.current.isGrounded && playerRef.current.vy < -5) playerRef.current.vy = playerRef.current.vy * 0.4; 
  }, [gameState]);

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

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
        if (e.code === 'Space' || e.code === 'ArrowUp') startJump();
        if (e.code === 'ArrowDown') startDuck();
    };
    const onKeyUp = (e: KeyboardEvent) => {
        if (e.code === 'Space' || e.code === 'ArrowUp') endJump();
        if (e.code === 'ArrowDown') endDuck();
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
        window.removeEventListener('keydown', onKeyDown);
        window.removeEventListener('keyup', onKeyUp);
    };
  }, [startJump, endJump, startDuck, endDuck]);

  const handleTouchStart = (e: React.TouchEvent) => touchStartRef.current = { y: e.touches[0].clientY };
  const handleTouchMove = (e: React.TouchEvent) => {
      if (!touchStartRef.current) return;
      const diffY = e.touches[0].clientY - touchStartRef.current.y;
      if (Math.abs(diffY) > SWIPE_THRESHOLD) {
          if (diffY < 0) { startJump(); if (playerRef.current.isDucking) playerRef.current.isDucking = false; }
          else startDuck();
      } 
  };
  const handleTouchEnd = () => { touchStartRef.current = null; endJump(); endDuck(); };

  const createParticles = (x: number, y: number, count: number, color: string) => {
    for (let i = 0; i < count; i++) {
      particlesRef.current.push({ x, y, vx: (Math.random() - 0.5) * 10, vy: (Math.random() - 0.5) * 10, life: 1.0, color });
    }
  };

  const spawnObstacle = () => {
    const { width, groundY } = dimensionsRef.current;
    const typeRoll = Math.random();
    let type = ObstacleType.DRONE_LOW;
    let w = 40, h = 40, y = groundY - h;

    if (typeRoll > 0.7) { type = ObstacleType.HOVER_MINE; w = 30; h = 30; y = groundY - 50 - Math.random() * 60; }
    else if (typeRoll > 0.4) { type = ObstacleType.DRONE_HIGH; y = groundY - 110; w = 50; h = 30; }
    else { type = ObstacleType.DRONE_LOW; w = 35; h = 35; y = groundY - h; }

    obstaclesRef.current.push({ x: width + 100, y, width: w, height: h, type, passed: false, frameOffset: Math.random() * 100 });

    // Spawn dangerous credits around obstacle
    if (Math.random() > 0.3) {
        const clusterCount = 3 + Math.floor(Math.random() * 3);
        const startX = width + 150;
        for(let i=0; i<clusterCount; i++) {
            creditsRef.current.push({
                id: Math.random().toString(36),
                x: startX + (i * 40),
                y: type === ObstacleType.DRONE_HIGH ? groundY - 20 : y - 20 - (Math.random() * 40),
                collected: false
            });
        }
    }
  };

  const resetGame = () => {
    const { groundY } = dimensionsRef.current;
    scoreRef.current = 0;
    speedRef.current = INITIAL_SPEED;
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
    particlesRef.current = [];
    playerRef.current = { y: groundY - PLAYER_HEIGHT_STANDING, vy: 0, isDucking: false, isGrounded: true };
    setScore(0);
    setLives(INITIAL_LIVES);
    setSynergy(0);
  };

  const update = useCallback(() => {
    if (gameState !== GameState.PLAYING) return;
    const { width, height, groundY } = dimensionsRef.current;
    if (height > width && width < 1024) return;

    const synergyMultiplier = synergyActiveFramesRef.current > 0 ? 1.5 : 1;
    speedRef.current = Math.min(MAX_SPEED, speedRef.current + SPEED_INCREMENT);
    scoreRef.current += speedRef.current * 0.02 * synergyMultiplier; 
    setScore(Math.floor(scoreRef.current));
    framesRef.current++;
    shakeRef.current = Math.max(0, shakeRef.current - 0.5);

    if (invincibleFramesRef.current > 0) invincibleFramesRef.current--;
    if (synergyActiveFramesRef.current > 0) {
        synergyActiveFramesRef.current--;
        setSynergy((synergyActiveFramesRef.current / SYNERGY_DURATION) * 100);
        if (synergyActiveFramesRef.current === 0) {
            synergyMeterRef.current = 0;
            setSynergy(0);
        }
    }

    const currentScore = Math.floor(scoreRef.current);
    for (let i = DEPARTMENTS.length - 1; i >= 0; i--) {
        if (currentScore >= DEPARTMENTS[i].threshold) { stageRef.current = i; break; }
    }

    if (framesRef.current % 180 === 0 && Math.random() > 0.4) {
        const word = triggersRef.current[Math.floor(Math.random() * triggersRef.current.length)];
        activeSubliminalRef.current = { text: word, opacity: 0.1 + (speedRef.current / MAX_SPEED) * 0.5, x: width / 2, y: height / 2, scale: 1 };
        shakeRef.current += 3;
    }
    
    if (activeSubliminalRef.current) {
        activeSubliminalRef.current.opacity -= 0.02;
        activeSubliminalRef.current.scale += 0.05;
        if (activeSubliminalRef.current.opacity <= 0) activeSubliminalRef.current = null;
    }

    starsRef.current.forEach(star => {
        star.x -= speedRef.current * star.speed;
        if (star.x < 0) { star.x = width + Math.random() * 50; star.y = Math.random() * height; }
    });

    const player = playerRef.current;
    player.vy += GRAVITY;
    player.y += player.vy;
    const currentHeight = player.isDucking ? PLAYER_HEIGHT_DUCKING : PLAYER_HEIGHT_STANDING;
    const playerGround = groundY - currentHeight;
    if (player.y > playerGround) { player.y = playerGround; player.vy = 0; player.isGrounded = true; }

    if (!obstaclesRef.current[obstaclesRef.current.length - 1] || (width - obstaclesRef.current[obstaclesRef.current.length - 1].x > (200 + (speedRef.current * 8)))) {
       if (Math.random() < (0.5 + stageRef.current * 0.1)) spawnObstacle(); 
    }

    // Credits Update
    for (let i = creditsRef.current.length - 1; i >= 0; i--) {
        const c = creditsRef.current[i];
        c.x -= speedRef.current;
        const dist = Math.sqrt(Math.pow(c.x - (PLAYER_X + PLAYER_WIDTH/2), 2) + Math.pow(c.y - (player.y + currentHeight/2), 2));
        if (dist < 40 && !c.collected) {
            c.collected = true;
            soundService.playCredit();
            sessionCreditsRef.current++;
            
            // Synergy Meter
            if (synergyActiveFramesRef.current === 0) {
                synergyMeterRef.current += SYNERGY_CREDIT_VALUE;
                setSynergy(synergyMeterRef.current);
                if (synergyMeterRef.current >= 100) {
                    synergyActiveFramesRef.current = SYNERGY_DURATION;
                    soundService.playSynergyStart();
                    shakeRef.current = 10;
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
          obs.x -= speedRef.current;
          if (obs.x < -150) obstaclesRef.current.splice(i, 1);
          continue;
      }
      obs.x -= speedRef.current;

      const pBox = { l: PLAYER_X + 10, r: PLAYER_X + PLAYER_WIDTH - 10, t: player.y + 5, b: player.y + currentHeight - 5 };
      const oBox = { l: obs.x, r: obs.x + obs.width, t: obs.y, b: obs.y + obs.height };
      let collided = pBox.r > oBox.l && pBox.l > oBox.r === false && pBox.b > oBox.t && pBox.t < oBox.b;
      
      if (!collided && obs.type === ObstacleType.DRONE_HIGH && !player.isDucking && PLAYER_X > obs.x - 120 && PLAYER_X < obs.x + obs.width) collided = true;

      if (collided) {
        if (synergyActiveFramesRef.current > 0) {
            obs.shattered = true;
            scoreRef.current += 500;
            createParticles(obs.x + obs.width/2, obs.y + obs.height/2, 20, COLORS.SYNERGY_WHITE);
            soundService.playScore();
            shakeRef.current = 5;
            continue;
        }

        if (invincibleFramesRef.current === 0) {
            soundService.playCollision(obs.type);
            createParticles(PLAYER_X, player.y, 30, COLORS.NEON_RED);
            shakeRef.current = 25;
            if (livesRef.current > 1) {
                livesRef.current--; setLives(livesRef.current);
                invincibleFramesRef.current = INVINCIBILITY_FRAMES;
                soundService.playRespawn();
                obstaclesRef.current.forEach(o => { if (o.x < width/2) o.x -= width; });
            } else {
                livesRef.current = 0; setLives(0);
                setDeathCause(Math.floor(scoreRef.current), "OPERATIONAL ERROR");
                setGameState(GameState.GAME_OVER);
            }
            return;
        }
      }

      if (!obs.passed && obs.x + obs.width < PLAYER_X) { obs.passed = true; scoreRef.current += 100; soundService.playScore(); }
      if (obs.x < -150) obstaclesRef.current.splice(i, 1);
    }

    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
      const p = particlesRef.current[i]; p.x += p.vx; p.y += p.vy; p.life -= 0.05;
      if (p.life <= 0) particlesRef.current.splice(i, 1);
    }
  }, [gameState, setScore, setGameState, setDeathCause, setLives, setSynergy]);

  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    const { width, height, groundY } = dimensionsRef.current;
    const isSynergy = synergyActiveFramesRef.current > 0;
    
    ctx.save();
    ctx.translate((Math.random() - 0.5) * shakeRef.current, (Math.random() - 0.5) * shakeRef.current);
    ctx.fillStyle = COLORS.DARK_BG; ctx.fillRect(-20, -20, width + 40, height + 40);

    const gridSize = 60;
    ctx.strokeStyle = isSynergy ? 'rgba(255,255,255,0.2)' : `rgba(0, 240, 255, 0.08)`;
    ctx.lineWidth = 1;
    const gridOffset = (framesRef.current * speedRef.current * (isSynergy ? 2 : 0.8)) % gridSize;
    for(let y = 0; y <= height; y+=gridSize) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke(); }
    for(let x = -gridOffset; x < width; x+=gridSize) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke(); }

    starsRef.current.forEach(star => { ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`; ctx.beginPath(); ctx.arc(star.x, star.y, star.size, 0, Math.PI*2); ctx.fill(); });

    if (gameState === GameState.MENU) { ctx.restore(); return; }

    if (activeSubliminalRef.current) {
        const msg = activeSubliminalRef.current;
        ctx.save(); ctx.globalAlpha = msg.opacity; ctx.fillStyle = isSynergy ? '#fff' : DEPARTMENTS[stageRef.current].primary;
        ctx.font = `900 120px 'Rajdhani'`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.translate(width/2, height/2); ctx.scale(msg.scale, msg.scale); ctx.fillText(msg.text, 0, 0); ctx.restore();
    }

    ctx.strokeStyle = isSynergy ? '#fff' : COLORS.NEON_BLUE; ctx.lineWidth = 2;
    ctx.shadowBlur = 15; ctx.shadowColor = ctx.strokeStyle;
    ctx.beginPath(); ctx.moveTo(0, groundY); ctx.lineTo(width, groundY); ctx.stroke(); ctx.shadowBlur = 0;

    // Credits Draw
    creditsRef.current.forEach(c => {
        ctx.save();
        ctx.shadowBlur = 10; ctx.shadowColor = COLORS.NEON_YELLOW;
        ctx.fillStyle = COLORS.NEON_YELLOW;
        const spin = Math.sin(framesRef.current * 0.2);
        ctx.translate(c.x, c.y);
        ctx.scale(spin, 1);
        ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(8, 0); ctx.lineTo(0, 10); ctx.lineTo(-8, 0); ctx.closePath(); ctx.fill();
        ctx.restore();
    });

    const p = playerRef.current;
    const ph = p.isDucking ? PLAYER_HEIGHT_DUCKING : PLAYER_HEIGHT_STANDING;
    const pulse = Math.sin(framesRef.current * 0.15) * 2;
    
    ctx.save();
    if (invincibleFramesRef.current > 0) ctx.globalAlpha = Math.sin(framesRef.current * 0.5) * 0.5 + 0.5;

    if (isSynergy) {
        ctx.shadowBlur = 30; ctx.shadowColor = '#fff'; ctx.fillStyle = '#fff';
        ctx.fillRect(PLAYER_X - pulse, p.y - pulse, PLAYER_WIDTH + pulse*2, ph + pulse*2);
    } else if (p.isDucking) {
        ctx.shadowBlur = 15; ctx.shadowColor = COLORS.NEON_BLUE; ctx.fillStyle = 'rgba(0, 240, 255, 0.8)';
        ctx.fillRect(PLAYER_X, p.y + 5, PLAYER_WIDTH, ph - 5);
    } else {
        ctx.shadowBlur = 15; ctx.shadowColor = COLORS.NEON_BLUE; ctx.fillStyle = 'rgba(0, 240, 255, 0.1)';
        ctx.strokeStyle = COLORS.NEON_BLUE; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(PLAYER_X + PLAYER_WIDTH/2, p.y - pulse); ctx.lineTo(PLAYER_X + PLAYER_WIDTH + pulse, p.y + ph/2); 
        ctx.lineTo(PLAYER_X + PLAYER_WIDTH/2, p.y + ph + pulse); ctx.lineTo(PLAYER_X - pulse, p.y + ph/2); ctx.closePath(); ctx.stroke(); ctx.fill();
    }
    ctx.restore();
    
    obstaclesRef.current.forEach(obs => {
      if (obs.shattered) return;
      ctx.shadowBlur = 15;
      if (obs.type === ObstacleType.HOVER_MINE) {
          const bob = Math.sin((framesRef.current + (obs.frameOffset||0)) * 0.1) * 5;
          ctx.shadowColor = COLORS.NEON_RED; ctx.fillStyle = '#333';
          ctx.beginPath(); ctx.arc(obs.x + 15, obs.y + 15 + bob, 15, 0, Math.PI*2); ctx.fill();
          ctx.strokeStyle = COLORS.NEON_RED; ctx.lineWidth = 2;
          ctx.beginPath(); for(let i=0; i<8; i++) { const a = i * (Math.PI/4); ctx.moveTo(obs.x + 15 + Math.cos(a)*15, obs.y + 15 + bob + Math.sin(a)*15); ctx.lineTo(obs.x + 15 + Math.cos(a)*22, obs.y + 15 + bob + Math.sin(a)*22); }
          ctx.stroke();
      } else {
        ctx.shadowColor = DEPARTMENTS[stageRef.current].primary; ctx.fillStyle = '#222';
        if (obs.type === ObstacleType.DRONE_HIGH) {
             ctx.beginPath(); ctx.moveTo(obs.x, obs.y + 10); ctx.lineTo(obs.x + obs.width, obs.y + 10); ctx.lineTo(obs.x + obs.width/2, obs.y + obs.height); ctx.fill();
             ctx.fillStyle = `rgba(255, 0, 0, 0.3)`; ctx.beginPath(); ctx.moveTo(obs.x + obs.width/2, obs.y + obs.height);
             const s = Math.sin(framesRef.current * 0.1) * 20; ctx.lineTo(obs.x - 120 + s, height); ctx.lineTo(obs.x + 20 + s, height); ctx.fill();
        } else ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        const blink = Math.sin(framesRef.current * 0.2) > 0.9;
        ctx.fillStyle = blink ? '#000' : COLORS.NEON_RED; ctx.shadowColor = COLORS.NEON_RED; ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.arc(obs.x + obs.width/2, obs.y + obs.height/2, 6, 0, Math.PI*2); ctx.fill();
      }
      ctx.shadowBlur = 0;
    });

    particlesRef.current.forEach(p => { ctx.fillStyle = p.color; ctx.globalAlpha = p.life; ctx.fillRect(p.x, p.y, 4, 4); ctx.globalAlpha = 1; });
    ctx.restore(); 
  }, [gameState]);

  const loop = useCallback(() => {
    if (gameState === GameState.PLAYING) update();
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) draw(ctx);
    requestRef.current = requestAnimationFrame(loop);
  }, [gameState, update, draw]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(requestRef.current!);
  }, [loop]);

  useEffect(() => {
    if (gameState === GameState.PLAYING || gameState === GameState.MENU) resetGame();
  }, [gameState]);

  return (
    <div ref={containerRef} className="w-full h-full relative bg-black touch-none">
        <canvas ref={canvasRef} className="block w-full h-full outline-none" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd} />
        {guideVisible && gameState === GameState.PLAYING && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center bg-black/40 z-50 animate-pulse">
                <div className="flex gap-16">
                     <div className="flex flex-col items-center gap-2">
                        <div className="w-16 h-24 border-2 border-dashed border-cyan-400 rounded-full flex flex-col items-center pt-2 bg-cyan-900/20">
                            <div className="w-12 h-12 bg-cyan-400/50 rounded-full animate-bounce mt-auto mb-2"></div>
                        </div>
                        <span className="text-cyan-400 font-bold tracking-widest text-lg">JUMP (UP)</span>
                     </div>
                     <div className="flex flex-col items-center gap-2">
                        <div className="w-16 h-24 border-2 border-dashed border-yellow-400 rounded-full flex flex-col items-center pb-2 bg-yellow-900/20">
                            <div className="w-12 h-12 bg-yellow-400/50 rounded-full animate-bounce mt-2"></div>
                        </div>
                        <span className="text-yellow-400 font-bold tracking-widest text-lg">DUCK (DOWN)</span>
                     </div>
                </div>
            </div>
        )}
        {gameState === GameState.PLAYING && (
             <div className="absolute top-4 right-4 text-right pointer-events-none">
                <div className="text-[8px] text-gray-500 font-mono tracking-widest uppercase">Dept. Zone</div>
                <div className="text-xl font-bold font-mono animate-pulse" style={{ color: DEPARTMENTS[stageRef.current].primary }}>
                    {DEPARTMENTS[stageRef.current].name}
                </div>
            </div>
        )}
    </div>
  );
};

export default GameCanvas;