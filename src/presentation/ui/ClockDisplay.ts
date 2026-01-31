/**
 * ClockDisplay
 * Presentation layer - displays game time
 * Mobile-first with large readable text
 */

import Phaser from 'phaser';
import { TimeManager } from '@game/systems/TimeManager';

export interface ClockDisplayConfig {
  scene: Phaser.Scene;
  x: number;
  y: number;
  format?: '12hour' | '24hour';
  showDay?: boolean;
  showTimeScale?: boolean;
}

export class ClockDisplay extends Phaser.GameObjects.Container {
  private timeText: Phaser.GameObjects.Text;
  private dayText?: Phaser.GameObjects.Text;
  private scaleIndicator?: Phaser.GameObjects.Text;
  private background: Phaser.GameObjects.Rectangle;

  private timeManager?: TimeManager;
  private config: ClockDisplayConfig;

  constructor(config: ClockDisplayConfig) {
    super(config.scene, config.x, config.y);
    this.config = config;

    this.create();
    this.scene.add.existing(this);
  }

  private create(): void {
    const { showDay, showTimeScale } = this.config;

    // Background
    this.background = this.scene.add.rectangle(0, 0, 140, showDay ? 70 : 45, 0x2d3436, 0.8);
    this.background.setStrokeStyle(2, 0x000000);
    this.add(this.background);

    // Time text
    this.timeText = this.scene.add.text(0, showDay ? -15 : 0, '09:00', {
      fontFamily: 'Comic Relief, sans-serif',
      fontSize: '24px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    });
    this.timeText.setOrigin(0.5);
    this.add(this.timeText);

    // Day text
    if (showDay !== false) {
      this.dayText = this.scene.add.text(0, 15, 'Monday', {
        fontFamily: 'Comic Relief, sans-serif',
        fontSize: '14px',
        color: '#ecf0f1',
        stroke: '#000000',
        strokeThickness: 2,
      });
      this.dayText.setOrigin(0.5);
      this.add(this.dayText);
    }

    // Time scale indicator
    if (showTimeScale) {
      this.scaleIndicator = this.scene.add.text(60, -20, '', {
        fontFamily: 'Comic Relief, sans-serif',
        fontSize: '12px',
        color: '#f39c12',
      });
      this.scaleIndicator.setOrigin(0.5);
      this.add(this.scaleIndicator);
    }
  }

  /**
   * Link to time manager for automatic updates
   */
  linkTimeManager(timeManager: TimeManager): void {
    this.timeManager = timeManager;
    this.update();
  }

  /**
   * Update display from time manager
   */
  update(): void {
    if (!this.timeManager) return;

    const time = this.timeManager.getTime();

    // Update time text
    const format = this.config.format || '24hour';
    const timeString = format === '12hour'
      ? this.timeManager.getTime12Hour()
      : this.timeManager.getTimeString();

    this.timeText.setText(timeString);

    // Update day text
    if (this.dayText) {
      this.dayText.setText(time.dayOfWeek);
    }

    // Update time scale indicator
    if (this.scaleIndicator) {
      const scale = this.timeManager.getTimeScale();
      if (scale === 0) {
        this.scaleIndicator.setText('PAUSED');
        this.scaleIndicator.setColor('#e74c3c');
      } else if (scale !== 1) {
        this.scaleIndicator.setText(`${scale}x`);
        this.scaleIndicator.setColor('#f39c12');
      } else {
        this.scaleIndicator.setText('');
      }
    }
  }

  /**
   * Show/hide
   */
  show(): void {
    this.setVisible(true);
  }

  hide(): void {
    this.setVisible(false);
  }
}
