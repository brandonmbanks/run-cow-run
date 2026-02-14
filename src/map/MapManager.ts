import Phaser from 'phaser';
import { TILE_SIZE, COLORS } from '../constants';
import { generateMap, TILE_GRASS, TILE_TREE, TILE_ROCK } from './MapGenerator';

const TILESET_KEY = 'map-tiles';

export class MapManager {
  private scene: Phaser.Scene;
  obstacleLayer!: Phaser.Tilemaps.TilemapLayer;
  grid!: number[][];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /** Create tileset texture, generate map, and build tilemap layers. */
  create(spawnCol: number, spawnRow: number): void {
    this.createTilesetTexture();
    this.grid = generateMap(spawnCol, spawnRow);
    this.buildTilemap();
  }

  /** Draw grass, tree, and rock tiles into a canvas texture. */
  private createTilesetTexture(): void {
    const tileCount = 3;
    const canvas = this.scene.textures.createCanvas(
      TILESET_KEY,
      TILE_SIZE * tileCount,
      TILE_SIZE,
    )!;
    const ctx = canvas.context;

    // Tile 0: Grass
    ctx.fillStyle = Phaser.Display.Color.IntegerToColor(COLORS.grass).rgba;
    ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    // Add subtle grass detail
    ctx.fillStyle = Phaser.Display.Color.IntegerToColor(COLORS.grassAlt).rgba;
    for (let i = 0; i < 6; i++) {
      const gx = Math.random() * (TILE_SIZE - 4);
      const gy = Math.random() * (TILE_SIZE - 4);
      ctx.fillRect(gx, gy, 2, 4);
    }

    // Tile 1: Tree
    const tx = TILE_SIZE;
    ctx.fillStyle = Phaser.Display.Color.IntegerToColor(COLORS.grass).rgba;
    ctx.fillRect(tx, 0, TILE_SIZE, TILE_SIZE);
    // Trunk
    ctx.fillStyle = Phaser.Display.Color.IntegerToColor(COLORS.treeTrunk).rgba;
    ctx.fillRect(tx + TILE_SIZE / 2 - 3, TILE_SIZE / 2, 6, TILE_SIZE / 2);
    // Canopy
    ctx.fillStyle = Phaser.Display.Color.IntegerToColor(COLORS.tree).rgba;
    ctx.beginPath();
    ctx.arc(tx + TILE_SIZE / 2, TILE_SIZE / 2 - 2, TILE_SIZE / 2 - 4, 0, Math.PI * 2);
    ctx.fill();

    // Tile 2: Rock
    const rx = TILE_SIZE * 2;
    ctx.fillStyle = Phaser.Display.Color.IntegerToColor(COLORS.grass).rgba;
    ctx.fillRect(rx, 0, TILE_SIZE, TILE_SIZE);
    // Rock shape
    ctx.fillStyle = Phaser.Display.Color.IntegerToColor(COLORS.rock).rgba;
    ctx.beginPath();
    ctx.ellipse(
      rx + TILE_SIZE / 2,
      TILE_SIZE / 2 + 2,
      TILE_SIZE / 2 - 4,
      TILE_SIZE / 2 - 6,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    // Highlight
    ctx.fillStyle = Phaser.Display.Color.IntegerToColor(COLORS.rockDark).rgba;
    ctx.beginPath();
    ctx.ellipse(
      rx + TILE_SIZE / 2 + 2,
      TILE_SIZE / 2 + 4,
      TILE_SIZE / 3 - 2,
      TILE_SIZE / 3 - 4,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();

    canvas.refresh();
  }

  /** Build the Phaser tilemap from the generated grid. */
  private buildTilemap(): void {
    const map = this.scene.make.tilemap({
      data: this.grid,
      tileWidth: TILE_SIZE,
      tileHeight: TILE_SIZE,
    });

    const tileset = map.addTilesetImage(TILESET_KEY)!;

    // Single layer with all tiles
    this.obstacleLayer = map.createLayer(0, tileset, 0, 0)!;

    // Trees and rocks collide
    this.obstacleLayer.setCollisionByExclusion([TILE_GRASS]);
  }
}
