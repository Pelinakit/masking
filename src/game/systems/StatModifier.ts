/**
 * StatModifier
 * Game Logic layer - defines and applies stat modifications
 */

import { StatSystem, type StatName } from './StatSystem';

export type ModifierType = 'instant' | 'duration' | 'decay' | 'recovery';

export interface StatModifierDefinition {
  type: ModifierType;
  stat: StatName;
  value: number;
  duration?: number;    // Game hours (for duration modifiers)
  tickRate?: number;    // How often to apply (for duration modifiers)
  id?: string;          // Optional identifier for removal
}

export interface ActiveModifier extends StatModifierDefinition {
  id: string;
  startTime: number;    // Timestamp when applied
  lastTick: number;     // Last time the modifier was applied
}

export class StatModifier {
  private activeModifiers: Map<string, ActiveModifier> = new Map();
  private nextId: number = 1;

  /**
   * Apply a stat modifier
   * Returns modifier ID for duration modifiers (can be used to remove early)
   */
  apply(statSystem: StatSystem, modifier: StatModifierDefinition): string | null {
    switch (modifier.type) {
      case 'instant':
        this.applyInstant(statSystem, modifier);
        return null;

      case 'duration':
        return this.applyDuration(statSystem, modifier);

      case 'decay':
        this.applyDecay(statSystem, modifier);
        return null;

      case 'recovery':
        this.applyRecovery(statSystem, modifier);
        return null;

      default:
        console.warn('Unknown modifier type:', modifier);
        return null;
    }
  }

  /**
   * Update all active duration modifiers
   * Call this regularly (e.g., every update frame)
   */
  update(statSystem: StatSystem, deltaMs: number): void {
    const now = Date.now();
    const expiredIds: string[] = [];

    this.activeModifiers.forEach((modifier, id) => {
      const elapsed = (now - modifier.startTime) / 1000; // Convert to seconds
      const gameHoursElapsed = elapsed / 3600; // Assuming 1 real second = 1 game second

      // Check if duration expired
      if (modifier.duration && gameHoursElapsed >= modifier.duration) {
        expiredIds.push(id);
        return;
      }

      // Apply tick if enough time has passed
      const tickRate = modifier.tickRate ?? 1; // Default 1 hour between ticks
      const timeSinceLastTick = (now - modifier.lastTick) / 1000 / 3600;

      if (timeSinceLastTick >= tickRate) {
        statSystem.modifyStat(modifier.stat, modifier.value);
        modifier.lastTick = now;
      }
    });

    // Remove expired modifiers
    expiredIds.forEach(id => this.activeModifiers.delete(id));
  }

  /**
   * Remove an active modifier by ID
   */
  remove(id: string): boolean {
    return this.activeModifiers.delete(id);
  }

  /**
   * Remove all active modifiers for a specific stat
   */
  removeAllForStat(stat: StatName): void {
    const toRemove: string[] = [];
    this.activeModifiers.forEach((modifier, id) => {
      if (modifier.stat === stat) {
        toRemove.push(id);
      }
    });
    toRemove.forEach(id => this.activeModifiers.delete(id));
  }

  /**
   * Clear all active modifiers
   */
  clearAll(): void {
    this.activeModifiers.clear();
  }

  /**
   * Get all active modifiers
   */
  getActive(): ActiveModifier[] {
    return Array.from(this.activeModifiers.values());
  }

  /**
   * Apply instant modifier (one-time change)
   */
  private applyInstant(statSystem: StatSystem, modifier: StatModifierDefinition): void {
    statSystem.modifyStat(modifier.stat, modifier.value);
  }

  /**
   * Apply duration modifier (effect over time)
   */
  private applyDuration(statSystem: StatSystem, modifier: StatModifierDefinition): string {
    const id = modifier.id ?? this.generateId();
    const now = Date.now();

    const activeModifier: ActiveModifier = {
      ...modifier,
      id,
      startTime: now,
      lastTick: now,
      type: 'duration',
    };

    this.activeModifiers.set(id, activeModifier);
    return id;
  }

  /**
   * Apply decay modifier (uses stat's decay rate)
   */
  private applyDecay(statSystem: StatSystem, modifier: StatModifierDefinition): void {
    const gameHours = modifier.value;
    statSystem.applyDecay(gameHours);
  }

  /**
   * Apply recovery modifier (uses stat's recovery rate)
   */
  private applyRecovery(statSystem: StatSystem, modifier: StatModifierDefinition): void {
    const gameHours = modifier.value;
    statSystem.applyRecovery(modifier.stat, gameHours);
  }

  /**
   * Generate unique modifier ID
   */
  private generateId(): string {
    return `modifier-${this.nextId++}`;
  }

  /**
   * Export state for saving
   */
  exportState(): any {
    const modifiers: any[] = [];
    this.activeModifiers.forEach(modifier => {
      modifiers.push({
        ...modifier,
        startTime: modifier.startTime,
        lastTick: modifier.lastTick,
      });
    });

    return {
      modifiers,
      nextId: this.nextId,
    };
  }

  /**
   * Import state from save data
   */
  importState(data: any): void {
    if (!data) return;

    this.activeModifiers.clear();

    if (data.modifiers) {
      data.modifiers.forEach((mod: ActiveModifier) => {
        this.activeModifiers.set(mod.id, mod);
      });
    }

    if (data.nextId) {
      this.nextId = data.nextId;
    }
  }
}

/**
 * Common modifier presets
 */
export const ModifierPresets = {
  // Sleep recovery
  sleep: (hours: number): StatModifierDefinition => ({
    type: 'recovery',
    stat: 'energy',
    value: hours,
  }),

  // Eating
  eatMeal: (): StatModifierDefinition => ({
    type: 'instant',
    stat: 'hunger',
    value: -40, // Reduce hunger by 40
  }),

  eatSnack: (): StatModifierDefinition => ({
    type: 'instant',
    stat: 'hunger',
    value: -20,
  }),

  // Stress reduction
  relax: (hours: number): StatModifierDefinition => ({
    type: 'recovery',
    stat: 'stress',
    value: hours,
  }),

  // Meeting stress
  meetingStress: (duration: number): StatModifierDefinition => ({
    type: 'duration',
    stat: 'stress',
    value: 5, // +5 stress per tick
    duration,
    tickRate: 0.25, // Every 15 minutes
  }),

  // Masking energy cost
  maskingCost: (duration: number, intensity: number): StatModifierDefinition => ({
    type: 'duration',
    stat: 'energy',
    value: -intensity, // Negative = drain
    duration,
    tickRate: 0.1, // Every 6 minutes
  }),

  // Social anxiety
  socialInteraction: (duration: number): StatModifierDefinition => ({
    type: 'duration',
    stat: 'socialAnxiety',
    value: 3,
    duration,
    tickRate: 0.25,
  }),

  // Fun activity
  playGame: (hours: number): StatModifierDefinition => ({
    type: 'recovery',
    stat: 'happiness',
    value: hours,
  }),
};
