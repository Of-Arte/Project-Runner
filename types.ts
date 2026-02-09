export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  GAME_OVER = 'GAME_OVER',
}

export enum ObstacleType {
  DRONE_LOW = 'DRONE_LOW',       // Jump over
  DRONE_HIGH = 'DRONE_HIGH',     // Duck under
  HOVER_MINE = 'HOVER_MINE',     // Floating hazard
  LIFE_PACK = 'LIFE_PACK',       // Restores life
  // Rare Department-Specific Obstacles
  GLASS_CEILING = 'GLASS_CEILING', // Descending barrier (Management)
  DATA_CORRUPTER = 'DATA_CORRUPTER', // Control inverter (Mainframe)
  SERVER = 'SERVER', // Towering server rack
  POWERUP = 'POWERUP',           // Special survival aid
}

export enum PowerupType {
  SHIELD = 'SHIELD',             // Firewall Buffer (Passive)
  REFLECT = 'REFLECT',           // Active Damage Reflection
}

export interface GameObject {
  x: number;
  y: number;
  width: number;
  height: number;
  type: ObstacleType;
  passed: boolean;
  shattered?: boolean;
  frameOffset?: number; 
  lane?: number; // Added for portrait mode lane tracking
  // Rare Obstacle Properties
  descendTimer?: number; // Glass Ceiling descent state
  hasInvertedControls?: boolean; // Track if Data Corrupter applied effect
  powerupType?: PowerupType; // Type of powerup if type is POWERUP
}

export enum BossPhase {
  ENTERING = 'ENTERING',
  IDLE = 'IDLE',
  PREPARING_ATTACK = 'PREPARING_ATTACK',
  ATTACKING = 'ATTACKING',
  COOLDOWN = 'COOLDOWN',
  TAKING_DAMAGE = 'TAKING_DAMAGE',
  DEFEATED = 'DEFEATED',
  LEAVING = 'LEAVING'
}

export interface BossState {
  phase: BossPhase;
  health: number;
  maxHealth: number;
  x: number;
  y: number;
  width: number;
  height: number;
  attackTimer: number;
  targetLane: number; // 0-2 for Portrait, or Y-position/lane for Landscape
  beamChargeLevel: number; // 0.0 to 1.0
  frame: number; // For animation
  attacksPerformed: number;
  maxAttacks: number;
}

export interface Laser {
  id: string;
  lane: number;
  life: number;     // Remaining frames
  maxLife: number;  // Total duration for fade out
}

export interface Credit {
  x: number;
  y: number;
  id: string;
  collected: boolean;
}

export interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
}

export interface PlayerState {
  y: number;
  vy: number;
  isDucking: boolean;
  isGrounded: boolean;
  // Portrait Mode Properties
  lane?: number; // 0: Left, 1: Center, 2: Right
  laneX?: number; // Current visual X for smoothing
  altitude?: number; // For top-down jump visualization
  // Powerup States
  hasShield?: boolean;
  activeEffectFrames: number;
  activeEffectType: PowerupType | null;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

export interface FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  vy: number;
  fontSize: number;
}

export interface GameConfig {
  // Speed / Time Handling
  baseSpeed: number;             // The "1.0" speed in pixels/frame
  timeScaleIncrement: number;    // How much time scales up per milestone (e.g. 0.1)
  
  // Legacy / Derived (used for caps)
  maxSpeed: number;              // Still relevant for capping scroll speed? or cap timeScale?
  speedMilestone: number;
  
  // Physics
  gravity: number;
  jumpForce: number;
  
  // Spawning
  obstacleSpawnRate: number;
  creditSpawnChance: number;
  lifePackBaseChance: number;
  lifePackSynergyChance: number;
}

export type GridType = 'classic' | 'digital';

export interface BiomePalette {
  background: string;
  grid: string;
  gridHighlight: string;
  text: string;
  obstacle: string;
  particlePrimary: string;
  particleSecondary: string;
}

export interface Biome {
  name: string;
  threshold: number;
  palette: BiomePalette;
  atmosphere: {
    gridType: GridType;
    particleDensity: number;
  };
}
