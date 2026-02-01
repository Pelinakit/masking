/**
 * RelationshipManager
 * Tracks cumulative NPC relationship states across days
 */

export interface RelationshipState {
  npcId: string;
  value: number;      // Current relationship value
  min: number;        // Minimum possible value
  max: number;        // Maximum possible value
  history: RelationshipChange[];
}

export interface RelationshipChange {
  day: number;        // Which day this happened
  delta: number;      // How much it changed
  reason: string;     // Why it changed
  timestamp: string;  // When it happened
}

export class RelationshipManager {
  private relationships: Map<string, RelationshipState> = new Map();
  private currentDay: number = 1;

  /**
   * Initialize a relationship with default values
   */
  initializeRelationship(
    npcId: string,
    initialValue: number = 50,
    min: number = 0,
    max: number = 100
  ): void {
    if (!this.relationships.has(npcId)) {
      this.relationships.set(npcId, {
        npcId,
        value: initialValue,
        min,
        max,
        history: [],
      });
    }
  }

  /**
   * Get current relationship value for an NPC
   */
  getRelationship(npcId: string): number {
    this.ensureRelationshipExists(npcId);
    return this.relationships.get(npcId)!.value;
  }

  /**
   * Get full relationship state for an NPC
   */
  getRelationshipState(npcId: string): RelationshipState | null {
    return this.relationships.get(npcId) || null;
  }

  /**
   * Modify relationship by a delta value
   */
  modifyRelationship(npcId: string, delta: number, reason: string): void {
    this.ensureRelationshipExists(npcId);

    const state = this.relationships.get(npcId)!;
    const oldValue = state.value;

    // Apply delta and clamp to min/max
    state.value = Math.max(state.min, Math.min(state.max, state.value + delta));

    // Record the change
    if (delta !== 0) {
      state.history.push({
        day: this.currentDay,
        delta,
        reason,
        timestamp: new Date().toISOString(),
      });

      // Log significant changes
      if (Math.abs(delta) >= 10) {
        console.log(`Relationship with ${npcId} ${delta > 0 ? 'increased' : 'decreased'} by ${Math.abs(delta)}: ${reason}`);
      }
    }
  }

  /**
   * Set relationship to a specific value
   */
  setRelationship(npcId: string, value: number, reason: string): void {
    this.ensureRelationshipExists(npcId);

    const state = this.relationships.get(npcId)!;
    const delta = value - state.value;

    if (delta !== 0) {
      this.modifyRelationship(npcId, delta, reason);
    }
  }

  /**
   * Get relationship tier/description
   */
  getRelationshipTier(npcId: string): string {
    const value = this.getRelationship(npcId);

    if (value >= 80) return 'Close Friend';
    if (value >= 60) return 'Friendly';
    if (value >= 40) return 'Acquaintance';
    if (value >= 20) return 'Distant';
    return 'Hostile';
  }

  /**
   * Get all relationships
   */
  getAllRelationships(): Map<string, RelationshipState> {
    return new Map(this.relationships);
  }

  /**
   * Get relationship history for an NPC
   */
  getHistory(npcId: string): RelationshipChange[] {
    const state = this.relationships.get(npcId);
    return state ? [...state.history] : [];
  }

  /**
   * Get changes from a specific day
   */
  getChangesFromDay(day: number): Map<string, RelationshipChange[]> {
    const changes = new Map<string, RelationshipChange[]>();

    this.relationships.forEach((state, npcId) => {
      const dayChanges = state.history.filter(change => change.day === day);
      if (dayChanges.length > 0) {
        changes.set(npcId, dayChanges);
      }
    });

    return changes;
  }

  /**
   * Get total change for an NPC across all days
   */
  getTotalChange(npcId: string): number {
    const state = this.relationships.get(npcId);
    if (!state) return 0;

    return state.history.reduce((total, change) => total + change.delta, 0);
  }

  /**
   * Get total change for an NPC on a specific day
   */
  getDayChange(npcId: string, day: number): number {
    const state = this.relationships.get(npcId);
    if (!state) return 0;

    return state.history
      .filter(change => change.day === day)
      .reduce((total, change) => total + change.delta, 0);
  }

  /**
   * Set current day (for tracking when changes happen)
   */
  setCurrentDay(day: number): void {
    this.currentDay = day;
  }

  /**
   * Get current day
   */
  getCurrentDay(): number {
    return this.currentDay;
  }

  /**
   * Clear relationship history (keep current values)
   */
  clearHistory(npcId?: string): void {
    if (npcId) {
      const state = this.relationships.get(npcId);
      if (state) {
        state.history = [];
      }
    } else {
      this.relationships.forEach(state => {
        state.history = [];
      });
    }
  }

  /**
   * Reset a relationship to initial state
   */
  resetRelationship(npcId: string, initialValue: number = 50): void {
    const state = this.relationships.get(npcId);
    if (state) {
      state.value = initialValue;
      state.history = [];
    }
  }

  /**
   * Reset all relationships
   */
  resetAll(initialValue: number = 50): void {
    this.relationships.forEach((state, npcId) => {
      this.resetRelationship(npcId, initialValue);
    });
  }

  /**
   * Ensure a relationship exists (create with defaults if not)
   */
  private ensureRelationshipExists(npcId: string): void {
    if (!this.relationships.has(npcId)) {
      this.initializeRelationship(npcId);
    }
  }

  /**
   * Export state for saving
   */
  exportState(): any {
    const relationships: any = {};

    this.relationships.forEach((state, npcId) => {
      relationships[npcId] = {
        value: state.value,
        min: state.min,
        max: state.max,
        history: state.history,
      };
    });

    return {
      relationships,
      currentDay: this.currentDay,
    };
  }

  /**
   * Import state from save data
   */
  importState(data: any): void {
    if (!data) return;

    this.relationships.clear();
    this.currentDay = data.currentDay || 1;

    if (data.relationships) {
      Object.entries(data.relationships).forEach(([npcId, stateData]: [string, any]) => {
        this.relationships.set(npcId, {
          npcId,
          value: stateData.value,
          min: stateData.min,
          max: stateData.max,
          history: stateData.history || [],
        });
      });
    }
  }

  /**
   * Get a summary of all relationships
   */
  getSummary(): string[] {
    const summary: string[] = [];

    this.relationships.forEach((state, npcId) => {
      const tier = this.getRelationshipTier(npcId);
      const total = this.getTotalChange(npcId);
      const trend = total > 0 ? '↑' : total < 0 ? '↓' : '→';

      summary.push(`${npcId}: ${state.value} (${tier}) ${trend}`);
    });

    return summary;
  }
}

// Export singleton instance
export const relationshipManager = new RelationshipManager();
