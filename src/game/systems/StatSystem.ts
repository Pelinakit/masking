/**
 * StatSystem
 * Game Logic layer - manages player stats with decay/recovery
 */

export interface Stat {
  current: number;
  max: number;
  decayRate: number;    // Points per game hour
  recoveryRate: number; // Points per game hour (when recovering)
  min: number;
}

export type StatName = 'energy' | 'stress' | 'hunger' | 'happiness' | 'socialAnxiety';

export interface StatChange {
  stat: StatName;
  previous: number;
  current: number;
  delta: number;
  timestamp: number;
}

export class StatSystem {
  private stats: Map<StatName, Stat>;
  private history: StatChange[] = [];
  private readonly MAX_HISTORY = 100;

  constructor() {
    this.stats = new Map([
      ['energy', {
        current: 100,
        max: 100,
        decayRate: 5,      // Drains during activities
        recoveryRate: 20,  // Sleep recovery
        min: 0,
      }],
      ['stress', {
        current: 0,
        max: 100,
        decayRate: -2,     // Naturally decreases slowly
        recoveryRate: -10, // Activities reduce stress
        min: 0,
      }],
      ['hunger', {
        current: 0,
        max: 100,
        decayRate: 3,      // Increases over time
        recoveryRate: -30, // Eating recovery
        min: 0,
      }],
      ['happiness', {
        current: 60,
        max: 100,
        decayRate: -1,     // Slowly decreases
        recoveryRate: 15,  // Fun activities increase
        min: 0,
      }],
      ['socialAnxiety', {
        current: 20,
        max: 100,
        decayRate: -1,     // Slowly decreases when alone
        recoveryRate: 10,  // Increases in social situations
        min: 0,
      }],
    ]);
  }

  /**
   * Get current value of a stat
   */
  getStat(name: StatName): number {
    return this.stats.get(name)?.current ?? 0;
  }

  /**
   * Get full stat data
   */
  getStatData(name: StatName): Stat | undefined {
    return this.stats.get(name);
  }

  /**
   * Get all stats as a plain object
   */
  getAllStats(): Record<StatName, number> {
    return {
      energy: this.getStat('energy'),
      stress: this.getStat('stress'),
      hunger: this.getStat('hunger'),
      happiness: this.getStat('happiness'),
      socialAnxiety: this.getStat('socialAnxiety'),
    };
  }

  /**
   * Modify a stat by delta amount (clamped to min/max)
   */
  modifyStat(name: StatName, delta: number, recordHistory: boolean = true): void {
    const stat = this.stats.get(name);
    if (!stat) return;

    const previous = stat.current;
    stat.current = this.clamp(stat.current + delta, stat.min, stat.max);

    if (recordHistory && delta !== 0) {
      this.recordChange(name, previous, stat.current, delta);
    }
  }

  /**
   * Set a stat to a specific value (clamped to min/max)
   */
  setStat(name: StatName, value: number, recordHistory: boolean = true): void {
    const stat = this.stats.get(name);
    if (!stat) return;

    const previous = stat.current;
    stat.current = this.clamp(value, stat.min, stat.max);

    if (recordHistory && previous !== stat.current) {
      this.recordChange(name, previous, stat.current, stat.current - previous);
    }
  }

  /**
   * Apply time-based decay to all stats
   * @param gameHours - Number of game hours elapsed
   */
  applyDecay(gameHours: number): void {
    this.stats.forEach((stat, name) => {
      const decay = stat.decayRate * gameHours;
      if (decay !== 0) {
        this.modifyStat(name, decay, false);
      }
    });
  }

  /**
   * Apply recovery effects to a specific stat
   * @param name - Stat to recover
   * @param gameHours - Duration of recovery in game hours
   */
  applyRecovery(name: StatName, gameHours: number): void {
    const stat = this.stats.get(name);
    if (!stat) return;

    const recovery = stat.recoveryRate * gameHours;
    if (recovery !== 0) {
      this.modifyStat(name, recovery, true);
    }
  }

  /**
   * Get recent stat history
   */
  getHistory(limit?: number): StatChange[] {
    if (limit) {
      return this.history.slice(-limit);
    }
    return [...this.history];
  }

  /**
   * Clear stat history
   */
  clearHistory(): void {
    this.history = [];
  }

  /**
   * Export state for saving
   */
  exportState(): any {
    const statsObj: any = {};
    this.stats.forEach((stat, name) => {
      statsObj[name] = {
        current: stat.current,
        max: stat.max,
        decayRate: stat.decayRate,
        recoveryRate: stat.recoveryRate,
        min: stat.min,
      };
    });

    return {
      stats: statsObj,
      history: this.history.slice(-20), // Keep last 20 changes
    };
  }

  /**
   * Import state from save data
   */
  importState(data: any): void {
    if (!data || !data.stats) return;

    Object.entries(data.stats).forEach(([name, statData]: [string, any]) => {
      const stat = this.stats.get(name as StatName);
      if (stat && statData) {
        stat.current = statData.current ?? stat.current;
        stat.max = statData.max ?? stat.max;
        stat.decayRate = statData.decayRate ?? stat.decayRate;
        stat.recoveryRate = statData.recoveryRate ?? stat.recoveryRate;
        stat.min = statData.min ?? stat.min;
      }
    });

    if (data.history) {
      this.history = data.history;
    }
  }

  /**
   * Record a stat change in history
   */
  private recordChange(stat: StatName, previous: number, current: number, delta: number): void {
    this.history.push({
      stat,
      previous,
      current,
      delta,
      timestamp: Date.now(),
    });

    // Trim history if too long
    if (this.history.length > this.MAX_HISTORY) {
      this.history = this.history.slice(-this.MAX_HISTORY);
    }
  }

  /**
   * Clamp value between min and max
   */
  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }

  /**
   * Check if any stat is in critical state
   */
  isCriticalState(): boolean {
    return (
      this.getStat('energy') < 10 ||
      this.getStat('stress') > 90 ||
      this.getStat('hunger') > 90
    );
  }

  /**
   * Get warning stats (low energy, high stress/hunger)
   */
  getWarningStats(): StatName[] {
    const warnings: StatName[] = [];

    if (this.getStat('energy') < 20) warnings.push('energy');
    if (this.getStat('stress') > 75) warnings.push('stress');
    if (this.getStat('hunger') > 75) warnings.push('hunger');
    if (this.getStat('happiness') < 20) warnings.push('happiness');
    if (this.getStat('socialAnxiety') > 75) warnings.push('socialAnxiety');

    return warnings;
  }
}
