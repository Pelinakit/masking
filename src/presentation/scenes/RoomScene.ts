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
import { yamlParser, type SceneScript } from '@scripting/YAMLParser';
import { InputManager } from '@game/systems/InputManager';
import { TutorialManager } from '@game/systems/TutorialManager';
import { AudioManager } from '@game/systems/AudioManager';

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
  private player?: Phaser.GameObjects.Sprite;
  private hotspots: Phaser.GameObjects.Rectangle[] = [];
  private interactionPrompts: Map<string, Phaser.GameObjects.Text> = new Map();

  private playerX: number = 400;
  private readonly PLAYER_SPEED = 150;
  private readonly ROOM_BOUNDS = { left: 50, right: 950 };

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
  }

  /**
   * Reload YAML scripts without page refresh
   */
  private async reloadYAML(): Promise<void> {
    console.log('[RoomScene] Reloading YAML scripts...');
    yamlParser.clearCache();
    await this.loadSceneData();
    this.showNotification('YAML reloaded!');
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
        targetX: 750,
        targetY: 420,
        arrowDirection: 'down',
        condition: () => !this.tutorialManager.isStepCompleted('kitchen-used'),
      },
      {
        id: 'laptop',
        title: 'Your Laptop',
        description: 'This is where you check emails, attend meetings, and manage tasks.',
        targetX: 500,
        targetY: 400,
        arrowDirection: 'down',
      },
    ]);

    this.tutorialManager.start();
  }

  /**
   * Create placeholder background
   */
  private createBackground(): void {
    const { width, height } = this.cameras.main;

    // Background color
    this.add.rectangle(width / 2, height / 2, width, height, 0x95a5a6);

    // Floor
    this.add.rectangle(width / 2, height - 100, width, 200, 0x7f8c8d);

    // Wall
    this.add.rectangle(width / 2, 200, width, 400, 0xbdc3c7);

    // Room label
    this.add.text(width / 2, 50, 'Your Apartment', {
      fontFamily: 'Comic Relief, sans-serif',
      fontSize: '32px',
      color: '#2c3e50',
      stroke: '#ffffff',
      strokeThickness: 3,
    }).setOrigin(0.5);
  }

  /**
   * Load scene data from YAML
   */
  private async loadSceneData(): Promise<void> {
    try {
      const yamlContent = await yamlParser.loadFile('/data/stories/scenes/home.yaml');
      this.sceneData = yamlParser.parseScene(yamlContent);
      console.log('Scene data loaded:', this.sceneData);
    } catch (error) {
      console.error('Failed to load scene data:', error);
    }
  }

  /**
   * Create player sprite
   */
  private createPlayer(): void {
    // Placeholder cat sprite (colored rectangle for now)
    const playerGraphics = this.add.graphics();
    playerGraphics.fillStyle(0xff6b6b, 1);
    playerGraphics.fillRect(0, 0, 40, 60);
    playerGraphics.generateTexture('player-cat', 40, 60);
    playerGraphics.destroy();

    this.player = this.add.sprite(this.playerX, 500, 'player-cat');
    this.player.setOrigin(0.5, 1);
  }

  /**
   * Create hotspots from scene data
   */
  private createHotspots(): void {
    const hotspotData = [
      { id: 'bed', x: 150, y: 450, width: 150, height: 100, label: 'Sleep (E)', color: 0x3498db },
      { id: 'laptop', x: 500, y: 400, width: 100, height: 80, label: 'Laptop (E)', color: 0x9b59b6 },
      { id: 'kitchen', x: 750, y: 420, width: 120, height: 100, label: 'Kitchen (E)', color: 0xe67e22 },
      { id: 'door', x: 900, y: 350, width: 60, height: 180, label: 'Door (E)', color: 0x95a5a6 },
    ];

    hotspotData.forEach(data => {
      // Hotspot area (semi-transparent for debug visibility)
      const hotspot = this.add.rectangle(data.x, data.y, data.width, data.height, data.color, 0.3);
      hotspot.setStrokeStyle(2, data.color, 0.8);
      hotspot.setData('id', data.id);
      this.hotspots.push(hotspot);

      // Interaction prompt (hidden by default)
      const prompt = this.add.text(data.x, data.y - data.height / 2 - 20, data.label, {
        fontFamily: 'Comic Relief, sans-serif',
        fontSize: '16px',
        color: '#ffffff',
        backgroundColor: '#000000',
        padding: { x: 8, y: 4 },
      });
      prompt.setOrigin(0.5);
      prompt.setVisible(false);
      this.interactionPrompts.set(data.id, prompt);
    });
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

    // Clock
    this.clock = new ClockDisplay({
      scene: this,
      x: width - 80,
      y: 50,
      showDay: true,
      showTimeScale: true,
    });
    this.clock.linkTimeManager(this.stateManager.time);

    // Instructions
    const inputType = this.inputManager.getInputType();
    const instructions = inputType === 'touch'
      ? 'Tap buttons to move  |  Tap interact'
      : 'A/D or Arrows: Move  |  E: Interact';

    this.add.text(width / 2, height - 30, instructions, {
      fontFamily: 'Comic Relief, sans-serif',
      fontSize: '14px',
      color: '#ecf0f1',
      backgroundColor: '#000000',
      padding: { x: 8, y: 4 },
    }).setOrigin(0.5);
  }

  /**
   * Update player movement
   */
  private updatePlayerMovement(delta: number): void {
    if (!this.player) return;

    let velocityX = 0;

    if (this.inputManager.isActionDown('move-left')) {
      velocityX = -this.PLAYER_SPEED;
      this.player.setFlipX(true);
    } else if (this.inputManager.isActionDown('move-right')) {
      velocityX = this.PLAYER_SPEED;
      this.player.setFlipX(false);
    }

    // Update position
    this.playerX += (velocityX * delta) / 1000;
    this.playerX = Phaser.Math.Clamp(this.playerX, this.ROOM_BOUNDS.left, this.ROOM_BOUNDS.right);

    this.player.setX(this.playerX);
  }

  /**
   * Update hotspot proximity and show/hide prompts
   */
  private updateHotspotProximity(): void {
    if (!this.player) return;

    const INTERACTION_DISTANCE = 100;

    this.hotspots.forEach(hotspot => {
      const id = hotspot.getData('id');
      const prompt = this.interactionPrompts.get(id);
      if (!prompt) return;

      const distance = Phaser.Math.Distance.Between(
        this.playerX,
        this.player!.y,
        hotspot.x,
        hotspot.y
      );

      prompt.setVisible(distance < INTERACTION_DISTANCE);
    });
  }

  /**
   * Handle interaction
   */
  private handleInteraction(): void {
    if (!this.player) return;

    const INTERACTION_DISTANCE = 100;

    // Find closest hotspot within range
    let closestHotspot: Phaser.GameObjects.Rectangle | null = null;
    let closestDistance = INTERACTION_DISTANCE;

    this.hotspots.forEach(hotspot => {
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
    });

    if (closestHotspot) {
      const id = closestHotspot.getData('id');
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
