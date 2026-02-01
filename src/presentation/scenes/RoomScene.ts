/**
 * RoomScene
 * Presentation layer - player's home room with hotspot interactions
 * Mobile-first with touch controls, tutorial, audio, and debug tools
 */

import Phaser from 'phaser';
import { StateManager } from '@game/StateManager';
import { StatBarGroup } from '@presentation/ui/StatBarGroup';
import { ClockDisplay } from '@presentation/ui/ClockDisplay';
import { UILayerManager } from '@presentation/ui/UILayerManager';
import { DebugPanel } from '@presentation/ui/DebugPanel';
import { yamlParser, type SceneScript, type SceneHotspot, type SceneLayer, type BackgroundConfig, type HotspotSpriteConfig } from '@scripting/YAMLParser';
import { assetWarningTracker } from '@core/AssetWarningTracker';
import { config } from '../../config';
import { InputManager } from '@game/systems/InputManager';
import { TutorialManager } from '@game/systems/TutorialManager';
import { AudioManager } from '@game/systems/AudioManager';
import { Character, type CharacterConfig } from '@presentation/components/Character';

export class RoomScene extends Phaser.Scene {
  private stateManager!: StateManager;
  private statBars!: StatBarGroup;
  private clock!: ClockDisplay;
  private uiLayerManager!: UILayerManager;
  private inputManager!: InputManager;
  private tutorialManager!: TutorialManager;
  private audioManager!: AudioManager;
  private debugPanel!: DebugPanel;

  private sceneData?: SceneScript;
  private player?: Character | Phaser.GameObjects.Sprite;
  private playerConfig?: CharacterConfig;
  private hotspots: Phaser.GameObjects.Rectangle[] = [];
  private hotspotSprites: Map<string, Phaser.GameObjects.Sprite | Phaser.GameObjects.Container> = new Map();
  private interactionPrompts: Map<string, Phaser.GameObjects.Text> = new Map();

  private playerX: number = 750;
  private readonly PLAYER_SPEED = 280;  // Scaled for larger resolution
  private readonly ROOM_BOUNDS = { left: 100, right: 1820 };

  // Depth layers for proper rendering order
  private static readonly DEPTH = {
    SCENE_BG: 0,          // Scene background image (behind everything)
    HOTSPOT_BG: 5,        // Background furniture (behind characters)
    CHARACTER: 50,        // Player and NPCs
    HOTSPOT_FG: 100,      // Foreground elements (in front of characters)
    UI: 1000,             // UI elements
  };

  private backgroundImage?: Phaser.GameObjects.Image;
  private placeholderElements: Phaser.GameObjects.GameObject[] = [];

  // Fallback animation state (when Character class isn't used)
  private fallbackAnimState: string = 'idle';
  private fallbackFrameIndex: number = 0;
  private fallbackFrameTimer: number = 0;

  constructor() {
    super({ key: 'RoomScene' });
  }

  create(): void {
    // Initialize systems
    this.stateManager = new StateManager();
    this.inputManager = new InputManager(this);
    this.tutorialManager = new TutorialManager(this);
    this.audioManager = new AudioManager(this);

    // UI Layer manager
    this.uiLayerManager = new UILayerManager(this);

    // Debug panel
    this.debugPanel = new DebugPanel(this, this.stateManager);

    // Create room background
    this.createBackground();

    // Load scene data
    this.loadSceneData();

    // Create player sprite
    this.createPlayer();

    // Create hotspots
    this.createHotspots();

    // Create UI
    this.createUI();

    // Show touch controls on mobile
    if (this.inputManager.getInputType() === 'touch') {
      this.inputManager.showTouchControls();
    }

    // Setup tutorial
    this.setupTutorial();

    // Start background music
    this.audioManager.playMusic('ambient-home', 2000);

    // Start time
    this.stateManager.time.resume();

    // Listen for input type changes
    this.events.on('inputTypeChanged', (type: string) => {
      if (type === 'touch') {
        this.inputManager.showTouchControls();
      } else {
        this.inputManager.hideTouchControls();
      }
    });

    // Listen for global YAML reload event
    this.game.events.on('reloadYAML', () => {
      this.reloadYAML();
    });

    // Listen for accessibility changes
    if (typeof window !== 'undefined') {
      window.addEventListener('accessibility-change', ((event: CustomEvent) => {
        this.handleAccessibilityChange(event.detail);
      }) as EventListener);
    }
  }

  /**
   * Handle accessibility setting changes
   */
  private handleAccessibilityChange(detail: { setting: string; value: boolean | number }): void {
    if (this.player instanceof Character) {
      const settings = this.stateManager.getAccessibilitySettings();
      this.player.updateAccessibilitySettings(settings);
    }
  }

  /**
   * Reload YAML scripts without page refresh
   */
  private async reloadYAML(): Promise<void> {
    console.log('[RoomScene] Reloading YAML scripts...');
    yamlParser.clearCache();

    // Reload scene data
    await this.loadSceneData();

    // Reload character config and update player
    await this.reloadPlayerCharacter();

    this.showNotification('YAML reloaded!');
  }

  /**
   * Reload player character config and update sprite
   */
  private async reloadPlayerCharacter(): Promise<void> {
    if (!(this.player instanceof Character)) return;

    try {
      const newConfig = await yamlParser.loadCharacter('/data/characters/player-cat.yaml', true);

      // Get animation names from new config
      const animNames = Object.keys(newConfig.animations);

      // Remove old animations
      Character.removeAnimations(this, 'player-cat', animNames);

      // Create new animations
      Character.createAnimations(this, newConfig);

      // Update the character instance
      this.player.updateConfig(newConfig);
      this.playerConfig = newConfig;

      console.log('[RoomScene] Player character config reloaded');
    } catch (error) {
      console.error('[RoomScene] Failed to reload player character:', error);
    }
  }

  /**
   * Show temporary notification
   */
  private showNotification(message: string): void {
    const { width } = this.cameras.main;
    const notif = this.add.text(width / 2, 50, message, {
      fontFamily: 'Comic Relief, sans-serif',
      fontSize: '18px',
      color: '#00ff00',
      backgroundColor: '#000000',
      padding: { x: 20, y: 10 },
    });
    notif.setOrigin(0.5);
    notif.setDepth(10001);

    this.tweens.add({
      targets: notif,
      alpha: 0,
      y: 30,
      duration: 2000,
      ease: 'Power2',
      onComplete: () => notif.destroy(),
    });
  }

  update(time: number, delta: number): void {
    // Update systems
    this.stateManager.update(delta);
    this.inputManager.update();

    // Update UI
    this.statBars.updateAll(true);
    this.clock.update();

    // Handle player movement
    this.updatePlayerMovement(delta);

    // Check hotspot proximity
    this.updateHotspotProximity();

    // Handle interaction
    if (this.inputManager.isActionJustPressed('interact')) {
      this.handleInteraction();
    }
  }

  /**
   * Setup tutorial steps
   */
  private setupTutorial(): void {
    if (!this.tutorialManager.shouldRunTutorial()) {
      return;
    }

    this.tutorialManager.defineSteps([
      {
        id: 'welcome',
        title: 'Welcome to Masking',
        description: 'Learn to navigate remote work while managing your energy and stress.',
        onComplete: () => {
          console.log('Tutorial: Welcome complete');
        },
      },
      {
        id: 'movement',
        title: 'Movement',
        description: 'Use A/D or Arrow keys to move. On touch, use the on-screen buttons.',
        targetX: 60,
        targetY: this.cameras.main.height - 60,
        arrowDirection: 'down',
      },
      {
        id: 'kitchen',
        title: 'Kitchen',
        description: 'Walk to the kitchen and press E (or tap) to prepare food.',
        targetX: 1400,
        targetY: 590,
        arrowDirection: 'down',
        condition: () => !this.tutorialManager.isStepCompleted('kitchen-used'),
      },
      {
        id: 'laptop',
        title: 'Your Laptop',
        description: 'This is where you check emails, attend meetings, and manage tasks.',
        targetX: 800,
        targetY: 560,
        arrowDirection: 'down',
      },
    ]);

    this.tutorialManager.start();
  }

  /**
   * Create placeholder background (used when no background image is specified or loading)
   */
  private createBackground(): void {
    const { width, height } = this.cameras.main;

    // Clear any existing placeholder elements
    this.clearPlaceholderBackground();

    // Background color
    const bg = this.add.rectangle(width / 2, height / 2, width, height, 0x2d3436);
    bg.setDepth(RoomScene.DEPTH.SCENE_BG);
    this.placeholderElements.push(bg);

    // Grid pattern for placeholder
    const graphics = this.add.graphics();
    graphics.lineStyle(1, 0x444444, 0.3);
    const gridSize = 100;
    for (let x = 0; x < width; x += gridSize) {
      graphics.lineBetween(x, 0, x, height);
    }
    for (let y = 0; y < height; y += gridSize) {
      graphics.lineBetween(0, y, width, y);
    }
    graphics.setDepth(RoomScene.DEPTH.SCENE_BG);
    this.placeholderElements.push(graphics);

    // Room label
    const label = this.add.text(width / 2, height / 2, 'Loading background...', {
      fontFamily: 'Comic Relief, sans-serif',
      fontSize: '32px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
    });
    label.setOrigin(0.5);
    label.setDepth(RoomScene.DEPTH.SCENE_BG);
    this.placeholderElements.push(label);
  }

  /**
   * Clear placeholder background elements
   */
  private clearPlaceholderBackground(): void {
    for (const element of this.placeholderElements) {
      element.destroy();
    }
    this.placeholderElements = [];
  }

  /**
   * Load background image from YAML config
   */
  private loadBackgroundImage(): void {
    const bgConfig = this.sceneData?.background_image;
    if (!bgConfig?.path) {
      console.log('[RoomScene] No background_image specified in YAML');
      return;
    }

    const textureKey = `bg-${this.sceneData?.id || 'room'}`;
    const fullPath = config.assetPath(bgConfig.path);

    console.log(`[RoomScene] Loading background: ${fullPath}`);

    // Check if already loaded
    if (this.textures.exists(textureKey)) {
      console.log(`[RoomScene] Background texture already exists: ${textureKey}`);
      this.createBackgroundSprite(textureKey, bgConfig);
      return;
    }

    // Store config for callback
    const configCopy = { ...bgConfig };

    // Load image via HTMLImageElement to avoid Phaser loader conflicts
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      console.log(`[RoomScene] Background image loaded: ${fullPath}`);
      this.textures.addImage(textureKey, img);
      this.createBackgroundSprite(textureKey, configCopy);
    };
    img.onerror = () => {
      console.error(`[RoomScene] Failed to load background: ${fullPath}`);
      assetWarningTracker.warn(
        'missing-sprite',
        textureKey,
        'Background image not found',
        { expectedPath: fullPath }
      );
    };
    img.src = fullPath;
  }

  /**
   * Create background sprite from loaded texture
   */
  private createBackgroundSprite(textureKey: string, bgConfig: BackgroundConfig): void {
    const { width, height } = this.cameras.main;

    // Clear placeholder background
    this.clearPlaceholderBackground();

    // Destroy existing background image if any
    if (this.backgroundImage) {
      this.backgroundImage.destroy();
    }

    this.backgroundImage = this.add.image(width / 2, height / 2, textureKey);
    this.backgroundImage.setDepth(RoomScene.DEPTH.SCENE_BG);

    // Apply scale if specified
    if (bgConfig.scale) {
      this.backgroundImage.setScale(bgConfig.scale);
    }

    console.log(`[RoomScene] Background sprite created: ${textureKey}`);
  }

  /**
   * Load scene data from YAML
   */
  private async loadSceneData(): Promise<void> {
    try {
      // Force bypass cache to get fresh data
      const yamlContent = await yamlParser.loadFile('/data/stories/scenes/home.yaml', true);
      this.sceneData = yamlParser.parseScene(yamlContent);
      console.log('[RoomScene] Scene data loaded:', this.sceneData);
      console.log('[RoomScene] Hotspots from YAML:', this.sceneData.hotspots);

      // Load background image if specified
      this.loadBackgroundImage();

      // Refresh hotspots with new data
      this.refreshHotspots();
    } catch (error) {
      console.error('[RoomScene] Failed to load scene data:', error);
    }
  }

  /**
   * Create player sprite using Character class
   */
  private createPlayer(): void {
    // Get character configs from registry (loaded in BootScene)
    const characterConfigs = this.registry.get('characterConfigs') as CharacterConfig[] | undefined;
    this.playerConfig = characterConfigs?.find((c) => c.id === 'player-cat');

    if (this.playerConfig) {
      // Check if texture exists
      const textureExists = this.textures.exists(this.playerConfig.id);
      console.log(`[RoomScene] Creating player, texture '${this.playerConfig.id}' exists: ${textureExists}`);

      if (!textureExists) {
        console.warn('[RoomScene] Texture not ready, using fallback');
        this.createPlaceholderPlayer();
        return;
      }

      // Get accessibility settings from state manager
      const accessibilitySettings = this.stateManager.getAccessibilitySettings();

      // Create Character sprite with config
      this.player = new Character(
        this,
        this.playerX,
        900,  // Ground level Y for 1080p
        this.playerConfig,
        accessibilitySettings
      );
      this.player.setOrigin(0.5, 1);
      this.player.setDepth(RoomScene.DEPTH.CHARACTER);

      console.log('[RoomScene] Created player with Character class');
    } else {
      // Fallback to placeholder if config not loaded
      console.warn('[RoomScene] Player config not found, using placeholder');
      this.createPlaceholderPlayer();
    }
  }

  /**
   * Create a placeholder player sprite (fallback)
   */
  private createPlaceholderPlayer(): void {
    // Use dimensions from config if available, otherwise defaults
    const frameWidth = this.playerConfig?.spritesheet.frameWidth ?? 64;
    const frameHeight = this.playerConfig?.spritesheet.frameHeight ?? 96;

    const playerGraphics = this.add.graphics();

    // Draw rectangle with border
    playerGraphics.fillStyle(0xff6b6b, 1);
    playerGraphics.fillRect(0, 0, frameWidth, frameHeight);
    playerGraphics.lineStyle(3, 0x000000);
    playerGraphics.strokeRect(2, 2, frameWidth - 4, frameHeight - 4);

    playerGraphics.generateTexture('player-placeholder', frameWidth, frameHeight);
    playerGraphics.destroy();

    // Create sprite
    this.player = this.add.sprite(this.playerX, 900, 'player-placeholder');
    this.player.setOrigin(0.5, 1);
    this.player.setDepth(RoomScene.DEPTH.CHARACTER);

    // Add "P" label on the sprite
    const pLabel = this.add.text(this.playerX, 900 - frameHeight / 2, 'P', {
      fontSize: '48px',
      fontFamily: 'sans-serif',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
    });
    pLabel.setOrigin(0.5, 0.5);
    pLabel.setDepth(RoomScene.DEPTH.CHARACTER + 1);

    // Add debug text for frame info
    const debugText = this.add.text(this.playerX, 900 - frameHeight - 5, '[?] idle', {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 4, y: 2 },
    });
    debugText.setOrigin(0.5, 1);
    debugText.setDepth(1000);

    // Store references for updates
    (this.player as any).debugText = debugText;
    (this.player as any).pLabel = pLabel;

    console.log(`[RoomScene] Created fallback placeholder (${frameWidth}x${frameHeight})`);
  }

  /**
   * Create hotspots from scene data (YAML)
   * Supports sprite-centric coordinates (new) and legacy direct coordinates
   */
  private createHotspots(): void {
    // Colors for different hotspot types
    const hotspotColors: Record<string, number> = {
      bed: 0x3498db,
      laptop: 0x9b59b6,
      kitchen: 0xe67e22,
      door: 0x95a5a6,
      default: 0x1abc9c,
    };

    // Use YAML data if available, otherwise use fallback
    const hotspotData = this.sceneData?.hotspots || [];

    if (hotspotData.length === 0) {
      console.warn('[RoomScene] No hotspots in scene data, using fallback');
    }

    hotspotData.forEach(data => {
      const color = hotspotColors[data.id] || hotspotColors.default;

      // Calculate positions based on sprite-centric or legacy format
      const positions = this.calculateHotspotPositions(data);

      // Load sprite from YAML or create placeholder
      this.loadHotspotSprite(data, color, positions.spriteX, positions.spriteY);

      // Hotspot area (semi-transparent for debug visibility)
      const hotspot = this.add.rectangle(
        positions.hitboxCenterX,
        positions.hitboxCenterY,
        positions.hitboxWidth,
        positions.hitboxHeight,
        color,
        0.15  // More transparent now that we have sprites
      );
      hotspot.setStrokeStyle(2, color, 0.5);
      hotspot.setData('id', data.id);
      hotspot.setData('action', data.action);
      hotspot.setDepth(10);  // Above background, below sprites
      this.hotspots.push(hotspot);

      // Interaction prompt (hidden by default)
      const label = data.label || `${data.id} (E)`;
      const prompt = this.add.text(
        positions.hitboxCenterX,
        positions.hitboxCenterY - positions.hitboxHeight / 2 - 20,
        label,
        {
          fontFamily: 'Comic Relief, sans-serif',
          fontSize: '16px',
          color: '#ffffff',
          backgroundColor: '#000000',
          padding: { x: 8, y: 4 },
        }
      );
      prompt.setOrigin(0.5);
      prompt.setVisible(false);
      prompt.setDepth(RoomScene.DEPTH.UI);
      this.interactionPrompts.set(data.id, prompt);
    });

    console.log(`[RoomScene] Created ${hotspotData.length} hotspots from YAML`);
  }

  /**
   * Calculate sprite and hitbox positions from hotspot data
   * Supports sprite-centric (new) and legacy coordinate formats
   */
  private calculateHotspotPositions(data: SceneHotspot): {
    spriteX: number;
    spriteY: number;
    hitboxCenterX: number;
    hitboxCenterY: number;
    hitboxWidth: number;
    hitboxHeight: number;
  } {
    // New sprite-centric format: sprite has x/y, hitbox is relative
    if (data.sprite?.x !== undefined && data.sprite?.y !== undefined) {
      const spriteX = data.sprite.x;
      const spriteY = data.sprite.y;

      // Hitbox defaults to sprite position if not specified
      const hitbox = data.hitbox || { width: 100, height: 100 };
      const hitboxOffsetX = hitbox.offset_x ?? 0;
      const hitboxOffsetY = hitbox.offset_y ?? 0;

      return {
        spriteX,
        spriteY,
        hitboxCenterX: spriteX + hitboxOffsetX,
        hitboxCenterY: spriteY + hitboxOffsetY,
        hitboxWidth: hitbox.width,
        hitboxHeight: hitbox.height,
      };
    }

    // Legacy format: x/y/width/height define hitbox, sprite offset from center
    const legacyX = data.x ?? 0;
    const legacyY = data.y ?? 0;
    const legacyWidth = data.width ?? 100;
    const legacyHeight = data.height ?? 100;

    const hitboxCenterX = legacyX + legacyWidth / 2;
    const hitboxCenterY = legacyY + legacyHeight / 2;

    // Sprite position with optional offsets
    const spriteOffsetX = data.sprite?.x ?? 0;  // In legacy, these are offsets
    const spriteOffsetY = data.sprite?.y ?? 0;

    return {
      spriteX: hitboxCenterX + spriteOffsetX,
      spriteY: hitboxCenterY + spriteOffsetY,
      hitboxCenterX,
      hitboxCenterY,
      hitboxWidth: legacyWidth,
      hitboxHeight: legacyHeight,
    };
  }

  /**
   * Load hotspot sprite from YAML config or create placeholder
   */
  private loadHotspotSprite(data: SceneHotspot, fallbackColor: number, spriteX: number, spriteY: number): void {
    const spriteConfig = data.sprite;

    if (!spriteConfig?.path) {
      // No sprite path defined, create placeholder at hitbox position
      this.createHotspotPlaceholder(data, fallbackColor, spriteX, spriteY);
      return;
    }

    const textureKey = `hotspot-${data.id}`;
    const fullPath = config.assetPath(spriteConfig.path);

    // Check if texture already exists
    if (this.textures.exists(textureKey)) {
      this.createHotspotSpriteFromTexture(data.id, textureKey, spriteX, spriteY, spriteConfig);
      return;
    }

    // Try to load the sprite
    this.load.image(textureKey, fullPath);
    this.load.once('complete', () => {
      if (this.textures.exists(textureKey)) {
        // Remove placeholder if it exists
        const existingPlaceholder = this.hotspotSprites.get(data.id);
        if (existingPlaceholder) {
          existingPlaceholder.destroy();
        }
        this.createHotspotSpriteFromTexture(data.id, textureKey, spriteX, spriteY, spriteConfig);
      }
    });
    this.load.once('loaderror', () => {
      // Log warning and create placeholder
      assetWarningTracker.warn(
        'missing-sprite',
        `hotspot-${data.id}`,
        `Furniture sprite not found`,
        { expectedPath: fullPath }
      );
      this.createHotspotPlaceholder(data, fallbackColor, spriteX, spriteY);
    });
    this.load.start();
  }

  /**
   * Create sprite from loaded texture
   */
  private createHotspotSpriteFromTexture(
    hotspotId: string,
    textureKey: string,
    spriteX: number,
    spriteY: number,
    spriteConfig: HotspotSpriteConfig
  ): void {
    const scale = spriteConfig.scale ?? 1.0;
    const layer = spriteConfig.layer ?? 'background';

    const sprite = this.add.sprite(spriteX, spriteY, textureKey);
    sprite.setScale(scale);
    sprite.setDepth(this.getLayerDepth(layer));

    this.hotspotSprites.set(hotspotId, sprite);
  }

  /**
   * Get depth value for a layer
   */
  private getLayerDepth(layer: SceneLayer): number {
    return layer === 'foreground'
      ? RoomScene.DEPTH.HOTSPOT_FG
      : RoomScene.DEPTH.HOTSPOT_BG;
  }

  /**
   * Create placeholder for missing hotspot sprite
   */
  private createHotspotPlaceholder(data: SceneHotspot, color: number, spriteX: number, spriteY: number): void {
    const layer = data.sprite?.layer ?? 'background';
    const placeholderSize = 64;

    const container = this.add.container(spriteX, spriteY);

    // Draw dashed border box
    const graphics = this.add.graphics();
    const halfSize = placeholderSize / 2;

    graphics.lineStyle(2, color, 0.8);

    // Draw dashed rectangle
    const dashLength = 6;
    const gapLength = 4;
    this.drawDashedLine(graphics, -halfSize, -halfSize, halfSize, -halfSize, dashLength, gapLength);
    this.drawDashedLine(graphics, halfSize, -halfSize, halfSize, halfSize, dashLength, gapLength);
    this.drawDashedLine(graphics, halfSize, halfSize, -halfSize, halfSize, dashLength, gapLength);
    this.drawDashedLine(graphics, -halfSize, halfSize, -halfSize, -halfSize, dashLength, gapLength);

    // Semi-transparent fill
    graphics.fillStyle(color, 0.2);
    graphics.fillRect(-halfSize, -halfSize, placeholderSize, placeholderSize);

    // Label with hotspot ID and layer indicator
    const layerIndicator = layer === 'foreground' ? '▲' : '▼';
    const label = this.add.text(0, 0, `[${data.id}]\n${layerIndicator}`, {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: '#FFFFFF',
      backgroundColor: '#000000',
      padding: { x: 4, y: 2 },
      align: 'center',
    });
    label.setOrigin(0.5);

    container.add([graphics, label]);
    container.setDepth(this.getLayerDepth(layer));

    this.hotspotSprites.set(data.id, container);
  }

  /**
   * Draw a dashed line on graphics object
   */
  private drawDashedLine(
    graphics: Phaser.GameObjects.Graphics,
    x1: number, y1: number,
    x2: number, y2: number,
    dashLength: number, gapLength: number
  ): void {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.sqrt(dx * dx + dy * dy);
    const unitX = dx / length;
    const unitY = dy / length;

    let drawn = 0;
    let drawing = true;

    while (drawn < length) {
      const segmentLength = drawing ? dashLength : gapLength;
      const endDraw = Math.min(drawn + segmentLength, length);

      if (drawing) {
        graphics.lineBetween(
          x1 + unitX * drawn,
          y1 + unitY * drawn,
          x1 + unitX * endDraw,
          y1 + unitY * endDraw
        );
      }

      drawn = endDraw;
      drawing = !drawing;
    }
  }

  /**
   * Clear and recreate hotspots (for YAML reload)
   */
  private refreshHotspots(): void {
    // Destroy existing hotspots
    this.hotspots.forEach(h => h.destroy());
    this.hotspots = [];

    // Destroy existing hotspot sprites
    this.hotspotSprites.forEach(s => s.destroy());
    this.hotspotSprites.clear();

    // Destroy existing prompts
    this.interactionPrompts.forEach(p => p.destroy());
    this.interactionPrompts.clear();

    // Recreate from current scene data
    this.createHotspots();
  }

  /**
   * Create UI elements
   */
  private createUI(): void {
    const { width, height } = this.cameras.main;

    // Stat bars
    this.statBars = new StatBarGroup({
      scene: this,
      x: 20,
      y: 80,
      layout: 'vertical',
      barWidth: 200,
      barHeight: 28,
      spacing: 4,
    });
    this.statBars.linkStatSystem(this.stateManager.stats);
    this.statBars.setDepth(RoomScene.DEPTH.UI);

    // Clock
    this.clock = new ClockDisplay({
      scene: this,
      x: width - 80,
      y: 50,
      showDay: true,
      showTimeScale: true,
    });
    this.clock.linkTimeManager(this.stateManager.time);
    this.clock.setDepth(RoomScene.DEPTH.UI);

    // Instructions
    const inputType = this.inputManager.getInputType();
    const instructions = inputType === 'touch'
      ? 'Tap buttons to move  |  Tap interact'
      : 'A/D or Arrows: Move  |  E: Interact';

    const instructionsText = this.add.text(width / 2, height - 30, instructions, {
      fontFamily: 'Comic Relief, sans-serif',
      fontSize: '14px',
      color: '#ecf0f1',
      backgroundColor: '#000000',
      padding: { x: 8, y: 4 },
    });
    instructionsText.setOrigin(0.5);
    instructionsText.setDepth(RoomScene.DEPTH.UI);
  }

  /**
   * Update player movement
   */
  private updatePlayerMovement(delta: number): void {
    if (!this.player) return;

    let velocityX = 0;
    let isMoving = false;

    if (this.inputManager.isActionDown('move-left')) {
      velocityX = -this.PLAYER_SPEED;
      isMoving = true;
      // Set direction (Character handles flipX internally)
      if (this.player instanceof Character) {
        this.player.setDirection('left');
      } else {
        this.player.setFlipX(true);
      }
    } else if (this.inputManager.isActionDown('move-right')) {
      velocityX = this.PLAYER_SPEED;
      isMoving = true;
      // Set direction (Character handles flipX internally)
      if (this.player instanceof Character) {
        this.player.setDirection('right');
      } else {
        this.player.setFlipX(false);
      }
    }

    // Update position
    this.playerX += (velocityX * delta) / 1000;
    this.playerX = Phaser.Math.Clamp(this.playerX, this.ROOM_BOUNDS.left, this.ROOM_BOUNDS.right);

    this.player.setX(this.playerX);

    // Update animation based on movement state
    if (this.player instanceof Character) {
      if (isMoving) {
        this.player.playAnimation('walk');
      } else {
        this.player.playAnimation('idle');
      }
    }

    // Update fallback animation simulation
    this.updateFallbackAnimation(delta, isMoving ? 'walk' : 'idle');

    // Update fallback elements if they exist
    const debugText = (this.player as any).debugText as Phaser.GameObjects.Text | undefined;
    const pLabel = (this.player as any).pLabel as Phaser.GameObjects.Text | undefined;

    if (debugText) {
      debugText.setX(this.playerX);
      const currentFrame = this.getFallbackCurrentFrame();
      debugText.setText(`[${currentFrame}] ${this.fallbackAnimState}`);
    }

    if (pLabel) {
      pLabel.setX(this.playerX);
      // Flip the P label to match player direction
      pLabel.setFlipX(this.player.flipX);
    }
  }

  /**
   * Simulate animation frame cycling for fallback placeholder
   */
  private updateFallbackAnimation(delta: number, newState: string): void {
    if (!this.playerConfig) return;

    // Reset frame index when animation changes
    if (newState !== this.fallbackAnimState) {
      this.fallbackAnimState = newState;
      this.fallbackFrameIndex = 0;
      this.fallbackFrameTimer = 0;
    }

    const animConfig = this.playerConfig.animations[this.fallbackAnimState];
    if (!animConfig) return;

    // Calculate frame duration in ms
    const frameDuration = 1000 / animConfig.frameRate;

    // Advance timer
    this.fallbackFrameTimer += delta;

    // Check if we should advance to next frame
    if (this.fallbackFrameTimer >= frameDuration) {
      this.fallbackFrameTimer -= frameDuration;
      this.fallbackFrameIndex++;

      // Loop or stop based on repeat setting
      if (this.fallbackFrameIndex >= animConfig.frames.length) {
        if (animConfig.repeat === -1) {
          // Loop forever
          this.fallbackFrameIndex = 0;
        } else {
          // Stay on last frame
          this.fallbackFrameIndex = animConfig.frames.length - 1;
        }
      }
    }
  }

  /**
   * Get the current frame number from the YAML animation sequence
   */
  private getFallbackCurrentFrame(): number {
    if (!this.playerConfig) return 0;

    const animConfig = this.playerConfig.animations[this.fallbackAnimState];
    if (!animConfig || !animConfig.frames.length) return 0;

    const safeIndex = Math.min(this.fallbackFrameIndex, animConfig.frames.length - 1);
    return animConfig.frames[safeIndex];
  }

  /**
   * Update hotspot proximity and show/hide prompts
   * Shows prompt and glow when player hitbox overlaps hotspot area
   */
  private updateHotspotProximity(): void {
    if (!this.player) return;

    // Player hitbox (centered on playerX, bottom at player.y)
    const playerBounds = this.getPlayerBounds();

    this.hotspots.forEach(hotspot => {
      const id = hotspot.getData('id');
      const prompt = this.interactionPrompts.get(id);
      const sprite = this.hotspotSprites.get(id);

      // Check if player hitbox overlaps hotspot rectangle
      const hotspotBounds = hotspot.getBounds();
      const overlaps = Phaser.Geom.Rectangle.Overlaps(playerBounds, hotspotBounds);

      // Show/hide interaction prompt
      if (prompt) {
        prompt.setVisible(overlaps);
      }

      // Add/remove glow effect on sprite
      if (sprite && sprite instanceof Phaser.GameObjects.Sprite) {
        this.updateSpriteGlow(sprite, overlaps);
      }
    });
  }

  /**
   * Add or remove glow effect on a sprite
   */
  private updateSpriteGlow(sprite: Phaser.GameObjects.Sprite, shouldGlow: boolean): void {
    const glowKey = 'interactionGlow';

    if (shouldGlow) {
      // Add glow if not already present
      if (!sprite.getData(glowKey)) {
        const glow = sprite.preFX?.addGlow(0xffffff, 4, 0, false, 0.1, 16);
        if (glow) {
          sprite.setData(glowKey, glow);
        }
      }
    } else {
      // Remove glow if present
      const existingGlow = sprite.getData(glowKey);
      if (existingGlow) {
        sprite.preFX?.remove(existingGlow);
        sprite.setData(glowKey, null);
      }
    }
  }

  /**
   * Get player hitbox bounds
   */
  private getPlayerBounds(): Phaser.Geom.Rectangle {
    const width = this.playerConfig?.spritesheet.frameWidth ?? 64;
    const height = this.playerConfig?.spritesheet.frameHeight ?? 96;

    return new Phaser.Geom.Rectangle(
      this.playerX - width / 2,
      this.player!.y - height,
      width,
      height
    );
  }

  /**
   * Handle interaction
   * Interacts with hotspot when player hitbox overlaps it
   */
  private handleInteraction(): void {
    if (!this.player) return;

    // Player hitbox
    const playerBounds = this.getPlayerBounds();

    // Find first overlapping hotspot (or closest if multiple overlap)
    let closestHotspot: Phaser.GameObjects.Rectangle | null = null;
    let closestDistance = Infinity;

    this.hotspots.forEach(hotspot => {
      const hotspotBounds = hotspot.getBounds();

      // Check collision
      if (Phaser.Geom.Rectangle.Overlaps(playerBounds, hotspotBounds)) {
        // If multiple overlap, pick the closest center
        const distance = Phaser.Math.Distance.Between(
          this.playerX,
          this.player!.y,
          hotspot.x,
          hotspot.y
        );

        if (distance < closestDistance) {
          closestDistance = distance;
          closestHotspot = hotspot;
        }
      }
    });

    if (closestHotspot) {
      const id = closestHotspot.getData('id');

      // Play interact animation if using Character class (visual feedback only)
      if (this.player instanceof Character) {
        this.player.playAnimation('interact');
      }

      // Trigger action immediately
      this.triggerHotspotAction(id);
      this.audioManager.playSfx('ui-click');
    }
  }

  /**
   * Trigger hotspot action
   */
  private triggerHotspotAction(id: string): void {
    console.log('Interacting with:', id);

    switch (id) {
      case 'bed':
        this.actionSleep();
        break;

      case 'laptop':
        this.actionOpenLaptop();
        break;

      case 'kitchen':
        this.actionKitchen();
        break;

      case 'door':
        this.actionDoor();
        break;
    }
  }

  /**
   * Sleep action
   */
  private actionSleep(): void {
    console.log('Going to sleep...');

    // Skip to morning
    this.stateManager.time.skipToTime(9, 0);

    // Recover energy
    this.stateManager.stats.modifyStat('energy', 50);
    this.stateManager.stats.modifyStat('stress', -20);

    // Sound effect
    this.audioManager.playSfx('stat-increase');

    // Auto-save
    this.stateManager.autoSave();
  }

  /**
   * Open laptop action
   */
  private actionOpenLaptop(): void {
    console.log('Opening laptop...');

    // Pause current scene and launch laptop overlay
    this.scene.pause();
    this.scene.launch('LaptopScene');
  }

  /**
   * Kitchen action
   */
  private actionKitchen(): void {
    console.log('Preparing food...');

    // Time cost
    this.stateManager.time.skipHours(0.5);

    // Stat changes
    this.stateManager.stats.modifyStat('hunger', -40);
    this.stateManager.stats.modifyStat('energy', 10);
    this.stateManager.stats.modifyStat('happiness', 5);

    // Sound effects
    this.audioManager.playSfx('stat-increase');

    // Tutorial progress
    if (!this.tutorialManager.isStepCompleted('kitchen-used')) {
      const state = this.stateManager.getState();
      if (!state.tutorialFlags) state.tutorialFlags = {};
      state.tutorialFlags['kitchen-used'] = true;
      this.stateManager.setState(state);
    }
  }

  /**
   * Door action
   */
  private actionDoor(): void {
    if (this.stateManager.time.isWorkHours()) {
      console.log('Door is locked during work hours');
      // TODO: Show message
    } else {
      console.log('Going outside...');
      // TODO: Scene transition
    }
  }

  /**
   * Cleanup
   */
  shutdown(): void {
    this.inputManager.destroy();
    this.tutorialManager.destroy();
    this.audioManager.destroy();
    this.debugPanel.destroy();
  }
}
