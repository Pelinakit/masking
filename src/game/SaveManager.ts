/**
 * SaveManager
 * State persistence for save/load game and day-to-day progression (E13)
 */

import { StateManager } from './StateManager';

export interface SaveData {
  version: string;
  timestamp: string;
  currentDay: string;
  currentWeek: number;
  currentTime: string;

  // Stats
  stats: {
    energy: number;
    stress: number;
    hunger: number;
    happiness: number;
    socialAnxiety: number;
  };

  // Relationships
  relationships: Record<string, number>;

  // Unlocks and flags
  unlocks: string[];
  flags: Record<string, string>;

  // Progression
  completedDays: string[];
  achievements: string[];

  // Gameplay data
  totalPlayTime: number;
  totalEnergySpent: number;
  totalStressGained: number;
}

export class SaveManager {
  private static readonly SAVE_KEY = 'masking_save_data';
  private static readonly SAVE_VERSION = '1.0.0';

  /**
   * Save current game state
   */
  save(state: StateManager, currentDay: string, currentWeek: number): boolean {
    try {
      const saveData: SaveData = {
        version: SaveManager.SAVE_VERSION,
        timestamp: new Date().toISOString(),
        currentDay,
        currentWeek,
        currentTime: state.time.getCurrentTimeString(),

        // Save stats
        stats: {
          energy: state.stats.getStat('energy'),
          stress: state.stats.getStat('stress'),
          hunger: state.stats.getStat('hunger'),
          happiness: state.stats.getStat('happiness'),
          socialAnxiety: state.stats.getStat('socialAnxiety'),
        },

        // Save relationships
        relationships: this.exportRelationships(state),

        // Save unlocks and flags
        unlocks: this.exportUnlocks(state),
        flags: this.exportFlags(state),

        // Save progression
        completedDays: this.exportCompletedDays(state),
        achievements: this.exportAchievements(state),

        // Save gameplay stats
        totalPlayTime: 0, // TODO: Track play time
        totalEnergySpent: 0, // TODO: Track cumulative energy
        totalStressGained: 0, // TODO: Track cumulative stress
      };

      // Save to localStorage
      localStorage.setItem(SaveManager.SAVE_KEY, JSON.stringify(saveData));

      console.log('Game saved successfully');
      return true;
    } catch (error) {
      console.error('Failed to save game:', error);
      return false;
    }
  }

  /**
   * Load saved game state
   */
  load(state: StateManager): { day: string; week: number } | null {
    try {
      const saved = localStorage.getItem(SaveManager.SAVE_KEY);

      if (!saved) {
        console.log('No save data found');
        return null;
      }

      const saveData: SaveData = JSON.parse(saved);

      // Validate version
      if (saveData.version !== SaveManager.SAVE_VERSION) {
        console.warn('Save data version mismatch, migration may be needed');
      }

      // Restore stats
      state.stats.setStat('energy', saveData.stats.energy);
      state.stats.setStat('stress', saveData.stats.stress);
      state.stats.setStat('hunger', saveData.stats.hunger);
      state.stats.setStat('happiness', saveData.stats.happiness);
      state.stats.setStat('socialAnxiety', saveData.stats.socialAnxiety);

      // Restore relationships
      this.importRelationships(state, saveData.relationships);

      // Restore unlocks
      this.importUnlocks(state, saveData.unlocks);

      // Restore flags
      this.importFlags(state, saveData.flags);

      // Restore time
      state.time.setTime(saveData.currentTime);

      console.log('Game loaded successfully');

      return {
        day: saveData.currentDay,
        week: saveData.currentWeek,
      };
    } catch (error) {
      console.error('Failed to load game:', error);
      return null;
    }
  }

  /**
   * Check if save data exists
   */
  hasSaveData(): boolean {
    return localStorage.getItem(SaveManager.SAVE_KEY) !== null;
  }

  /**
   * Delete save data
   */
  deleteSave(): boolean {
    try {
      localStorage.removeItem(SaveManager.SAVE_KEY);
      console.log('Save data deleted');
      return true;
    } catch (error) {
      console.error('Failed to delete save:', error);
      return false;
    }
  }

  /**
   * Export save data as JSON string (for backup/export)
   */
  exportSaveData(): string | null {
    const saved = localStorage.getItem(SaveManager.SAVE_KEY);
    return saved;
  }

  /**
   * Import save data from JSON string (for restore/import)
   */
  importSaveData(jsonData: string): boolean {
    try {
      // Validate JSON
      const saveData = JSON.parse(jsonData);

      if (!saveData.version || !saveData.currentDay) {
        throw new Error('Invalid save data format');
      }

      // Store in localStorage
      localStorage.setItem(SaveManager.SAVE_KEY, jsonData);

      console.log('Save data imported successfully');
      return true;
    } catch (error) {
      console.error('Failed to import save data:', error);
      return false;
    }
  }

  /**
   * Get save metadata without loading full save
   */
  getSaveMetadata(): { day: string; week: number; timestamp: string } | null {
    try {
      const saved = localStorage.getItem(SaveManager.SAVE_KEY);
      if (!saved) return null;

      const saveData: SaveData = JSON.parse(saved);

      return {
        day: saveData.currentDay,
        week: saveData.currentWeek,
        timestamp: saveData.timestamp,
      };
    } catch (error) {
      console.error('Failed to get save metadata:', error);
      return null;
    }
  }

  /**
   * Export relationships to object
   */
  private exportRelationships(state: StateManager): Record<string, number> {
    const relationships: Record<string, number> = {};

    // Get all NPC IDs from relationships manager
    const npcIds = state.relationships.getAllNPCs();

    npcIds.forEach(npcId => {
      relationships[npcId] = state.relationships.getRelationship(npcId);
    });

    return relationships;
  }

  /**
   * Import relationships from object
   */
  private importRelationships(state: StateManager, relationships: Record<string, number>): void {
    Object.entries(relationships).forEach(([npcId, value]) => {
      state.relationships.setRelationship(npcId, value);
    });
  }

  /**
   * Export unlocks to array
   */
  private exportUnlocks(state: StateManager): string[] {
    // Get all unlocked content
    return state.getAllUnlocks();
  }

  /**
   * Import unlocks from array
   */
  private importUnlocks(state: StateManager, unlocks: string[]): void {
    unlocks.forEach(contentId => {
      state.unlockContent(contentId);
    });
  }

  /**
   * Export flags to object
   */
  private exportFlags(state: StateManager): Record<string, string> {
    const flags: Record<string, string> = {};

    // Get all decisions/flags
    const decisions = state.getAllDecisions();

    decisions.forEach(([key, value]) => {
      flags[key] = value;
    });

    return flags;
  }

  /**
   * Import flags from object
   */
  private importFlags(state: StateManager, flags: Record<string, string>): void {
    Object.entries(flags).forEach(([key, value]) => {
      state.recordDecision(key, value);
    });
  }

  /**
   * Export completed days
   */
  private exportCompletedDays(state: StateManager): string[] {
    // Get list of completed days
    return state.getCompletedDays();
  }

  /**
   * Export achievements
   */
  private exportAchievements(state: StateManager): string[] {
    // Get list of unlocked achievements
    return state.getAchievements();
  }

  /**
   * Create a new game save
   */
  newGame(state: StateManager): boolean {
    try {
      // Reset state to defaults
      state.stats.setStat('energy', 100);
      state.stats.setStat('stress', 0);
      state.stats.setStat('hunger', 0);
      state.stats.setStat('happiness', 50);
      state.stats.setStat('socialAnxiety', 20);

      // Clear relationships
      state.relationships.resetAll();

      // Clear unlocks and flags
      state.clearAllUnlocks();
      state.clearAllDecisions();

      // Save initial state
      return this.save(state, 'monday', 1);
    } catch (error) {
      console.error('Failed to create new game:', error);
      return false;
    }
  }
}

/**
 * Singleton instance
 */
export const saveManager = new SaveManager();
