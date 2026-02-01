/**
 * BootScene
 * Presentation layer - initial loading scene
 * Loads character configs, spritesheets, and creates animations
 */

import Phaser from 'phaser';
import { yamlParser } from '@scripting/YAMLParser';
import { Character, type CharacterConfig } from '@presentation/components/Character';
import { config } from '../../config';
import { assetWarningTracker } from '@core/AssetWarningTracker';

// List of character configs to load
const CHARACTER_CONFIGS = [
  '/data/characters/player-cat.yaml',
  '/data/characters/boss-chihuahua.yaml',
];

export class BootScene extends Phaser.Scene {
  private loadedCharacters: CharacterConfig[] = [];
  private loadingText?: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // Show loading text
    const { width, height } = this.cameras.main;
    this.loadingText = this.add.text(width / 2, height / 2, 'Loading...', {
      fontFamily: 'Comic Relief, sans-serif',
      fontSize: '24px',
      color: '#ffffff',
    });
    this.loadingText.setOrigin(0.5);
  }

  create(): void {
    console.log('BootScene: Initializing game...');

    // Listen for global YAML reload to clear asset warnings
    this.game.events.on('reloadYAML', () => {
      assetWarningTracker.clear();
    });

    // Start async loading process
    this.loadAllAssets().then(() => {
      console.log('BootScene: All assets loaded successfully');
      // Transition to main menu after assets are ready
      this.time.delayedCall(100, () => {
        this.scene.start('MainMenuScene');
      });
    }).catch((error) => {
      console.error('BootScene: Failed to load assets:', error);
      // Still transition even on error
      this.time.delayedCall(100, () => {
        this.scene.start('MainMenuScene');
      });
    });
  }

  /**
   * Load all assets asynchronously
   */
  private async loadAllAssets(): Promise<void> {
    console.log('[BootScene] Starting asset loading...');

    // Load character configs
    await this.loadCharacterConfigs();
    console.log('[BootScene] Character configs loaded');

    // Load spritesheets (or create placeholders)
    await this.loadCharacterSpritesheets();
    console.log('[BootScene] Spritesheets loaded');

    // Verify textures exist
    for (const charConfig of this.loadedCharacters) {
      const exists = this.textures.exists(charConfig.id);
      console.log(`[BootScene] Texture '${charConfig.id}' exists: ${exists}`);
    }

    // Create animations from configs
    this.createCharacterAnimations();
    console.log('[BootScene] Animations created');
  }

  /**
   * Load all character YAML configs
   */
  private async loadCharacterConfigs(): Promise<void> {
    this.updateLoadingText('Loading characters...');

    const configPromises = CHARACTER_CONFIGS.map(async (path) => {
      try {
        const charConfig = await yamlParser.loadCharacter(path);
        console.log(`[BootScene] Loaded character config: ${charConfig.id}`);
        return charConfig;
      } catch (error) {
        assetWarningTracker.warn(
          'config-error',
          path,
          `Failed to load character config: ${error}`,
          { expectedPath: path, severity: 'error' }
        );
        return null;
      }
    });

    const results = await Promise.all(configPromises);
    this.loadedCharacters = results.filter((c): c is CharacterConfig => c !== null);

    // Store in registry for other scenes to access
    this.registry.set('characterConfigs', this.loadedCharacters);
    this.registry.set('assetWarningTracker', assetWarningTracker);
  }

  /**
   * Load spritesheets for all characters
   * Creates placeholder textures if actual sprites not found
   */
  private async loadCharacterSpritesheets(): Promise<void> {
    this.updateLoadingText('Loading sprites...');

    const placeholdersToCreate: CharacterConfig[] = [];

    // First, try to load real spritesheets
    for (const charConfig of this.loadedCharacters) {
      const { id, spritesheet } = charConfig;
      const fullPath = config.assetPath(spritesheet.path);

      // Check if texture already exists
      if (this.textures.exists(id)) {
        console.log(`[BootScene] Texture '${id}' already loaded`);
        continue;
      }

      try {
        // Try to load the actual spritesheet
        await this.loadSpritesheetAsync(
          id,
          fullPath,
          spritesheet.frameWidth,
          spritesheet.frameHeight
        );
        console.log(`[BootScene] Loaded spritesheet: ${id}`);
      } catch (error) {
        // Mark for placeholder creation
        assetWarningTracker.warn(
          'missing-sprite',
          id,
          'Spritesheet not found, creating placeholder',
          { expectedPath: fullPath }
        );
        placeholdersToCreate.push(charConfig);
      }
    }

    // Create all placeholders in one batch
    if (placeholdersToCreate.length > 0) {
      await this.createPlaceholderSpritesheets(placeholdersToCreate);
    }
  }

  /**
   * Load a spritesheet asynchronously
   */
  private loadSpritesheetAsync(
    key: string,
    path: string,
    frameWidth: number,
    frameHeight: number
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if file exists first
      fetch(path, { method: 'HEAD' })
        .then((response) => {
          if (!response.ok) {
            reject(new Error(`Spritesheet not found: ${path}`));
            return;
          }

          // File exists, load it
          this.load.spritesheet(key, path, { frameWidth, frameHeight });
          this.load.once('complete', () => resolve());
          this.load.once('loaderror', () => reject(new Error(`Failed to load: ${path}`)));
          this.load.start();
        })
        .catch(() => reject(new Error(`Failed to fetch: ${path}`)));
    });
  }

  /**
   * Create multiple placeholder spritesheets in one batch
   */
  private async createPlaceholderSpritesheets(configs: CharacterConfig[]): Promise<void> {
    if (configs.length === 0) {
      return;
    }

    // Create all placeholders and wait for all to complete
    await Promise.all(configs.map((config) => this.createSinglePlaceholder(config)));
    console.log(`[BootScene] Created ${configs.length} placeholder spritesheets`);
  }

  /**
   * Create a single placeholder spritesheet with proper frame data
   */
  private createSinglePlaceholder(charConfig: CharacterConfig): Promise<void> {
    return new Promise((resolve) => {
      const { id, spritesheet, animations } = charConfig;
      const { frameWidth, frameHeight } = spritesheet;

      console.log(`[BootScene] Creating placeholder for '${id}' (${frameWidth}x${frameHeight})`);

      // Calculate max frame index
      let maxFrame = 0;
      for (const animConfig of Object.values(animations)) {
        for (const frame of animConfig.frames) {
          maxFrame = Math.max(maxFrame, frame);
        }
      }
      const totalFrames = maxFrame + 1;

      // Generate canvas
      const canvas = this.generatePlaceholderCanvas(charConfig, totalFrames);

      // Convert to image and wait for it to load
      const image = new Image();
      image.onload = () => {
        try {
          // Remove existing texture if any
          if (this.textures.exists(id)) {
            this.textures.remove(id);
          }

          // Add as spritesheet texture with frame data
          const texture = this.textures.addSpriteSheet(id, image, {
            frameWidth,
            frameHeight,
          });

          if (texture) {
            console.log(`[BootScene] Created placeholder '${id}': ${texture.frameTotal} frames, texture exists: ${this.textures.exists(id)}`);
          } else {
            console.error(`[BootScene] Failed to create texture for '${id}'`);
          }
        } catch (e) {
          console.error(`[BootScene] Error creating placeholder '${id}':`, e);
        }
        resolve();
      };
      image.onerror = (e) => {
        console.error(`[BootScene] Failed to load placeholder image for '${id}'`, e);
        resolve();
      };
      image.src = canvas.toDataURL();
    });
  }

  /**
   * Generate canvas for placeholder spritesheet
   * Includes CVD-friendly diagonal stripes and warning triangle
   */
  private generatePlaceholderCanvas(charConfig: CharacterConfig, totalFrames: number): HTMLCanvasElement {
    const { id, spritesheet } = charConfig;
    const { frameWidth, frameHeight } = spritesheet;

    const width = frameWidth * totalFrames;
    const height = frameHeight;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    const hue = this.stringToHue(id);
    // Get first letter for the sprite (P for player, B for boss, etc.)
    const letter = id.includes('player') ? 'P' : id.charAt(0).toUpperCase();

    for (let i = 0; i < totalFrames; i++) {
      const x = i * frameWidth;
      const lightness = 40 + (i * 6) % 25;

      // Fill background
      ctx.fillStyle = `hsl(${hue}, 60%, ${lightness}%)`;
      ctx.fillRect(x, 0, frameWidth, frameHeight);

      // Draw diagonal stripe pattern (CVD-friendly)
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, 0, frameWidth, frameHeight);
      ctx.clip();
      ctx.strokeStyle = `hsla(${hue}, 80%, ${Math.max(lightness - 15, 20)}%, 0.4)`;
      ctx.lineWidth = 4;
      const stripeSpacing = 12;
      for (let stripe = -frameHeight; stripe < frameWidth + frameHeight; stripe += stripeSpacing) {
        ctx.beginPath();
        ctx.moveTo(x + stripe, 0);
        ctx.lineTo(x + stripe + frameHeight, frameHeight);
        ctx.stroke();
      }
      ctx.restore();

      // Draw border
      ctx.strokeStyle = `hsl(${hue}, 80%, 25%)`;
      ctx.lineWidth = 3;
      ctx.strokeRect(x + 2, 2, frameWidth - 4, frameHeight - 4);

      // Draw warning triangle in top-left corner
      const triangleSize = 16;
      const triangleX = x + 8;
      const triangleY = 8;
      ctx.fillStyle = '#FFD700'; // Gold
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(triangleX + triangleSize / 2, triangleY);
      ctx.lineTo(triangleX, triangleY + triangleSize);
      ctx.lineTo(triangleX + triangleSize, triangleY + triangleSize);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Exclamation mark
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('!', triangleX + triangleSize / 2, triangleY + triangleSize - 5);

      const centerX = x + frameWidth / 2;

      // Draw large letter in center (this flips with the sprite)
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 4;
      ctx.font = 'bold 48px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.strokeText(letter, centerX, frameHeight / 2 - 10);
      ctx.fillText(letter, centerX, frameHeight / 2 - 10);

      // Draw frame number at bottom (smaller, but visible)
      ctx.font = 'bold 20px sans-serif';
      ctx.lineWidth = 3;
      ctx.strokeText(`${i}`, centerX, frameHeight - 18);
      ctx.fillText(`${i}`, centerX, frameHeight - 18);
    }

    return canvas;
  }


  /**
   * Convert a string to a hue value (0-360)
   */
  private stringToHue(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash % 360);
  }

  /**
   * Create Phaser animations from all loaded character configs
   */
  private createCharacterAnimations(): void {
    this.updateLoadingText('Creating animations...');

    for (const charConfig of this.loadedCharacters) {
      // Debug: Check texture frames
      const texture = this.textures.get(charConfig.id);
      const frameNames = texture.getFrameNames();
      console.log(`[BootScene] Texture '${charConfig.id}' has frames:`, frameNames);

      Character.createAnimations(this, charConfig);
    }
  }

  /**
   * Update loading text
   */
  private updateLoadingText(text: string): void {
    if (this.loadingText) {
      this.loadingText.setText(text);
    }
  }
}
