/**
 * YAMLParser
 * Script Interpretation layer - parses YAML narrative scripts
 */

import { load } from 'js-yaml';
import type { StatName } from '@game/systems/StatSystem';
import type { MaskType } from '@game/StateManager';
import { config } from '../config';
import { characterParser } from './parsers/CharacterParser';
import type { CharacterConfig } from '@presentation/components/Character';

// Re-export character types for convenience
export type { CharacterConfig, AnimationConfig, CharacterAccessibility } from '@presentation/components/Character';

// Layer types for scene elements
export type SceneLayer = 'background' | 'foreground';

// Background image configuration from YAML
export interface BackgroundConfig {
  path: string;
  scale?: number;
}

// Hotspot sprite configuration from YAML (sprite-centric coordinates)
export interface HotspotSpriteConfig {
  path: string;
  x: number;           // Sprite X position (absolute)
  y: number;           // Sprite Y position (absolute)
  scale?: number;
  layer?: SceneLayer;  // 'background' (behind characters) or 'foreground' (in front)
}

// Hitbox configuration relative to sprite
export interface HotspotHitboxConfig {
  offset_x?: number;   // Offset from sprite center
  offset_y?: number;
  width: number;
  height: number;
}

// Scene Script Types
export interface SceneHotspot {
  id: string;
  action: string;
  label?: string;
  condition?: string;
  sprite?: HotspotSpriteConfig;
  hitbox?: HotspotHitboxConfig;
  // Legacy support: direct x/y/width/height (deprecated)
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export interface SceneScript {
  id: string;
  name: string;
  background: string;  // Legacy: background name/id
  background_image?: BackgroundConfig;  // New: explicit background image config
  hotspots: SceneHotspot[];
  ambientSound?: string;
}

// NPC Script Types
export interface NPCScript {
  id: string;
  name: string;
  species: string;
  role: string;
  portrait?: string;
  affinity: number;
  dialogues: Record<string, DialogueNode>;
}

// Dialogue Types
export interface DialogueNode {
  id: string;
  speaker?: string;
  text: string;
  choices?: Choice[];
  effects?: Effect[];
  next?: string;
  condition?: string;
}

export interface Choice {
  text: string;
  next: string;
  effects?: Effect[];
  condition?: string;
  maskRequirement?: MaskType;
}

export interface Effect {
  type: 'stat' | 'relationship' | 'item' | 'unlock' | 'scene' | 'time';
  target?: string;
  value?: number | string;
  stat?: StatName;
  delta?: number;
}

// Event Script Types
export interface EventScript {
  id: string;
  title: string;
  description: string;
  triggerTime?: {
    hour: number;
    minute: number;
    dayOfWeek?: string;
  };
  condition?: string;
  sequence: EventSequenceNode[];
}

export interface EventSequenceNode {
  type: 'dialogue' | 'choice' | 'effect' | 'scene' | 'wait';
  data: any;
  delay?: number;
}

// Email Types
export interface EmailScript {
  id: string;
  from: string;
  subject: string;
  body: string;
  timestamp: {
    hour: number;
    minute: number;
  };
  actions?: EmailAction[];
  important?: boolean;
}

export interface EmailAction {
  label: string;
  effects: Effect[];
}

// Meeting Types
export interface MeetingScript {
  id: string;
  title: string;
  participants: string[];
  startTime: {
    hour: number;
    minute: number;
  };
  duration: number; // Game hours
  meetingType: string;
  recommendedMask: MaskType;
  events: MeetingEvent[];
}

export interface MeetingEvent {
  timestamp: number; // Minutes into meeting
  speaker: string;
  dialogue: string;
  choices?: Choice[];
  effects?: Effect[];
}

// Laptop Config Types
export interface LaptopGridConfig {
  max_columns: number;
  icon_size: number;
  padding: number;
  spacing: number;
}

export interface LaptopTransitionsConfig {
  duration: number;
  respect_reduced_motion: boolean;
}

export interface LaptopSoundsConfig {
  navigate?: string;
  open_app?: string;
  close_app?: string;
}

export interface LaptopAppConfig {
  id: string;
  name: string;
  fallback_icon: string;
  sprite?: string;
  background?: string;
}

export interface LaptopConfig {
  id: string;
  name: string;
  background: string;
  grid: LaptopGridConfig;
  transitions?: LaptopTransitionsConfig;
  sounds?: LaptopSoundsConfig;
  apps: LaptopAppConfig[];
}

export class YAMLParser {
  private cache: Map<string, { content: string; parsed: any; timestamp: number }> = new Map();

  /**
   * Clear the cache to force reload of all YAML files
   */
  clearCache(): void {
    this.cache.clear();
    console.log('[YAMLParser] Cache cleared - next load will fetch fresh data');
  }

  /**
   * Reload a specific file (clears from cache and re-fetches)
   */
  async reloadFile(path: string): Promise<string> {
    this.cache.delete(path);
    return this.loadFile(path);
  }

  /**
   * Get cache stats
   */
  getCacheStats(): { files: number; paths: string[] } {
    return {
      files: this.cache.size,
      paths: Array.from(this.cache.keys()),
    };
  }

  /**
   * Parse a scene script
   */
  parseScene(yamlContent: string): SceneScript {
    try {
      const data = load(yamlContent) as any;
      return this.validateScene(data);
    } catch (error) {
      throw new Error(`Failed to parse scene YAML: ${error}`);
    }
  }

  /**
   * Parse an NPC script
   */
  parseNPC(yamlContent: string): NPCScript {
    try {
      const data = load(yamlContent) as any;
      return this.validateNPC(data);
    } catch (error) {
      throw new Error(`Failed to parse NPC YAML: ${error}`);
    }
  }

  /**
   * Parse an event script
   */
  parseEvent(yamlContent: string): EventScript {
    try {
      const data = load(yamlContent) as any;
      return this.validateEvent(data);
    } catch (error) {
      throw new Error(`Failed to parse event YAML: ${error}`);
    }
  }

  /**
   * Parse an email script
   */
  parseEmail(yamlContent: string): EmailScript {
    try {
      const data = load(yamlContent) as any;
      return this.validateEmail(data);
    } catch (error) {
      throw new Error(`Failed to parse email YAML: ${error}`);
    }
  }

  /**
   * Parse a meeting script
   */
  parseMeeting(yamlContent: string): MeetingScript {
    try {
      const data = load(yamlContent) as any;
      return this.validateMeeting(data);
    } catch (error) {
      throw new Error(`Failed to parse meeting YAML: ${error}`);
    }
  }

  /**
   * Parse a character script
   */
  parseCharacter(yamlContent: string): CharacterConfig {
    return characterParser.parse(yamlContent);
  }

  /**
   * Load and parse a character config from path
   */
  async loadCharacter(path: string, bypassCache: boolean = false): Promise<CharacterConfig> {
    const content = await this.loadFile(path, bypassCache);
    return this.parseCharacter(content);
  }

  /**
   * Parse a laptop config
   */
  parseLaptop(yamlContent: string): LaptopConfig {
    try {
      const data = load(yamlContent) as any;
      return this.validateLaptop(data);
    } catch (error) {
      throw new Error(`Failed to parse laptop YAML: ${error}`);
    }
  }

  /**
   * Load and parse a laptop config from path
   */
  async loadLaptop(path: string, bypassCache: boolean = false): Promise<LaptopConfig> {
    const content = await this.loadFile(path, bypassCache);
    return this.parseLaptop(content);
  }

  /**
   * Load YAML file from path (async) - uses cache unless cleared
   */
  async loadFile(path: string, bypassCache: boolean = false): Promise<string> {
    // Check cache first
    if (!bypassCache && this.cache.has(path)) {
      return this.cache.get(path)!.content;
    }

    // Resolve path with base path for data files
    const fullPath = path.startsWith('/data/') ? config.dataPath(path) : path;

    try {
      const response = await fetch(fullPath + '?t=' + Date.now()); // Cache-bust browser cache
      if (!response.ok) {
        throw new Error(`Failed to load YAML file: ${response.statusText}`);
      }
      const content = await response.text();

      // Store in cache
      this.cache.set(path, {
        content,
        parsed: null,
        timestamp: Date.now(),
      });

      return content;
    } catch (error) {
      throw new Error(`Failed to load YAML file from ${path}: ${error}`);
    }
  }

  /**
   * Validate scene data
   */
  private validateScene(data: any): SceneScript {
    if (!data.id || !data.name) {
      throw new Error('Scene requires id and name');
    }

    return {
      id: data.id,
      name: data.name,
      background: data.background || '',
      background_image: data.background_image,
      hotspots: data.hotspots || [],
      ambientSound: data.ambientSound,
    };
  }

  /**
   * Validate NPC data
   */
  private validateNPC(data: any): NPCScript {
    if (!data.id || !data.name) {
      throw new Error('NPC requires id and name');
    }

    return {
      id: data.id,
      name: data.name,
      species: data.species || 'cat',
      role: data.role || 'unknown',
      portrait: data.portrait,
      affinity: data.affinity ?? 50,
      dialogues: data.dialogues || {},
    };
  }

  /**
   * Validate event data
   */
  private validateEvent(data: any): EventScript {
    if (!data.id || !data.title) {
      throw new Error('Event requires id and title');
    }

    return {
      id: data.id,
      title: data.title,
      description: data.description || '',
      triggerTime: data.triggerTime,
      condition: data.condition,
      sequence: data.sequence || [],
    };
  }

  /**
   * Validate email data
   */
  private validateEmail(data: any): EmailScript {
    if (!data.id || !data.from || !data.subject) {
      throw new Error('Email requires id, from, and subject');
    }

    return {
      id: data.id,
      from: data.from,
      subject: data.subject,
      body: data.body || '',
      timestamp: data.timestamp || { hour: 9, minute: 0 },
      actions: data.actions || [],
      important: data.important || false,
    };
  }

  /**
   * Validate meeting data
   */
  private validateMeeting(data: any): MeetingScript {
    if (!data.id || !data.title) {
      throw new Error('Meeting requires id and title');
    }

    return {
      id: data.id,
      title: data.title,
      participants: data.participants || [],
      startTime: data.startTime || { hour: 10, minute: 0 },
      duration: data.duration || 1,
      meetingType: data.meetingType || 'general',
      recommendedMask: data.recommendedMask || 'meetingParticipant',
      events: data.events || [],
    };
  }

  /**
   * Validate laptop config data
   */
  private validateLaptop(data: any): LaptopConfig {
    if (!data.id) {
      throw new Error('Laptop config requires id');
    }

    if (!data.apps || !Array.isArray(data.apps) || data.apps.length === 0) {
      throw new Error('Laptop config requires at least one app');
    }

    // Validate each app has required fields
    const validatedApps: LaptopAppConfig[] = data.apps.map((app: any, index: number) => {
      if (!app.id || !app.name || !app.fallback_icon) {
        throw new Error(`App at index ${index} requires id, name, and fallback_icon`);
      }
      return {
        id: app.id,
        name: app.name,
        fallback_icon: app.fallback_icon,
        sprite: app.sprite,
        background: app.background,
      };
    });

    // Grid config with defaults
    const grid: LaptopGridConfig = {
      max_columns: data.grid?.max_columns ?? 6,
      icon_size: data.grid?.icon_size ?? 80,
      padding: data.grid?.padding ?? 32,
      spacing: data.grid?.spacing ?? 60,
    };

    // Transitions config with defaults
    const transitions: LaptopTransitionsConfig = {
      duration: data.transitions?.duration ?? 400,
      respect_reduced_motion: data.transitions?.respect_reduced_motion ?? true,
    };

    // Sounds config
    const sounds: LaptopSoundsConfig = {
      navigate: data.sounds?.navigate,
      open_app: data.sounds?.open_app,
      close_app: data.sounds?.close_app,
    };

    return {
      id: data.id,
      name: data.name || 'Laptop',
      background: data.background || 'assets/backgrounds/pc.png',
      grid,
      transitions,
      sounds,
      apps: validatedApps,
    };
  }
}

/**
 * Singleton instance for convenience
 */
export const yamlParser = new YAMLParser();
