import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Dragon, DragonState, DragonConfig } from '../entities/Dragon';
import { Fireball } from '../entities/Fireball';
import {
  COLORS,
  BOSS_ARENA_WIDTH,
  BOSS_ARENA_HEIGHT,
  BOMB_SPAWN_INTERVAL,
  BOMBS_TO_WIN,
  BOMB_RADIUS,
  DIFFICULTIES,
  DifficultyLevel,
  DifficultyConfig,
} from '../constants';
import { HUD } from '../ui/HUD';
import { VirtualJoystick } from '../ui/VirtualJoystick';

const WALL_THICKNESS = 28;

export class BossScene extends Phaser.Scene {
  private player!: Player;
  private dragon!: Dragon;
  private fireballGroup!: Phaser.Physics.Arcade.Group;
  private walls!: Phaser.Physics.Arcade.StaticGroup;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<string, Phaser.Input.Keyboard.Key>;
  private bombTimer = 0;
  private bombsCollected = 0;
  private currentBomb: Phaser.GameObjects.Container | null = null;
  private bombCollider: Phaser.Physics.Arcade.Collider | null = null;
  private hud!: HUD;
  private joystick?: VirtualJoystick;
  private score = 0;
  private keysCollected = 0;
  private keyCount = 0;
  private isOver = false;
  private needsFollow = false;
  private difficulty: DifficultyLevel = 'medium';
  private config!: DifficultyConfig;

  constructor() {
    super({ key: 'BossScene' });
  }

  create(data: { score?: number; difficulty?: DifficultyLevel; keysCollected?: number; keyCount?: number }): void {
    this.difficulty = data.difficulty ?? 'medium';
    this.config = DIFFICULTIES[this.difficulty];
    this.score = data.score ?? 0;
    this.keysCollected = data.keysCollected ?? 0;
    this.keyCount = data.keyCount ?? 0;
    this.isOver = false;
    this.bombTimer = 0;
    this.bombsCollected = 0;
    this.currentBomb = null;
    this.bombCollider = null;

    // --- Camera: match game scene zoom ---
    const cam = this.cameras.main;
    cam.setBackgroundColor(COLORS.arenaFloor);
    const targetViewWidth = 480;
    const zoom = Math.min(cam.width / targetViewWidth, 1);
    cam.setZoom(zoom);
    // If viewport fits the entire arena, center it; otherwise follow player within bounds
    const viewW = cam.width / zoom;
    const viewH = cam.height / zoom;
    this.needsFollow = viewW < BOSS_ARENA_WIDTH || viewH < BOSS_ARENA_HEIGHT;
    if (this.needsFollow) {
      cam.setBounds(0, 0, BOSS_ARENA_WIDTH, BOSS_ARENA_HEIGHT);
    } else {
      cam.centerOn(BOSS_ARENA_WIDTH / 2, BOSS_ARENA_HEIGHT / 2);
    }

    // --- Physics world bounds ---
    this.physics.world.setBounds(0, 0, BOSS_ARENA_WIDTH, BOSS_ARENA_HEIGHT);

    // --- Arena textures ---
    this.createArenaTextures();

    // Tiled floor
    const floorTile = this.add.tileSprite(
      BOSS_ARENA_WIDTH / 2, BOSS_ARENA_HEIGHT / 2,
      BOSS_ARENA_WIDTH, BOSS_ARENA_HEIGHT,
      'arena-floor',
    );
    floorTile.setDepth(-1);

    // Vignette overlay — dark gradient around edges for depth
    const vignette = this.add.graphics().setDepth(0);
    const vignetteInset = WALL_THICKNESS;
    const innerW = BOSS_ARENA_WIDTH - vignetteInset * 2;
    const innerH = BOSS_ARENA_HEIGHT - vignetteInset * 2;
    // Draw darkening bands from edges inward
    const bands = 6;
    for (let i = 0; i < bands; i++) {
      const alpha = 0.12 * (1 - i / bands);
      const expand = (bands - i) * 8;
      vignette.fillStyle(0x000000, alpha);
      vignette.fillRect(
        vignetteInset + i * 8, vignetteInset + i * 8,
        innerW - i * 16, expand,
      );
      vignette.fillRect(
        vignetteInset + i * 8, BOSS_ARENA_HEIGHT - vignetteInset - i * 8 - expand,
        innerW - i * 16, expand,
      );
      vignette.fillRect(
        vignetteInset + i * 8, vignetteInset + i * 8,
        expand, innerH - i * 16,
      );
      vignette.fillRect(
        BOSS_ARENA_WIDTH - vignetteInset - i * 8 - expand, vignetteInset + i * 8,
        expand, innerH - i * 16,
      );
    }

    // --- Walls (static physics bodies with brick texture) ---
    this.walls = this.physics.add.staticGroup();
    // Top
    this.addWall(BOSS_ARENA_WIDTH / 2, WALL_THICKNESS / 2, BOSS_ARENA_WIDTH, WALL_THICKNESS);
    // Bottom
    this.addWall(BOSS_ARENA_WIDTH / 2, BOSS_ARENA_HEIGHT - WALL_THICKNESS / 2, BOSS_ARENA_WIDTH, WALL_THICKNESS);
    // Left
    this.addWall(WALL_THICKNESS / 2, BOSS_ARENA_HEIGHT / 2, WALL_THICKNESS, BOSS_ARENA_HEIGHT);
    // Right
    this.addWall(BOSS_ARENA_WIDTH - WALL_THICKNESS / 2, BOSS_ARENA_HEIGHT / 2, WALL_THICKNESS, BOSS_ARENA_HEIGHT);

    // --- Player (bottom-center) ---
    this.player = new Player(this, 320, 430);
    this.player.body.setCollideWorldBounds(true);
    this.physics.add.collider(this.player, this.walls);
    if (this.needsFollow) {
      cam.startFollow(this.player, true, 0.08, 0.08);
    }

    // --- Dragon (top-center) ---
    const dragonCfg: DragonConfig = {
      cooldownMin: this.config.attackCooldownMin,
      cooldownMax: this.config.attackCooldownMax,
      stunDuration: this.config.stunDuration,
      rollTelegraphDuration: this.config.rollTelegraphDuration,
      spinRevolutions: this.config.spinRevolutions,
      spinFireballsPerRev: this.config.spinFireballsPerRev,
      fireballSpeed: this.config.fireballSpeed,
    };
    this.dragon = new Dragon(this, 320, 80, this.player, (x, y, angle, speed?) => {
      this.spawnFireball(x, y, angle, speed);
    }, dragonCfg);
    this.dragon.body.setCollideWorldBounds(true);
    this.physics.add.collider(this.dragon as unknown as Phaser.GameObjects.GameObject, this.walls, () => {
      if (this.dragon.getState() === DragonState.ROLLING) {
        this.dragon.wallHitWhileRolling();
      }
    });

    // --- Fireball group ---
    this.fireballGroup = this.physics.add.group({ runChildUpdate: false });

    // Fireballs hit player → game over
    this.physics.add.overlap(this.player, this.fireballGroup, () => this.onPlayerHit());

    // Fireballs hit walls → destroy fireball
    this.physics.add.collider(this.fireballGroup, this.walls, (obj) => {
      obj.destroy();
    });

    // Dragon touches player → game over
    this.physics.add.overlap(this.player, this.dragon as unknown as Phaser.GameObjects.GameObject, () => this.onPlayerHit());

    // --- Input ---
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = this.input.keyboard!.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    }) as Record<string, Phaser.Input.Keyboard.Key>;

    // --- HUD (dragon hearts) ---
    this.hud = new HUD(this);
    this.hud.updateDragonHearts(BOMBS_TO_WIN, BOMBS_TO_WIN);

    // --- Virtual joystick (touch devices only) ---
    if (this.sys.game.device.input.touch) {
      this.joystick = new VirtualJoystick(this);
    }
  }

  update(time: number, delta: number): void {
    if (this.isOver) return;

    // --- Player input ---
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

    // --- Dragon AI ---
    this.dragon.step(time, delta);

    // --- Bomb spawning ---
    this.bombTimer += delta;
    if (this.bombTimer >= BOMB_SPAWN_INTERVAL && !this.currentBomb) {
      this.spawnBomb();
      this.bombTimer = 0;
    }

    // --- Destroy out-of-bounds fireballs ---
    for (const fb of this.fireballGroup.getChildren() as Fireball[]) {
      if (
        fb.x < -50 || fb.x > BOSS_ARENA_WIDTH + 50 ||
        fb.y < -50 || fb.y > BOSS_ARENA_HEIGHT + 50
      ) {
        fb.destroy();
      }
    }
  }

  private addWall(x: number, y: number, w: number, h: number): void {
    const wall = this.add.tileSprite(x, y, w, h, 'arena-wall');
    this.physics.add.existing(wall, true);
    this.walls.add(wall);
  }

  private createArenaTextures(): void {
    const rgba = (c: number) => Phaser.Display.Color.IntegerToColor(c).rgba;

    // --- Floor texture (32x32 marble tile, lighter for contrast) ---
    if (this.textures.exists('arena-floor')) this.textures.remove('arena-floor');
    const floorCanvas = this.textures.createCanvas('arena-floor', 32, 32)!;
    const fc = floorCanvas.context;
    fc.fillStyle = rgba(COLORS.arenaFloor);
    fc.fillRect(0, 0, 32, 32);
    // Subtle marble veins
    fc.strokeStyle = 'rgba(255,255,255,0.04)';
    fc.lineWidth = 1;
    fc.beginPath(); fc.moveTo(4, 0); fc.quadraticCurveTo(16, 18, 28, 6); fc.stroke();
    fc.beginPath(); fc.moveTo(0, 20); fc.quadraticCurveTo(14, 26, 32, 18); fc.stroke();
    // Tile edge seam
    fc.strokeStyle = 'rgba(0,0,0,0.1)';
    fc.strokeRect(0.5, 0.5, 31, 31);
    floorCanvas.refresh();

    // --- Wall texture (16x16 dark stone) ---
    if (this.textures.exists('arena-wall')) this.textures.remove('arena-wall');
    const wallCanvas = this.textures.createCanvas('arena-wall', 16, 16)!;
    const wc = wallCanvas.context;
    wc.fillStyle = rgba(COLORS.arenaWall);
    wc.fillRect(0, 0, 16, 16);
    // Subtle mortar lines
    wc.strokeStyle = 'rgba(255,255,255,0.06)';
    wc.lineWidth = 1;
    wc.beginPath(); wc.moveTo(0, 8); wc.lineTo(16, 8); wc.stroke();
    wc.beginPath(); wc.moveTo(8, 0); wc.lineTo(8, 8); wc.stroke();
    wc.beginPath(); wc.moveTo(4, 8); wc.lineTo(4, 16); wc.stroke();
    wc.beginPath(); wc.moveTo(12, 8); wc.lineTo(12, 16); wc.stroke();
    wallCanvas.refresh();
  }

  private spawnFireball(x: number, y: number, angle: number, speed?: number): void {
    const fb = new Fireball(this, x, y, angle, speed ?? this.config.fireballSpeed);
    this.fireballGroup.add(fb);
    fb.launch();
  }

  private spawnBomb(): void {
    const pad = WALL_THICKNESS + BOMB_RADIUS + 20;
    const bx = Phaser.Math.Between(pad, BOSS_ARENA_WIDTH - pad);
    const by = Phaser.Math.Between(pad, BOSS_ARENA_HEIGHT - pad);

    const bomb = new Phaser.GameObjects.Container(this, bx, by);

    // Black body
    const body = this.add.circle(0, 0, BOMB_RADIUS, COLORS.bomb);
    // Orange fuse
    const fuse = this.add.rectangle(0, -BOMB_RADIUS - 3, 3, 8, COLORS.bombFuse);
    // Yellow spark (flickering)
    const spark = this.add.circle(0, -BOMB_RADIUS - 7, 3, COLORS.bombSpark);
    this.tweens.add({
      targets: spark,
      alpha: 0.2,
      duration: 150,
      yoyo: true,
      repeat: -1,
    });

    bomb.add([body, fuse, spark]);
    this.add.existing(bomb);
    this.physics.add.existing(bomb, true); // static body

    const bombBody = bomb.body as Phaser.Physics.Arcade.StaticBody;
    bombBody.setCircle(BOMB_RADIUS + 4);
    bombBody.position.set(bx - (BOMB_RADIUS + 4), by - (BOMB_RADIUS + 4));
    bombBody.updateCenter();

    // Bobbing tween (same pattern as Key.ts)
    this.tweens.add({
      targets: bomb,
      y: by - 4,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.currentBomb = bomb;
    this.bombCollider = this.physics.add.overlap(this.player, bomb, () => this.onBombCollected());
  }

  private onBombCollected(): void {
    if (!this.currentBomb) return;

    if (this.bombCollider) {
      this.physics.world.removeCollider(this.bombCollider);
      this.bombCollider = null;
    }

    this.currentBomb.destroy();
    this.currentBomb = null;
    this.bombsCollected++;
    this.cameras.main.flash(200, 255, 150, 0);
    this.hud.updateDragonHearts(BOMBS_TO_WIN - this.bombsCollected, BOMBS_TO_WIN);
    this.bombTimer = 0;

    if (this.bombsCollected >= BOMBS_TO_WIN) {
      this.onVictory();
    }
  }

  private onPlayerHit(): void {
    if (this.isOver) return;
    this.isOver = true;

    this.player.body.setVelocity(0, 0);
    this.dragon.body.setVelocity(0, 0);

    this.cameras.main.flash(300, 255, 0, 0);
    this.time.delayedCall(500, () => {
      this.scene.start('GameOverScene', {
        score: this.score,
        victory: false,
        difficulty: this.difficulty,
        keysCollected: this.keysCollected,
        keyCount: this.keyCount,
        dragonHeartsLeft: BOMBS_TO_WIN - this.bombsCollected,
      });
    });
  }

  private onVictory(): void {
    if (this.isOver) return;
    this.isOver = true;

    this.player.body.setVelocity(0, 0);
    this.dragon.body.setVelocity(0, 0);

    this.cameras.main.flash(500, 255, 215, 0);
    this.time.delayedCall(800, () => {
      this.scene.start('GameOverScene', {
        score: this.score,
        victory: true,
        difficulty: this.difficulty,
        keysCollected: this.keysCollected,
        keyCount: this.keyCount,
      });
    });
  }
}
