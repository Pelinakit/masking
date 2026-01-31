/**
 * StatBar
 * Presentation layer - CVD-friendly stat visualization
 * Mobile-first design with large touch targets
 */

import Phaser from 'phaser';
import { StatName } from '@game/systems/StatSystem';

export interface StatBarConfig {
  scene: Phaser.Scene;
  x: number;
  y: number;
  width: number;
  height: number;
  statName: StatName;
  showLabel?: boolean;
  showValue?: boolean;
}

export interface StatBarPattern {
  color: number;
  patternType: 'solid' | 'diagonal' | 'dots' | 'crosshatch' | 'horizontal';
}

export class StatBar extends Phaser.GameObjects.Container {
  private background: Phaser.GameObjects.Rectangle;
  private fill: Phaser.GameObjects.Graphics;
  private label?: Phaser.GameObjects.Text;
  private valueText?: Phaser.GameObjects.Text;

  private config: StatBarConfig;
  private currentValue: number = 100;
  private maxValue: number = 100;
  private pattern: StatBarPattern;

  constructor(config: StatBarConfig) {
    super(config.scene, config.x, config.y);
    this.config = config;
    this.pattern = this.getPatternForStat(config.statName);

    this.create();
    this.scene.add.existing(this);
  }

  private create(): void {
    const { width, height, statName, showLabel, showValue } = this.config;

    // Background (dark)
    this.background = this.scene.add.rectangle(0, 0, width, height, 0x2d3436, 1);
    this.background.setOrigin(0, 0);
    this.background.setStrokeStyle(2, 0x000000);
    this.add(this.background);

    // Fill (patterned)
    this.fill = this.scene.add.graphics();
    this.add(this.fill);

    // Label
    if (showLabel !== false) {
      const labelText = this.getStatLabel(statName);
      this.label = this.scene.add.text(8, height / 2, labelText, {
        fontFamily: 'Comic Relief, sans-serif',
        fontSize: '16px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 3,
      });
      this.label.setOrigin(0, 0.5);
      this.add(this.label);
    }

    // Value text
    if (showValue !== false) {
      this.valueText = this.scene.add.text(width - 8, height / 2, '100', {
        fontFamily: 'Comic Relief, sans-serif',
        fontSize: '16px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 3,
      });
      this.valueText.setOrigin(1, 0.5);
      this.add(this.valueText);
    }

    this.updateFill();
  }

  /**
   * Update stat value with smooth animation
   */
  setValue(value: number, max: number = 100, animate: boolean = true): void {
    const clampedValue = Phaser.Math.Clamp(value, 0, max);

    if (animate && this.currentValue !== clampedValue) {
      this.scene.tweens.addCounter({
        from: this.currentValue,
        to: clampedValue,
        duration: 300,
        ease: 'Power2',
        onUpdate: (tween) => {
          this.currentValue = tween.getValue();
          this.maxValue = max;
          this.updateFill();
        },
      });
    } else {
      this.currentValue = clampedValue;
      this.maxValue = max;
      this.updateFill();
    }
  }

  /**
   * Get current value
   */
  getValue(): number {
    return this.currentValue;
  }

  /**
   * Update fill graphics with pattern
   */
  private updateFill(): void {
    const { width, height } = this.config;
    const percentage = this.maxValue > 0 ? this.currentValue / this.maxValue : 0;
    const fillWidth = (width - 4) * percentage;

    this.fill.clear();

    if (fillWidth > 0) {
      // Base fill color
      this.fill.fillStyle(this.pattern.color, 1);
      this.fill.fillRect(2, 2, fillWidth, height - 4);

      // Apply pattern overlay
      this.applyPattern(fillWidth, height - 4);
    }

    // Update value text
    if (this.valueText) {
      this.valueText.setText(Math.round(this.currentValue).toString());
    }
  }

  /**
   * Apply CVD-friendly pattern overlay
   */
  private applyPattern(fillWidth: number, fillHeight: number): void {
    const { patternType } = this.pattern;

    switch (patternType) {
      case 'diagonal':
        this.applyDiagonalPattern(fillWidth, fillHeight);
        break;
      case 'dots':
        this.applyDotPattern(fillWidth, fillHeight);
        break;
      case 'crosshatch':
        this.applyCrosshatchPattern(fillWidth, fillHeight);
        break;
      case 'horizontal':
        this.applyHorizontalPattern(fillWidth, fillHeight);
        break;
      case 'solid':
      default:
        // No pattern
        break;
    }
  }

  /**
   * Diagonal stripe pattern
   */
  private applyDiagonalPattern(width: number, height: number): void {
    this.fill.lineStyle(2, 0xffffff, 0.3);
    const spacing = 8;
    for (let i = -height; i < width; i += spacing) {
      this.fill.lineBetween(2 + i, 2, 2 + i + height, 2 + height);
    }
  }

  /**
   * Dot pattern
   */
  private applyDotPattern(width: number, height: number): void {
    this.fill.fillStyle(0xffffff, 0.3);
    const spacing = 8;
    for (let x = spacing; x < width; x += spacing) {
      for (let y = spacing; y < height; y += spacing) {
        this.fill.fillCircle(2 + x, 2 + y, 2);
      }
    }
  }

  /**
   * Crosshatch pattern
   */
  private applyCrosshatchPattern(width: number, height: number): void {
    this.fill.lineStyle(1, 0xffffff, 0.3);
    const spacing = 6;

    // Diagonal right
    for (let i = -height; i < width; i += spacing) {
      this.fill.lineBetween(2 + i, 2, 2 + i + height, 2 + height);
    }

    // Diagonal left
    for (let i = 0; i < width + height; i += spacing) {
      this.fill.lineBetween(2 + i, 2, 2 + i - height, 2 + height);
    }
  }

  /**
   * Horizontal stripe pattern
   */
  private applyHorizontalPattern(width: number, height: number): void {
    this.fill.lineStyle(2, 0xffffff, 0.3);
    const spacing = 6;
    for (let y = spacing; y < height; y += spacing) {
      this.fill.lineBetween(2, 2 + y, 2 + width, 2 + y);
    }
  }

  /**
   * Get pattern configuration for stat type
   */
  private getPatternForStat(stat: StatName): StatBarPattern {
    switch (stat) {
      case 'energy':
        return { color: 0x3498db, patternType: 'solid' }; // Blue solid

      case 'stress':
        return { color: 0xe74c3c, patternType: 'diagonal' }; // Red diagonal stripes

      case 'hunger':
        return { color: 0xe67e22, patternType: 'dots' }; // Orange dots

      case 'happiness':
        return { color: 0xf1c40f, patternType: 'solid' }; // Yellow solid

      case 'socialAnxiety':
        return { color: 0x9b59b6, patternType: 'crosshatch' }; // Purple crosshatch

      default:
        return { color: 0x95a5a6, patternType: 'solid' }; // Gray solid
    }
  }

  /**
   * Get human-readable label for stat
   */
  private getStatLabel(stat: StatName): string {
    switch (stat) {
      case 'energy': return 'Energy';
      case 'stress': return 'Stress';
      case 'hunger': return 'Hunger';
      case 'happiness': return 'Happiness';
      case 'socialAnxiety': return 'Social Anxiety';
      default: return stat;
    }
  }

  /**
   * Cleanup
   */
  destroy(fromScene?: boolean): void {
    this.fill.destroy();
    super.destroy(fromScene);
  }
}
