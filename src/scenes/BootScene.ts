import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // No external assets to load in phase 1
  }

  create(): void {
    this.scene.start('MenuScene');
  }
}
