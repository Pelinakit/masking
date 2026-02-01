/**
 * EntityRegistry Service
 * Manages game entities (characters, stats, etc.) for dropdown selections
 * Allows creating new entities on-the-fly
 */

import { fileService } from './FileService.js';

export interface CharacterEntity {
  id: string;
  name: string;
  species?: string;
  role?: string;
}

export interface StatEntity {
  id: string;
  name: string;
  min: number;
  max: number;
  default: number;
}

export interface FlagEntity {
  id: string;
  name: string;
  description?: string;
}

// Default stats that exist in the game
const DEFAULT_STATS: StatEntity[] = [
  { id: 'energy', name: 'Energy', min: 0, max: 100, default: 100 },
  { id: 'stress', name: 'Stress', min: 0, max: 100, default: 0 },
  { id: 'hunger', name: 'Hunger', min: 0, max: 100, default: 0 },
  { id: 'happiness', name: 'Happiness', min: 0, max: 100, default: 50 },
  { id: 'social_anxiety', name: 'Social Anxiety', min: 0, max: 100, default: 30 },
];

// Default characters (will be augmented from files)
const DEFAULT_CHARACTERS: CharacterEntity[] = [
  { id: 'player', name: 'Player', role: 'protagonist' },
  { id: 'narrator', name: 'Narrator', role: 'system' },
];

class EntityRegistry {
  private characters: Map<string, CharacterEntity> = new Map();
  private stats: Map<string, StatEntity> = new Map();
  private flags: Map<string, FlagEntity> = new Map();
  private initialized = false;

  /**
   * Initialize the registry by loading from files
   */
  async init(): Promise<void> {
    if (this.initialized) return;

    // Load default stats
    DEFAULT_STATS.forEach(stat => this.stats.set(stat.id, stat));

    // Load default characters
    DEFAULT_CHARACTERS.forEach(char => this.characters.set(char.id, char));

    // Try to load characters from files
    await this.loadCharactersFromFiles();

    // Try to load custom stats
    await this.loadStatsFromFiles();

    this.initialized = true;
    console.log(`[EntityRegistry] Initialized with ${this.characters.size} characters, ${this.stats.size} stats`);
  }

  /**
   * Load characters from YAML files
   */
  private async loadCharactersFromFiles(): Promise<void> {
    try {
      // Try to load from characters directory
      const files = await fileService.listFiles('public/data/characters');

      for (const file of files) {
        if (file.endsWith('.yaml') || file.endsWith('.yml')) {
          try {
            const data = await fileService.readFile(`public/data/characters/${file}`);
            const parsed = this.parseYAML(data.content);

            if (parsed && parsed.id && parsed.name) {
              this.characters.set(parsed.id, {
                id: parsed.id,
                name: parsed.name,
                species: parsed.species,
                role: parsed.role,
              });
            }
          } catch (e) {
            console.warn(`[EntityRegistry] Failed to parse character file: ${file}`);
          }
        }
      }
    } catch (e) {
      console.log('[EntityRegistry] No characters directory found, using defaults');
    }
  }

  /**
   * Load custom stats from config
   */
  private async loadStatsFromFiles(): Promise<void> {
    try {
      const data = await fileService.readFile('public/data/config/stats.yaml');
      const parsed = this.parseYAML(data.content);

      if (parsed && Array.isArray(parsed.stats)) {
        parsed.stats.forEach((stat: any) => {
          if (stat.id && stat.name) {
            this.stats.set(stat.id, {
              id: stat.id,
              name: stat.name,
              min: stat.min ?? 0,
              max: stat.max ?? 100,
              default: stat.default ?? 50,
            });
          }
        });
      }
    } catch (e) {
      console.log('[EntityRegistry] No stats config found, using defaults');
    }
  }

  /**
   * Simple YAML parser for basic structures
   */
  private parseYAML(content: string): any {
    try {
      // Use dynamic import for yaml module
      const lines = content.split('\n');
      const result: any = {};

      for (const line of lines) {
        const match = line.match(/^(\w+):\s*(.*)$/);
        if (match) {
          const [, key, value] = match;
          result[key] = value.replace(/^["']|["']$/g, '');
        }
      }

      return result;
    } catch {
      return null;
    }
  }

  /**
   * Get all characters
   */
  getCharacters(): CharacterEntity[] {
    return Array.from(this.characters.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Get character by ID
   */
  getCharacter(id: string): CharacterEntity | undefined {
    return this.characters.get(id);
  }

  /**
   * Add a new character
   */
  async addCharacter(char: Omit<CharacterEntity, 'id'>): Promise<CharacterEntity> {
    const id = this.generateId(char.name);
    const character: CharacterEntity = { ...char, id };

    this.characters.set(id, character);

    // Save to file
    await this.saveCharacterToFile(character);

    return character;
  }

  /**
   * Save character to YAML file
   */
  private async saveCharacterToFile(char: CharacterEntity): Promise<void> {
    const yaml = `id: ${char.id}
name: ${char.name}
${char.species ? `species: ${char.species}` : ''}
${char.role ? `role: ${char.role}` : ''}
voice:
  type: bweh
  pitchOffset: 0
  speedOffset: 0
defaultEmotion: neutral
`.trim();

    try {
      await fileService.writeFile(`public/data/characters/${char.id}.yaml`, yaml);
      console.log(`[EntityRegistry] Created character file: ${char.id}.yaml`);
    } catch (e) {
      console.error('[EntityRegistry] Failed to save character:', e);
    }
  }

  /**
   * Get all stats
   */
  getStats(): StatEntity[] {
    return Array.from(this.stats.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Get stat by ID
   */
  getStat(id: string): StatEntity | undefined {
    return this.stats.get(id);
  }

  /**
   * Add a new stat
   */
  async addStat(stat: Omit<StatEntity, 'id'>): Promise<StatEntity> {
    const id = this.generateId(stat.name);
    const newStat: StatEntity = { ...stat, id };

    this.stats.set(id, newStat);

    // Note: Saving stats to file would require updating the game config
    // For now, stats are only stored in memory for this session

    return newStat;
  }

  /**
   * Get all flags
   */
  getFlags(): FlagEntity[] {
    return Array.from(this.flags.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Add a new flag
   */
  addFlag(name: string, description?: string): FlagEntity {
    const id = this.generateId(name);
    const flag: FlagEntity = { id, name, description };
    this.flags.set(id, flag);
    return flag;
  }

  /**
   * Generate a valid ID from a name
   */
  private generateId(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');
  }

  /**
   * Check if character exists
   */
  hasCharacter(id: string): boolean {
    return this.characters.has(id);
  }

  /**
   * Check if stat exists
   */
  hasStat(id: string): boolean {
    return this.stats.has(id);
  }
}

export const entityRegistry = new EntityRegistry();
