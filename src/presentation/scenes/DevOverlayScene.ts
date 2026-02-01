/**
 * DevOverlayScene
 * Persistent overlay for dev controls across all scenes
 * Runs in parallel with other scenes when dev mode is enabled
 */

import Phaser from 'phaser';
import { yamlParser } from '@scripting/YAMLParser';
import { assetWarningTracker, type AssetWarning } from '@core/AssetWarningTracker';

export class DevOverlayScene extends Phaser.Scene {
  private devControls?: Phaser.GameObjects.Container;
  private devModeIndicator?: Phaser.GameObjects.Container;
  private assetStatusPanel?: Phaser.GameObjects.Container;
  private isAssetPanelOpen: boolean = false;

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
        this.devModeIndicator?.destroy();
        this.devModeIndicator = undefined;
        this.closeAssetStatusPanel();
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
    if (this.devModeIndicator) {
      this.devModeIndicator.destroy();
    }

    const { width } = this.cameras.main;
    this.devControls = this.add.container(0, 0);
    this.devControls.setDepth(99999);

    // Create DEV MODE indicator (top-left)
    this.createDevModeIndicator();

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

    // Asset Status button
    this.createButton(
      startX - btnWidth - spacing,
      spacing,
      btnWidth,
      btnHeight,
      '🖼️ Asset Status',
      () => this.toggleAssetStatusPanel()
    );

    // Cache Stats button
    this.createButton(
      startX - (btnWidth + spacing) * 2,
      spacing,
      btnWidth,
      btnHeight,
      '📊 Cache Stats',
      () => this.showCacheStats()
    );
  }

  /**
   * Create DEV MODE indicator badge
   */
  private createDevModeIndicator(): void {
    this.devModeIndicator = this.add.container(10, 10);
    this.devModeIndicator.setDepth(99998);

    const bg = this.add.rectangle(0, 0, 100, 24, 0x000000, 0.9);
    bg.setOrigin(0, 0);
    bg.setStrokeStyle(1, 0x00ff00);

    const text = this.add.text(50, 12, '🔧 DEV MODE', {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#00ff00',
    });
    text.setOrigin(0.5);

    this.devModeIndicator.add([bg, text]);
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
   * Toggle asset status panel visibility
   */
  private toggleAssetStatusPanel(): void {
    if (this.isAssetPanelOpen) {
      this.closeAssetStatusPanel();
    } else {
      this.openAssetStatusPanel();
    }
  }

  /**
   * Open asset status panel
   */
  private openAssetStatusPanel(): void {
    this.isAssetPanelOpen = true;

    if (this.assetStatusPanel) {
      this.assetStatusPanel.destroy();
    }

    const { width, height } = this.cameras.main;
    const panelWidth = 350;
    const panelHeight = 300;
    const panelX = width / 2 - panelWidth / 2;
    const panelY = height / 2 - panelHeight / 2;

    this.assetStatusPanel = this.add.container(panelX, panelY);
    this.assetStatusPanel.setDepth(100000);

    // Panel background
    const bg = this.add.rectangle(0, 0, panelWidth, panelHeight, 0x1a1a1a, 0.98);
    bg.setOrigin(0, 0);
    bg.setStrokeStyle(2, 0x00ff00);
    this.assetStatusPanel.add(bg);

    // Header
    const header = this.add.text(panelWidth / 2, 15, '🖼️ Asset Status', {
      fontFamily: 'Comic Relief, sans-serif',
      fontSize: '16px',
      color: '#00ff00',
    });
    header.setOrigin(0.5, 0);
    this.assetStatusPanel.add(header);

    // Close button
    const closeBtn = this.add.text(panelWidth - 15, 10, '✕', {
      fontFamily: 'sans-serif',
      fontSize: '18px',
      color: '#ff6b6b',
    });
    closeBtn.setOrigin(0.5, 0);
    closeBtn.setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => this.closeAssetStatusPanel());
    closeBtn.on('pointerover', () => closeBtn.setColor('#ff9999'));
    closeBtn.on('pointerout', () => closeBtn.setColor('#ff6b6b'));
    this.assetStatusPanel.add(closeBtn);

    // Get warnings
    const warnings = assetWarningTracker.getAll();
    const summary = assetWarningTracker.getSummary();

    // Summary line
    const summaryText = this.add.text(15, 45, `Total Issues: ${summary.total}`, {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: summary.total > 0 ? '#FFD700' : '#00ff00',
    });
    this.assetStatusPanel.add(summaryText);

    // Divider
    const divider = this.add.rectangle(panelWidth / 2, 65, panelWidth - 20, 1, 0x444444);
    this.assetStatusPanel.add(divider);

    // Warnings list
    if (warnings.length === 0) {
      const noIssues = this.add.text(panelWidth / 2, 100, '✓ No asset issues detected', {
        fontFamily: 'Comic Relief, sans-serif',
        fontSize: '14px',
        color: '#00ff00',
      });
      noIssues.setOrigin(0.5, 0);
      this.assetStatusPanel.add(noIssues);
    } else {
      let yOffset = 75;
      const maxVisible = 8;
      const visibleWarnings = warnings.slice(0, maxVisible);

      for (const warning of visibleWarnings) {
        const icon = this.getWarningIcon(warning);
        const color = this.getWarningColor(warning);

        const line = this.add.text(15, yOffset, `${icon} ${warning.assetId}`, {
          fontFamily: 'monospace',
          fontSize: '11px',
          color,
        });
        this.assetStatusPanel.add(line);

        const detail = this.add.text(30, yOffset + 14, warning.message.substring(0, 40), {
          fontFamily: 'monospace',
          fontSize: '10px',
          color: '#888888',
        });
        this.assetStatusPanel.add(detail);

        yOffset += 32;
      }

      if (warnings.length > maxVisible) {
        const more = this.add.text(15, yOffset, `... and ${warnings.length - maxVisible} more`, {
          fontFamily: 'monospace',
          fontSize: '11px',
          color: '#888888',
        });
        this.assetStatusPanel.add(more);
      }
    }

    // Clear button
    const clearBtnY = panelHeight - 40;
    const clearBg = this.add.rectangle(panelWidth / 2, clearBtnY, 100, 28, 0x333333);
    clearBg.setInteractive({ useHandCursor: true });
    clearBg.setStrokeStyle(1, 0x666666);
    clearBg.on('pointerdown', () => {
      assetWarningTracker.clear();
      this.openAssetStatusPanel(); // Refresh panel
      this.showNotification('Asset warnings cleared');
    });
    clearBg.on('pointerover', () => clearBg.setFillStyle(0x444444));
    clearBg.on('pointerout', () => clearBg.setFillStyle(0x333333));
    this.assetStatusPanel.add(clearBg);

    const clearText = this.add.text(panelWidth / 2, clearBtnY, 'Clear All', {
      fontFamily: 'Comic Relief, sans-serif',
      fontSize: '12px',
      color: '#ffffff',
    });
    clearText.setOrigin(0.5);
    this.assetStatusPanel.add(clearText);
  }

  /**
   * Close asset status panel
   */
  private closeAssetStatusPanel(): void {
    this.isAssetPanelOpen = false;
    if (this.assetStatusPanel) {
      this.assetStatusPanel.destroy();
      this.assetStatusPanel = undefined;
    }
  }

  /**
   * Get icon for warning type
   */
  private getWarningIcon(warning: AssetWarning): string {
    switch (warning.type) {
      case 'missing-sprite':
        return '❌';
      case 'frame-mismatch':
        return '⚠️';
      case 'missing-audio':
        return '🔇';
      case 'config-error':
        return '⛔';
      case 'load-failed':
        return '💥';
      default:
        return '❓';
    }
  }

  /**
   * Get color for warning severity
   */
  private getWarningColor(warning: AssetWarning): string {
    switch (warning.severity) {
      case 'error':
        return '#FF6B6B';
      case 'warn':
        return '#FFD700';
      case 'info':
        return '#4ECDC4';
      default:
        return '#FFFFFF';
    }
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
