/**
 * StatBarGroup
 * Presentation layer - manages all stat bars in a responsive layout
 * Mobile-first: vertical stack on mobile, horizontal on desktop
 */

import Phaser from 'phaser';
import { StatBar } from './StatBar';
import { StatSystem, StatName } from '@game/systems/StatSystem';

export interface StatBarGroupConfig {
  scene: Phaser.Scene;
  x: number;
  y: number;
  layout?: 'vertical' | 'horizontal';
  barWidth?: number;
  barHeight?: number;
  spacing?: number;
}

export class StatBarGroup extends Phaser.GameObjects.Container {
  private statBars: Map<StatName, StatBar> = new Map();
  private statSystem?: StatSystem;
  private config: StatBarGroupConfig;

  private readonly STATS_ORDER: StatName[] = [
    'energy',
    'stress',
    'hunger',
    'happiness',
    'socialAnxiety',
  ];

  constructor(config: StatBarGroupConfig) {
    super(config.scene, config.x, config.y);
    this.config = config;

    this.create();
    this.scene.add.existing(this);
  }

  private create(): void {
    const layout = this.config.layout || 'vertical';
    const barWidth = this.config.barWidth || 200;
    const barHeight = this.config.barHeight || 32;
    const spacing = this.config.spacing || 8;

    this.STATS_ORDER.forEach((stat, index) => {
      let x = 0;
      let y = 0;

      if (layout === 'vertical') {
        y = index * (barHeight + spacing);
      } else {
        x = index * (barWidth + spacing);
      }

      const statBar = new StatBar({
        scene: this.scene,
        x,
        y,
        width: barWidth,
        height: barHeight,
        statName: stat,
        showLabel: true,
        showValue: true,
      });

      this.add(statBar);
      this.statBars.set(stat, statBar);
    });
  }

  /**
   * Link to stat system for automatic updates
   */
  linkStatSystem(statSystem: StatSystem): void {
    this.statSystem = statSystem;
    this.updateAll(false);
  }

  /**
   * Update all stat bars from linked stat system
   */
  updateAll(animate: boolean = true): void {
    if (!this.statSystem) return;

    this.STATS_ORDER.forEach(stat => {
      const statBar = this.statBars.get(stat);
      const statData = this.statSystem?.getStatData(stat);

      if (statBar && statData) {
        statBar.setValue(statData.current, statData.max, animate);
      }
    });
  }

  /**
   * Update a specific stat bar
   */
  updateStat(stat: StatName, animate: boolean = true): void {
    if (!this.statSystem) return;

    const statBar = this.statBars.get(stat);
    const statData = this.statSystem.getStatData(stat);

    if (statBar && statData) {
      statBar.setValue(statData.current, statData.max, animate);
    }
  }

  /**
   * Show/hide the entire group
   */
  show(): void {
    this.setVisible(true);
  }

  hide(): void {
    this.setVisible(false);
  }

  /**
   * Resize for responsive layout
   */
  resize(width: number, height: number): void {
    // Adjust layout based on screen size
    const isMobile = width < 768;
    const newLayout = isMobile ? 'vertical' : 'horizontal';

    if (newLayout !== this.config.layout) {
      this.config.layout = newLayout;
      this.recreate();
    }
  }

  /**
   * Recreate bars with new layout
   */
  private recreate(): void {
    this.statBars.forEach(bar => bar.destroy());
    this.statBars.clear();
    this.removeAll(true);
    this.create();

    if (this.statSystem) {
      this.updateAll(false);
    }
  }
}
