/**
 * MainMenuScene
 * Presentation layer - main menu with placeholder UI
 */

import Phaser from 'phaser';

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainMenuScene' });
  }

  create(): void {
    const { width, height } = this.cameras.main;

    // Title
    this.add.text(width / 2, height / 3, 'Masking', {
      fontSize: '48px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif',
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(width / 2, height / 2, 'A game about neurodivergent experiences', {
      fontSize: '18px',
      color: '#cccccc',
      fontFamily: 'Arial, sans-serif',
    }).setOrigin(0.5);

    // Placeholder for New Game button
    const newGameText = this.add.text(width / 2, height * 0.65, 'New Game', {
      fontSize: '24px',
      color: '#00ff88',
      fontFamily: 'Arial, sans-serif',
    }).setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    newGameText.on('pointerover', () => {
      newGameText.setScale(1.1);
    });

    newGameText.on('pointerout', () => {
      newGameText.setScale(1.0);
    });

    newGameText.on('pointerdown', () => {
      console.log('New Game clicked - game scenes not yet implemented');
    });

    // Version info
    this.add.text(10, height - 30, 'v0.1.0 - Scaffolding Complete', {
      fontSize: '12px',
      color: '#666666',
      fontFamily: 'Arial, sans-serif',
    });
  }
}
