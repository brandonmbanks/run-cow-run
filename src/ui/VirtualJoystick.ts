import {
  JOYSTICK_BASE_RADIUS,
  JOYSTICK_THUMB_RADIUS,
  JOYSTICK_BASE_ALPHA,
  JOYSTICK_THUMB_ALPHA,
} from '../constants';

export class VirtualJoystick {
  forceX = 0;
  forceY = 0;
  isActive = false;

  private scene: Phaser.Scene;
  private base: Phaser.GameObjects.Graphics;
  private thumb: Phaser.GameObjects.Graphics;
  private activePointerId = -1;
  private baseX = 0;
  private baseY = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    // Draw base circle
    this.base = scene.add.graphics();
    this.base.fillStyle(0xffffff, JOYSTICK_BASE_ALPHA);
    this.base.fillCircle(0, 0, JOYSTICK_BASE_RADIUS);
    this.base.setScrollFactor(0).setDepth(99).setVisible(false);

    // Draw thumb circle
    this.thumb = scene.add.graphics();
    this.thumb.fillStyle(0xffffff, JOYSTICK_THUMB_ALPHA);
    this.thumb.fillCircle(0, 0, JOYSTICK_THUMB_RADIUS);
    this.thumb.setScrollFactor(0).setDepth(99).setVisible(false);

    scene.input.on('pointerdown', this.onPointerDown, this);
    scene.input.on('pointermove', this.onPointerMove, this);
    scene.input.on('pointerup', this.onPointerUp, this);
  }

  private onPointerDown(pointer: Phaser.Input.Pointer): void {
    if (this.isActive) return;

    this.isActive = true;
    this.activePointerId = pointer.id;
    this.baseX = pointer.x;
    this.baseY = pointer.y;

    this.base.setPosition(this.baseX, this.baseY).setVisible(true);
    this.thumb.setPosition(this.baseX, this.baseY).setVisible(true);
    this.forceX = 0;
    this.forceY = 0;
  }

  private onPointerMove(pointer: Phaser.Input.Pointer): void {
    if (!this.isActive || pointer.id !== this.activePointerId) return;

    const dx = pointer.x - this.baseX;
    const dy = pointer.y - this.baseY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    let thumbX: number;
    let thumbY: number;

    if (dist > JOYSTICK_BASE_RADIUS) {
      // Clamp to base radius
      thumbX = this.baseX + (dx / dist) * JOYSTICK_BASE_RADIUS;
      thumbY = this.baseY + (dy / dist) * JOYSTICK_BASE_RADIUS;
      this.forceX = dx / dist;
      this.forceY = dy / dist;
    } else {
      thumbX = pointer.x;
      thumbY = pointer.y;
      this.forceX = dx / JOYSTICK_BASE_RADIUS;
      this.forceY = dy / JOYSTICK_BASE_RADIUS;
    }

    this.thumb.setPosition(thumbX, thumbY);
  }

  private onPointerUp(pointer: Phaser.Input.Pointer): void {
    if (!this.isActive || pointer.id !== this.activePointerId) return;

    this.isActive = false;
    this.activePointerId = -1;
    this.forceX = 0;
    this.forceY = 0;
    this.base.setVisible(false);
    this.thumb.setVisible(false);
  }

  destroy(): void {
    this.scene.input.off('pointerdown', this.onPointerDown, this);
    this.scene.input.off('pointermove', this.onPointerMove, this);
    this.scene.input.off('pointerup', this.onPointerUp, this);
    this.base.destroy();
    this.thumb.destroy();
  }
}
