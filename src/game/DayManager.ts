/**
 * DayManager
 * Manages day start/end sequences, scenario loading, and progression (E12)
 */

import { StateManager } from './StateManager';
import { ScenarioLoader } from '@scripting/ScenarioLoader';
import { effectExecutor } from '@scripting/EffectExecutor';
import type { DayScenario } from '@scripting/types/ScenarioTypes';
import { EmailManager } from './EmailManager';
import { TaskManager } from './TaskManager';
import { EventScheduler } from './EventScheduler';

export interface DaySummary {
  day: string;
  week: number;
  energySpent: number;
  stressGained: number;
  timeTaken: number;
  emailsRead: number;
  meetingsAttended: number;
  tasksCompleted: number;
  relationshipChanges: Map<string, number>;
  achievements: string[];
}

export class DayManager {
  private stateManager: StateManager;
  private scenarioLoader: ScenarioLoader;
  private emailManager: EmailManager;
  private taskManager: TaskManager;
  private eventScheduler: EventScheduler;

  private currentScenario: DayScenario | null = null;
  private dayStartTime: number = 0;

  constructor(
    stateManager: StateManager,
    scenarioLoader: ScenarioLoader,
    emailManager: EmailManager,
    taskManager: TaskManager,
    eventScheduler: EventScheduler
  ) {
    this.stateManager = stateManager;
    this.scenarioLoader = scenarioLoader;
    this.emailManager = emailManager;
    this.taskManager = taskManager;
    this.eventScheduler = eventScheduler;
  }

  /**
   * Start a new day
   * Loads scenario, initializes managers, schedules events
   */
  async startDay(day: string, week: number = 1): Promise<void> {
    console.log(`Starting day: Week ${week}, ${day}`);

    this.dayStartTime = Date.now();

    try {
      // Load day scenario from YAML
      this.currentScenario = await this.scenarioLoader.loadScenarioByDay(day, week);

      // Initialize scenario state
      this.scenarioLoader.startScenario(this.currentScenario);

      // Set game time to start of day
      this.stateManager.time.setTime(this.currentScenario.startTime || '09:00');

      // Initialize all managers with scenario data
      this.initializeManagers();

      // Trigger day start event
      this.triggerDayStartEvent();

      console.log(`Day started successfully: ${this.currentScenario.metadata.title}`);
    } catch (error) {
      console.error('Failed to start day:', error);
      throw error;
    }
  }

  /**
   * Initialize managers with scenario data
   */
  private initializeManagers(): void {
    if (!this.currentScenario) return;

    // Load emails into EmailManager
    if (this.currentScenario.emails) {
      this.currentScenario.emails.forEach(email => {
        this.emailManager.scheduleEmail(email);
      });
    }

    // Load tasks into TaskManager
    if (this.currentScenario.tasks) {
      this.currentScenario.tasks.forEach(task => {
        this.taskManager.addTask(task);
      });
    }

    // Schedule events
    if (this.currentScenario.events) {
      this.currentScenario.events.forEach(event => {
        this.eventScheduler.scheduleEvent(event);
      });
    }
  }

  /**
   * Trigger day start event effects
   */
  private triggerDayStartEvent(): void {
    if (!this.currentScenario) return;

    // Execute start_of_day effects if defined
    const startEvent = this.currentScenario.events?.find(e => e.trigger === 'start_of_day');
    if (startEvent?.effects) {
      effectExecutor.executeAll(startEvent.effects, this.stateManager);
    }
  }

  /**
   * End the current day
   * Evaluates end conditions, shows summary, calculates rewards
   */
  endDay(): DaySummary {
    console.log('Ending day...');

    if (!this.currentScenario) {
      throw new Error('No active scenario to end');
    }

    const scenarioState = this.scenarioLoader.getCurrentState();

    // Calculate day summary
    const summary: DaySummary = {
      day: this.currentScenario.metadata.day,
      week: this.currentScenario.metadata.week,
      energySpent: scenarioState?.totalEnergySpent || 0,
      stressGained: scenarioState?.totalStressGained || 0,
      timeTaken: scenarioState?.totalTimeTaken || 0,
      emailsRead: scenarioState?.emailsRead.size || 0,
      meetingsAttended: scenarioState?.meetingsAttended.size || 0,
      tasksCompleted: scenarioState?.tasksCompleted.size || 0,
      relationshipChanges: this.calculateRelationshipChanges(),
      achievements: this.evaluateAchievements(),
    };

    // Trigger end_of_day event effects
    this.triggerDayEndEvent();

    // Evaluate end conditions
    this.evaluateEndConditions();

    console.log('Day summary:', summary);

    return summary;
  }

  /**
   * Trigger day end event effects
   */
  private triggerDayEndEvent(): void {
    if (!this.currentScenario) return;

    // Execute end_of_day effects if defined
    const endEvent = this.currentScenario.events?.find(e => e.trigger === 'end_of_day');
    if (endEvent?.effects) {
      effectExecutor.executeAll(endEvent.effects, this.stateManager);
    }
  }

  /**
   * Evaluate end-of-day conditions for branching
   */
  private evaluateEndConditions(): void {
    if (!this.currentScenario?.endConditions) return;

    this.currentScenario.endConditions.forEach(condition => {
      // Evaluate condition using ScriptInterpreter
      // Apply consequences if condition is met
      console.log('Evaluating end condition:', condition);
    });
  }

  /**
   * Calculate relationship changes during the day
   */
  private calculateRelationshipChanges(): Map<string, number> {
    // Track relationship changes from start of day
    const changes = new Map<string, number>();

    // TODO: Implement actual relationship change tracking
    // For now, return empty map

    return changes;
  }

  /**
   * Evaluate achievements for the day
   */
  private evaluateAchievements(): string[] {
    const achievements: string[] = [];
    const scenarioState = this.scenarioLoader.getCurrentState();

    if (!scenarioState) return achievements;

    // Check for achievement conditions
    if (scenarioState.emailsRead.size === scenarioState.emailsReceived.size) {
      achievements.push('inbox_zero');
    }

    if (scenarioState.tasksCompleted.size >= 5) {
      achievements.push('productive_day');
    }

    if (scenarioState.meetingsAttended.size >= 3) {
      achievements.push('meeting_marathon');
    }

    // Check stress levels
    const stress = this.stateManager.stats.getStat('stress');
    if (stress < 20) {
      achievements.push('zen_master');
    }

    // Check energy levels
    const energy = this.stateManager.stats.getStat('energy');
    if (energy > 80) {
      achievements.push('energizer');
    }

    return achievements;
  }

  /**
   * Transition to next day
   * Handles week transitions
   */
  async transitionToNextDay(): Promise<void> {
    if (!this.currentScenario) {
      throw new Error('No active scenario');
    }

    const currentDay = this.currentScenario.metadata.day;
    const currentWeek = this.currentScenario.metadata.week;

    // Determine next day
    const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    const currentDayIndex = dayOrder.findIndex(d => currentDay.toLowerCase().includes(d));

    let nextDay: string;
    let nextWeek: number = currentWeek;

    if (currentDayIndex === -1 || currentDayIndex === dayOrder.length - 1) {
      // Friday or unknown day - go to Monday of next week
      nextDay = 'monday';
      nextWeek = currentWeek + 1;
    } else {
      // Go to next day in same week
      nextDay = dayOrder[currentDayIndex + 1];
    }

    console.log(`Transitioning to: Week ${nextWeek}, ${nextDay}`);

    // Start next day
    await this.startDay(nextDay, nextWeek);
  }

  /**
   * Get current scenario
   */
  getCurrentScenario(): DayScenario | null {
    return this.currentScenario;
  }

  /**
   * Check if day is complete
   * Based on end_of_day trigger or manual player decision
   */
  isDayComplete(): boolean {
    // Check if it's past end time
    const currentTime = this.stateManager.time.getCurrentTimeString();
    const endTime = this.currentScenario?.endTime || '17:00';

    return currentTime >= endTime;
  }

  /**
   * Get day progress (0-100)
   */
  getDayProgress(): number {
    if (!this.currentScenario) return 0;

    const startTime = this.currentScenario.startTime || '09:00';
    const endTime = this.currentScenario.endTime || '17:00';
    const currentTime = this.stateManager.time.getCurrentTimeString();

    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    const [currentHour, currentMin] = currentTime.split(':').map(Number);

    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    const currentMinutes = currentHour * 60 + currentMin;

    const progress = ((currentMinutes - startMinutes) / (endMinutes - startMinutes)) * 100;

    return Math.max(0, Math.min(100, progress));
  }
}
