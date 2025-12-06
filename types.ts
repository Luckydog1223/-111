export enum ShapeType {
  HEART = 'Heart',
  FLOWER = 'Flower',
  STAR = 'Star',
  TREE = 'Tree',
  FIREWORKS = 'Fireworks'
}

export interface HandData {
  isDetected: boolean;
  isOpen: boolean; // true = open palm, false = fist
  openness: number; // 0.0 to 1.0
  position: { x: number; y: number };
}

export interface ParticleConfig {
  count: number;
  color: string;
  size: number;
}