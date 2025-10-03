/**
 * Core data models for the Wheel within a Wheel game
 * These interfaces define the structure of game data
 */

export interface Wedge {
  id: string;
  label: string;
  weight: number;
  visualAngle?: number;
  color: string;
  media?: WedgeMedia;
}

export interface WedgeMedia {
  type: 'text' | 'image' | 'video';
  src: string;
  alt?: string;
}

export interface Wheel {
  id: string;
  label: string;
  wedges: Wedge[];
  frictionCoefficient: number;
  clutchRatio?: number; // Only for inner wheel
  radius: number;
  position: { x: number; y: number };
  currentAngle: number;
  angularVelocity: number;
}

export interface Player {
  id: string;
  name: string;
  avatarUrl?: string;
  isActive: boolean;
}

export interface GameSettings {
  maxPlayers: number;
  roundLimit?: number;
  scoreLimit?: number;
  enableSound: boolean;
  theme: string;
  deterministic: boolean;
  rngSeed?: number;
}

export interface GameState {
  wheels: Wheel[];
  players: Player[];
  currentPlayerIndex: number;
  gamePhase: 'setup' | 'playing' | 'spinning' | 'result' | 'finished';
  scores: Map<string, number>;
  settings: GameSettings;
}

export interface SpinResult {
  bigWheelWedge: Wedge;
  smallWheelWedge: Wedge;
  bigWheelIndex: number;
  smallWheelIndex: number;
}

export interface PowerMeterState {
  value: number; // 0-100
  isActive: boolean;
  oscillationSpeed: number;
}