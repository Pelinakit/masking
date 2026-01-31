/**
 * BootScene
 * Presentation layer - initial loading scene
 */

import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // Load initial assets here
    // For now, create a simple loading text
  }

  create(): void {
    console.log('BootScene: Initializing game...');

    // Transition to main menu after brief delay
    this.time.delayedCall(500, () => {
      this.scene.start('MainMenuScene');
    });
  }
}
