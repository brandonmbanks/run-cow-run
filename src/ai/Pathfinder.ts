import * as EasyStar from 'easystarjs';
import { TILE_SIZE } from '../constants';
import { TILE_GRASS, TILE_DRAWBRIDGE } from '../map/MapGenerator';

export class Pathfinder {
  private easystar: EasyStar.js;

  constructor(grid: number[][]) {
    this.easystar = new EasyStar.js();
    this.easystar.setGrid(grid);
    this.easystar.setAcceptableTiles([TILE_GRASS, TILE_DRAWBRIDGE]);
    this.easystar.enableDiagonals();
    this.easystar.disableCornerCutting();
    this.easystar.setIterationsPerCalculation(100);
  }

  worldToTile(wx: number, wy: number): { col: number; row: number } {
    return {
      col: Math.floor(wx / TILE_SIZE),
      row: Math.floor(wy / TILE_SIZE),
    };
  }

  tileToWorld(col: number, row: number): { x: number; y: number } {
    return {
      x: col * TILE_SIZE + TILE_SIZE / 2,
      y: row * TILE_SIZE + TILE_SIZE / 2,
    };
  }

  /** Find path between two world positions. Returns world coords or null via callback. */
  findPath(
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    callback: (path: { x: number; y: number }[] | null) => void,
  ): void {
    const from = this.worldToTile(fromX, fromY);
    const to = this.worldToTile(toX, toY);

    this.easystar.findPath(from.col, from.row, to.col, to.row, (tilePath) => {
      if (!tilePath || tilePath.length < 2) {
        callback(null);
        return;
      }
      // Skip first tile (current position), convert rest to world coords
      const worldPath = tilePath.slice(1).map((p) => this.tileToWorld(p.x, p.y));
      callback(worldPath);
    });
  }

  /** Must be called each frame to process async path calculations. */
  update(): void {
    this.easystar.calculate();
  }
}
