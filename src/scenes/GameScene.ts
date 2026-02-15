import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Knight } from '../entities/Knight';
import { Key } from '../entities/Key';
import { MapManager } from '../map/MapManager';
import { Pathfinder } from '../ai/Pathfinder';
import {
  COLORS,
  TILE_SIZE,
  DIFFICULTIES,
  DifficultyLevel,
  DifficultyConfig,
  SCREEN_SHAKE_DURATION,
  SCREEN_SHAKE_INTENSITY,
} from '../constants';
import { TILE_GRASS, TILE_DRAWBRIDGE, MapData } from '../map/MapGenerator';
import { HUD } from '../ui/HUD';
import { VirtualJoystick } from '../ui/VirtualJoystick';

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private mapManager!: MapManager;
  private pathfinder!: Pathfinder;
  private knights: Knight[] = [];
  private knightGroup!: Phaser.Physics.Arcade.Group;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<string, Phaser.Input.Keyboard.Key>;
  private spawnTimer = 0;
  private gameOver = false;
  private elapsedTime = 0;
  private mapData!: MapData;
  private keysCollected = 0;
  private currentKey: Key | null = null;
  private keyCollider: Phaser.Physics.Arcade.Collider | null = null;
  private hud!: HUD;
  private joystick?: VirtualJoystick;
  private gateOpen = false;
  private debugGfx!: Phaser.GameObjects.Graphics;
  private debugVisible = false;
  private difficulty: DifficultyLevel = 'medium';
  private config!: DifficultyConfig;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(data: { difficulty?: DifficultyLevel }): void {
    this.difficulty = data.difficulty ?? 'medium';
    this.config = DIFFICULTIES[this.difficulty];

    const mapTiles = this.config.mapTiles;
    const mapSize = TILE_SIZE * mapTiles;

    this.gameOver = false;
    this.knights = [];
    this.spawnTimer = this.config.knightSpawnInterval - this.config.firstKnightDelay;
    this.elapsedTime = 0;
    this.keysCollected = 0;
    this.currentKey = null;
    this.gateOpen = false;

    // Green world background
    this.cameras.main.setBackgroundColor(COLORS.grass);

    // Set world bounds
    this.physics.world.setBounds(0, 0, mapSize, mapSize);

    // Spawn at center of map
    const spawnCol = Math.floor(mapTiles / 2);
    const spawnRow = Math.floor(mapTiles / 2);

    // Generate and render the tilemap
    this.mapManager = new MapManager(this);
    this.mapData = this.mapManager.create(spawnCol, spawnRow, mapTiles, this.config.obstacleDensity, this.config.keyCount);

    // Create pathfinder from obstacle grid
    this.pathfinder = new Pathfinder(this.mapManager.grid);

    // Create player at center of map
    const spawnX = spawnCol * TILE_SIZE + TILE_SIZE / 2;
    const spawnY = spawnRow * TILE_SIZE + TILE_SIZE / 2;
    this.player = new Player(this, spawnX, spawnY);

    // Knight physics group
    this.knightGroup = this.physics.add.group();

    // Player collides with obstacles
    this.physics.add.collider(this.player, this.mapManager.obstacleLayer);

    // Knights collide with obstacles and each other
    this.physics.add.collider(this.knightGroup, this.mapManager.obstacleLayer);
    this.physics.add.collider(this.knightGroup, this.knightGroup);

    // Knights catch player (overlap, not collider — touch = caught)
    this.physics.add.overlap(this.knightGroup, this.player, () => this.onCaught());

    // Camera setup — zoom out on small screens so more map is visible
    const targetViewWidth = 480;
    const zoom = Math.min(this.scale.width / targetViewWidth, 1);
    this.cameras.main.setZoom(zoom);
    this.cameras.main.setBounds(0, 0, mapSize, mapSize);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

    // Keyboard input
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = this.input.keyboard!.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    }) as Record<string, Phaser.Input.Keyboard.Key>;

    // HUD
    this.hud = new HUD(this);
    this.hud.updateKeys(0, this.config.keyCount);

    // Virtual joystick (touch devices only)
    if (this.sys.game.device.input.touch) {
      this.joystick = new VirtualJoystick(this);
    }

    // Debug collision overlay (toggle with F1)
    this.debugGfx = this.add.graphics().setDepth(99).setVisible(false);
    this.input.keyboard!.on('keydown-F1', () => {
      this.debugVisible = !this.debugVisible;
      this.debugGfx.setVisible(this.debugVisible);
      if (!this.debugVisible) this.debugGfx.clear();
    });

    // Spawn the first key
    this.spawnNextKey();
  }

  update(time: number, delta: number): void {
    if (this.gameOver) return;

    this.elapsedTime += delta;

    // Player input
    let vx = 0;
    let vy = 0;

    if (this.cursors.left.isDown || this.wasd.left.isDown) vx = -1;
    else if (this.cursors.right.isDown || this.wasd.right.isDown) vx = 1;

    if (this.cursors.up.isDown || this.wasd.up.isDown) vy = -1;
    else if (this.cursors.down.isDown || this.wasd.down.isDown) vy = 1;

    if (this.joystick?.isActive) {
      vx = this.joystick.forceX;
      vy = this.joystick.forceY;
    }

    this.player.move(vx, vy);

    // Process pathfinding calculations
    this.pathfinder.update();

    // Update knight speeds and movement
    const elapsed = this.elapsedTime / 1000;
    const speed = Math.min(this.config.knightSpeedBase + elapsed * 0.5, this.config.knightSpeedMax);
    for (const knight of this.knights) {
      knight.setSpeed(speed);
      knight.step(time, delta);
    }

    // Spawn knights periodically
    this.spawnTimer += delta;
    if (this.spawnTimer >= this.config.knightSpawnInterval && this.knights.length < this.config.maxKnights) {
      this.spawnTimer = 0;
      this.spawnKnight();
    }

    // Debug: draw collision circles (F1 to toggle)
    if (this.debugVisible) {
      this.debugGfx.clear();
      this.debugGfx.lineStyle(2, 0xff0000, 0.8);
      // Player body
      const pb = this.player.body;
      this.debugGfx.strokeCircle(
        pb.position.x + pb.halfWidth,
        pb.position.y + pb.halfHeight,
        pb.halfWidth,
      );
      // Current key body
      if (this.currentKey?.body) {
        const kb = this.currentKey.body;
        this.debugGfx.strokeCircle(
          kb.position.x + kb.halfWidth,
          kb.position.y + kb.halfHeight,
          kb.halfWidth,
        );
      }
    }
  }

  private spawnNextKey(): void {
    if (this.keysCollected >= this.config.keyCount) return;

    const pos = this.mapData.keyPositions[this.keysCollected];
    const px = pos.col * TILE_SIZE + TILE_SIZE / 2;
    const py = pos.row * TILE_SIZE + TILE_SIZE / 2;

    this.currentKey = new Key(this, px, py);
    this.keyCollider = this.physics.add.overlap(this.player, this.currentKey, () => this.onKeyCollected());
  }

  private onKeyCollected(): void {
    if (!this.currentKey) return;

    // Remove the overlap collider before destroying the key
    if (this.keyCollider) {
      this.physics.world.removeCollider(this.keyCollider);
      this.keyCollider = null;
    }

    this.currentKey.destroy();
    this.currentKey = null;
    this.keysCollected++;
    this.hud.updateKeys(this.keysCollected, this.config.keyCount);

    if (this.keysCollected >= this.config.keyCount) {
      this.openGate();
    } else {
      this.spawnNextKey();
    }
  }

  private openGate(): void {
    this.gateOpen = true;

    // Swap gate tiles to drawbridge (walkable) in the tilemap
    const layer = this.mapManager.obstacleLayer;
    for (const gt of this.mapData.gateTiles) {
      layer.putTileAt(TILE_DRAWBRIDGE, gt.col, gt.row);
    }
    // Re-apply collision rules so the new tiles are walkable
    layer.setCollisionByExclusion([TILE_GRASS, TILE_DRAWBRIDGE]);

    // Gold camera flash
    this.cameras.main.flash(500, 255, 215, 0);

    // Create a trigger zone sized to fit exactly the gate tiles
    const cols = this.mapData.gateTiles.map((t) => t.col);
    const rows = this.mapData.gateTiles.map((t) => t.row);
    const minCol = Math.min(...cols);
    const maxCol = Math.max(...cols);
    const minRow = Math.min(...rows);
    const maxRow = Math.max(...rows);

    const zoneX = minCol * TILE_SIZE + ((maxCol - minCol + 1) * TILE_SIZE) / 2;
    const zoneY = minRow * TILE_SIZE + ((maxRow - minRow + 1) * TILE_SIZE) / 2;
    const zoneW = (maxCol - minCol + 1) * TILE_SIZE;
    const zoneH = (maxRow - minRow + 1) * TILE_SIZE;

    const zone = this.add.zone(zoneX, zoneY, zoneW, zoneH);
    this.physics.add.existing(zone, true); // static body
    this.physics.add.overlap(this.player, zone, () => this.onEnterCastle());
  }

  private onEnterCastle(): void {
    if (this.gameOver) return;
    this.gameOver = true;

    this.player.body.setVelocity(0, 0);
    for (const knight of this.knights) {
      knight.body.setVelocity(0, 0);
    }

    const score = Math.floor(this.elapsedTime / 1000);
    // BossScene not yet implemented — fall back to GameOverScene
    if (this.scene.get('BossScene')) {
      this.scene.start('BossScene', { score, difficulty: this.difficulty, keysCollected: this.keysCollected, keyCount: this.config.keyCount });
    } else {
      this.scene.start('GameOverScene', { score, victory: true, keysCollected: this.keysCollected, keyCount: this.config.keyCount });
    }
  }

  private spawnKnight(): void {
    const pos = this.findEdgeSpawnPosition();
    if (!pos) return;

    const knight = new Knight(this, pos.x, pos.y, this.player, this.pathfinder);
    this.knights.push(knight);
    this.knightGroup.add(knight);
  }

  /** Find a random grass tile along the inner edge of the map. */
  private findEdgeSpawnPosition(): { x: number; y: number } | null {
    const mapTiles = this.config.mapTiles;
    const edges: { row: number; col: number }[] = [];
    const inner = 1; // Just inside the rock border

    for (let i = inner; i < mapTiles - inner; i++) {
      edges.push({ row: inner, col: i });
      edges.push({ row: mapTiles - 1 - inner, col: i });
      edges.push({ row: i, col: inner });
      edges.push({ row: i, col: mapTiles - 1 - inner });
    }

    Phaser.Utils.Array.Shuffle(edges);
    for (const { row, col } of edges) {
      if (this.mapManager.grid[row][col] === TILE_GRASS) {
        return {
          x: col * TILE_SIZE + TILE_SIZE / 2,
          y: row * TILE_SIZE + TILE_SIZE / 2,
        };
      }
    }

    return null;
  }

  private onCaught(): void {
    if (this.gameOver) return;
    this.gameOver = true;

    // Stop all movement
    this.player.body.setVelocity(0, 0);
    for (const knight of this.knights) {
      knight.body.setVelocity(0, 0);
    }

    this.cameras.main.shake(SCREEN_SHAKE_DURATION, SCREEN_SHAKE_INTENSITY);

    const score = Math.floor(this.elapsedTime / 1000);
    this.time.delayedCall(SCREEN_SHAKE_DURATION, () => {
      this.scene.start('GameOverScene', { score, difficulty: this.difficulty, keysCollected: this.keysCollected, keyCount: this.config.keyCount });
    });
  }
}
