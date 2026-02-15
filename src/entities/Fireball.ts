import Phaser from 'phaser';
import { COLORS, DRAGON_FIREBALL_SPEED, FIREBALL_RADIUS } from '../constants';

export class Fireball extends Phaser.GameObjects.Container {
  declare body: Phaser.Physics.Arcade.Body;

  private _vx: number;
  private _vy: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    angle: number,
    speed: number = DRAGON_FIREBALL_SPEED,
  ) {
    super(scene, x, y);

    this._vx = Math.cos(angle) * speed;
    this._vy = Math.sin(angle) * speed;

    const outer = scene.add.circle(0, 0, FIREBALL_RADIUS, COLORS.fireball);
    const core = scene.add.circle(0, 0, FIREBALL_RADIUS * 0.5, COLORS.fireballCore);
    this.add([outer, core]);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.body.setCircle(FIREBALL_RADIUS);
    this.body.setOffset(-FIREBALL_RADIUS, -FIREBALL_RADIUS);
  }

  /** Apply stored velocity — call after adding to a physics group. */
  launch(): void {
    this.body.setVelocity(this._vx, this._vy);
  }
}
