/**
 * ScenarioLoader
 * Loads and parses day scenario YAML files
 */

import { parse } from 'yaml';
import type { DayScenario, ScenarioState } from './types/ScenarioTypes.js';

export class ScenarioLoader {
  private cache: Map<string, DayScenario> = new Map();
  private currentScenario: DayScenario | null = null;
  private currentState: ScenarioState | null = null;

  /**
   * Load a scenario from a file path
   */
  async loadScenario(filePath: string): Promise<DayScenario> {
    // Check cache first
    if (this.cache.has(filePath)) {
      return this.cache.get(filePath)!;
    }

    try {
      const response = await fetch(filePath);
      if (!response.ok) {
        throw new Error(`Failed to load scenario: ${response.statusText}`);
      }

      const yamlText = await response.text();
      const scenario = parse(yamlText) as DayScenario;

      // Validate basic structure
      this.validateScenario(scenario);

      // Cache it
      this.cache.set(filePath, scenario);

      return scenario;
    } catch (error) {
      console.error(`Error loading scenario from ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Load a scenario by day and week number
   */
  async loadScenarioByDay(day: string, week: number = 1): Promise<DayScenario> {
    const fileName = `week${week}-${day.toLowerCase()}.yaml`;
    const filePath = `/data/stories/scenarios/${fileName}`;
    return this.loadScenario(filePath);
  }

  /**
   * Start a new scenario
   */
  startScenario(scenario: DayScenario): ScenarioState {
    this.currentScenario = scenario;
    this.currentState = this.createInitialState(scenario);
    return this.currentState;
  }

  /**
   * Get current scenario
   */
  getCurrentScenario(): DayScenario | null {
    return this.currentScenario;
  }

  /**
   * Get current scenario state
   */
  getCurrentState(): ScenarioState | null {
    return this.currentState;
  }

  /**
   * Create initial state for a scenario
   */
  private createInitialState(scenario: DayScenario): ScenarioState {
    return {
      currentDay: scenario.metadata.day,
      currentWeek: scenario.metadata.week,
      startTime: new Date().toISOString(),
      emailsReceived: new Set(),
      emailsRead: new Set(),
      meetingsAttended: new Set(),
      meetingsSkipped: new Set(),
      tasksCompleted: new Set(),
      eventsTriggered: new Set(),
      choicesMade: new Map(),
      totalEnergySpent: 0,
      totalStressGained: 0,
      totalTimeTaken: 0,
    };
  }

  /**
   * Mark an email as received
   */
  receiveEmail(emailId: string): void {
    if (this.currentState) {
      this.currentState.emailsReceived.add(emailId);
    }
  }

  /**
   * Mark an email as read
   */
  readEmail(emailId: string): void {
    if (this.currentState) {
      this.currentState.emailsRead.add(emailId);
    }
  }

  /**
   * Mark a meeting as attended
   */
  attendMeeting(meetingId: string): void {
    if (this.currentState) {
      this.currentState.meetingsAttended.add(meetingId);
    }
  }

  /**
   * Mark a meeting as skipped
   */
  skipMeeting(meetingId: string): void {
    if (this.currentState) {
      this.currentState.meetingsSkipped.add(meetingId);
    }
  }

  /**
   * Mark a task as completed
   */
  completeTask(taskId: string): void {
    if (this.currentState) {
      this.currentState.tasksCompleted.add(taskId);
    }
  }

  /**
   * Trigger an event
   */
  triggerEvent(eventId: string): void {
    if (this.currentState) {
      this.currentState.eventsTriggered.add(eventId);
    }
  }

  /**
   * Record a choice made
   */
  recordChoice(contextId: string, choiceText: string): void {
    if (this.currentState) {
      this.currentState.choicesMade.set(contextId, choiceText);
    }
  }

  /**
   * Add to energy spent
   */
  addEnergySpent(amount: number): void {
    if (this.currentState) {
      this.currentState.totalEnergySpent += amount;
    }
  }

  /**
   * Add to stress gained
   */
  addStressGained(amount: number): void {
    if (this.currentState) {
      this.currentState.totalStressGained += amount;
    }
  }

  /**
   * Add to time taken
   */
  addTimeTaken(minutes: number): void {
    if (this.currentState) {
      this.currentState.totalTimeTaken += minutes;
    }
  }

  /**
   * Get emails scheduled for a specific time
   */
  getEmailsAtTime(time: string): any[] {
    if (!this.currentScenario) return [];

    return this.currentScenario.emails.filter(email => {
      return email.time === time && !this.currentState?.emailsReceived.has(email.id);
    });
  }

  /**
   * Get meetings scheduled for a specific time
   */
  getMeetingsAtTime(time: string): any[] {
    if (!this.currentScenario) return [];

    return this.currentScenario.meetings.filter(meeting => {
      return meeting.time === time;
    });
  }

  /**
   * Get events scheduled for a specific time
   */
  getEventsAtTime(time: string): any[] {
    if (!this.currentScenario) return [];

    return this.currentScenario.events.filter(event => {
      return event.time === time && !this.currentState?.eventsTriggered.has(event.id);
    });
  }

  /**
   * Get all incomplete tasks
   */
  getIncompleteTasks(): any[] {
    if (!this.currentScenario) return [];

    return this.currentScenario.tasks.filter(task => {
      return !this.currentState?.tasksCompleted.has(task.id);
    });
  }

  /**
   * Evaluate end of day conditions
   */
  evaluateEndOfDay(stats: any): {
    type: 'perfect' | 'success' | 'burnout' | 'normal';
    message: string;
    rewards?: any;
  } {
    if (!this.currentScenario) {
      return { type: 'normal', message: 'Day complete.' };
    }

    const config = this.currentScenario.end_of_day;

    // Check for perfect day
    if (config.perfect_day) {
      const isPerfect = this.evaluateConditions(config.perfect_day.conditions, stats);
      if (isPerfect) {
        return {
          type: 'perfect',
          message: config.perfect_day.reward?.message || 'Perfect day!',
          rewards: config.perfect_day.reward,
        };
      }
    }

    // Check for burnout
    if (config.burnout_warning) {
      const isBurnout = this.evaluateConditions(config.burnout_warning.conditions, stats);
      if (isBurnout) {
        return {
          type: 'burnout',
          message: config.burnout_warning.consequence?.message || 'Burnout warning!',
        };
      }
    }

    // Check for success
    if (config.success_conditions) {
      const isSuccess = this.evaluateConditions(config.success_conditions, stats);
      if (isSuccess) {
        return {
          type: 'success',
          message: 'Good day! You accomplished your goals.',
        };
      }
    }

    return { type: 'normal', message: 'Day complete.' };
  }

  /**
   * Evaluate a list of conditions against current stats
   */
  private evaluateConditions(conditions: string[], stats: any): boolean {
    return conditions.every(condition => {
      return this.evaluateCondition(condition, stats);
    });
  }

  /**
   * Evaluate a single condition string
   * Examples: "energy > 20", "All high priority tasks completed"
   */
  private evaluateCondition(condition: string, stats: any): boolean {
    // Handle special text conditions
    if (condition.includes('All high priority tasks completed')) {
      const highPriorityTasks = this.currentScenario?.tasks.filter(t => t.priority === 'high') || [];
      return highPriorityTasks.every(task => this.currentState?.tasksCompleted.has(task.id));
    }

    if (condition.includes('All tasks completed')) {
      const allTasks = this.currentScenario?.tasks || [];
      return allTasks.every(task => this.currentState?.tasksCompleted.has(task.id));
    }

    if (condition.includes('All meetings attended with correct mask')) {
      const allMeetings = this.currentScenario?.meetings.filter(m => !m.optional) || [];
      return allMeetings.every(meeting => this.currentState?.meetingsAttended.has(meeting.id));
    }

    // Handle stat comparisons: "energy > 20"
    const match = condition.match(/(\w+)\s*([<>=]+)\s*(\d+)/);
    if (match) {
      const stat = match[1];
      const operator = match[2];
      const valueStr = match[3];

      if (!stat || !operator || !valueStr) return false;

      const value = parseInt(valueStr, 10);
      const currentValue = stats[stat] || 0;

      switch (operator) {
        case '>': return currentValue > value;
        case '<': return currentValue < value;
        case '>=': return currentValue >= value;
        case '<=': return currentValue <= value;
        case '==':
        case '=': return currentValue === value;
        default: return false;
      }
    }

    return false;
  }

  /**
   * Validate scenario structure
   */
  private validateScenario(scenario: DayScenario): void {
    if (!scenario.metadata) {
      throw new Error('Scenario missing metadata');
    }
    if (!scenario.metadata.day) {
      throw new Error('Scenario missing day in metadata');
    }
    if (!scenario.metadata.week) {
      throw new Error('Scenario missing week in metadata');
    }

    // Ensure arrays exist even if empty
    scenario.emails = scenario.emails || [];
    scenario.meetings = scenario.meetings || [];
    scenario.tasks = scenario.tasks || [];
    scenario.events = scenario.events || [];
    scenario.end_of_day = scenario.end_of_day || {};
  }

  /**
   * Clear cache (useful for dev mode reloads)
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Export state for saving
   */
  exportState(): any {
    if (!this.currentState) return null;

    return {
      currentDay: this.currentState.currentDay,
      currentWeek: this.currentState.currentWeek,
      startTime: this.currentState.startTime,
      emailsReceived: Array.from(this.currentState.emailsReceived),
      emailsRead: Array.from(this.currentState.emailsRead),
      meetingsAttended: Array.from(this.currentState.meetingsAttended),
      meetingsSkipped: Array.from(this.currentState.meetingsSkipped),
      tasksCompleted: Array.from(this.currentState.tasksCompleted),
      eventsTriggered: Array.from(this.currentState.eventsTriggered),
      choicesMade: Array.from(this.currentState.choicesMade.entries()),
      totalEnergySpent: this.currentState.totalEnergySpent,
      totalStressGained: this.currentState.totalStressGained,
      totalTimeTaken: this.currentState.totalTimeTaken,
    };
  }

  /**
   * Import state from save data
   */
  importState(data: any): void {
    if (!data) return;

    this.currentState = {
      currentDay: data.currentDay,
      currentWeek: data.currentWeek,
      startTime: data.startTime,
      emailsReceived: new Set(data.emailsReceived || []),
      emailsRead: new Set(data.emailsRead || []),
      meetingsAttended: new Set(data.meetingsAttended || []),
      meetingsSkipped: new Set(data.meetingsSkipped || []),
      tasksCompleted: new Set(data.tasksCompleted || []),
      eventsTriggered: new Set(data.eventsTriggered || []),
      choicesMade: new Map(data.choicesMade || []),
      totalEnergySpent: data.totalEnergySpent || 0,
      totalStressGained: data.totalStressGained || 0,
      totalTimeTaken: data.totalTimeTaken || 0,
    };
  }
}

// Export singleton instance
export const scenarioLoader = new ScenarioLoader();
