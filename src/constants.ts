export const TILE_SIZE = 32;

export const PLAYER_SPEED = 160;
export const KNIGHT_PATH_INTERVAL = 500; // ms

// Castle
export const CASTLE_WIDTH = 7;
export const CASTLE_HEIGHT = 7;
export const CASTLE_MARGIN = 3;

// Keys
export const KEY_MIN_DIST_FROM_SPAWN = 12;
export const KEY_MIN_DIST_BETWEEN = 8;

// Boss arena
export const BOSS_ARENA_WIDTH = 640;
export const BOSS_ARENA_HEIGHT = 480;
export const FIREBALL_RADIUS = 8;

// Dragon (non-difficulty-varying)
export const DRAGON_SPEED = 70;
export const DRAGON_BODY_RADIUS = 24;
export const TRIPLE_FIREBALL_SPREAD = 0.35; // radians (~20°)
export const ROLL_SPEED = 350;
export const ROLL_DURATION = 800;

// Bombs
export const BOMB_SPAWN_INTERVAL = 30000;
export const BOMBS_TO_WIN = 3;
export const BOMB_RADIUS = 12;

// --- Difficulty system ---

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export interface DifficultyConfig {
  // Overworld
  mapTiles: number;
  obstacleDensity: number;
  keyCount: number;
  knightSpeedBase: number;
  knightSpeedMax: number;
  maxKnights: number;
  knightSpawnInterval: number;
  firstKnightDelay: number;
  // Boss fight
  fireballSpeed: number;
  attackCooldownMin: number;
  attackCooldownMax: number;
  stunDuration: number;
  rollTelegraphDuration: number;
  spinRevolutions: number;
  spinFireballsPerRev: number;
}

export const DIFFICULTIES: Record<DifficultyLevel, DifficultyConfig> = {
  easy: {
    mapTiles: 40,
    obstacleDensity: 0.10,
    keyCount: 3,
    knightSpeedBase: 70,
    knightSpeedMax: 110,
    maxKnights: 5,
    knightSpawnInterval: 20000,
    firstKnightDelay: 20000,
    fireballSpeed: 150,
    attackCooldownMin: 3000,
    attackCooldownMax: 5000,
    stunDuration: 1500,
    rollTelegraphDuration: 800,
    spinRevolutions: 1,
    spinFireballsPerRev: 8,
  },
  medium: {
    mapTiles: 50,
    obstacleDensity: 0.15,
    keyCount: 5,
    knightSpeedBase: 90,
    knightSpeedMax: 140,
    maxKnights: 8,
    knightSpawnInterval: 15000,
    firstKnightDelay: 15000,
    fireballSpeed: 200,
    attackCooldownMin: 2000,
    attackCooldownMax: 3500,
    stunDuration: 1000,
    rollTelegraphDuration: 500,
    spinRevolutions: 2,
    spinFireballsPerRev: 12,
  },
  hard: {
    mapTiles: 60,
    obstacleDensity: 0.15,
    keyCount: 5,
    knightSpeedBase: 110,
    knightSpeedMax: 155,
    maxKnights: 12,
    knightSpawnInterval: 10000,
    firstKnightDelay: 5000,
    fireballSpeed: 260,
    attackCooldownMin: 1200,
    attackCooldownMax: 2500,
    stunDuration: 500,
    rollTelegraphDuration: 300,
    spinRevolutions: 3,
    spinFireballsPerRev: 16,
  },
};

// --- UI ---
export const JOYSTICK_BASE_RADIUS = 50;
export const JOYSTICK_THUMB_RADIUS = 25;
export const JOYSTICK_BASE_ALPHA = 0.3;
export const JOYSTICK_THUMB_ALPHA = 0.5;
export const JOYSTICK_ZONE_WIDTH_PERCENT = 0.6;
export const HUD_FONT_SIZE = 18;
export const HUD_PADDING = 12;
export const SCREEN_SHAKE_DURATION = 200;
export const SCREEN_SHAKE_INTENSITY = 0.01;

export const COLORS = {
  grass: 0x4a8c2a,
  grassAlt: 0x3d7a22,
  tree: 0x2d6b1a,
  treeTrunk: 0x8b5e3c,
  rock: 0x888888,
  rockDark: 0x666666,
  cow: 0xffffff,
  cowSpots: 0x222222,
  cowHead: 0xffe0c0,
  knight: 0xcc2222,
  knightArmor: 0x888888,
  knightHorse: 0x8b4513,
  castleWall: 0x8a7d6b,
  castleWallDark: 0x6b5e4d,
  castleRoof: 0x7a4a3a,
  castleRoofDark: 0x5c3328,
  turret: 0x9a8d7b,
  turretDark: 0x7a6d5b,
  gate: 0x5c4033,
  gateBars: 0x333333,
  gateOpen: 0x4a8c2a,
  drawbridge: 0x8b6914,
  drawbridgeDark: 0x6b4e0e,
  key: 0xffd700,
  keyBorder: 0x222222,
  dragon: 0x2d8c2a,
  dragonBelly: 0xc8b84d,
  dragonWing: 0x1a6b1a,
  dragonEye: 0xff0000,
  dragonHorn: 0x888888,
  fireball: 0xff4500,
  fireballCore: 0xffdd00,
  arenaFloor: 0x333333,
  arenaWall: 0x555555,
  bomb: 0x111111,
  bombFuse: 0xff6600,
  bombSpark: 0xffff00,
};
