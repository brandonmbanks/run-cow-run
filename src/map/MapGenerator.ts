import { MAP_TILES } from '../constants';

/** Tile indices */
export const TILE_GRASS = 0;
export const TILE_TREE = 1;
export const TILE_ROCK = 2;

/**
 * Generates a 2D grid of tile indices for the game map.
 * - Rock border around edges
 * - ~15% obstacle density (trees + rocks)
 * - No obstacles within `clearRadius` tiles of the spawn point
 * - No two obstacles adjacent (4-directional)
 */
export function generateMap(
  spawnCol: number,
  spawnRow: number,
  clearRadius = 5,
): number[][] {
  const grid: number[][] = [];

  // Fill with grass
  for (let r = 0; r < MAP_TILES; r++) {
    grid[r] = [];
    for (let c = 0; c < MAP_TILES; c++) {
      grid[r][c] = TILE_GRASS;
    }
  }

  // Rock border
  for (let r = 0; r < MAP_TILES; r++) {
    for (let c = 0; c < MAP_TILES; c++) {
      if (r === 0 || r === MAP_TILES - 1 || c === 0 || c === MAP_TILES - 1) {
        grid[r][c] = TILE_ROCK;
      }
    }
  }

  // Place random obstacles in the interior
  const obstacleDensity = 0.15;

  for (let r = 1; r < MAP_TILES - 1; r++) {
    for (let c = 1; c < MAP_TILES - 1; c++) {
      // Skip the clear zone around spawn
      const dr = Math.abs(r - spawnRow);
      const dc = Math.abs(c - spawnCol);
      if (dr <= clearRadius && dc <= clearRadius) continue;

      // Skip if any neighbor already has an obstacle (no adjacent obstacles)
      if (
        grid[r - 1][c] !== TILE_GRASS ||
        grid[r + 1]?.[c] !== TILE_GRASS ||
        grid[r][c - 1] !== TILE_GRASS ||
        grid[r][c + 1] !== TILE_GRASS
      ) {
        continue;
      }

      if (Math.random() < obstacleDensity) {
        // ~60% trees, ~40% rocks
        grid[r][c] = Math.random() < 0.6 ? TILE_TREE : TILE_ROCK;
      }
    }
  }

  return grid;
}
