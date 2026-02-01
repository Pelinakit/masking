/**
 * ScriptInterpreter
 * Script Interpretation layer - executes YAML scripts and applies effects
 * Enhanced with comprehensive condition evaluation (E10)
 */

import { StateManager } from '@game/StateManager';
import { Effect, DialogueNode, Choice } from './YAMLParser';

export type ConditionEvaluator = (condition: string, state: StateManager) => boolean;

export class ScriptInterpreter {
  private conditionEvaluator?: ConditionEvaluator;

  /**
   * Set custom condition evaluator
   * Conditions are string expressions like "stats.energy > 50"
   */
  setConditionEvaluator(evaluator: ConditionEvaluator): void {
    this.conditionEvaluator = evaluator;
  }

  /**
   * Execute an effect on the game state
   */
  executeEffect(effect: Effect, state: StateManager): void {
    switch (effect.type) {
      case 'stat':
        this.executeStatEffect(effect, state);
        break;

      case 'relationship':
        this.executeRelationshipEffect(effect, state);
        break;

      case 'item':
        this.executeItemEffect(effect, state);
        break;

      case 'unlock':
        this.executeUnlockEffect(effect, state);
        break;

      case 'scene':
        this.executeSceneEffect(effect, state);
        break;

      case 'time':
        this.executeTimeEffect(effect, state);
        break;

      default:
        console.warn('Unknown effect type:', effect);
    }
  }

  /**
   * Execute multiple effects in sequence
   */
  executeEffects(effects: Effect[], state: StateManager): void {
    effects.forEach(effect => this.executeEffect(effect, state));
  }

  /**
   * Evaluate a condition string
   * Returns true if condition is met or no condition specified
   */
  evaluateCondition(condition: string | undefined, state: StateManager): boolean {
    if (!condition) return true;

    if (this.conditionEvaluator) {
      return this.conditionEvaluator(condition, state);
    }

    // Enhanced built-in evaluator
    return this.enhancedConditionEvaluator(condition, state);
  }

  /**
   * Filter choices by available conditions
   */
  filterChoices(choices: Choice[], state: StateManager): Choice[] {
    return choices.filter(choice => this.evaluateCondition(choice.condition, state));
  }

  /**
   * Check if dialogue node should be displayed
   */
  canShowDialogue(node: DialogueNode, state: StateManager): boolean {
    return this.evaluateCondition(node.condition, state);
  }

  /**
   * Execute stat effect
   */
  private executeStatEffect(effect: Effect, state: StateManager): void {
    if (!effect.stat || effect.delta === undefined) {
      console.warn('Stat effect missing stat or delta:', effect);
      return;
    }

    state.stats.modifyStat(effect.stat, effect.delta);
  }

  /**
   * Execute relationship effect
   */
  private executeRelationshipEffect(effect: Effect, state: StateManager): void {
    if (!effect.target || effect.delta === undefined) {
      console.warn('Relationship effect missing target or delta:', effect);
      return;
    }

    state.modifyRelationship(effect.target, effect.delta);
  }

  /**
   * Execute item effect (placeholder - implement when inventory system added)
   */
  private executeItemEffect(effect: Effect, state: StateManager): void {
    console.log('Item effect:', effect);
    // TODO: Implement when inventory system is added
  }

  /**
   * Execute unlock effect
   */
  private executeUnlockEffect(effect: Effect, state: StateManager): void {
    if (!effect.target) {
      console.warn('Unlock effect missing target:', effect);
      return;
    }

    state.unlockContent(effect.target);
  }

  /**
   * Execute scene transition effect
   */
  private executeSceneEffect(effect: Effect, state: StateManager): void {
    if (!effect.target) {
      console.warn('Scene effect missing target:', effect);
      return;
    }

    // Store scene transition request (actual transition handled by game engine)
    state.recordDecision('_nextScene', effect.target);
  }

  /**
   * Execute time effect
   */
  private executeTimeEffect(effect: Effect, state: StateManager): void {
    if (effect.value === undefined) {
      console.warn('Time effect missing value:', effect);
      return;
    }

    const hours = typeof effect.value === 'number' ? effect.value : parseFloat(effect.value);
    if (!isNaN(hours)) {
      state.time.skipHours(hours);
    }
  }

  /**
   * Enhanced condition evaluator (E10)
   * Supports:
   * - Basic stats: "energy > 50", "stress < 70"
   * - Relationships: "relationship.boss > 60"
   * - Time checks: 'time > "09:00"', 'time < "17:00"'
   * - Task completion: "tasks.complete", "tasks.high_priority.complete"
   * - Day/week: 'day == "Monday"', "week == 1"
   * - Unlocks: "unlocked.area2"
   * - Decisions: "decision.choice1 == yes"
   */
  private enhancedConditionEvaluator(condition: string, state: StateManager): boolean {
    try {
      // Handle time conditions
      if (condition.includes('time')) {
        return this.evaluateTimeCondition(condition, state);
      }

      // Handle task conditions
      if (condition.includes('tasks')) {
        return this.evaluateTaskCondition(condition, state);
      }

      // Handle day/week conditions
      if (condition.includes('day ==') || condition.includes('day !=')) {
        return this.evaluateDayCondition(condition, state);
      }

      if (condition.includes('week')) {
        return this.evaluateWeekCondition(condition, state);
      }

      // Handle dot-notation conditions
      if (condition.includes('.')) {
        const [category, rest] = condition.split('.');

        if (category === 'relationship') {
          return this.evaluateRelationshipCondition(rest, state);
        }

        if (category === 'unlocked') {
          return state.isUnlocked(rest);
        }

        if (category === 'decision') {
          return this.evaluateDecisionCondition(rest, state);
        }
      }

      // Handle simple stat checks
      return this.evaluateStatCondition(condition, state);
    } catch (error) {
      console.warn('Condition evaluation error:', condition, error);
      return false;
    }
  }

  /**
   * Evaluate time condition like 'time > "09:00"' or 'time < "17:00"'
   */
  private evaluateTimeCondition(condition: string, state: StateManager): boolean {
    const match = condition.match(/time\s*([><=]+)\s*"(\d{2}:\d{2})"/);
    if (!match) return false;

    const [, operator, timeStr] = match;
    const currentTime = state.time.getCurrentTimeString(); // e.g., "09:30"
    const [currentHour, currentMin] = currentTime.split(':').map(Number);
    const [compareHour, compareMin] = timeStr.split(':').map(Number);

    const currentMinutes = currentHour * 60 + currentMin;
    const compareMinutes = compareHour * 60 + compareMin;

    switch (operator) {
      case '>': return currentMinutes > compareMinutes;
      case '<': return currentMinutes < compareMinutes;
      case '>=': return currentMinutes >= compareMinutes;
      case '<=': return currentMinutes <= compareMinutes;
      case '==': return currentMinutes === compareMinutes;
      case '!=': return currentMinutes !== compareMinutes;
      default: return false;
    }
  }

  /**
   * Evaluate task condition like "tasks.complete" or "tasks.high_priority.complete"
   */
  private evaluateTaskCondition(condition: string, state: StateManager): boolean {
    // Check for simple "tasks.complete" (all tasks complete)
    if (condition === 'tasks.complete') {
      // Assume StateManager has a method to check all tasks
      // For now, return false as placeholder
      return false; // TODO: Implement when task system is fully integrated
    }

    // Check for specific task: "tasks.high_priority.complete"
    const match = condition.match(/tasks\.(\w+)\.complete/);
    if (match) {
      const [, taskId] = match;
      // Check if specific task is complete
      // For now, return false as placeholder
      return false; // TODO: Implement when task system is fully integrated
    }

    return false;
  }

  /**
   * Evaluate day condition like 'day == "Monday"' or 'day != "Friday"'
   */
  private evaluateDayCondition(condition: string, state: StateManager): boolean {
    const match = condition.match(/day\s*([=!]+)\s*"(\w+)"/);
    if (!match) return false;

    const [, operator, dayName] = match;
    const currentDay = state.time.getCurrentDay(); // e.g., "Monday"

    if (operator === '==') {
      return currentDay === dayName;
    } else if (operator === '!=') {
      return currentDay !== dayName;
    }

    return false;
  }

  /**
   * Evaluate week condition like "week == 1" or "week > 2"
   */
  private evaluateWeekCondition(condition: string, state: StateManager): boolean {
    const match = condition.match(/week\s*([><=]+)\s*(\d+)/);
    if (!match) return false;

    const [, operator, weekStr] = match;
    const currentWeek = state.time.getCurrentWeek();
    const compareWeek = parseInt(weekStr, 10);

    switch (operator) {
      case '>': return currentWeek > compareWeek;
      case '<': return currentWeek < compareWeek;
      case '>=': return currentWeek >= compareWeek;
      case '<=': return currentWeek <= compareWeek;
      case '==': return currentWeek === compareWeek;
      case '!=': return currentWeek !== compareWeek;
      default: return false;
    }
  }

  /**
   * Evaluate stat condition like "energy > 50"
   */
  private evaluateStatCondition(condition: string, state: StateManager): boolean {
    const match = condition.match(/(\w+)\s*([><=]+)\s*(\d+)/);
    if (!match) return false;

    const [, stat, operator, valueStr] = match;
    const statValue = state.stats.getStat(stat as any);
    const compareValue = parseInt(valueStr, 10);

    switch (operator) {
      case '>': return statValue > compareValue;
      case '<': return statValue < compareValue;
      case '>=': return statValue >= compareValue;
      case '<=': return statValue <= compareValue;
      case '==': return statValue === compareValue;
      case '!=': return statValue !== compareValue;
      default: return false;
    }
  }

  /**
   * Evaluate relationship condition like "boss > 60"
   */
  private evaluateRelationshipCondition(condition: string, state: StateManager): boolean {
    const match = condition.match(/(\w+)\s*([><=]+)\s*(\d+)/);
    if (!match) return false;

    const [, npcId, operator, valueStr] = match;
    const relationship = state.getRelationship(npcId);
    const compareValue = parseInt(valueStr, 10);

    switch (operator) {
      case '>': return relationship > compareValue;
      case '<': return relationship < compareValue;
      case '>=': return relationship >= compareValue;
      case '<=': return relationship <= compareValue;
      case '==': return relationship === compareValue;
      case '!=': return relationship !== compareValue;
      default: return false;
    }
  }

  /**
   * Evaluate decision condition like "choice1 == yes"
   */
  private evaluateDecisionCondition(condition: string, state: StateManager): boolean {
    const match = condition.match(/(\w+)\s*([=!]+)\s*(\w+)/);
    if (!match) return false;

    const [, key, operator, value] = match;
    const decision = state.getDecision(key);

    if (operator === '==') {
      return decision === value;
    } else if (operator === '!=') {
      return decision !== value;
    }

    return false;
  }
}

/**
 * Singleton instance for convenience
 */
export const scriptInterpreter = new ScriptInterpreter();
