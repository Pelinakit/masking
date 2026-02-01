/**
 * EffectExecutor
 * Unified effect execution system for all game systems (E11)
 * Centralizes stat changes, relationship updates, unlocks, and flags
 */

import { StateManager } from '@game/StateManager';
import type { Effect } from './types/ScenarioTypes';

export class EffectExecutor {
  /**
   * Execute a single effect
   */
  execute(effect: Effect, state: StateManager): void {
    switch (effect.type) {
      case 'stat':
        this.executeStatEffect(effect, state);
        break;

      case 'relationship':
        this.executeRelationshipEffect(effect, state);
        break;

      case 'unlock':
        this.executeUnlockEffect(effect, state);
        break;

      case 'flag':
        this.executeFlagEffect(effect, state);
        break;

      case 'time':
        this.executeTimeEffect(effect, state);
        break;

      case 'scene':
        this.executeSceneEffect(effect, state);
        break;

      default:
        console.warn('Unknown effect type:', effect.type);
    }
  }

  /**
   * Execute multiple effects in sequence
   */
  executeAll(effects: Effect[], state: StateManager): void {
    effects.forEach(effect => this.execute(effect, state));
  }

  /**
   * Execute stat effect
   * Handles: energy, stress, hunger, happiness, socialAnxiety
   */
  private executeStatEffect(effect: Effect, state: StateManager): void {
    if (!effect.stat) {
      console.warn('Stat effect missing stat property:', effect);
      return;
    }

    const value = effect.value ?? effect.delta ?? 0;

    if (typeof value !== 'number') {
      console.warn('Stat effect value must be a number:', effect);
      return;
    }

    // Apply stat change
    state.stats.modifyStat(effect.stat as any, value);

    console.log(`Applied stat effect: ${effect.stat} ${value > 0 ? '+' : ''}${value}`);
  }

  /**
   * Execute relationship effect
   * Modifies relationship value with NPCs
   */
  private executeRelationshipEffect(effect: Effect, state: StateManager): void {
    if (!effect.target) {
      console.warn('Relationship effect missing target:', effect);
      return;
    }

    const value = effect.value ?? effect.delta ?? 0;

    if (typeof value !== 'number') {
      console.warn('Relationship effect value must be a number:', effect);
      return;
    }

    // Apply relationship change
    state.relationships.modifyRelationship(effect.target, value);

    console.log(`Applied relationship effect: ${effect.target} ${value > 0 ? '+' : ''}${value}`);
  }

  /**
   * Execute unlock effect
   * Unlocks content, areas, or features
   */
  private executeUnlockEffect(effect: Effect, state: StateManager): void {
    if (!effect.target) {
      console.warn('Unlock effect missing target:', effect);
      return;
    }

    state.unlockContent(effect.target);

    console.log(`Unlocked: ${effect.target}`);
  }

  /**
   * Execute flag effect
   * Sets or clears dialogue/story flags for branching
   */
  private executeFlagEffect(effect: Effect, state: StateManager): void {
    if (!effect.target) {
      console.warn('Flag effect missing target:', effect);
      return;
    }

    const flagName = effect.target;
    const flagValue = effect.value ?? true;

    // Set flag
    state.recordDecision(flagName, String(flagValue));

    console.log(`Set flag: ${flagName} = ${flagValue}`);
  }

  /**
   * Execute time effect
   * Advances game time by hours/minutes
   */
  private executeTimeEffect(effect: Effect, state: StateManager): void {
    const value = effect.value;

    if (typeof value !== 'number') {
      console.warn('Time effect value must be a number (hours):', effect);
      return;
    }

    state.time.skipHours(value);

    console.log(`Advanced time by ${value} hours`);
  }

  /**
   * Execute scene effect
   * Triggers scene transitions
   */
  private executeSceneEffect(effect: Effect, state: StateManager): void {
    if (!effect.target) {
      console.warn('Scene effect missing target:', effect);
      return;
    }

    // Store scene transition request
    state.recordDecision('_nextScene', effect.target);

    console.log(`Queued scene transition to: ${effect.target}`);
  }

  /**
   * Calculate total energy cost from effects
   */
  calculateEnergyCost(effects: Effect[]): number {
    return effects
      .filter(e => e.type === 'stat' && e.stat === 'energy')
      .reduce((total, e) => total + (e.value ?? e.delta ?? 0), 0);
  }

  /**
   * Calculate total stress gain from effects
   */
  calculateStressGain(effects: Effect[]): number {
    return effects
      .filter(e => e.type === 'stat' && e.stat === 'stress')
      .reduce((total, e) => total + (e.value ?? e.delta ?? 0), 0);
  }

  /**
   * Get all relationship changes from effects
   */
  getRelationshipChanges(effects: Effect[]): Map<string, number> {
    const changes = new Map<string, number>();

    effects
      .filter(e => e.type === 'relationship' && e.target)
      .forEach(e => {
        const current = changes.get(e.target!) ?? 0;
        changes.set(e.target!, current + (e.value ?? e.delta ?? 0));
      });

    return changes;
  }

  /**
   * Preview effects without applying them
   * Returns a summary of what would happen
   */
  preview(effects: Effect[]): {
    energy: number;
    stress: number;
    relationships: Map<string, number>;
    unlocks: string[];
    flags: string[];
  } {
    const preview = {
      energy: this.calculateEnergyCost(effects),
      stress: this.calculateStressGain(effects),
      relationships: this.getRelationshipChanges(effects),
      unlocks: effects.filter(e => e.type === 'unlock' && e.target).map(e => e.target!),
      flags: effects.filter(e => e.type === 'flag' && e.target).map(e => e.target!),
    };

    return preview;
  }
}

/**
 * Singleton instance for global use
 */
export const effectExecutor = new EffectExecutor();
