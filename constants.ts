import { GameConfig } from './types';

// Physics Constants
export const GRAVITY = 1.8; 
export const JUMP_FORCE = -22; 

// Player Constants
export const PLAYER_X = 80; 
export const PLAYER_WIDTH = 40;
export const PLAYER_HEIGHT_STANDING = 60;
export const PLAYER_HEIGHT_DUCKING = 30;

// Game Mechanics
export const INITIAL_LIVES = 3;
export const INVINCIBILITY_FRAMES = 120; // Reduced from 180 (3s -> 2s) to fix "ghosting" feel
export const SYNERGY_DURATION = 360; // 6 seconds at 60fps
export const SYNERGY_CREDIT_VALUE = 5; // % per credit
export const LIFE_RECOVERY_THRESHOLD = 50; // credits for +1 life
export const LASER_COOLDOWN_FRAMES = 600; // 10 seconds at 60fps
export const LASER_COOLDOWN_REDUCTION = 30; // 0.5 seconds reduction

// Speed Constants (Deprecated - Moving to configs)
export const INITIAL_SPEED = 6; 
export const MAX_SPEED = 45; 
export const SPEED_INCREMENT = 0.00; 

export const CREDIT_SCORE_VALUE = 100; 

// Mode Configurations
export const LANDSCAPE_CONFIG: GameConfig = {
  baseSpeed: 14,        // The "1.0" speed in pixels/frame (Increased from 10)
  maxSpeed: 80,         // Cap for scroll speed (base * timeScale) (Increased from 60)
  speedMilestone: 10000,
  timeScaleIncrement: 0.15, // Smooth time scaling
  obstacleSpawnRate: 0.6,
  creditSpawnChance: 0.7,
  lifePackBaseChance: 0.05,
  lifePackSynergyChance: 0.20,
  gravity: 1.2,         // Lower gravity for floatier jumps
  jumpForce: -20,       // Adjusted for new gravity (was -26 with 1.8 grav)
};

export const PORTRAIT_CONFIG: GameConfig = {
  baseSpeed: 8,         // Increased from 5
  maxSpeed: 50,         // Increased from 40
  speedMilestone: 10000,
  timeScaleIncrement: 0.1,
  obstacleSpawnRate: 0.5,
  creditSpawnChance: 0.7,
  lifePackBaseChance: 0.05,
  lifePackSynergyChance: 0.20,
  gravity: 1.8,
  jumpForce: -22,
};

// V-Corp Theme Colors
export const COLORS = {
  NEON_YELLOW: '#facc15',
  NEON_RED: '#f87171',
  NEON_BLUE: '#00F0FF',
  NEON_CYAN: '#22d3ee', // Alias for NEON_BLUE
  NEON_GREEN: '#4ade80',
  NEON_PURPLE: '#BD0AFF',
  SYNERGY_WHITE: '#FFFFFF',
  DARK_BG: '#050505',
  GRID_LINE: '#1A1A1A',
  TEXT_PRIMARY: '#E0E0E0',
  TEXT_SECONDARY: '#808080'
};

export const DEPARTMENTS = [
  { threshold: 0, name: "ORIENTATION", primary: COLORS.NEON_BLUE, bg: '#050510' },
  { threshold: 800, name: "PROCESSING", primary: COLORS.NEON_GREEN, bg: '#000500' },
  { threshold: 2000, name: "EXECUTIVE OVERSIGHT", primary: COLORS.NEON_RED, bg: '#1a0505' },
  { threshold: 4000, name: "THE VOID", primary: COLORS.NEON_PURPLE, bg: '#080008' }
];

export const MOCK_LEADERBOARD = [
  { username: 'NEO_CEO', score: 999999 },
  { username: 'CORP_SLAYER', score: 50000 },
  { username: 'WAGE_CAGE', score: 25000 },
  { username: 'LADDER_CLIMBER', score: 10000 },
  { username: 'INTERN_01', score: 5000 },
  { username: 'MAIL_ROOM', score: 1000 },
];

// Portrait Mode Constants
export const PORTRAIT_PLAYER_Y_OFFSET = 120; // Distance from bottom
export const PORTRAIT_PLAYER_SIZE = 40;
export const PORTRAIT_LANE_COUNT = 3;
// Lanes are percentage based: 25%, 50%, 75% of screen width typically
export const PORTRAIT_LANE_WIDTH_PERCENT = 33.33; 

// Initial speed might need to be different or same?
// Keeping same for now, but physics might feel faster/slower due to vertical FOV
