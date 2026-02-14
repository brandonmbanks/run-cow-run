import Phaser from 'phaser';
import { COLORS, PLAYER_SPEED } from '../constants';

export class Player extends Phaser.GameObjects.Container {
  declare body: Phaser.Physics.Arcade.Body;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    // Draw cow body (white ellipse)
    const body = scene.add.ellipse(0, 0, 56, 44, COLORS.cow);

    // Spots on the body
    const spot1 = scene.add.circle(-10, -6, 8, COLORS.cowSpots);
    const spot2 = scene.add.circle(8, 4, 6, COLORS.cowSpots);
    const spot3 = scene.add.circle(-4, 10, 6, COLORS.cowSpots);

    // Head (pinkish circle in front, centered)
    const head = scene.add.circle(28, 0, 14, COLORS.cowHead);

    // Ears (long ellipses on sides of head)
    const earL = scene.add.ellipse(22, -20, 8, 16, 0x000000);
    const earR = scene.add.ellipse(22, 20, 8, 16, 0x000000);

    // Eyes
    const eyeL = scene.add.circle(32, -6, 3, 0x000000);
    const eyeR = scene.add.circle(32, 6, 3, 0x000000);

    // Tail
    const tail = scene.add.rectangle(-32, 0, 12, 4, COLORS.cowSpots);

    this.add([body, spot1, spot2, spot3, head, earL, earR, eyeL, eyeR, tail]);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Set up circular physics body
    this.body.setCircle(28);
    this.body.setOffset(-28, -28);
    this.body.setCollideWorldBounds(true);
  }

  move(vx: number, vy: number): void {
    // Normalize diagonal movement
    const len = Math.sqrt(vx * vx + vy * vy);
    if (len > 0) {
      vx /= len;
      vy /= len;
    }

    this.body.setVelocity(vx * PLAYER_SPEED, vy * PLAYER_SPEED);

    // Rotate cow to face movement direction
    if (len > 0) {
      this.rotation = Math.atan2(vy, vx);
    }
  }
}
