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

    // Horse body (brown ellipse)
    const horse = scene.add.ellipse(0, 0, 26, 18, COLORS.knightHorse);

    // Knight torso (red rectangle on horse)
    const torso = scene.add.rectangle(2, 0, 14, 16, COLORS.knight);

    // Helmet (gray circle)
    const helmet = scene.add.circle(8, 0, 6, COLORS.knightArmor);

    // Lance
    const lance = scene.add.rectangle(20, 0, 16, 2, COLORS.knightArmor);

    this.add([horse, torso, helmet, lance]);

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
