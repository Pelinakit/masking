/**
 * DebugPanel
 * Development tool for testing and debugging
 * Stat editor, time skip, event triggers
 */

import Phaser from 'phaser';
import { StateManager } from '@game/StateManager';
import { yamlParser } from '@scripting/YAMLParser';

export class DebugPanel {
  private scene: Phaser.Scene;
  private stateManager: StateManager;

  private container?: Phaser.GameObjects.Container;
  private isVisible: boolean = false;
  private toggleKey?: Phaser.Input.Keyboard.Key;

  constructor(scene: Phaser.Scene, stateManager: StateManager) {
    this.scene = scene;
    this.stateManager = stateManager;

    this.setupToggleKey();
  }

  /**
   * Setup toggle key (F12 - works on all keyboard layouts)
   */
  private setupToggleKey(): void {
    if (!this.scene.input.keyboard) return;

    this.toggleKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F12);
    this.toggleKey.on('down', () => this.toggle());
  }

  /**
   * Toggle panel visibility
   */
  toggle(): void {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * Show debug panel
   */
  show(): void {
    if (this.isVisible) return;

    this.isVisible = true;
    this.createPanel();
  }

  /**
   * Hide debug panel
   */
  hide(): void {
    if (!this.isVisible) return;

    this.isVisible = false;

    if (this.container) {
      this.container.destroy();
      this.container = undefined;
    }
  }

  /**
   * Create debug panel UI
   */
  private createPanel(): void {
    const { width, height } = this.scene.cameras.main;

    this.container = this.scene.add.container(0, 0);
    this.container.setDepth(10000); // Always on top

    // Semi-transparent background
    const bg = this.scene.add.rectangle(0, 0, 400, height, 0x000000, 0.9);
    bg.setOrigin(0);
    this.container.add(bg);

    // Title
    const title = this.scene.add.text(200, 20, 'DEBUG PANEL', {
      fontFamily: 'Comic Relief, sans-serif',
      fontSize: '20px',
      color: '#00ff00',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5, 0);
    this.container.add(title);

    // Close button
    const closeBtn = this.scene.add.rectangle(370, 20, 40, 40, 0xff0000);
    closeBtn.setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => this.hide());
    this.container.add(closeBtn);

    const closeX = this.scene.add.text(370, 30, '×', {
      fontSize: '32px',
      color: '#ffffff',
    });
    closeX.setOrigin(0.5);
    this.container.add(closeX);

    // Sections
    let yOffset = 70;

    // Time controls
    yOffset = this.addTimeControls(yOffset);

    // Stat controls
    yOffset = this.addStatControls(yOffset);

    // Event triggers
    yOffset = this.addEventTriggers(yOffset);

    // Script controls (YAML hot reload)
    yOffset = this.addScriptControls(yOffset);

    // State management
    yOffset = this.addStateControls(yOffset);
  }

  /**
   * Add time control buttons
   */
  private addTimeControls(startY: number): number {
    const sectionTitle = this.scene.add.text(20, startY, 'Time Controls', {
      fontFamily: 'Comic Relief, sans-serif',
      fontSize: '16px',
      color: '#ffff00',
      fontStyle: 'bold',
    });
    this.container?.add(sectionTitle);

    let y = startY + 30;

    // Time buttons
    const timeButtons = [
      { label: '+1 Hour', action: () => this.stateManager.time.skipHours(1) },
      { label: '+4 Hours', action: () => this.stateManager.time.skipHours(4) },
      { label: 'Skip to 9am', action: () => this.stateManager.time.skipToTime(9, 0) },
      { label: 'Skip to 5pm', action: () => this.stateManager.time.skipToTime(17, 0) },
      { label: 'Next Day', action: () => this.stateManager.time.skipDays(1) },
    ];

    timeButtons.forEach(({ label, action }) => {
      const btn = this.createButton(20, y, 360, 35, label, action);
      this.container?.add(btn);
      y += 45;
    });

    return y + 10;
  }

  /**
   * Add stat control sliders
   */
  private addStatControls(startY: number): number {
    const sectionTitle = this.scene.add.text(20, startY, 'Stats', {
      fontFamily: 'Comic Relief, sans-serif',
      fontSize: '16px',
      color: '#ffff00',
      fontStyle: 'bold',
    });
    this.container?.add(sectionTitle);

    let y = startY + 30;

    const stats = ['energy', 'stress', 'hunger', 'happiness'];

    stats.forEach(stat => {
      // Stat label and value
      const state = this.stateManager.getState();
      const currentValue = state.stats[stat] || 0;

      const label = this.scene.add.text(20, y, `${stat}: ${currentValue}`, {
        fontFamily: 'Comic Relief, sans-serif',
        fontSize: '14px',
        color: '#ffffff',
      });
      this.container?.add(label);

      // Buttons
      const minusBtn = this.createButton(200, y - 5, 50, 25, '-10', () => {
        this.stateManager.stats.modifyStat(stat, -10);
        this.refresh();
      });

      const plusBtn = this.createButton(260, y - 5, 50, 25, '+10', () => {
        this.stateManager.stats.modifyStat(stat, 10);
        this.refresh();
      });

      const maxBtn = this.createButton(320, y - 5, 60, 25, 'MAX', () => {
        this.stateManager.stats.setStat(stat, 100);
        this.refresh();
      });

      this.container?.add([minusBtn, plusBtn, maxBtn]);

      y += 35;
    });

    return y + 10;
  }

  /**
   * Add event trigger buttons
   */
  private addEventTriggers(startY: number): number {
    const sectionTitle = this.scene.add.text(20, startY, 'Triggers', {
      fontFamily: 'Comic Relief, sans-serif',
      fontSize: '16px',
      color: '#ffff00',
      fontStyle: 'bold',
    });
    this.container?.add(sectionTitle);

    let y = startY + 30;

    const triggers = [
      {
        label: 'Trigger Meeting',
        action: () => {
          console.log('Trigger meeting event');
          this.scene.events.emit('debugTriggerMeeting');
        },
      },
      {
        label: 'Add Email',
        action: () => {
          console.log('Add test email');
          this.scene.events.emit('debugAddEmail');
        },
      },
      {
        label: 'Add Task',
        action: () => {
          const state = this.stateManager.getState();
          if (!state.tasks) state.tasks = [];
          state.tasks.push({
            id: `task-${Date.now()}`,
            text: 'Debug task',
            completed: false,
          });
          this.stateManager.setState(state);
        },
      },
    ];

    triggers.forEach(({ label, action }) => {
      const btn = this.createButton(20, y, 360, 35, label, action);
      this.container?.add(btn);
      y += 45;
    });

    return y + 10;
  }

  /**
   * Add script controls (YAML hot reload)
   */
  private addScriptControls(startY: number): number {
    const sectionTitle = this.scene.add.text(20, startY, 'Scripts (YAML)', {
      fontFamily: 'Comic Relief, sans-serif',
      fontSize: '16px',
      color: '#ffff00',
      fontStyle: 'bold',
    });
    this.container?.add(sectionTitle);

    let y = startY + 30;

    const buttons = [
      {
        label: '🔄 Reload All YAML',
        action: () => {
          yamlParser.clearCache();
          console.log('[Debug] YAML cache cleared - reloading scene...');
          this.scene.events.emit('reloadYAML');
          // Notify user
          this.showNotification('YAML scripts reloaded!');
        },
      },
      {
        label: '📊 Cache Stats',
        action: () => {
          const stats = yamlParser.getCacheStats();
          console.log('[Debug] YAML Cache:', stats);
          this.showNotification(`Cached: ${stats.files} files`);
        },
      },
    ];

    buttons.forEach(({ label, action }) => {
      const btn = this.createButton(20, y, 360, 35, label, action);
      this.container?.add(btn);
      y += 45;
    });

    return y + 10;
  }

  /**
   * Show temporary notification
   */
  private showNotification(message: string): void {
    const { width } = this.scene.cameras.main;
    const notif = this.scene.add.text(width / 2, 50, message, {
      fontFamily: 'Comic Relief, sans-serif',
      fontSize: '18px',
      color: '#00ff00',
      backgroundColor: '#000000',
      padding: { x: 20, y: 10 },
    });
    notif.setOrigin(0.5);
    notif.setDepth(10001);

    this.scene.tweens.add({
      targets: notif,
      alpha: 0,
      y: 30,
      duration: 2000,
      ease: 'Power2',
      onComplete: () => notif.destroy(),
    });
  }

  /**
   * Add state management controls
   */
  private addStateControls(startY: number): number {
    const sectionTitle = this.scene.add.text(20, startY, 'State', {
      fontFamily: 'Comic Relief, sans-serif',
      fontSize: '16px',
      color: '#ffff00',
      fontStyle: 'bold',
    });
    this.container?.add(sectionTitle);

    let y = startY + 30;

    const buttons = [
      {
        label: 'Save State',
        action: () => {
          this.stateManager.save();
          console.log('State saved');
        },
      },
      {
        label: 'Load State',
        action: () => {
          this.stateManager.load();
          this.refresh();
          console.log('State loaded');
        },
      },
      {
        label: 'Reset State',
        action: () => {
          if (confirm('Reset all game state?')) {
            localStorage.clear();
            location.reload();
          }
        },
      },
      {
        label: 'Export State',
        action: () => {
          const state = this.stateManager.getState();
          console.log('Current state:', JSON.stringify(state, null, 2));
        },
      },
    ];

    buttons.forEach(({ label, action }) => {
      const btn = this.createButton(20, y, 360, 35, label, action);
      this.container?.add(btn);
      y += 45;
    });

    return y + 10;
  }

  /**
   * Create button helper
   */
  private createButton(
    x: number,
    y: number,
    width: number,
    height: number,
    label: string,
    onClick: () => void
  ): Phaser.GameObjects.Container {
    const container = this.scene.add.container(x, y);

    const bg = this.scene.add.rectangle(0, 0, width, height, 0x444444);
    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerdown', onClick);
    bg.on('pointerover', () => bg.setFillStyle(0x666666));
    bg.on('pointerout', () => bg.setFillStyle(0x444444));

    const text = this.scene.add.text(0, 0, label, {
      fontFamily: 'Comic Relief, sans-serif',
      fontSize: '14px',
      color: '#ffffff',
    });
    text.setOrigin(0.5);

    container.add([bg, text]);
    return container;
  }

  /**
   * Refresh panel (rebuild UI)
   */
  private refresh(): void {
    if (this.isVisible) {
      this.hide();
      this.show();
    }
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.hide();
  }
}
