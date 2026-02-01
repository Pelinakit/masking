/**
 * EventScheduler
 * Manages random and scheduled events with weighted probability and conditions
 */

import type { EventDefinition } from '@scripting/types/ScenarioTypes.js';

export interface ScheduledEvent {
  id: string;
  time: string; // HH:MM format
  type: 'notification' | 'choice' | 'cutscene' | 'interaction';
  title: string;
  description: string;
  condition?: string;
  choices?: any[];
  triggered: boolean;
  weight?: number; // For random selection
}

export interface RandomEventPool {
  events: ScheduledEvent[];
  totalWeight: number;
}

export type EventTriggerCallback = (event: ScheduledEvent) => void;

export class EventScheduler {
  private scheduledEvents: Map<string, ScheduledEvent> = new Map();
  private randomEventPools: Map<string, RandomEventPool> = new Map();
  private triggeredEvents: Set<string> = new Set();
  private listeners: Map<string, EventTriggerCallback> = new Map();
  private currentTime: string = '09:00';

  /**
   * Add a scheduled event from YAML definition
   */
  scheduleEvent(definition: EventDefinition): void {
    const event: ScheduledEvent = {
      id: definition.id,
      time: definition.time,
      type: definition.type,
      title: definition.title,
      description: definition.description,
      condition: definition.condition,
      choices: definition.choices,
      triggered: false,
      weight: definition.weight,
    };

    this.scheduledEvents.set(event.id, event);
  }

  /**
   * Add multiple events from YAML
   */
  scheduleEvents(definitions: EventDefinition[]): void {
    definitions.forEach(def => this.scheduleEvent(def));
  }

  /**
   * Add an event to a random event pool
   */
  addToRandomPool(poolId: string, definition: EventDefinition): void {
    if (!this.randomEventPools.has(poolId)) {
      this.randomEventPools.set(poolId, {
        events: [],
        totalWeight: 0,
      });
    }

    const pool = this.randomEventPools.get(poolId)!;
    const event: ScheduledEvent = {
      id: definition.id,
      time: definition.time,
      type: definition.type,
      title: definition.title,
      description: definition.description,
      condition: definition.condition,
      choices: definition.choices,
      triggered: false,
      weight: definition.weight || 1,
    };

    pool.events.push(event);
    pool.totalWeight += event.weight || 1;
  }

  /**
   * Select a random event from a pool using weighted probability
   */
  selectRandomEvent(poolId: string, stats?: any): ScheduledEvent | null {
    const pool = this.randomEventPools.get(poolId);
    if (!pool || pool.events.length === 0) return null;

    // Filter events by conditions
    const validEvents = pool.events.filter(event => {
      if (!event.condition) return true;
      if (!stats) return true;
      return this.evaluateCondition(event.condition, stats);
    });

    if (validEvents.length === 0) return null;

    // Calculate total weight of valid events
    const totalWeight = validEvents.reduce((sum, e) => sum + (e.weight || 1), 0);

    // Select random event based on weight
    let random = Math.random() * totalWeight;

    for (const event of validEvents) {
      random -= event.weight || 1;
      if (random <= 0) {
        return event;
      }
    }

    // Fallback to last event
    return validEvents[validEvents.length - 1];
  }

  /**
   * Check if any events should trigger at current time
   */
  checkEvents(currentTime: string, stats?: any): ScheduledEvent[] {
    this.currentTime = currentTime;
    const triggeredEvents: ScheduledEvent[] = [];

    this.scheduledEvents.forEach(event => {
      if (
        event.time === currentTime &&
        !event.triggered &&
        !this.triggeredEvents.has(event.id)
      ) {
        // Check condition if present
        if (event.condition && stats) {
          if (!this.evaluateCondition(event.condition, stats)) {
            return;
          }
        }

        event.triggered = true;
        this.triggeredEvents.add(event.id);
        triggeredEvents.push(event);

        // Notify listeners
        this.notifyListeners(event);
      }
    });

    return triggeredEvents;
  }

  /**
   * Manually trigger an event
   */
  triggerEvent(eventId: string): boolean {
    const event = this.scheduledEvents.get(eventId);
    if (!event || event.triggered) {
      return false;
    }

    event.triggered = true;
    this.triggeredEvents.add(event.id);
    this.notifyListeners(event);

    return true;
  }

  /**
   * Get event by ID
   */
  getEvent(eventId: string): ScheduledEvent | null {
    return this.scheduledEvents.get(eventId) || null;
  }

  /**
   * Get all scheduled events
   */
  getAllEvents(): ScheduledEvent[] {
    return Array.from(this.scheduledEvents.values());
  }

  /**
   * Get events for a specific time
   */
  getEventsAtTime(time: string): ScheduledEvent[] {
    return Array.from(this.scheduledEvents.values()).filter(
      e => e.time === time && !e.triggered
    );
  }

  /**
   * Get triggered events
   */
  getTriggeredEvents(): ScheduledEvent[] {
    return Array.from(this.scheduledEvents.values()).filter(e => e.triggered);
  }

  /**
   * Get untriggered events
   */
  getUpcomingEvents(): ScheduledEvent[] {
    return Array.from(this.scheduledEvents.values()).filter(e => !e.triggered);
  }

  /**
   * Check if an event has been triggered
   */
  hasTriggered(eventId: string): boolean {
    return this.triggeredEvents.has(eventId);
  }

  /**
   * Reset an event (mark as not triggered)
   */
  resetEvent(eventId: string): void {
    const event = this.scheduledEvents.get(eventId);
    if (event) {
      event.triggered = false;
      this.triggeredEvents.delete(event.id);
    }
  }

  /**
   * Clear all triggered events
   */
  resetAllEvents(): void {
    this.scheduledEvents.forEach(event => {
      event.triggered = false;
    });
    this.triggeredEvents.clear();
  }

  /**
   * Remove an event
   */
  removeEvent(eventId: string): void {
    this.scheduledEvents.delete(eventId);
    this.triggeredEvents.delete(eventId);
  }

  /**
   * Clear all events
   */
  clearAll(): void {
    this.scheduledEvents.clear();
    this.randomEventPools.clear();
    this.triggeredEvents.clear();
  }

  /**
   * Subscribe to event triggers
   */
  onEventTrigger(eventId: string, callback: EventTriggerCallback): () => void {
    this.listeners.set(eventId, callback);
    return () => this.listeners.delete(eventId);
  }

  /**
   * Subscribe to any event trigger
   */
  onAnyEventTrigger(callback: EventTriggerCallback): () => void {
    const listenerId = `__any__${Date.now()}`;
    this.listeners.set(listenerId, callback);
    return () => this.listeners.delete(listenerId);
  }

  /**
   * Notify listeners when an event triggers
   */
  private notifyListeners(event: ScheduledEvent): void {
    // Notify specific listener
    const specificListener = this.listeners.get(event.id);
    if (specificListener) {
      specificListener(event);
    }

    // Notify wildcard listeners
    this.listeners.forEach((callback, id) => {
      if (id.startsWith('__any__')) {
        callback(event);
      }
    });
  }

  /**
   * Evaluate a condition string
   * Examples: "energy < 30", "stress > 80"
   */
  private evaluateCondition(condition: string, stats: any): boolean {
    const match = condition.match(/(\w+)\s*([<>=]+)\s*(\d+)/);
    if (!match) return false;

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

  /**
   * Export state for saving
   */
  exportState(): any {
    const eventsData: any[] = [];

    this.scheduledEvents.forEach(event => {
      eventsData.push({
        id: event.id,
        time: event.time,
        type: event.type,
        title: event.title,
        description: event.description,
        condition: event.condition,
        choices: event.choices,
        triggered: event.triggered,
        weight: event.weight,
      });
    });

    return {
      events: eventsData,
      triggeredEvents: Array.from(this.triggeredEvents),
      currentTime: this.currentTime,
    };
  }

  /**
   * Import state from save data
   */
  importState(data: any): void {
    if (!data) return;

    this.scheduledEvents.clear();
    this.triggeredEvents.clear();
    this.currentTime = data.currentTime || '09:00';

    if (data.events) {
      data.events.forEach((eventData: any) => {
        this.scheduledEvents.set(eventData.id, eventData as ScheduledEvent);
      });
    }

    if (data.triggeredEvents) {
      data.triggeredEvents.forEach((id: string) => {
        this.triggeredEvents.add(id);
      });
    }
  }
}

// Export singleton instance
export const eventScheduler = new EventScheduler();
