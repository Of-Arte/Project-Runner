export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
}

export enum ObstacleType {
  DRONE_LOW = 'DRONE_LOW',       // Jump over
  DRONE_HIGH = 'DRONE_HIGH',     // Duck under
  HOVER_MINE = 'HOVER_MINE',     // Floating hazard
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
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}