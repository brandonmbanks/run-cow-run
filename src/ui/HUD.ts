import { HUD_FONT_SIZE, HUD_PADDING } from '../constants';

export class HUD {
  private scene: Phaser.Scene;
  private keysText?: Phaser.GameObjects.Text;
  private heartsText?: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  updateKeys(collected: number, total: number): void {
    if (!this.keysText) {
      this.keysText = this.scene.add
        .text(HUD_PADDING, HUD_PADDING, '', {
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
  }

  updateDragonHearts(livesRemaining: number, total: number): void {
    if (!this.heartsText) {
      this.heartsText = this.scene.add
        .text(0, HUD_PADDING, '', {
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
    this.heartsText.setX(
      (this.scene.scale.width - this.heartsText.width) / 2
    );
  }

  destroy(): void {
    this.keysText?.destroy();
    this.heartsText?.destroy();
  }
}
