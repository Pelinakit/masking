/**
 * ContextButton
 * Presentation layer - reusable button with keyboard shortcut display
 * Mobile-first with 44px minimum touch target
 */

import Phaser from 'phaser';

export interface ContextButtonConfig {
  scene: Phaser.Scene;
  x: number;
  y: number;
  text: string;
  key?: string;
  callback: () => void;
  width?: number;
  height?: number;
}

export class ContextButton extends Phaser.GameObjects.Container {
  private background: Phaser.GameObjects.Rectangle;
  private labelText: Phaser.GameObjects.Text;
  private keyText?: Phaser.GameObjects.Text;
  private callback: () => void;
  private keyObject?: Phaser.Input.Keyboard.Key;

  private isHovered: boolean = false;
  private isPressed: boolean = false;

  constructor(config: ContextButtonConfig) {
    super(config.scene, config.x, config.y);

    this.callback = config.callback;
    this.create(config);

    // Set up keyboard shortcut
    if (config.key && this.scene.input.keyboard) {
      this.keyObject = this.scene.input.keyboard.addKey(config.key);
      this.keyObject.on('down', () => this.callback());
    }

    this.scene.add.existing(this);
  }

  private create(config: ContextButtonConfig): void {
    const width = config.width || 120;
    const height = config.height || 44; // 44px minimum for touch

    // Background
    this.background = this.scene.add.rectangle(0, 0, width, height, 0x34495e, 1);
    this.background.setStrokeStyle(2, 0x000000);
    this.background.setInteractive({ useHandCursor: true });
    this.add(this.background);

    // Label text
    this.labelText = this.scene.add.text(0, config.key ? -8 : 0, config.text, {
      fontFamily: 'Comic Relief, sans-serif',
      fontSize: '16px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    });
    this.labelText.setOrigin(0.5);
    this.add(this.labelText);

    // Key text
    if (config.key) {
      this.keyText = this.scene.add.text(0, 10, `[${config.key}]`, {
        fontFamily: 'Comic Relief, sans-serif',
        fontSize: '12px',
        color: '#ecf0f1',
        stroke: '#000000',
        strokeThickness: 2,
      });
      this.keyText.setOrigin(0.5);
      this.add(this.keyText);
    }

    // Interaction events
    this.background.on('pointerover', () => this.onHover());
    this.background.on('pointerout', () => this.onOut());
    this.background.on('pointerdown', () => this.onDown());
    this.background.on('pointerup', () => this.onUp());
  }

  /**
   * Update button text
   */
  setText(text: string): void {
    this.labelText.setText(text);
  }

  /**
   * Update button key
   */
  setKey(key: string): void {
    if (this.keyText) {
      this.keyText.setText(`[${key}]`);
    }
  }

  /**
   * Enable/disable button
   */
  setEnabled(enabled: boolean): void {
    this.background.setInteractive(enabled);
    this.setAlpha(enabled ? 1 : 0.5);
  }

  /**
   * Hover effect
   */
  private onHover(): void {
    this.isHovered = true;
    this.background.setFillStyle(0x4a6278);
  }

  /**
   * Hover out effect
   */
  private onOut(): void {
    this.isHovered = false;
    if (!this.isPressed) {
      this.background.setFillStyle(0x34495e);
    }
  }

  /**
   * Press down effect
   */
  private onDown(): void {
    this.isPressed = true;
    this.background.setFillStyle(0x2c3e50);
    this.setScale(0.95);
  }

  /**
   * Release effect and trigger callback
   */
  private onUp(): void {
    this.isPressed = false;
    this.setScale(1);

    if (this.isHovered) {
      this.background.setFillStyle(0x4a6278);
      this.callback();
    } else {
      this.background.setFillStyle(0x34495e);
    }
  }

  /**
   * Cleanup
   */
  destroy(fromScene?: boolean): void {
    if (this.keyObject) {
      this.keyObject.destroy();
    }
    super.destroy(fromScene);
  }
}
