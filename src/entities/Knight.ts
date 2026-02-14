import Phaser from 'phaser';
import { COLORS, KNIGHT_SPEED_BASE, KNIGHT_PATH_INTERVAL, TILE_SIZE } from '../constants';
import { Pathfinder } from '../ai/Pathfinder';

export class Knight extends Phaser.GameObjects.Container {
  declare body: Phaser.Physics.Arcade.Body;

  private target: Phaser.GameObjects.Container;
  private pathfinder: Pathfinder;
  private path: { x: number; y: number }[] = [];
  private pathIndex = 0;
  private pathTimer = 0;
  private speed: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    target: Phaser.GameObjects.Container,
    pathfinder: Pathfinder,
    speed: number = KNIGHT_SPEED_BASE,
  ) {
    super(scene, x, y);
    this.target = target;
    this.pathfinder = pathfinder;
    this.speed = speed;

    // Horse body (brown ellipse, extended forward)
    const horseBody = scene.add.ellipse(-2, 0, 30, 16, COLORS.knightHorse);

    // Horse head (brown, sticking out front)
    const horseHead = scene.add.ellipse(16, 0, 12, 10, COLORS.knightHorse);

    // Horse snout (lighter brown, extending past head)
    const horseSnout = scene.add.ellipse(22, 0, 8, 6, 0xa0612b);

    // Horse nostril
    const horseNostril = scene.add.ellipse(25, 1, 2, 1.5, 0x222222);

    // Horse ear
    const horseEar = scene.add.ellipse(20, -4, 4, 6, 0x6b3a10);

    // Horse eye
    const horseEye = scene.add.circle(19, -1, 1.5, 0x000000);

    // Knight torso (red, sitting behind horse head)
    const torso = scene.add.rectangle(-2, -4, 14, 14, COLORS.knight);

    // Helmet (gray, on top of torso)
    const helmet = scene.add.circle(2, -4, 6, COLORS.knightArmor);

    // Helmet visor slit
    const visor = scene.add.rectangle(5, -4, 3, 2, 0x222222);

    // Lance (bright white, long shaft with point)
    const lanceShaft = scene.add.rectangle(24, -4, 26, 3, 0xdddddd);
    const lanceTip = scene.add.circle(38, -4, 3, 0xeeeeee);
    // TODO: fix triangle positioning and use instead of circle
    // const lanceTip = scene.add.triangle(33, -7, 0, -3, 8, 0, 0, 3, 0xeeeeee);

    this.add([horseBody, horseHead, horseSnout, horseNostril, horseEar, horseEye, torso, helmet, visor, lanceShaft, lanceTip]);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.body.setCircle(13);
    this.body.setOffset(-13, -13);

    // Request initial path immediately
    this.requestPath();
  }

  setSpeed(speed: number): void {
    this.speed = speed;
  }

  step(time: number, delta: number): void {
    this.pathTimer += delta;
    if (this.pathTimer >= KNIGHT_PATH_INTERVAL) {
      this.pathTimer = 0;
      this.requestPath();
    }

    if (this.path.length > 0 && this.pathIndex < this.path.length) {
      const waypoint = this.path[this.pathIndex];
      const dist = Phaser.Math.Distance.Between(this.x, this.y, waypoint.x, waypoint.y);

      if (dist < TILE_SIZE / 2) {
        this.pathIndex++;
        if (this.pathIndex >= this.path.length) {
          this.directChase();
          return;
        }
      }
      this.moveToward(waypoint.x, waypoint.y);
    } else {
      this.directChase();
    }
  }

  private requestPath(): void {
    this.pathfinder.findPath(this.x, this.y, this.target.x, this.target.y, (path) => {
      if (path) {
        this.path = path;
        this.pathIndex = 0;
      }
    });
  }

  private directChase(): void {
    this.moveToward(this.target.x, this.target.y);
  }

  private moveToward(tx: number, ty: number): void {
    const angle = Phaser.Math.Angle.Between(this.x, this.y, tx, ty);
    this.body.setVelocity(
      Math.cos(angle) * this.speed,
      Math.sin(angle) * this.speed,
    );
    this.rotation = angle;
  }
}
