/**
 * LaptopScene
 * Data-driven laptop interface loaded from YAML
 * Features: dynamic grid, keyboard navigation, sprite/emoji icons, transitions
 */

import Phaser from 'phaser';
import { StateManager } from '@game/StateManager';
import { yamlParser, type LaptopConfig, type LaptopAppConfig } from '@scripting/YAMLParser';
import { config } from '../../config';

interface AppIcon {
  id: string;
  config: LaptopAppConfig;
  container: Phaser.GameObjects.Container;
  sprite?: Phaser.GameObjects.Sprite;
  text?: Phaser.GameObjects.Text;
  label: Phaser.GameObjects.Text;
  gridIndex: number;
  row: number;
  col: number;
}

type ViewState = 'desktop' | 'app';

export class LaptopScene extends Phaser.Scene {
  private stateManager!: StateManager;
  private laptopConfig!: LaptopConfig;

  // View state
  private viewState: ViewState = 'desktop';
  private currentAppId: string | null = null;

  // UI elements
  private background!: Phaser.GameObjects.Image;
  private appIcons: AppIcon[] = [];
  private topBar!: Phaser.GameObjects.Container;
  private appViewContainer!: Phaser.GameObjects.Container;

  // Keyboard navigation
  private focusedIndex: number = -1; // -1 means no keyboard focus
  private focusBorder?: Phaser.GameObjects.Graphics;
  private focusTween?: Phaser.Tweens.Tween;

  // Grid layout calculated values
  private gridStartX: number = 0;
  private gridStartY: number = 0;
  private gridRows: number = 0;
  private gridCols: number = 0;

  // Motion preference
  private prefersReducedMotion: boolean = false;

  // Asset loading tracking
  private loadedSprites: Set<string> = new Set();
  private loadedBackgrounds: Set<string> = new Set();

  constructor() {
    super({ key: 'LaptopScene' });
    // Initialize with fallback config immediately
    this.laptopConfig = this.createFallbackConfig();
  }

  create(): void {
    this.stateManager = new StateManager();

    // Check motion preference
    if (typeof window !== 'undefined') {
      this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    // Show loading state and load config async
    this.loadAndBuildUI();
  }

  /**
   * Load config and build UI asynchronously
   */
  private async loadAndBuildUI(): Promise<void> {
    const { width, height } = this.cameras.main;

    // Show loading text
    const loadingText = this.add.text(width / 2, height / 2, 'Loading...', {
      fontFamily: 'Comic Relief, sans-serif',
      fontSize: '24px',
      color: '#ecf0f1',
    });
    loadingText.setOrigin(0.5);

    // Load laptop config from YAML
    try {
      this.laptopConfig = await yamlParser.loadLaptop('/data/stories/scenes/laptop.yaml');
      console.log('[LaptopScene] Loaded config:', this.laptopConfig);
    } catch (error) {
      console.error('[LaptopScene] Failed to load laptop config:', error);
      // Keep fallback config
    }

    // Preload desktop background
    await this.loadBackgroundTexture('desktop-bg', this.laptopConfig.background);

    // Preload app sprites and backgrounds
    for (const app of this.laptopConfig.apps) {
      if (app.sprite) {
        await this.loadSpriteTexture(`app-icon-${app.id}`, app.sprite);
      }
      if (app.background) {
        await this.loadBackgroundTexture(`app-bg-${app.id}`, app.background);
      }
    }

    // Remove loading text
    loadingText.destroy();

    // Build UI
    this.buildUI(width, height);
  }

  /**
   * Build the UI after config and assets are loaded
   */
  private buildUI(width: number, height: number): void {
    // Create background
    this.createBackground(width, height);

    // Create top bar
    this.createTopBar(width);

    // Create app grid
    this.createAppGrid(width, height);

    // Create app view container (hidden initially)
    this.appViewContainer = this.add.container(0, 0);
    this.appViewContainer.setVisible(false);
    this.appViewContainer.setDepth(100);

    // Setup input
    this.setupInput();

    // Listen for YAML reload
    this.game.events.on('reloadYAML', () => this.reloadConfig());
  }

  /**
   * Load a background texture
   */
  private async loadBackgroundTexture(key: string, path: string): Promise<void> {
    if (this.textures.exists(key)) {
      this.loadedBackgrounds.add(key);
      return;
    }

    const fullPath = config.assetPath(path);

    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        this.textures.addImage(key, img);
        this.loadedBackgrounds.add(key);
        console.log(`[LaptopScene] Loaded background: ${key}`);
        resolve();
      };
      img.onerror = () => {
        console.warn(`[LaptopScene] Failed to load background: ${path}`);
        resolve();
      };
      img.src = fullPath;
    });
  }

  /**
   * Load a sprite texture
   */
  private async loadSpriteTexture(key: string, path: string): Promise<void> {
    if (this.textures.exists(key)) {
      this.loadedSprites.add(key);
      return;
    }

    const fullPath = config.assetPath(path);

    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        this.textures.addImage(key, img);
        this.loadedSprites.add(key);
        console.log(`[LaptopScene] Loaded sprite: ${key}`);
        resolve();
      };
      img.onerror = () => {
        console.warn(`[LaptopScene] Failed to load sprite: ${path}, will use fallback`);
        resolve();
      };
      img.src = fullPath;
    });
  }

  /**
   * Create fallback config if YAML fails to load
   */
  private createFallbackConfig(): LaptopConfig {
    return {
      id: 'laptop',
      name: 'Laptop',
      background: 'assets/backgrounds/pc.png',
      grid: {
        max_columns: 6,
        icon_size: 80,
        padding: 32,
        spacing: 60,
      },
      transitions: {
        duration: 400,
        respect_reduced_motion: true,
      },
      sounds: {},
      apps: [
        { id: 'email', name: 'Email', fallback_icon: '✉' },
        { id: 'calendar', name: 'Calendar', fallback_icon: '📅' },
        { id: 'tasks', name: 'Tasks', fallback_icon: '✓' },
        { id: 'zoom', name: 'Zoom', fallback_icon: '📹' },
        { id: 'catdora', name: 'Catdora', fallback_icon: '🍕' },
        { id: 'chat', name: 'Chat', fallback_icon: '💬' },
        { id: 'solitaire', name: 'Solitaire', fallback_icon: '🃏' },
      ],
    };
  }

  /**
   * Create background image
   */
  private createBackground(width: number, height: number): void {
    const bgKey = this.loadedBackgrounds.has('desktop-bg') ? 'desktop-bg' : '__MISSING';

    if (bgKey === '__MISSING') {
      // Create solid color fallback
      const bg = this.add.rectangle(width / 2, height / 2, width, height, 0x2d3436);
      bg.setDepth(0);
      // Create a placeholder image for transitions
      this.background = this.add.image(width / 2, height / 2, '__DEFAULT');
      this.background.setVisible(false);
    } else {
      this.background = this.add.image(width / 2, height / 2, bgKey);
      this.background.setDepth(0);
    }
  }

  /**
   * Create top bar with title and close button
   */
  private createTopBar(width: number): void {
    this.topBar = this.add.container(width / 2, 30);
    this.topBar.setDepth(1000);

    // Bar background
    const bar = this.add.rectangle(0, 0, width, 60, 0x34495e);
    this.topBar.add(bar);

    // Title
    const title = this.add.text(-width / 2 + 20, 0, this.laptopConfig.name, {
      fontFamily: 'Comic Relief, sans-serif',
      fontSize: '24px',
      color: '#ecf0f1',
    });
    title.setOrigin(0, 0.5);
    this.topBar.add(title);

    // Close button (44px minimum touch target)
    const closeBtn = this.add.rectangle(width / 2 - 40, 0, 50, 50, 0xe74c3c);
    closeBtn.setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => this.handleEscape());
    this.topBar.add(closeBtn);

    const closeX = this.add.text(width / 2 - 40, 0, '×', {
      fontFamily: 'Comic Relief, sans-serif',
      fontSize: '32px',
      color: '#ffffff',
    });
    closeX.setOrigin(0.5);
    this.topBar.add(closeX);
  }

  /**
   * Create app grid from config
   */
  private createAppGrid(width: number, height: number): void {
    const { grid, apps } = this.laptopConfig;
    const { max_columns, icon_size, padding, spacing } = grid;

    // Calculate grid dimensions
    this.gridCols = Math.min(apps.length, max_columns);
    this.gridRows = Math.ceil(apps.length / max_columns);

    // Calculate total grid size
    const totalWidth = this.gridCols * (icon_size + padding) + (this.gridCols - 1) * spacing;
    const totalHeight = this.gridRows * (icon_size + padding + 40) + (this.gridRows - 1) * spacing;

    // Center grid on screen (accounting for top bar)
    this.gridStartX = (width - totalWidth) / 2 + (icon_size + padding) / 2;
    this.gridStartY = 60 + (height - 60 - totalHeight) / 2 + (icon_size + padding) / 2;

    // Create icons
    apps.forEach((appConfig, index) => {
      const col = index % max_columns;
      const row = Math.floor(index / max_columns);

      const x = this.gridStartX + col * (icon_size + padding + spacing);
      const y = this.gridStartY + row * (icon_size + padding + 40 + spacing);

      const appIcon = this.createAppIcon(appConfig, x, y, index, row, col);
      this.appIcons.push(appIcon);
    });
  }

  /**
   * Create a single app icon
   */
  private createAppIcon(
    appConfig: LaptopAppConfig,
    x: number,
    y: number,
    gridIndex: number,
    row: number,
    col: number
  ): AppIcon {
    const { icon_size, padding } = this.laptopConfig.grid;
    const touchSize = icon_size + padding;

    // Container for icon and label
    const container = this.add.container(x, y);
    container.setDepth(10);

    // Interactive background (invisible, for touch target)
    const hitArea = this.add.rectangle(0, 0, touchSize, touchSize + 40, 0x000000, 0);
    hitArea.setInteractive({ useHandCursor: true });
    container.add(hitArea);

    let sprite: Phaser.GameObjects.Sprite | undefined;
    let text: Phaser.GameObjects.Text | undefined;

    // Try to use sprite, fallback to emoji with background
    const spriteKey = `app-icon-${appConfig.id}`;
    if (this.loadedSprites.has(spriteKey)) {
      // Sprite found - no background needed
      sprite = this.add.sprite(0, 0, spriteKey);
      sprite.setDisplaySize(icon_size, icon_size);
      container.add(sprite);
    } else {
      // Emoji fallback - add background for visibility
      const iconBg = this.add.rectangle(0, 0, icon_size, icon_size, 0x3d566e, 0.8);
      iconBg.setStrokeStyle(2, 0x4a6785);
      container.add(iconBg);

      text = this.add.text(0, 0, appConfig.fallback_icon, {
        fontSize: '56px',
        stroke: '#000000',
        strokeThickness: 4,
      });
      text.setOrigin(0.5);
      container.add(text);
    }

    // App name label
    const label = this.add.text(0, icon_size / 2 + 24, appConfig.name, {
      fontFamily: 'Comic Relief, sans-serif',
      fontSize: '18px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
    });
    label.setOrigin(0.5);
    container.add(label);

    // Setup interactions
    hitArea.on('pointerover', () => this.onIconHover(gridIndex, true));
    hitArea.on('pointerout', () => this.onIconHover(gridIndex, false));
    hitArea.on('pointerdown', () => this.openApp(appConfig.id));

    return {
      id: appConfig.id,
      config: appConfig,
      container,
      sprite,
      text,
      label,
      gridIndex,
      row,
      col,
    };
  }

  /**
   * Handle icon hover state
   */
  private onIconHover(index: number, isHovering: boolean): void {
    const icon = this.appIcons[index];
    if (!icon) return;

    // Clear keyboard focus when mouse hovers
    if (isHovering && this.focusedIndex !== -1) {
      this.clearFocusIndicator();
      this.focusedIndex = -1;
    }

    this.updateIconVisuals(icon, isHovering, false);
  }

  /**
   * Update icon visual state (hover/focus effects)
   */
  private updateIconVisuals(icon: AppIcon, showGlow: boolean, isKeyboardFocus: boolean): void {
    const target = icon.sprite || icon.text;
    if (!target) return;

    if (showGlow) {
      // Add glow effect
      if (!target.getData('hasGlow')) {
        const glow = target.preFX?.addGlow(0xffffff, 4, 0, false, 0.1, 16);
        if (glow) {
          target.setData('hasGlow', true);
          target.setData('glowFx', glow);
        }
      }

      // Scale up on hover (not keyboard focus)
      if (!isKeyboardFocus) {
        this.tweens.add({
          targets: icon.container,
          scaleX: 1.08,
          scaleY: 1.08,
          duration: 100,
          ease: 'Power2',
        });
      }
    } else {
      // Remove glow
      const glow = target.getData('glowFx');
      if (glow) {
        target.preFX?.remove(glow);
        target.setData('hasGlow', false);
        target.setData('glowFx', null);
      }

      // Scale back
      this.tweens.add({
        targets: icon.container,
        scaleX: 1,
        scaleY: 1,
        duration: 100,
        ease: 'Power2',
      });
    }
  }

  /**
   * Setup keyboard and escape input
   */
  private setupInput(): void {
    if (!this.input.keyboard) return;

    // Arrow keys for 2D navigation
    const cursors = this.input.keyboard.createCursorKeys();
    cursors.up.on('down', () => this.navigateGrid('up'));
    cursors.down.on('down', () => this.navigateGrid('down'));
    cursors.left.on('down', () => this.navigateGrid('left'));
    cursors.right.on('down', () => this.navigateGrid('right'));

    // Tab for linear navigation
    const tabKey = this.input.keyboard.addKey('TAB');
    tabKey.on('down', (event: KeyboardEvent) => {
      event.preventDefault();
      this.navigateLinear(event.shiftKey ? -1 : 1);
    });

    // Enter/Space to activate
    const enterKey = this.input.keyboard.addKey('ENTER');
    const spaceKey = this.input.keyboard.addKey('SPACE');
    enterKey.on('down', () => this.activateFocused());
    spaceKey.on('down', () => this.activateFocused());

    // Escape to go back/close
    const escKey = this.input.keyboard.addKey('ESC');
    escKey.on('down', () => this.handleEscape());
  }

  /**
   * Navigate grid with arrow keys
   */
  private navigateGrid(direction: 'up' | 'down' | 'left' | 'right'): void {
    if (this.viewState !== 'desktop') return;

    const numApps = this.appIcons.length;
    if (numApps === 0) return;

    // Initialize focus if not set
    if (this.focusedIndex === -1) {
      this.setFocusedIndex(0);
      return;
    }

    const currentIcon = this.appIcons[this.focusedIndex];
    if (!currentIcon) return;

    let newRow = currentIcon.row;
    let newCol = currentIcon.col;

    switch (direction) {
      case 'up':
        newRow = (newRow - 1 + this.gridRows) % this.gridRows;
        break;
      case 'down':
        newRow = (newRow + 1) % this.gridRows;
        break;
      case 'left':
        newCol = (newCol - 1 + this.gridCols) % this.gridCols;
        break;
      case 'right':
        newCol = (newCol + 1) % this.gridCols;
        break;
    }

    // Calculate new index, handling partial last row
    let newIndex = newRow * this.laptopConfig.grid.max_columns + newCol;
    if (newIndex >= numApps) {
      // Wrap to valid index
      if (direction === 'down') {
        newIndex = newCol;
      } else if (direction === 'right') {
        newIndex = newRow * this.laptopConfig.grid.max_columns;
      } else {
        newIndex = Math.min(newIndex, numApps - 1);
      }
    }

    this.setFocusedIndex(newIndex);
  }

  /**
   * Navigate linearly with Tab
   */
  private navigateLinear(delta: number): void {
    if (this.viewState !== 'desktop') return;

    const numApps = this.appIcons.length;
    if (numApps === 0) return;

    // Initialize focus if not set
    if (this.focusedIndex === -1) {
      this.setFocusedIndex(delta > 0 ? 0 : numApps - 1);
      return;
    }

    const newIndex = (this.focusedIndex + delta + numApps) % numApps;
    this.setFocusedIndex(newIndex);
  }

  /**
   * Set focused index and update visuals
   */
  private setFocusedIndex(index: number): void {
    // Clear previous focus
    if (this.focusedIndex !== -1 && this.focusedIndex !== index) {
      const prevIcon = this.appIcons[this.focusedIndex];
      if (prevIcon) {
        this.updateIconVisuals(prevIcon, false, false);
      }
    }

    this.focusedIndex = index;
    const icon = this.appIcons[index];
    if (!icon) return;

    // Apply focus visuals
    this.updateIconVisuals(icon, true, true);
    this.drawFocusIndicator(icon);

    // Play navigation sound
    // this.sound.play('ui-tick', { volume: 0.3 });
  }

  /**
   * Draw animated dashed border for keyboard focus
   */
  private drawFocusIndicator(icon: AppIcon): void {
    this.clearFocusIndicator();

    const { icon_size, padding } = this.laptopConfig.grid;
    const size = icon_size + 8;
    const x = icon.container.x;
    const y = icon.container.y;

    this.focusBorder = this.add.graphics();
    this.focusBorder.setDepth(20);

    // Draw dashed rectangle
    this.drawDashedRect(this.focusBorder, x - size / 2, y - size / 2, size, size);

    // Animate the dash pattern
    this.focusTween = this.tweens.add({
      targets: { offset: 0 },
      offset: 20,
      duration: 1000,
      repeat: -1,
      onUpdate: (tween) => {
        if (this.focusBorder) {
          this.focusBorder.clear();
          this.drawDashedRect(
            this.focusBorder,
            x - size / 2,
            y - size / 2,
            size,
            size,
            tween.getValue() ?? 0
          );
        }
      },
    });
  }

  /**
   * Draw a dashed rectangle
   */
  private drawDashedRect(
    graphics: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    width: number,
    height: number,
    offset: number = 0
  ): void {
    graphics.lineStyle(3, 0xffffff, 0.9);

    const dashLength = 8;
    const gapLength = 4;
    const totalLength = dashLength + gapLength;

    // Top edge
    this.drawDashedLine(graphics, x, y, x + width, y, dashLength, gapLength, offset);
    // Right edge
    this.drawDashedLine(graphics, x + width, y, x + width, y + height, dashLength, gapLength, offset);
    // Bottom edge
    this.drawDashedLine(graphics, x + width, y + height, x, y + height, dashLength, gapLength, offset);
    // Left edge
    this.drawDashedLine(graphics, x, y + height, x, y, dashLength, gapLength, offset);
  }

  /**
   * Draw a dashed line
   */
  private drawDashedLine(
    graphics: Phaser.GameObjects.Graphics,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    dashLength: number,
    gapLength: number,
    offset: number = 0
  ): void {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.sqrt(dx * dx + dy * dy);
    const unitX = dx / length;
    const unitY = dy / length;

    const totalLength = dashLength + gapLength;
    let pos = offset % totalLength;
    let drawing = pos < dashLength;

    while (pos < length) {
      const segmentEnd = drawing
        ? Math.min(pos + dashLength - (offset % totalLength), length)
        : Math.min(pos + gapLength, length);

      if (drawing && pos < length) {
        graphics.lineBetween(
          x1 + unitX * pos,
          y1 + unitY * pos,
          x1 + unitX * Math.min(pos + dashLength, length),
          y1 + unitY * Math.min(pos + dashLength, length)
        );
      }

      pos += drawing ? dashLength : gapLength;
      drawing = !drawing;
    }
  }

  /**
   * Clear focus indicator
   */
  private clearFocusIndicator(): void {
    if (this.focusTween) {
      this.focusTween.stop();
      this.focusTween = undefined;
    }
    if (this.focusBorder) {
      this.focusBorder.destroy();
      this.focusBorder = undefined;
    }
  }

  /**
   * Activate the focused app
   */
  private activateFocused(): void {
    if (this.viewState !== 'desktop') return;
    if (this.focusedIndex === -1) return;

    const icon = this.appIcons[this.focusedIndex];
    if (icon) {
      this.openApp(icon.id);
    }
  }

  /**
   * Open an app
   */
  private openApp(appId: string): void {
    const app = this.laptopConfig.apps.find((a) => a.id === appId);
    if (!app) return;

    console.log(`[LaptopScene] Opening app: ${appId}`);

    this.currentAppId = appId;
    this.viewState = 'app';

    // Update title
    const title = this.topBar.getAt(1) as Phaser.GameObjects.Text;
    title.setText(app.name);

    // Switch background
    this.switchBackground(app.background);

    // Hide app grid
    this.appIcons.forEach((icon) => icon.container.setVisible(false));
    this.clearFocusIndicator();

    // Show app view
    this.showAppView(appId);
  }

  /**
   * Switch background instantly
   */
  private switchBackground(bgPath?: string): void {
    const bgKey = bgPath ? `app-bg-${this.currentAppId}` : 'desktop-bg';
    const hasTexture = this.loadedBackgrounds.has(bgKey);
    const targetKey = hasTexture ? bgKey : 'desktop-bg';

    if (!this.loadedBackgrounds.has(targetKey)) {
      console.log(`[LaptopScene] Background not loaded: ${targetKey}`);
      return;
    }

    this.background.setTexture(targetKey);
  }

  /**
   * Show app-specific view
   */
  private showAppView(appId: string): void {
    this.appViewContainer.removeAll(true);
    this.appViewContainer.setVisible(true);

    const { width, height } = this.cameras.main;

    // Create back button
    const backBtn = this.add.rectangle(100, height - 50, 120, 44, 0x95a5a6);
    backBtn.setInteractive({ useHandCursor: true });
    backBtn.on('pointerdown', () => this.returnToDesktop());
    this.appViewContainer.add(backBtn);

    const backText = this.add.text(100, height - 50, '← Back', {
      fontFamily: 'Comic Relief, sans-serif',
      fontSize: '16px',
      color: '#ffffff',
    });
    backText.setOrigin(0.5);
    this.appViewContainer.add(backText);

    // Placeholder content for apps
    const placeholder = this.add.text(width / 2, height / 2, `${appId.toUpperCase()} App\n(Content coming soon)`, {
      fontFamily: 'Comic Relief, sans-serif',
      fontSize: '24px',
      color: '#ecf0f1',
      align: 'center',
    });
    placeholder.setOrigin(0.5);
    this.appViewContainer.add(placeholder);
  }

  /**
   * Return to desktop view
   */
  private returnToDesktop(): void {
    console.log('[LaptopScene] Returning to desktop');

    this.viewState = 'desktop';
    this.currentAppId = null;

    // Update title
    const title = this.topBar.getAt(1) as Phaser.GameObjects.Text;
    title.setText(this.laptopConfig.name);

    // Switch back to desktop background
    this.switchBackgroundToDesktop();

    // Hide app view
    this.appViewContainer.setVisible(false);

    // Show app grid
    this.appIcons.forEach((icon) => icon.container.setVisible(true));
  }

  /**
   * Switch background back to desktop
   */
  private switchBackgroundToDesktop(): void {
    if (!this.loadedBackgrounds.has('desktop-bg')) return;
    this.background.setTexture('desktop-bg');
  }

  /**
   * Handle escape key
   */
  private handleEscape(): void {
    if (this.viewState === 'app') {
      this.returnToDesktop();
    } else {
      this.closeLaptop();
    }
  }

  /**
   * Close laptop and return to room
   */
  private closeLaptop(): void {
    console.log('[LaptopScene] Closing laptop');
    this.clearFocusIndicator();
    this.scene.stop('LaptopScene');
    this.scene.resume('RoomScene');
  }

  /**
   * Reload config from YAML
   */
  private async reloadConfig(): Promise<void> {
    console.log('[LaptopScene] Reloading config...');

    try {
      this.laptopConfig = await yamlParser.loadLaptop('/data/stories/scenes/laptop.yaml', true);

      // Rebuild UI
      this.appIcons.forEach((icon) => icon.container.destroy());
      this.appIcons = [];

      const { width, height } = this.cameras.main;
      this.createAppGrid(width, height);

      console.log('[LaptopScene] Config reloaded successfully');
    } catch (error) {
      console.error('[LaptopScene] Failed to reload config:', error);
    }
  }
}
