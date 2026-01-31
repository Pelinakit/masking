/**
 * Core GameEngine
 * Foundation layer - manages Phaser instance lifecycle
 */

import Phaser from 'phaser';
import { BootScene } from '@presentation/scenes/BootScene';
import { MainMenuScene } from '@presentation/scenes/MainMenuScene';
import { RoomScene } from '@presentation/scenes/RoomScene';
import { LaptopScene } from '@presentation/scenes/LaptopScene';
import { MeetingScene } from '@presentation/scenes/MeetingScene';
import { DevOverlayScene } from '@presentation/scenes/DevOverlayScene';

export interface GameConfig {
  containerId: string;
  width: number;
  height: number;
}

export class GameEngine {
  private game: Phaser.Game | null = null;
  private config: GameConfig;

  constructor(config: GameConfig) {
    this.config = config;
  }

  initialize(): void {
    const phaserConfig: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: this.config.width,
      height: this.config.height,
      parent: this.config.containerId,
      backgroundColor: '#2d3436',
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      scene: [BootScene, MainMenuScene, RoomScene, LaptopScene, MeetingScene, DevOverlayScene],
    };

    this.game = new Phaser.Game(phaserConfig);

    // Start DevOverlayScene in parallel once game is ready
    this.game.events.once('ready', () => {
      this.game?.scene.start('DevOverlayScene');
    });
  }

  destroy(): void {
    if (this.game) {
      this.game.destroy(true);
      this.game = null;
    }
  }

  getGame(): Phaser.Game | null {
    return this.game;
  }
}
