import Phaser from 'phaser';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  create(data: { score?: number; victory?: boolean; difficulty?: string }): void {
    const { width, height } = this.scale;
    const score = data.score ?? 0;
    const victory = data.victory ?? false;

    if (victory) {
      this.add
        .text(width / 2, height / 3 - 20, 'VICTORY!', {
          fontSize: '48px',
          color: '#ffd700',
          fontFamily: 'monospace',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);

      this.add
        .text(width / 2, height / 3 + 30, 'The dragon is defeated!', {
          fontSize: '22px',
          color: '#ffffff',
          fontFamily: 'monospace',
        })
        .setOrigin(0.5);
    } else {
      this.add
        .text(width / 2, height / 3, 'Game Over!', {
          fontSize: '48px',
          color: '#ff4444',
          fontFamily: 'monospace',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);
    }

    this.add
      .text(width / 2, height / 2, `Survived: ${score}s`, {
        fontSize: '28px',
        color: '#ffffff',
        fontFamily: 'monospace',
      })
      .setOrigin(0.5);

    const restartText = this.add
      .text(width / 2, height / 2 + 80, 'Tap or Press SPACE to Continue', {
        fontSize: '20px',
        color: '#cccccc',
        fontFamily: 'monospace',
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: restartText,
      alpha: 0.3,
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    this.input.once('pointerdown', () => this.restart());
    this.input.keyboard?.once('keydown-SPACE', () => this.restart());
  }

  private restart(): void {
    this.scene.start('MenuScene');
  }
}
