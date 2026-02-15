import { CASTLE_WIDTH, CASTLE_HEIGHT, CASTLE_MARGIN, KEY_MIN_DIST_FROM_SPAWN, KEY_MIN_DIST_BETWEEN } from '../constants';

/** Tile indices */
export const TILE_GRASS = 0;
export const TILE_TREE = 1;
export const TILE_ROCK = 2;
export const TILE_CASTLE_WALL = 3;
export const TILE_CASTLE_ROOF = 4;
export const TILE_TURRET = 5;
export const TILE_GATE = 6;
export const TILE_DRAWBRIDGE = 7;

export interface MapData {
  grid: number[][];
  keyPositions: { col: number; row: number }[];
  gateTiles: { col: number; row: number }[];
  drawbridgeTiles: { col: number; row: number }[];
  castleCorner: { col: number; row: number };
}

/**
 * Generates a 2D grid of tile indices for the game map.
 */
export function generateMap(
  spawnCol: number,
  spawnRow: number,
  mapTiles: number,
  obstacleDensity: number,
  keyCount: number,
  clearRadius = 5,
): MapData {
  const grid: number[][] = [];

  // Fill with grass
  for (let r = 0; r < mapTiles; r++) {
    grid[r] = [];
    for (let c = 0; c < mapTiles; c++) {
      grid[r][c] = TILE_GRASS;
    }
  }

  // Rock border
  for (let r = 0; r < mapTiles; r++) {
    for (let c = 0; c < mapTiles; c++) {
      if (r === 0 || r === mapTiles - 1 || c === 0 || c === mapTiles - 1) {
        grid[r][c] = TILE_ROCK;
      }
    }
  }

  // Place castle first (before obstacles so buffer clearing works)
  const castleResult = placeCastle(grid, spawnCol, spawnRow, mapTiles);

  // Place random obstacles in the interior
  for (let r = 1; r < mapTiles - 1; r++) {
    for (let c = 1; c < mapTiles - 1; c++) {
      const dr = Math.abs(r - spawnRow);
      const dc = Math.abs(c - spawnCol);
      if (dr <= clearRadius && dc <= clearRadius) continue;

      if (grid[r][c] !== TILE_GRASS) continue;

      if (
        grid[r - 1][c] !== TILE_GRASS ||
        grid[r + 1]?.[c] !== TILE_GRASS ||
        grid[r][c - 1] !== TILE_GRASS ||
        grid[r][c + 1] !== TILE_GRASS
      ) {
        continue;
      }

      if (Math.random() < obstacleDensity) {
        grid[r][c] = Math.random() < 0.6 ? TILE_TREE : TILE_ROCK;
      }
    }
  }

  // Place keys
  const keyPositions = placeKeys(grid, spawnCol, spawnRow, castleResult.castleCorner, mapTiles, keyCount);

  return {
    grid,
    keyPositions,
    gateTiles: castleResult.gateTiles,
    drawbridgeTiles: castleResult.drawbridgeTiles,
    castleCorner: castleResult.castleCorner,
  };
}

/**
 * Places a 7x7 castle in a random corner (farthest from spawn, with tie-breaking).
 * Features: walls, roof interior, turrets on corners, gate (3-wide, sealed), drawbridge (2 deep).
 */
function placeCastle(
  grid: number[][],
  spawnCol: number,
  spawnRow: number,
  mapTiles: number,
): { gateTiles: { col: number; row: number }[]; drawbridgeTiles: { col: number; row: number }[]; castleCorner: { col: number; row: number } } {
  const margin = CASTLE_MARGIN;
  const corners = [
    { col: margin, row: margin },
    { col: mapTiles - CASTLE_WIDTH - margin, row: margin },
    { col: margin, row: mapTiles - CASTLE_HEIGHT - margin },
    { col: mapTiles - CASTLE_WIDTH - margin, row: mapTiles - CASTLE_HEIGHT - margin },
  ];

  // Shuffle first so equal distances get random pick
  for (let i = corners.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [corners[i], corners[j]] = [corners[j], corners[i]];
  }

  // Pick farthest corner from spawn
  let best = corners[0];
  let bestDist = 0;
  for (const corner of corners) {
    const cx = corner.col + CASTLE_WIDTH / 2;
    const cy = corner.row + CASTLE_HEIGHT / 2;
    const dist = Math.abs(cx - spawnCol) + Math.abs(cy - spawnRow);
    if (dist > bestDist) {
      bestDist = dist;
      best = corner;
    }
  }

  const startCol = best.col;
  const startRow = best.row;
  const endCol = startCol + CASTLE_WIDTH - 1;
  const endRow = startRow + CASTLE_HEIGHT - 1;

  // Fill the 7x7: walls on perimeter, roof on interior
  for (let r = startRow; r <= endRow; r++) {
    for (let c = startCol; c <= endCol; c++) {
      if (r === startRow || r === endRow || c === startCol || c === endCol) {
        grid[r][c] = TILE_CASTLE_WALL;
      } else {
        grid[r][c] = TILE_CASTLE_ROOF;
      }
    }
  }

  // Place turrets at the 4 corners
  grid[startRow][startCol] = TILE_TURRET;
  grid[startRow][endCol] = TILE_TURRET;
  grid[endRow][startCol] = TILE_TURRET;
  grid[endRow][endCol] = TILE_TURRET;

  // Determine gate wall face: the one closest to map center
  const castleCenterCol = startCol + Math.floor(CASTLE_WIDTH / 2);
  const castleCenterRow = startRow + Math.floor(CASTLE_HEIGHT / 2);
  const mapCenter = Math.floor(mapTiles / 2);

  const dLeft = Math.abs(startCol - mapCenter);
  const dRight = Math.abs(endCol - mapCenter);
  const dTop = Math.abs(startRow - mapCenter);
  const dBottom = Math.abs(endRow - mapCenter);
  const minD = Math.min(dLeft, dRight, dTop, dBottom);

  // Gate: 3 tiles in the wall; drawbridge: 3x2 extending outward
  const gateTiles: { col: number; row: number }[] = [];
  const drawbridgeTiles: { col: number; row: number }[] = [];

  // dc/dr define the outward direction from the gate
  let dc = 0;
  let dr = 0;

  if (minD === dLeft) {
    for (let i = -1; i <= 1; i++) gateTiles.push({ col: startCol, row: castleCenterRow + i });
    dc = -1; dr = 0;
  } else if (minD === dRight) {
    for (let i = -1; i <= 1; i++) gateTiles.push({ col: endCol, row: castleCenterRow + i });
    dc = 1; dr = 0;
  } else if (minD === dTop) {
    for (let i = -1; i <= 1; i++) gateTiles.push({ col: castleCenterCol + i, row: startRow });
    dc = 0; dr = -1;
  } else {
    for (let i = -1; i <= 1; i++) gateTiles.push({ col: castleCenterCol + i, row: endRow });
    dc = 0; dr = 1;
  }

  // Set gate tiles in grid
  for (const t of gateTiles) {
    grid[t.row][t.col] = TILE_GATE;
  }

  // Place drawbridge extending 2 tiles outward from gate
  for (let depth = 1; depth <= 2; depth++) {
    for (const gt of gateTiles) {
      const bc = gt.col + dc * depth;
      const br = gt.row + dr * depth;
      if (br >= 0 && br < mapTiles && bc >= 0 && bc < mapTiles) {
        grid[br][bc] = TILE_DRAWBRIDGE;
        drawbridgeTiles.push({ col: bc, row: br });
      }
    }
  }

  // Clear a 2-tile buffer around the castle (but preserve special tiles)
  const buffer = 2;
  for (let r = startRow - buffer; r <= endRow + buffer; r++) {
    for (let c = startCol - buffer; c <= endCol + buffer; c++) {
      if (r < 0 || r >= mapTiles || c < 0 || c >= mapTiles) continue;
      const tile = grid[r][c];
      // Only clear grass/tree tiles in the buffer zone (not castle/drawbridge/rock)
      if (tile === TILE_TREE) {
        // Clear trees in buffer
        if (r < startRow || r > endRow || c < startCol || c > endCol) {
          grid[r][c] = TILE_GRASS;
        }
      }
    }
  }

  return { gateTiles, drawbridgeTiles, castleCorner: best };
}

/**
 * Finds eligible grass tiles and picks KEY_COUNT positions
 * that are far from spawn, far from each other, and not inside the castle.
 */
function placeKeys(
  grid: number[][],
  spawnCol: number,
  spawnRow: number,
  castleCorner: { col: number; row: number },
  mapTiles: number,
  keyCount: number,
): { col: number; row: number }[] {
  const eligible: { col: number; row: number }[] = [];
  for (let r = 1; r < mapTiles - 1; r++) {
    for (let c = 1; c < mapTiles - 1; c++) {
      if (grid[r][c] !== TILE_GRASS) continue;

      const dist = Math.abs(c - spawnCol) + Math.abs(r - spawnRow);
      if (dist < KEY_MIN_DIST_FROM_SPAWN) continue;

      if (
        r >= castleCorner.row && r < castleCorner.row + CASTLE_HEIGHT &&
        c >= castleCorner.col && c < castleCorner.col + CASTLE_WIDTH
      ) continue;

      eligible.push({ col: c, row: r });
    }
  }

  for (let i = eligible.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [eligible[i], eligible[j]] = [eligible[j], eligible[i]];
  }

  const positions: { col: number; row: number }[] = [];
  for (const tile of eligible) {
    if (positions.length >= keyCount) break;

    const tooClose = positions.some((p) => {
      const d = Math.abs(p.col - tile.col) + Math.abs(p.row - tile.row);
      return d < KEY_MIN_DIST_BETWEEN;
    });
    if (tooClose) continue;

    positions.push(tile);
  }

  return positions;
}
