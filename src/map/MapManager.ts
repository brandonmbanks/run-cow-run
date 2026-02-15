import Phaser from 'phaser';
import { TILE_SIZE, COLORS } from '../constants';
import { generateMap, TILE_GRASS, TILE_DRAWBRIDGE, MapData } from './MapGenerator';

const TILESET_KEY = 'map-tiles';

export class MapManager {
  private scene: Phaser.Scene;
  obstacleLayer!: Phaser.Tilemaps.TilemapLayer;
  grid!: number[][];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /** Create tileset texture, generate map, and build tilemap layers. */
  create(spawnCol: number, spawnRow: number, mapTiles: number, obstacleDensity: number, keyCount: number): MapData {
    this.createTilesetTexture();
    const mapData = generateMap(spawnCol, spawnRow, mapTiles, obstacleDensity, keyCount);
    this.grid = mapData.grid;
    this.buildTilemap();
    return mapData;
  }

  private createTilesetTexture(): void {
    if (this.scene.textures.exists(TILESET_KEY)) {
      this.scene.textures.remove(TILESET_KEY);
    }

    const tileCount = 8;
    const canvas = this.scene.textures.createCanvas(
      TILESET_KEY,
      TILE_SIZE * tileCount,
      TILE_SIZE,
    )!;
    const ctx = canvas.context;
    const S = TILE_SIZE;

    // Helper: get rgba string from integer color
    const rgba = (c: number) => Phaser.Display.Color.IntegerToColor(c).rgba;

    // --- Tile 0: Grass ---
    ctx.fillStyle = rgba(COLORS.grass);
    ctx.fillRect(0, 0, S, S);
    ctx.fillStyle = rgba(COLORS.grassAlt);
    for (let i = 0; i < 6; i++) {
      ctx.fillRect(Math.random() * (S - 4), Math.random() * (S - 4), 2, 4);
    }

    // --- Tile 1: Tree ---
    const t1 = S;
    ctx.fillStyle = rgba(COLORS.grass);
    ctx.fillRect(t1, 0, S, S);
    ctx.fillStyle = rgba(COLORS.treeTrunk);
    ctx.fillRect(t1 + S / 2 - 3, S / 2, 6, S / 2);
    ctx.fillStyle = rgba(COLORS.tree);
    ctx.beginPath();
    ctx.arc(t1 + S / 2, S / 2 - 2, S / 2 - 4, 0, Math.PI * 2);
    ctx.fill();

    // --- Tile 2: Rock ---
    const t2 = S * 2;
    ctx.fillStyle = rgba(COLORS.grass);
    ctx.fillRect(t2, 0, S, S);
    ctx.fillStyle = rgba(COLORS.rock);
    ctx.beginPath();
    ctx.ellipse(t2 + S / 2, S / 2 + 2, S / 2 - 4, S / 2 - 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = rgba(COLORS.rockDark);
    ctx.beginPath();
    ctx.ellipse(t2 + S / 2 + 2, S / 2 + 4, S / 3 - 2, S / 3 - 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // --- Tile 3: Castle Wall (brick pattern) ---
    const t3 = S * 3;
    ctx.fillStyle = rgba(COLORS.castleWall);
    ctx.fillRect(t3, 0, S, S);
    ctx.strokeStyle = rgba(COLORS.castleWallDark);
    ctx.lineWidth = 1;
    // Horizontal mortar
    ctx.beginPath(); ctx.moveTo(t3, S / 2); ctx.lineTo(t3 + S, S / 2); ctx.stroke();
    // Vertical mortar (offset rows)
    ctx.beginPath(); ctx.moveTo(t3 + S / 2, 0); ctx.lineTo(t3 + S / 2, S / 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(t3 + S / 4, S / 2); ctx.lineTo(t3 + S / 4, S); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(t3 + S * 3 / 4, S / 2); ctx.lineTo(t3 + S * 3 / 4, S); ctx.stroke();
    // Edge shading
    ctx.fillStyle = rgba(COLORS.castleWallDark);
    ctx.globalAlpha = 0.3;
    ctx.fillRect(t3, 0, 2, S);
    ctx.fillRect(t3, 0, S, 2);
    ctx.globalAlpha = 1.0;

    // --- Tile 4: Castle Roof (shingles) ---
    const t4 = S * 4;
    ctx.fillStyle = rgba(COLORS.castleRoof);
    ctx.fillRect(t4, 0, S, S);
    ctx.strokeStyle = rgba(COLORS.castleRoofDark);
    ctx.lineWidth = 1;
    const rowH = S / 4;
    for (let row = 0; row < 4; row++) {
      const y = row * rowH;
      ctx.beginPath(); ctx.moveTo(t4, y); ctx.lineTo(t4 + S, y); ctx.stroke();
      const offset = row % 2 === 0 ? 0 : S / 6;
      for (let sx = offset; sx < S; sx += S / 3) {
        ctx.beginPath(); ctx.moveTo(t4 + sx, y); ctx.lineTo(t4 + sx, y + rowH); ctx.stroke();
      }
    }

    // --- Tile 5: Turret (circular tower) ---
    const t5 = S * 5;
    ctx.fillStyle = rgba(COLORS.castleWall);
    ctx.fillRect(t5, 0, S, S);
    // Stone circle
    ctx.fillStyle = rgba(COLORS.turret);
    ctx.beginPath();
    ctx.arc(t5 + S / 2, S / 2, S / 2 - 2, 0, Math.PI * 2);
    ctx.fill();
    // Inner darker ring
    ctx.fillStyle = rgba(COLORS.turretDark);
    ctx.beginPath();
    ctx.arc(t5 + S / 2, S / 2, S / 2 - 6, 0, Math.PI * 2);
    ctx.fill();
    // Center highlight
    ctx.fillStyle = rgba(COLORS.turret);
    ctx.beginPath();
    ctx.arc(t5 + S / 2, S / 2, S / 4 - 2, 0, Math.PI * 2);
    ctx.fill();
    // Crenellation dots (4 small squares around edge)
    ctx.fillStyle = rgba(COLORS.castleWallDark);
    const crenR = S / 2 - 3;
    for (let a = 0; a < 4; a++) {
      const angle = (a * Math.PI) / 2 + Math.PI / 4;
      const cx2 = t5 + S / 2 + Math.cos(angle) * crenR;
      const cy2 = S / 2 + Math.sin(angle) * crenR;
      ctx.fillRect(cx2 - 2, cy2 - 2, 4, 4);
    }

    // --- Tile 6: Gate (portcullis) ---
    const t6 = S * 6;
    // Dark background
    ctx.fillStyle = rgba(COLORS.gate);
    ctx.fillRect(t6, 0, S, S);
    // Iron bars (vertical)
    ctx.fillStyle = rgba(COLORS.gateBars);
    for (let bx = 4; bx < S; bx += 8) {
      ctx.fillRect(t6 + bx, 0, 2, S);
    }
    // Horizontal crossbars
    for (let by = 6; by < S; by += 10) {
      ctx.fillRect(t6, by, S, 2);
    }

    // --- Tile 7: Drawbridge (wooden planks) ---
    const t7 = S * 7;
    ctx.fillStyle = rgba(COLORS.drawbridge);
    ctx.fillRect(t7, 0, S, S);
    // Plank gaps (horizontal lines)
    ctx.strokeStyle = rgba(COLORS.drawbridgeDark);
    ctx.lineWidth = 1;
    for (let py = 0; py < S; py += 6) {
      ctx.beginPath(); ctx.moveTo(t7, py); ctx.lineTo(t7 + S, py); ctx.stroke();
    }
    // Wood grain (subtle vertical streaks)
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = rgba(COLORS.drawbridgeDark);
    for (let i = 0; i < 5; i++) {
      const gx = Math.random() * (S - 2);
      ctx.fillRect(t7 + gx, 0, 1, S);
    }
    ctx.globalAlpha = 1.0;
    // Border edges
    ctx.strokeStyle = rgba(COLORS.drawbridgeDark);
    ctx.lineWidth = 2;
    ctx.strokeRect(t7 + 1, 1, S - 2, S - 2);

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

    // Everything except grass and drawbridge collides
    this.obstacleLayer.setCollisionByExclusion([TILE_GRASS, TILE_DRAWBRIDGE]);
  }
}
