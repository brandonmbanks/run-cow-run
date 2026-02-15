import Phaser from 'phaser';
import { DifficultyLevel } from '../constants';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    const { width, height } = this.scale;

    this.add
      .text(width / 2, height / 4, 'Run Cow Run!', {
        fontSize: '48px',
        color: '#ffffff',
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height / 4 + 50, 'Collect keys. Escape knights. Slay the dragon.', {
        fontSize: '16px',
        color: '#999999',
        fontFamily: 'monospace',
      })
      .setOrigin(0.5);

    const buttons: { label: string; difficulty: DifficultyLevel; color: string; key: string }[] = [
      { label: 'Easy   ', difficulty: 'easy', color: '#44cc44', key: '1' },
      { label: 'Medium ', difficulty: 'medium', color: '#cccc44', key: '2' },
      { label: 'Hard   ', difficulty: 'hard', color: '#cc4444', key: '3' },
    ];

    const startY = height / 2 + 10;
    const spacing = 60;

    this.add
      .text(width / 2, startY - 50, 'Choose Difficulty', {
        fontSize: '20px',
        color: '#cccccc',
        fontFamily: 'monospace',
      })
      .setOrigin(0.5);

    for (let i = 0; i < buttons.length; i++) {
      const { label, difficulty, color, key } = buttons[i];
      const y = startY + i * spacing;

      const btn = this.add
        .text(width / 2, y, `${label}[${key}]`, {
          fontSize: '32px',
          color,
          fontFamily: 'monospace',
          fontStyle: 'bold',
          padding: { x: 20, y: 8 },
          backgroundColor: '#222222',
          fixedWidth: 260,
          align: 'center',
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });

      btn.on('pointerover', () => btn.setAlpha(0.7));
      btn.on('pointerout', () => btn.setAlpha(1));
      btn.on('pointerdown', () => this.startGame(difficulty));
    }

    // Keyboard shortcuts: 1/2/3
    this.input.keyboard?.on('keydown-ONE', () => this.startGame('easy'));
    this.input.keyboard?.on('keydown-TWO', () => this.startGame('medium'));
    this.input.keyboard?.on('keydown-THREE', () => this.startGame('hard'));
  }

  private startGame(difficulty: DifficultyLevel): void {
    this.scene.start('GameScene', { difficulty });
  }
}
