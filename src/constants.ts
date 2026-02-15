export const TILE_SIZE = 32;
export const MAP_TILES = 50;
export const MAP_SIZE = TILE_SIZE * MAP_TILES; // 1600

export const PLAYER_SPEED = 160;
export const KNIGHT_SPEED_BASE = 90;
export const KNIGHT_SPEED_MAX = 140;
export const KNIGHT_SPAWN_INTERVAL = 15000; // ms
export const KNIGHT_PATH_INTERVAL = 500; // ms
export const MAX_KNIGHTS = 8;

// Castle
export const CASTLE_WIDTH = 7;
export const CASTLE_HEIGHT = 7;
export const CASTLE_MARGIN = 3;

// Keys
export const KEY_COUNT = 5;
export const KEY_MIN_DIST_FROM_SPAWN = 12;
export const KEY_MIN_DIST_BETWEEN = 8;

// Boss arena
export const BOSS_ARENA_WIDTH = 640;
export const BOSS_ARENA_HEIGHT = 480;
export const FIREBALL_RADIUS = 8;
export const DRAGON_FIREBALL_SPEED = 200;

// Dragon
export const DRAGON_SPEED = 70;
export const DRAGON_BODY_RADIUS = 24;
export const TRIPLE_FIREBALL_SPREAD = 0.35; // radians (~20°)
export const ROLL_TELEGRAPH_DURATION = 500;
export const ROLL_SPEED = 350;
export const ROLL_DURATION = 800;
export const SPIN_ATTACK_DURATION = 2000;
export const SPIN_FIREBALL_COUNT = 12;
export const SPIN_REVOLUTIONS = 2;
export const ATTACK_COOLDOWN_MIN = 2000;
export const ATTACK_COOLDOWN_MAX = 3500;

// Bombs
export const BOMB_SPAWN_INTERVAL = 30000;
export const BOMBS_TO_WIN = 3;
export const BOMB_RADIUS = 12;

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
