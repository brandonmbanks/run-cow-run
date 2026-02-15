import Phaser from 'phaser';
import { COLORS } from '../constants';

export class Key extends Phaser.GameObjects.Container {
  declare body: Phaser.Physics.Arcade.StaticBody;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    // Key head (yellow circle with black stroke)
    const head = scene.add.circle(0, -4, 6, COLORS.key);
    head.setStrokeStyle(1.5, COLORS.keyBorder);

    // Hole in key head
    const hole = scene.add.circle(0, -4, 2, COLORS.keyBorder);

    // Shaft (rectangular bar going down)
    const shaft = scene.add.rectangle(0, 6, 3, 14, COLORS.key);
    shaft.setStrokeStyle(1, COLORS.keyBorder);

    // Teeth (two small rectangles off the shaft)
    const tooth1 = scene.add.rectangle(3, 9, 4, 2, COLORS.key);
    tooth1.setStrokeStyle(1, COLORS.keyBorder);
    const tooth2 = scene.add.rectangle(3, 13, 4, 2, COLORS.key);
    tooth2.setStrokeStyle(1, COLORS.keyBorder);

    this.add([shaft, tooth1, tooth2, head, hole]);

    scene.add.existing(this);
    scene.physics.add.existing(this, true); // true = static body

    this.body.setCircle(16);
    this.body.position.set(x - 16, y - 16);
    this.body.updateCenter();

    // Bobbing tween
    scene.tweens.add({
      targets: this,
      y: y - 4,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }
}
