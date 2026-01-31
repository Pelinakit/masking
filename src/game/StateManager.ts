/**
 * StateManager
 * Game Logic layer - manages unified game state and persistence
 */

import { StatSystem } from './systems/StatSystem';
import { TimeManager, GameTime, DayOfWeek } from './systems/TimeManager';
import { StatModifier } from './systems/StatModifier';

export type MaskType =
  | 'meetingParticipant'
  | 'presenter'
  | 'casualColleague'
  | 'carefulSubordinate'
  | 'professionalClientFacer'
  | 'none';

export type Species = 'cat' | 'dog' | 'bird' | 'rodent';

export interface PlayerState {
  name: string;
  species: Species;
  currentMask: MaskType;
  currentLocation: string;
  money: number;
}

export interface ProgressState {
  currentDay: number;
  completedTasks: string[];
  completedEvents: string[];
  decisions: Record<string, any>;
  unlockedContent: string[];
}

export interface RelationshipState {
  npcs: Record<string, number>; // NPC ID -> affinity (0-100)
}

export interface SaveData {
  version: string;
  timestamp: number;
  player: PlayerState;
  stats: any;
  time: any;
  modifiers: any;
  progress: ProgressState;
  relationships: RelationshipState;
  settings: {
    tutorialCompleted: boolean;
    audioVolume: number;
    sfxVolume: number;
    cvdMode: boolean;
  };
}

export class StateManager {
  private static readonly STORAGE_KEY = 'masking-game-state';
  private static readonly SAVE_VERSION = '1.0.0';

  // Core systems
  public readonly stats: StatSystem;
  public readonly time: TimeManager;
  public readonly modifiers: StatModifier;

  // Game state
  private player: PlayerState;
  private progress: ProgressState;
  private relationships: RelationshipState;
  private settings: SaveData['settings'];

  constructor() {
    // Initialize systems
    this.stats = new StatSystem();
    this.time = new TimeManager();
    this.modifiers = new StatModifier();

    // Initialize state
    this.player = this.getDefaultPlayerState();
    this.progress = this.getDefaultProgressState();
    this.relationships = this.getDefaultRelationshipState();
    this.settings = this.getDefaultSettings();

    // Try to load saved state
    this.loadGame();
  }

  /**
   * Update systems (call every frame)
   */
  update(deltaMs: number): void {
    // Update time
    this.time.update(deltaMs);

    // Update modifiers
    this.modifiers.update(this.stats, deltaMs);
  }

  /**
   * Get player state
   */
  getPlayer(): PlayerState {
    return { ...this.player };
  }

  /**
   * Update player state
   */
  updatePlayer(partial: Partial<PlayerState>): void {
    this.player = { ...this.player, ...partial };
  }

  /**
   * Get progress state
   */
  getProgress(): ProgressState {
    return { ...this.progress };
  }

  /**
   * Mark task as completed
   */
  completeTask(taskId: string): void {
    if (!this.progress.completedTasks.includes(taskId)) {
      this.progress.completedTasks.push(taskId);
    }
  }

  /**
   * Mark event as completed
   */
  completeEvent(eventId: string): void {
    if (!this.progress.completedEvents.includes(eventId)) {
      this.progress.completedEvents.push(eventId);
    }
  }

  /**
   * Record a player decision
   */
  recordDecision(key: string, value: any): void {
    this.progress.decisions[key] = value;
  }

  /**
   * Check if decision was made
   */
  hasDecision(key: string): boolean {
    return key in this.progress.decisions;
  }

  /**
   * Get decision value
   */
  getDecision(key: string): any {
    return this.progress.decisions[key];
  }

  /**
   * Unlock content (e.g., new areas, features)
   */
  unlockContent(contentId: string): void {
    if (!this.progress.unlockedContent.includes(contentId)) {
      this.progress.unlockedContent.push(contentId);
    }
  }

  /**
   * Check if content is unlocked
   */
  isUnlocked(contentId: string): boolean {
    return this.progress.unlockedContent.includes(contentId);
  }

  /**
   * Get NPC relationship value
   */
  getRelationship(npcId: string): number {
    return this.relationships.npcs[npcId] ?? 50; // Default neutral
  }

  /**
   * Modify NPC relationship
   */
  modifyRelationship(npcId: string, delta: number): void {
    const current = this.getRelationship(npcId);
    this.relationships.npcs[npcId] = Math.max(0, Math.min(100, current + delta));
  }

  /**
   * Set NPC relationship to specific value
   */
  setRelationship(npcId: string, value: number): void {
    this.relationships.npcs[npcId] = Math.max(0, Math.min(100, value));
  }

  /**
   * Get settings
   */
  getSettings(): SaveData['settings'] {
    return { ...this.settings };
  }

  /**
   * Update settings
   */
  updateSettings(partial: Partial<SaveData['settings']>): void {
    this.settings = { ...this.settings, ...partial };
  }

  /**
   * Save game to localStorage
   */
  saveGame(): boolean {
    try {
      const saveData: SaveData = {
        version: StateManager.SAVE_VERSION,
        timestamp: Date.now(),
        player: this.player,
        stats: this.stats.exportState(),
        time: this.time.exportState(),
        modifiers: this.modifiers.exportState(),
        progress: this.progress,
        relationships: this.relationships,
        settings: this.settings,
      };

      localStorage.setItem(StateManager.STORAGE_KEY, JSON.stringify(saveData));
      console.log('Game saved successfully');
      return true;
    } catch (error) {
      console.error('Failed to save game:', error);
      return false;
    }
  }

  /**
   * Load game from localStorage
   */
  loadGame(): boolean {
    try {
      const saved = localStorage.getItem(StateManager.STORAGE_KEY);
      if (!saved) {
        console.log('No saved game found');
        return false;
      }

      const saveData: SaveData = JSON.parse(saved);

      // Version check (in future, handle migrations)
      if (saveData.version !== StateManager.SAVE_VERSION) {
        console.warn('Save file version mismatch, attempting to load anyway');
      }

      // Restore state
      this.player = saveData.player || this.getDefaultPlayerState();
      this.progress = saveData.progress || this.getDefaultProgressState();
      this.relationships = saveData.relationships || this.getDefaultRelationshipState();
      this.settings = saveData.settings || this.getDefaultSettings();

      // Restore systems
      if (saveData.stats) {
        this.stats.importState(saveData.stats);
      }
      if (saveData.time) {
        this.time.importState(saveData.time);
      }
      if (saveData.modifiers) {
        this.modifiers.importState(saveData.modifiers);
      }

      console.log('Game loaded successfully');
      return true;
    } catch (error) {
      console.error('Failed to load game:', error);
      return false;
    }
  }

  /**
   * Check if save exists
   */
  hasSavedGame(): boolean {
    return localStorage.getItem(StateManager.STORAGE_KEY) !== null;
  }

  /**
   * Delete saved game
   */
  deleteSave(): void {
    localStorage.removeItem(StateManager.STORAGE_KEY);
  }

  /**
   * Reset to new game state
   */
  resetGame(): void {
    this.player = this.getDefaultPlayerState();
    this.progress = this.getDefaultProgressState();
    this.relationships = this.getDefaultRelationshipState();
    this.settings = this.getDefaultSettings();

    // Reset systems
    this.stats.importState({ stats: {}, history: [] });
    this.time.importState({
      hour: 9,
      minute: 0,
      dayOfWeek: 'Sunday',
      dayNumber: 0,
      timeScale: 1,
    });
    this.modifiers.clearAll();

    this.deleteSave();
  }

  /**
   * Auto-save at key moments
   */
  autoSave(): void {
    this.saveGame();
  }

  /**
   * Default player state
   */
  private getDefaultPlayerState(): PlayerState {
    return {
      name: 'Player',
      species: 'cat',
      currentMask: 'none',
      currentLocation: 'home',
      money: 0,
    };
  }

  /**
   * Default progress state
   */
  private getDefaultProgressState(): ProgressState {
    return {
      currentDay: 0,
      completedTasks: [],
      completedEvents: [],
      decisions: {},
      unlockedContent: [],
    };
  }

  /**
   * Default relationship state
   */
  private getDefaultRelationshipState(): RelationshipState {
    return {
      npcs: {},
    };
  }

  /**
   * Default settings
   */
  private getDefaultSettings(): SaveData['settings'] {
    return {
      tutorialCompleted: false,
      audioVolume: 0.7,
      sfxVolume: 0.8,
      cvdMode: false,
    };
  }

  /**
   * Export entire state for debugging
   */
  exportDebugState(): any {
    return {
      player: this.player,
      stats: this.stats.getAllStats(),
      time: this.time.getTime(),
      progress: this.progress,
      relationships: this.relationships,
      settings: this.settings,
    };
  }
}
