/**
 * Character
 * Presentation layer - animated sprite with YAML-driven configuration
 * Supports multiple animation states, accessibility features, and direction mirroring
 */

import Phaser from 'phaser';
import { assetWarningTracker } from '@core/AssetWarningTracker';

/**
 * Animation configuration for a single animation state
 */
export interface AnimationConfig {
  frames: number[];
  frameRate: number;
  repeat: number; // -1 for loop, 0 for once, N for N times
}

/**
 * Accessibility configuration for a character
 */
export interface CharacterAccessibility {
  reducedMotionStaticFrame: number;
  description: string;
}

/**
 * Full character configuration from YAML
 */
export interface CharacterConfig {
  id: string;
  name: string;
  species: string;
  spritesheet: {
    path: string;
    frameWidth: number;
    frameHeight: number;
  };
  animations: Record<string, AnimationConfig>;
  defaultAnimation: string;
  accessibility?: CharacterAccessibility;
}

/**
 * Animation state names
 */
export type AnimationState = 'idle' | 'walk' | 'talk' | 'interact' | string;

/**
 * Direction the character is facing
 */
export type Direction = 'left' | 'right';

/**
 * Accessibility settings from StateManager
 */
export interface AccessibilitySettings {
  reducedMotion: boolean;
  animationSpeed: number; // 0.5, 1.0, or 1.5
}

/**
 * Character sprite with animation support
 */
export class Character extends Phaser.GameObjects.Sprite {
  private config: CharacterConfig;
  private currentState: AnimationState;
  private currentDirection: Direction = 'left';
  private accessibilitySettings: AccessibilitySettings;
  private debugText?: Phaser.GameObjects.Text;

  /**
   * Create a new Character sprite
   * @param scene The Phaser scene
   * @param x X position
   * @param y Y position
   * @param config Character configuration from YAML
   * @param accessibilitySettings Optional accessibility settings
   */
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    config: CharacterConfig,
    accessibilitySettings?: AccessibilitySettings
  ) {
    super(scene, x, y, config.id);

    this.config = config;
    this.currentState = config.defaultAnimation || 'idle';
    this.accessibilitySettings = accessibilitySettings || {
      reducedMotion: false,
      animationSpeed: 1.0,
    };

    // Add to scene
    scene.add.existing(this);

    // Create debug frame number display
    this.createDebugDisplay();

    // Play default animation
    this.playAnimation(this.currentState);

    // Listen for frame changes to update debug display
    this.on('animationupdate', () => {
      this.updateDebugDisplay();
    });
  }

  /**
   * Create debug text showing current frame number
   */
  private createDebugDisplay(): void {
    this.debugText = this.scene.add.text(0, 0, '0', {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 4, y: 2 },
    });
    this.debugText.setOrigin(0.5, 1);
    this.debugText.setDepth(1000);
    this.updateDebugDisplay();
  }

  /**
   * Update debug display with current frame info
   */
  private updateDebugDisplay(): void {
    if (!this.debugText) return;

    // Get current animation frame index
    let frameDisplay = '?';
    if (this.anims.currentAnim && this.anims.currentFrame) {
      // Animation is playing - show the frame index from the animation
      frameDisplay = String(this.anims.currentFrame.index);
    } else if (this.frame && this.frame.name !== '__BASE') {
      // Static frame from texture
      frameDisplay = String(this.frame.name);
    }

    // Show state and frame number
    this.debugText.setText(`[${frameDisplay}] ${this.currentState}`);
    this.debugText.setPosition(this.x, this.y - this.displayHeight - 5);
  }

  /**
   * Override preUpdate to keep debug text positioned
   */
  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
    this.updateDebugDisplay();
  }

  /**
   * Play an animation by name
   * @param state The animation state to play (idle, walk, talk, interact, etc.)
   * @param force Force restart even if already playing
   */
  playAnimation(state: AnimationState, force: boolean = false): void {
    // Don't restart same animation unless forced
    if (!force && this.currentState === state && this.anims.isPlaying) {
      return;
    }

    this.currentState = state;
    const animKey = `${this.config.id}-${state}`;

    // Check if animation exists
    if (!this.scene.anims.exists(animKey)) {
      // Try idle as fallback
      const idleKey = `${this.config.id}-idle`;
      if (this.scene.anims.exists(idleKey)) {
        console.warn(`[Character] Animation '${animKey}' not found, falling back to idle`);
        this.playAnimationKey(idleKey);
      } else {
        // No animations available yet, just show static frame
        console.warn(`[Character] No animations available for '${this.config.id}', showing static frame`);
        this.showStaticFrame();
      }
      return;
    }

    // Handle reduced motion mode
    if (this.accessibilitySettings.reducedMotion) {
      this.showStaticFrame();
      return;
    }

    this.playAnimationKey(animKey);
  }

  // Track which animations we've already warned about
  private static warnedAnimations = new Set<string>();

  /**
   * Play animation by key with proper error handling
   */
  private playAnimationKey(animKey: string): void {
    try {
      // Verify the animation has valid frame data before playing
      const anim = this.scene.anims.get(animKey);
      if (!anim || !anim.frames || anim.frames.length === 0) {
        // Only warn once per animation key
        if (!Character.warnedAnimations.has(animKey)) {
          console.warn(`[Character] Animation '${animKey}' has no frames`);
          Character.warnedAnimations.add(animKey);
        }
        this.showStaticFrame();
        return;
      }

      this.play({
        key: animKey,
        timeScale: this.accessibilitySettings.animationSpeed,
      });
    } catch (error) {
      console.error(`[Character] Failed to play animation '${animKey}':`, error);
      this.showStaticFrame();
    }
  }

  /**
   * Show a static frame (for reduced motion mode)
   */
  private showStaticFrame(): void {
    const frameIndex = this.config.accessibility?.reducedMotionStaticFrame ?? 0;

    // Only stop if animation is playing
    if (this.anims.isPlaying) {
      this.anims.stop();
    }

    // Try to set frame, but handle case where texture isn't ready
    try {
      const texture = this.texture;
      if (texture && texture.has(String(frameIndex))) {
        this.setFrame(frameIndex);
      }
    } catch (error) {
      // Texture not ready yet, ignore
      console.warn(`[Character] Could not set frame ${frameIndex} for '${this.config.id}'`);
    }
  }

  /**
   * Stop animation and return to idle
   */
  stopAnimation(): void {
    this.stop();
    this.playAnimation('idle');
  }

  /**
   * Set the direction the character is facing
   * Characters are left-facing by default, mirrored when facing right
   * @param direction 'left' or 'right'
   */
  setDirection(direction: Direction): void {
    if (this.currentDirection === direction) return;

    this.currentDirection = direction;
    // Characters face left by default, flip when facing right
    this.setFlipX(direction === 'right');
  }

  /**
   * Get current direction
   */
  getDirection(): Direction {
    return this.currentDirection;
  }

  /**
   * Get current animation state
   */
  getCurrentState(): AnimationState {
    return this.currentState;
  }

  /**
   * Update accessibility settings
   * @param settings New accessibility settings
   */
  updateAccessibilitySettings(settings: Partial<AccessibilitySettings>): void {
    this.accessibilitySettings = { ...this.accessibilitySettings, ...settings };

    // If reduced motion changed, update current animation
    if (settings.reducedMotion !== undefined) {
      if (settings.reducedMotion) {
        this.showStaticFrame();
      } else {
        this.playAnimation(this.currentState, true);
      }
    }

    // If speed changed, update current animation
    if (settings.animationSpeed !== undefined && this.anims.isPlaying) {
      this.anims.timeScale = settings.animationSpeed;
    }
  }

  /**
   * Update character configuration (for hot-reload)
   * @param newConfig New character configuration
   */
  updateConfig(newConfig: CharacterConfig): void {
    this.config = newConfig;
    // Restart current animation with new config
    this.playAnimation(this.currentState, true);
  }

  /**
   * Get the character configuration
   */
  getConfig(): CharacterConfig {
    return this.config;
  }

  /**
   * Get accessibility description for screen readers
   */
  getAccessibilityDescription(): string {
    return this.config.accessibility?.description || `${this.config.name} (${this.config.species})`;
  }

  /**
   * Clean up when destroyed
   */
  destroy(fromScene?: boolean): void {
    if (this.debugText) {
      this.debugText.destroy();
      this.debugText = undefined;
    }
    super.destroy(fromScene);
  }

  /**
   * Static method to create Phaser animations from character config
   * Call this in BootScene after loading the spritesheet
   * Validates frame indices and clamps to available frames if necessary
   * @param scene The Phaser scene
   * @param config Character configuration
   */
  static createAnimations(scene: Phaser.Scene, config: CharacterConfig): void {
    // Get actual frame count from texture
    const texture = scene.textures.get(config.id);
    const actualFrameCount = texture ? texture.frameTotal : 0;

    // Track if we've warned about this character's frame issues
    let hasFrameIssues = false;
    const outOfBoundsAnims: string[] = [];

    for (const [animName, animConfig] of Object.entries(config.animations)) {
      const key = `${config.id}-${animName}`;

      // Skip if animation already exists
      if (scene.anims.exists(key)) {
        continue;
      }

      // Check for out-of-bounds frames and clamp
      let frames = animConfig.frames;
      const maxFrame = Math.max(...frames);

      if (actualFrameCount > 0 && maxFrame >= actualFrameCount) {
        hasFrameIssues = true;
        outOfBoundsAnims.push(`${animName} (max: ${maxFrame})`);

        // Clamp frames to available range
        frames = frames.map(f => Math.min(f, actualFrameCount - 1));
      }

      try {
        scene.anims.create({
          key,
          frames: scene.anims.generateFrameNumbers(config.id, {
            frames,
          }),
          frameRate: animConfig.frameRate,
          repeat: animConfig.repeat,
        });
      } catch (error) {
        console.error(`[Character] Failed to create animation '${key}':`, error);
      }
    }

    // Log warning once per character if there were frame issues
    if (hasFrameIssues && !assetWarningTracker.hasWarned('frame-mismatch', config.id)) {
      assetWarningTracker.warn(
        'frame-mismatch',
        config.id,
        `Animations reference frames beyond spritesheet bounds`,
        {
          details: {
            actualFrames: actualFrameCount,
            affectedAnimations: outOfBoundsAnims,
            action: 'Frames clamped to available range',
          },
        }
      );
    }

    console.log(`[Character] Created animations for '${config.id}'`);
  }

  /**
   * Static method to remove animations for a character (for hot-reload)
   * @param scene The Phaser scene
   * @param characterId The character ID
   * @param animationNames Optional list of animation names to remove (defaults to common ones)
   */
  static removeAnimations(
    scene: Phaser.Scene,
    characterId: string,
    animationNames: string[] = ['idle', 'walk', 'talk', 'interact']
  ): void {
    const anims = scene.anims;
    let removed = 0;

    // Remove animations with known names
    for (const animName of animationNames) {
      const key = `${characterId}-${animName}`;
      if (anims.exists(key)) {
        anims.remove(key);
        removed++;
      }
    }

    console.log(`[Character] Removed ${removed} animations for '${characterId}'`);
  }
}
