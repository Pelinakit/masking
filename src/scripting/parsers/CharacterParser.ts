/**
 * CharacterParser
 * Script Interpretation layer - parses YAML character configurations
 */

import { load } from 'js-yaml';
import type {
  CharacterConfig,
  AnimationConfig,
  CharacterAccessibility,
} from '@presentation/components/Character';

/**
 * Validation error for character configs
 */
export class CharacterValidationError extends Error {
  constructor(
    message: string,
    public readonly field?: string
  ) {
    super(message);
    this.name = 'CharacterValidationError';
  }
}

/**
 * Parse and validate character YAML configurations
 */
export class CharacterParser {
  /**
   * Parse a character YAML string into a CharacterConfig
   * @param yamlContent The raw YAML content
   * @returns Validated CharacterConfig
   * @throws CharacterValidationError if validation fails
   */
  parse(yamlContent: string): CharacterConfig {
    try {
      const data = load(yamlContent) as any;
      return this.validate(data);
    } catch (error) {
      if (error instanceof CharacterValidationError) {
        throw error;
      }
      throw new CharacterValidationError(`Failed to parse character YAML: ${error}`);
    }
  }

  /**
   * Validate character data and return typed config
   * @param data Raw parsed YAML data
   * @returns Validated CharacterConfig
   * @throws CharacterValidationError if validation fails
   */
  validate(data: any): CharacterConfig {
    // Required fields
    if (!data.id || typeof data.id !== 'string') {
      throw new CharacterValidationError('Character requires a valid id', 'id');
    }

    if (!data.name || typeof data.name !== 'string') {
      throw new CharacterValidationError('Character requires a valid name', 'name');
    }

    // Validate spritesheet
    const spritesheet = this.validateSpritesheet(data.spritesheet);

    // Validate animations
    const animations = this.validateAnimations(data.animations);

    // Must have at least idle animation
    if (!animations.idle) {
      throw new CharacterValidationError(
        "Character must have at least an 'idle' animation",
        'animations.idle'
      );
    }

    // Validate accessibility (optional)
    const accessibility = data.accessibility
      ? this.validateAccessibility(data.accessibility)
      : undefined;

    // Validate defaultAnimation
    const defaultAnimation = data.defaultAnimation || 'idle';
    if (!animations[defaultAnimation]) {
      throw new CharacterValidationError(
        `Default animation '${defaultAnimation}' not found in animations`,
        'defaultAnimation'
      );
    }

    return {
      id: data.id,
      name: data.name,
      species: data.species || 'unknown',
      spritesheet,
      animations,
      defaultAnimation,
      accessibility,
    };
  }

  /**
   * Validate spritesheet configuration
   */
  private validateSpritesheet(data: any): CharacterConfig['spritesheet'] {
    if (!data || typeof data !== 'object') {
      throw new CharacterValidationError('Character requires spritesheet configuration', 'spritesheet');
    }

    if (!data.path || typeof data.path !== 'string') {
      throw new CharacterValidationError('Spritesheet requires a valid path', 'spritesheet.path');
    }

    if (!data.frameWidth || typeof data.frameWidth !== 'number' || data.frameWidth <= 0) {
      throw new CharacterValidationError(
        'Spritesheet requires a valid positive frameWidth',
        'spritesheet.frameWidth'
      );
    }

    if (!data.frameHeight || typeof data.frameHeight !== 'number' || data.frameHeight <= 0) {
      throw new CharacterValidationError(
        'Spritesheet requires a valid positive frameHeight',
        'spritesheet.frameHeight'
      );
    }

    return {
      path: data.path,
      frameWidth: data.frameWidth,
      frameHeight: data.frameHeight,
    };
  }

  /**
   * Validate animations configuration
   */
  private validateAnimations(data: any): Record<string, AnimationConfig> {
    if (!data || typeof data !== 'object') {
      throw new CharacterValidationError('Character requires animations configuration', 'animations');
    }

    const animations: Record<string, AnimationConfig> = {};

    for (const [name, config] of Object.entries(data)) {
      animations[name] = this.validateAnimation(name, config);
    }

    return animations;
  }

  /**
   * Validate a single animation configuration
   */
  private validateAnimation(name: string, data: any): AnimationConfig {
    if (!data || typeof data !== 'object') {
      throw new CharacterValidationError(
        `Animation '${name}' requires configuration object`,
        `animations.${name}`
      );
    }

    // Validate frames
    if (!Array.isArray(data.frames) || data.frames.length === 0) {
      throw new CharacterValidationError(
        `Animation '${name}' requires a non-empty frames array`,
        `animations.${name}.frames`
      );
    }

    for (let i = 0; i < data.frames.length; i++) {
      if (typeof data.frames[i] !== 'number' || data.frames[i] < 0) {
        throw new CharacterValidationError(
          `Animation '${name}' frame ${i} must be a non-negative number`,
          `animations.${name}.frames[${i}]`
        );
      }
    }

    // Validate frameRate
    if (typeof data.frameRate !== 'number' || data.frameRate <= 0) {
      throw new CharacterValidationError(
        `Animation '${name}' requires a positive frameRate`,
        `animations.${name}.frameRate`
      );
    }

    // Validate repeat (default to -1 for loop)
    const repeat = data.repeat ?? -1;
    if (typeof repeat !== 'number') {
      throw new CharacterValidationError(
        `Animation '${name}' repeat must be a number`,
        `animations.${name}.repeat`
      );
    }

    return {
      frames: data.frames,
      frameRate: data.frameRate,
      repeat,
    };
  }

  /**
   * Validate accessibility configuration
   */
  private validateAccessibility(data: any): CharacterAccessibility {
    const result: CharacterAccessibility = {
      reducedMotionStaticFrame: 0,
      description: '',
    };

    if (typeof data.reducedMotionStaticFrame === 'number') {
      if (data.reducedMotionStaticFrame < 0) {
        throw new CharacterValidationError(
          'reducedMotionStaticFrame must be non-negative',
          'accessibility.reducedMotionStaticFrame'
        );
      }
      result.reducedMotionStaticFrame = data.reducedMotionStaticFrame;
    }

    if (typeof data.description === 'string') {
      result.description = data.description;
    }

    return result;
  }

  /**
   * Validate that frame indices are within spritesheet bounds
   * @param config Character config to validate
   * @param totalFrames Total frames in the spritesheet
   * @returns true if valid, throws if invalid
   */
  validateFrameBounds(config: CharacterConfig, totalFrames: number): boolean {
    for (const [animName, animConfig] of Object.entries(config.animations)) {
      for (const frame of animConfig.frames) {
        if (frame >= totalFrames) {
          throw new CharacterValidationError(
            `Animation '${animName}' references frame ${frame}, but spritesheet only has ${totalFrames} frames (0-${totalFrames - 1})`,
            `animations.${animName}.frames`
          );
        }
      }
    }
    return true;
  }
}

/**
 * Singleton instance for convenience
 */
export const characterParser = new CharacterParser();
