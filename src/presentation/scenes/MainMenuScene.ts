/**
 * MainMenuScene
 * Presentation layer - main menu with New Game / Continue options
 */

import Phaser from 'phaser';
import { StateManager } from '@game/StateManager';

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainMenuScene' });
  }

  create(): void {
    const { width, height } = this.cameras.main;

    // Title
    this.add.text(width / 2, height / 3, 'Masking', {
      fontSize: '64px',
      color: '#ffffff',
      fontFamily: 'Comic Relief, Arial, sans-serif',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(width / 2, height / 2, 'A game about neurodivergent experiences in remote work', {
      fontSize: '18px',
      color: '#ecf0f1',
      fontFamily: 'Comic Relief, Arial, sans-serif',
    }).setOrigin(0.5);

    // Check if save exists
    const tempStateManager = new StateManager();
    const hasSave = tempStateManager.hasSavedGame();

    // New Game button
    const newGameText = this.add.text(
      width / 2,
      height * 0.65,
      hasSave ? 'New Game' : 'Start Game',
      {
        fontSize: '28px',
        color: '#2ecc71',
        fontFamily: 'Comic Relief, Arial, sans-serif',
        stroke: '#000000',
        strokeThickness: 3,
      }
    ).setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    newGameText.on('pointerover', () => newGameText.setScale(1.1));
    newGameText.on('pointerout', () => newGameText.setScale(1.0));
    newGameText.on('pointerdown', () => {
      if (hasSave) {
        // Reset save and start new game
        tempStateManager.resetGame();
      }
      this.scene.start('RoomScene');
    });

    // Continue button (if save exists)
    if (hasSave) {
      const continueText = this.add.text(width / 2, height * 0.75, 'Continue', {
        fontSize: '28px',
        color: '#3498db',
        fontFamily: 'Comic Relief, Arial, sans-serif',
        stroke: '#000000',
        strokeThickness: 3,
      }).setOrigin(0.5)
        .setInteractive({ useHandCursor: true });

      continueText.on('pointerover', () => continueText.setScale(1.1));
      continueText.on('pointerout', () => continueText.setScale(1.0));
      continueText.on('pointerdown', () => {
        this.scene.start('RoomScene');
      });
    }

    // Version info
    this.add.text(10, height - 30, 'v0.2.0 - Phase 4.2 Development', {
      fontSize: '12px',
      color: '#95a5a6',
      fontFamily: 'Comic Relief, Arial, sans-serif',
    });

    // Dev mode toggle (bottom right)
    this.createDevModeToggle(width, height);
  }

  /**
   * Create dev mode toggle
   */
  private createDevModeToggle(width: number, height: number): void {
    const isDevMode = localStorage.getItem('masking-dev-mode') === 'true';

    const devText = this.add.text(
      width - 10,
      height - 30,
      isDevMode ? '🛠️ Dev Mode: ON' : '🛠️ Dev Mode: OFF',
      {
        fontSize: '12px',
        color: isDevMode ? '#00ff00' : '#666666',
        fontFamily: 'Comic Relief, Arial, sans-serif',
      }
    ).setOrigin(1, 0)
      .setInteractive({ useHandCursor: true });

    devText.on('pointerdown', () => {
      const newState = localStorage.getItem('masking-dev-mode') !== 'true';
      localStorage.setItem('masking-dev-mode', String(newState));
      devText.setText(newState ? '🛠️ Dev Mode: ON' : '🛠️ Dev Mode: OFF');
      devText.setColor(newState ? '#00ff00' : '#666666');

      // Notify DevOverlayScene
      this.game.events.emit('devModeChanged', newState);
    });

    devText.on('pointerover', () => devText.setAlpha(0.7));
    devText.on('pointerout', () => devText.setAlpha(1));
  }
}
