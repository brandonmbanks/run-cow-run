import { HUD_FONT_SIZE, HUD_PADDING } from '../constants';

export class HUD {
  private scene: Phaser.Scene;
  private keysText?: Phaser.GameObjects.Text;
  private heartsText?: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /** Convert desired screen-pixel position to scrollFactor=0 coordinates (accounts for camera zoom). */
  private screenToLocal(sx: number, sy: number): { x: number; y: number } {
    const cam = this.scene.cameras.main;
    return {
      x: cam.centerX + (sx - cam.centerX) / cam.zoom,
      y: cam.centerY + (sy - cam.centerY) / cam.zoom,
    };
  }

  updateKeys(collected: number, total: number): void {
    if (!this.keysText) {
      this.keysText = this.scene.add
        .text(0, 0, '', {
          fontSize: `${HUD_FONT_SIZE}px`,
          color: '#ffd700',
          fontFamily: 'monospace',
          stroke: '#000000',
          strokeThickness: 3,
        })
        .setScrollFactor(0)
        .setDepth(100);
    }
    this.keysText.setText(`Keys: ${collected}/${total}`);
    const pos = this.screenToLocal(HUD_PADDING, HUD_PADDING);
    this.keysText.setPosition(pos.x, pos.y);
  }

  updateDragonHearts(livesRemaining: number, total: number): void {
    if (!this.heartsText) {
      this.heartsText = this.scene.add
        .text(0, 0, '', {
          fontSize: `${HUD_FONT_SIZE + 4}px`,
          color: '#ffffff',
          fontFamily: 'monospace',
        })
        .setScrollFactor(0)
        .setDepth(100);
    }
    const filled = '\u2764\uFE0F'.repeat(livesRemaining);
    const empty = '\uD83E\uDD0D'.repeat(total - livesRemaining);
    this.heartsText.setText(filled + empty);
    // Center horizontally
    const pos = this.screenToLocal(
      (this.scene.scale.width - this.heartsText.width) / 2,
      HUD_PADDING,
    );
    this.heartsText.setPosition(pos.x, pos.y);
  }

  destroy(): void {
    this.keysText?.destroy();
    this.heartsText?.destroy();
  }
}
