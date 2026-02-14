import Phaser from 'phaser';
import { COLORS, PLAYER_SPEED } from '../constants';

export class Player extends Phaser.GameObjects.Container {
  declare body: Phaser.Physics.Arcade.Body;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    // Draw cow body (white ellipse)
    const body = scene.add.ellipse(0, 0, 28, 22, COLORS.cow);

    // Brown patches on the body
    const patch1 = scene.add.ellipse(-5, -4, 10, 7, 0x8B4513);
    const patch2 = scene.add.ellipse(4, 3, 8, 6, 0x8B4513);

    // Head — white base with brown patch on top
    const head = scene.add.circle(14, 0, 7, COLORS.cow);
    const headPatch = scene.add.ellipse(12, -3, 8, 6, 0x8B4513);

    // Ears (brown)
    const earL = scene.add.ellipse(11, -10, 4, 8, 0x8B4513);
    const earR = scene.add.ellipse(11, 10, 4, 8, 0x8B4513);

    // Snout (pink oval extending past head)
    const snout = scene.add.ellipse(20, 0, 8, 6, 0xffcca0);

    // Nostrils on snout
    const nostrilL = scene.add.ellipse(21, -2, 2, 1.5, 0x222222);
    const nostrilR = scene.add.ellipse(21, 2, 2, 1.5, 0x222222);

    // Eyes
    const eyeL = scene.add.circle(16, -3, 1.5, 0x000000);
    const eyeR = scene.add.circle(16, 3, 1.5, 0x000000);

    // Tail
    const tail = scene.add.rectangle(-16, 0, 6, 2, 0x8B4513);

    this.add([body, patch1, patch2, head, headPatch, earL, earR, snout, nostrilL, nostrilR, eyeL, eyeR, tail]);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Set up circular physics body
    this.body.setCircle(14);
    this.body.setOffset(-14, -14);
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
