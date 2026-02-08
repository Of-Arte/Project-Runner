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

export type GridType = 'classic' | 'hex' | 'digital';

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
