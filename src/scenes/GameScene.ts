import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { MapManager } from '../map/MapManager';
import { COLORS, MAP_SIZE, MAP_TILES, TILE_SIZE } from '../constants';

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private mapManager!: MapManager;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<string, Phaser.Input.Keyboard.Key>;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    // Green world background
    this.cameras.main.setBackgroundColor(COLORS.grass);

    // Set world bounds
    this.physics.world.setBounds(0, 0, MAP_SIZE, MAP_SIZE);

    // Spawn at center of map (in tile coords)
    const spawnCol = Math.floor(MAP_TILES / 2);
    const spawnRow = Math.floor(MAP_TILES / 2);

    // Generate and render the tilemap
    this.mapManager = new MapManager(this);
    this.mapManager.create(spawnCol, spawnRow);

    // Create player at center of map (world coords)
    const spawnX = spawnCol * TILE_SIZE + TILE_SIZE / 2;
    const spawnY = spawnRow * TILE_SIZE + TILE_SIZE / 2;
    this.player = new Player(this, spawnX, spawnY);

    // Player collides with obstacles
    this.physics.add.collider(this.player, this.mapManager.obstacleLayer);

    // Camera setup
    this.cameras.main.setBounds(0, 0, MAP_SIZE, MAP_SIZE);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

    // Keyboard input
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = this.input.keyboard!.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    }) as Record<string, Phaser.Input.Keyboard.Key>;
  }

  update(): void {
    let vx = 0;
    let vy = 0;

    if (this.cursors.left.isDown || this.wasd.left.isDown) vx = -1;
    else if (this.cursors.right.isDown || this.wasd.right.isDown) vx = 1;

    if (this.cursors.up.isDown || this.wasd.up.isDown) vy = -1;
    else if (this.cursors.down.isDown || this.wasd.down.isDown) vy = 1;

    this.player.move(vx, vy);
  }
}
