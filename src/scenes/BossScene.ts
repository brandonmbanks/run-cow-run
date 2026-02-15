import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Dragon, DragonState } from '../entities/Dragon';
import { Fireball } from '../entities/Fireball';
import {
  COLORS,
  BOSS_ARENA_WIDTH,
  BOSS_ARENA_HEIGHT,
  BOMB_SPAWN_INTERVAL,
  BOMBS_TO_WIN,
  BOMB_RADIUS,
} from '../constants';

const WALL_THICKNESS = 16;

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
  private hudText!: Phaser.GameObjects.Text;
  private score = 0;
  private isOver = false;

  constructor() {
    super({ key: 'BossScene' });
  }

  create(data: { score?: number }): void {
    this.score = data.score ?? 0;
    this.isOver = false;
    this.bombTimer = 0;
    this.bombsCollected = 0;
    this.currentBomb = null;
    this.bombCollider = null;

    // --- Camera: fixed, auto-zoom to fit arena ---
    const cam = this.cameras.main;
    cam.setBackgroundColor(COLORS.arenaFloor);
    const zoomX = cam.width / BOSS_ARENA_WIDTH;
    const zoomY = cam.height / BOSS_ARENA_HEIGHT;
    const zoom = Math.min(zoomX, zoomY, 1);
    cam.setZoom(zoom);
    cam.centerOn(BOSS_ARENA_WIDTH / 2, BOSS_ARENA_HEIGHT / 2);

    // --- Physics world bounds ---
    this.physics.world.setBounds(0, 0, BOSS_ARENA_WIDTH, BOSS_ARENA_HEIGHT);

    // --- Arena floor ---
    this.add.rectangle(
      BOSS_ARENA_WIDTH / 2,
      BOSS_ARENA_HEIGHT / 2,
      BOSS_ARENA_WIDTH,
      BOSS_ARENA_HEIGHT,
      COLORS.arenaFloor,
    );

    // --- Walls (static physics bodies) ---
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

    // --- Dragon (top-center) ---
    this.dragon = new Dragon(this, 320, 80, this.player, (x, y, angle, speed?) => {
      this.spawnFireball(x, y, angle, speed);
    });
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

    // --- HUD ---
    this.hudText = this.add.text(16, 16, `Bombs: 0/${BOMBS_TO_WIN}`, {
      fontSize: '18px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    }).setScrollFactor(0).setDepth(100);
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
    const wall = this.add.rectangle(x, y, w, h, COLORS.arenaWall);
    this.physics.add.existing(wall, true);
    this.walls.add(wall);
  }

  private spawnFireball(x: number, y: number, angle: number, speed?: number): void {
    const fb = new Fireball(this, x, y, angle, speed);
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
    this.hudText.setText(`Bombs: ${this.bombsCollected}/${BOMBS_TO_WIN}`);
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
      this.scene.start('GameOverScene', { score: this.score, victory: false });
    });
  }

  private onVictory(): void {
    if (this.isOver) return;
    this.isOver = true;

    this.player.body.setVelocity(0, 0);
    this.dragon.body.setVelocity(0, 0);

    this.cameras.main.flash(500, 255, 215, 0);
    this.time.delayedCall(800, () => {
      this.scene.start('GameOverScene', { score: this.score, victory: true });
    });
  }
}
