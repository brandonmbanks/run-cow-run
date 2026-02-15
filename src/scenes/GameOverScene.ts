import Phaser from 'phaser';
import { BOMBS_TO_WIN } from '../constants';

interface GameOverData {
  score?: number;
  victory?: boolean;
  difficulty?: string;
  keysCollected?: number;
  keyCount?: number;
  dragonHeartsLeft?: number;
}

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  create(data: GameOverData): void {
    const { width, height } = this.scale;
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

      // Context-aware stat line
      let statText = '';
      if (data.dragonHeartsLeft != null) {
        // Defeated in boss fight — show dragon's remaining hearts
        const filled = '\u2764\uFE0F'.repeat(data.dragonHeartsLeft);
        const empty = '\uD83E\uDD0D'.repeat(BOMBS_TO_WIN - data.dragonHeartsLeft);
        statText = `The dragon endures  ${filled}${empty}`;
      } else if (data.keysCollected != null && data.keyCount != null) {
        // Defeated in overworld — show keys collected
        statText = `Keys: ${data.keysCollected}/${data.keyCount}`;
      }

      if (statText) {
        this.add
          .text(width / 2, height / 2, statText, {
            fontSize: '24px',
            color: '#ffffff',
            fontFamily: 'monospace',
          })
          .setOrigin(0.5);
      }
    }

    const restartY = victory ? height / 2 + 20 : height / 2 + 80;
    const restartText = this.add
      .text(width / 2, restartY, 'Tap or Press SPACE to Continue', {
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
