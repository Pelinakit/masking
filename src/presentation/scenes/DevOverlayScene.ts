/**
 * DevOverlayScene
 * Persistent overlay for dev controls across all scenes
 * Runs in parallel with other scenes when dev mode is enabled
 */

import Phaser from 'phaser';
import { yamlParser } from '@scripting/YAMLParser';

export class DevOverlayScene extends Phaser.Scene {
  private devControls?: Phaser.GameObjects.Container;

  constructor() {
    super({ key: 'DevOverlayScene' });
  }

  create(): void {
    // Only show if dev mode is enabled
    if (!this.isDevMode()) {
      return;
    }

    this.createDevControls();

    // Listen for dev mode changes
    this.game.events.on('devModeChanged', (enabled: boolean) => {
      if (enabled) {
        this.createDevControls();
      } else {
        this.devControls?.destroy();
        this.devControls = undefined;
      }
    });
  }

  /**
   * Check if dev mode is enabled
   */
  private isDevMode(): boolean {
    return localStorage.getItem('masking-dev-mode') === 'true';
  }

  /**
   * Create dev control buttons
   */
  private createDevControls(): void {
    if (this.devControls) {
      this.devControls.destroy();
    }

    const { width } = this.cameras.main;
    this.devControls = this.add.container(0, 0);
    this.devControls.setDepth(99999);

    const btnWidth = 120;
    const btnHeight = 32;
    const spacing = 10;
    const startX = width - spacing - btnWidth / 2;

    // Reload YAML button
    this.createButton(
      startX,
      spacing,
      btnWidth,
      btnHeight,
      '🔄 Reload YAML',
      () => this.reloadYAML()
    );

    // Debug info button
    this.createButton(
      startX - btnWidth - spacing,
      spacing,
      btnWidth,
      btnHeight,
      '📊 Cache Stats',
      () => this.showCacheStats()
    );
  }

  /**
   * Create a button
   */
  private createButton(
    x: number,
    y: number,
    w: number,
    h: number,
    label: string,
    onClick: () => void
  ): void {
    const btn = this.add.rectangle(x, y, w, h, 0x222222, 0.95);
    btn.setOrigin(0.5, 0);
    btn.setInteractive({ useHandCursor: true });
    btn.setStrokeStyle(1, 0x00ff00);

    const text = this.add.text(x, y + h / 2, label, {
      fontFamily: 'Comic Relief, sans-serif',
      fontSize: '12px',
      color: '#00ff00',
    });
    text.setOrigin(0.5, 0.5);

    btn.on('pointerdown', onClick);
    btn.on('pointerover', () => btn.setFillStyle(0x444444));
    btn.on('pointerout', () => btn.setFillStyle(0x222222));

    this.devControls?.add([btn, text]);
  }

  /**
   * Reload all YAML scripts
   */
  private reloadYAML(): void {
    yamlParser.clearCache();
    this.showNotification('YAML cache cleared - reload scene to apply');

    // Emit event for active scenes to reload their data
    this.game.events.emit('reloadYAML');
  }

  /**
   * Show cache statistics
   */
  private showCacheStats(): void {
    const stats = yamlParser.getCacheStats();
    console.log('[Dev] YAML Cache:', stats);
    this.showNotification(`Cached: ${stats.files} files`);
  }

  /**
   * Show temporary notification
   */
  private showNotification(message: string): void {
    const { width } = this.cameras.main;
    const notif = this.add.text(width / 2, 60, message, {
      fontFamily: 'Comic Relief, sans-serif',
      fontSize: '16px',
      color: '#00ff00',
      backgroundColor: '#000000',
      padding: { x: 16, y: 8 },
    });
    notif.setOrigin(0.5);
    notif.setDepth(99999);

    this.tweens.add({
      targets: notif,
      alpha: 0,
      y: 40,
      duration: 2500,
      ease: 'Power2',
      onComplete: () => notif.destroy(),
    });
  }
}
