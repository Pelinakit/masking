/**
 * InputManager
 * Handles multi-input support (touch, keyboard, gamepad)
 * Auto-detects last used input method
 */

export type InputType = 'touch' | 'keyboard' | 'gamepad';
export type ActionType = 'move-left' | 'move-right' | 'interact' | 'menu' | 'back';

export interface InputBinding {
  action: ActionType;
  keys?: Phaser.Input.Keyboard.KeyCodes[];
  gamepadButton?: number;
}

export class InputManager {
  private scene: Phaser.Scene;
  private currentInputType: InputType = 'keyboard';
  private bindings: Map<ActionType, InputBinding> = new Map();

  // Keyboard
  private keys: Map<string, Phaser.Input.Keyboard.Key> = new Map();

  // Gamepad
  private gamepad: Phaser.Input.Gamepad.Gamepad | null = null;

  // Touch
  private touchZones: Map<string, Phaser.GameObjects.Zone> = new Map();

  // Action states
  private actionStates: Map<ActionType, boolean> = new Map();
  private actionJustPressed: Map<ActionType, boolean> = new Map();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.setupDefaultBindings();
    this.setupInputDetection();
  }

  /**
   * Setup default input bindings
   */
  private setupDefaultBindings(): void {
    // Movement
    this.bindings.set('move-left', {
      action: 'move-left',
      keys: [Phaser.Input.Keyboard.KeyCodes.A, Phaser.Input.Keyboard.KeyCodes.LEFT],
      gamepadButton: Phaser.Input.Gamepad.Configs.XBOX_360.LEFT_STICK_LEFT,
    });

    this.bindings.set('move-right', {
      action: 'move-right',
      keys: [Phaser.Input.Keyboard.KeyCodes.D, Phaser.Input.Keyboard.KeyCodes.RIGHT],
      gamepadButton: Phaser.Input.Gamepad.Configs.XBOX_360.LEFT_STICK_RIGHT,
    });

    // Interaction
    this.bindings.set('interact', {
      action: 'interact',
      keys: [Phaser.Input.Keyboard.KeyCodes.E, Phaser.Input.Keyboard.KeyCodes.SPACE],
      gamepadButton: Phaser.Input.Gamepad.Configs.XBOX_360.A,
    });

    // Menu
    this.bindings.set('menu', {
      action: 'menu',
      keys: [Phaser.Input.Keyboard.KeyCodes.ESC, Phaser.Input.Keyboard.KeyCodes.M],
      gamepadButton: Phaser.Input.Gamepad.Configs.XBOX_360.START,
    });

    // Back
    this.bindings.set('back', {
      action: 'back',
      keys: [Phaser.Input.Keyboard.KeyCodes.ESC, Phaser.Input.Keyboard.KeyCodes.BACKSPACE],
      gamepadButton: Phaser.Input.Gamepad.Configs.XBOX_360.B,
    });

    // Initialize action states
    this.bindings.forEach((_, action) => {
      this.actionStates.set(action, false);
      this.actionJustPressed.set(action, false);
    });
  }

  /**
   * Setup input type detection
   */
  private setupInputDetection(): void {
    // Keyboard detection
    if (this.scene.input.keyboard) {
      this.scene.input.keyboard.on('keydown', () => {
        if (this.currentInputType !== 'keyboard') {
          this.currentInputType = 'keyboard';
          this.onInputTypeChanged();
        }
      });

      // Setup keyboard bindings
      this.bindings.forEach(binding => {
        if (binding.keys) {
          binding.keys.forEach(keyCode => {
            const key = this.scene.input.keyboard!.addKey(keyCode);
            this.keys.set(`${binding.action}-${keyCode}`, key);
          });
        }
      });
    }

    // Touch detection
    this.scene.input.on('pointerdown', () => {
      if (this.currentInputType !== 'touch') {
        this.currentInputType = 'touch';
        this.onInputTypeChanged();
      }
    });

    // Gamepad detection
    if (this.scene.input.gamepad) {
      this.scene.input.gamepad.once('connected', (pad: Phaser.Input.Gamepad.Gamepad) => {
        this.gamepad = pad;
        this.currentInputType = 'gamepad';
        this.onInputTypeChanged();
      });

      this.scene.input.gamepad.on('down', () => {
        if (this.currentInputType !== 'gamepad') {
          this.currentInputType = 'gamepad';
          this.onInputTypeChanged();
        }
      });
    }
  }

  /**
   * Called when input type changes
   */
  private onInputTypeChanged(): void {
    console.log('Input type changed to:', this.currentInputType);
    this.scene.events.emit('inputTypeChanged', this.currentInputType);
  }

  /**
   * Update input states (call in scene update)
   */
  update(): void {
    // Reset just-pressed states
    this.actionJustPressed.forEach((_, action) => {
      this.actionJustPressed.set(action, false);
    });

    // Update action states
    this.bindings.forEach((binding, action) => {
      const wasPressed = this.actionStates.get(action) || false;
      const isPressed = this.isActionPressed(binding);

      this.actionStates.set(action, isPressed);

      // Just pressed = now pressed but wasn't before
      if (isPressed && !wasPressed) {
        this.actionJustPressed.set(action, true);
      }
    });
  }

  /**
   * Check if action is currently pressed
   */
  private isActionPressed(binding: InputBinding): boolean {
    // Keyboard
    if (this.currentInputType === 'keyboard' && binding.keys) {
      for (const keyCode of binding.keys) {
        const key = this.keys.get(`${binding.action}-${keyCode}`);
        if (key && key.isDown) {
          return true;
        }
      }
    }

    // Gamepad
    if (this.currentInputType === 'gamepad' && this.gamepad && binding.gamepadButton !== undefined) {
      const button = this.gamepad.buttons[binding.gamepadButton];
      if (button && button.pressed) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if action is pressed this frame
   */
  isActionDown(action: ActionType): boolean {
    return this.actionStates.get(action) || false;
  }

  /**
   * Check if action was just pressed this frame
   */
  isActionJustPressed(action: ActionType): boolean {
    return this.actionJustPressed.get(action) || false;
  }

  /**
   * Get current input type
   */
  getInputType(): InputType {
    return this.currentInputType;
  }

  /**
   * Create touch zone for mobile controls
   */
  createTouchZone(id: string, x: number, y: number, width: number, height: number, action: ActionType): void {
    const zone = this.scene.add.zone(x, y, width, height);
    zone.setInteractive();

    zone.on('pointerdown', () => {
      this.actionStates.set(action, true);
      this.actionJustPressed.set(action, true);
    });

    zone.on('pointerup', () => {
      this.actionStates.set(action, false);
    });

    zone.on('pointerout', () => {
      this.actionStates.set(action, false);
    });

    this.touchZones.set(id, zone);
  }

  /**
   * Remove touch zone
   */
  removeTouchZone(id: string): void {
    const zone = this.touchZones.get(id);
    if (zone) {
      zone.destroy();
      this.touchZones.delete(id);
    }
  }

  /**
   * Show touch controls (for mobile)
   */
  showTouchControls(): void {
    const { width, height } = this.scene.cameras.main;

    // Left/right movement buttons
    this.createTouchButton('move-left', 60, height - 60, 'move-left', '←');
    this.createTouchButton('move-right', 160, height - 60, 'move-right', '→');

    // Interact button (right side)
    this.createTouchButton('interact', width - 80, height - 60, 'interact', 'E');
  }

  /**
   * Create touch button visual
   */
  private createTouchButton(id: string, x: number, y: number, action: ActionType, label: string): void {
    const size = 80;

    // Button background
    const button = this.scene.add.circle(x, y, size / 2, 0x34495e, 0.7);
    button.setStrokeStyle(3, 0xecf0f1, 0.8);

    // Label
    const text = this.scene.add.text(x, y, label, {
      fontFamily: 'Comic Relief, sans-serif',
      fontSize: '24px',
      color: '#ecf0f1',
    });
    text.setOrigin(0.5);

    // Create interactive zone
    this.createTouchZone(id, x, y, size, size, action);

    // Store references for cleanup
    button.setData('touchControl', true);
    text.setData('touchControl', true);
  }

  /**
   * Hide touch controls
   */
  hideTouchControls(): void {
    this.touchZones.forEach((_, id) => {
      this.removeTouchZone(id);
    });

    // Remove visual elements
    this.scene.children.list.forEach(child => {
      if (child.getData('touchControl')) {
        child.destroy();
      }
    });
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.hideTouchControls();
    this.keys.clear();
    this.actionStates.clear();
    this.actionJustPressed.clear();
  }
}
