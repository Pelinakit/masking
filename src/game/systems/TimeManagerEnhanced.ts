/**
 * TimeManager (Enhanced)
 * Hybrid time flow: real-time during free periods, action-based during work tasks
 */

export type DayOfWeek = 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';

export type TimeFlowMode = 'realtime' | 'action-based' | 'paused';

export interface GameTime {
  hour: number;       // 0-23
  minute: number;     // 0-59
  dayOfWeek: DayOfWeek;
  dayNumber: number;  // Absolute day count
}

export type TimeEventCallback = (time: GameTime) => void;

export interface TimeEvent {
  id: string;
  hour: number;
  minute: number;
  callback: TimeEventCallback;
  recurring?: boolean;
  dayOfWeek?: DayOfWeek;
  fired?: boolean;
}

export class TimeManagerEnhanced {
  private hour: number = 9;
  private minute: number = 0;
  private dayOfWeek: DayOfWeek = 'Monday';
  private dayNumber: number = 1;

  private timeScale: number = 1;
  private accumulatedTime: number = 0;
  private flowMode: TimeFlowMode = 'realtime';

  private events: Map<string, TimeEvent> = new Map();
  private nextEventId: number = 1;

  // Time flow configuration
  private readonly MS_PER_GAME_MINUTE = 1000; // 60x speed by default
  private readonly WORK_START_HOUR = 9;
  private readonly WORK_END_HOUR = 17;

  private readonly DAYS_OF_WEEK: DayOfWeek[] = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
  ];

  constructor(startTime?: Partial<GameTime>) {
    if (startTime) {
      this.hour = startTime.hour ?? this.hour;
      this.minute = startTime.minute ?? this.minute;
      this.dayOfWeek = startTime.dayOfWeek ?? this.dayOfWeek;
      this.dayNumber = startTime.dayNumber ?? this.dayNumber;
    }
  }

  /**
   * Update time based on delta time from game loop
   */
  update(deltaMs: number): void {
    if (this.flowMode === 'paused' || this.timeScale === 0) return;

    // Only update in realtime mode
    if (this.flowMode === 'realtime') {
      this.accumulatedTime += deltaMs * this.timeScale;

      while (this.accumulatedTime >= this.MS_PER_GAME_MINUTE) {
        this.accumulatedTime -= this.MS_PER_GAME_MINUTE;
        this.advanceMinute();
      }
    }
  }

  /**
   * Set time flow mode
   */
  setFlowMode(mode: TimeFlowMode): void {
    this.flowMode = mode;
  }

  /**
   * Get current flow mode
   */
  getFlowMode(): TimeFlowMode {
    return this.flowMode;
  }

  /**
   * Advance time by action (for action-based mode)
   * Used when completing tasks or attending meetings
   */
  advanceByAction(minutes: number): void {
    for (let i = 0; i < minutes; i++) {
      this.advanceMinute();
    }
  }

  /**
   * Advance time by one game minute
   */
  private advanceMinute(): void {
    this.minute++;

    if (this.minute >= 60) {
      this.minute = 0;
      this.hour++;

      if (this.hour >= 24) {
        this.hour = 0;
        this.advanceDay();
      }
    }

    this.checkEvents();
  }

  /**
   * Advance to next day
   */
  private advanceDay(): void {
    this.dayNumber++;
    const currentIndex = this.DAYS_OF_WEEK.indexOf(this.dayOfWeek);
    const nextIndex = (currentIndex + 1) % 7;
    this.dayOfWeek = this.DAYS_OF_WEEK[nextIndex];

    // Reset one-time events for new day
    this.events.forEach(event => {
      if (!event.recurring) {
        event.fired = false;
      }
    });
  }

  /**
   * Check if any events should fire
   */
  private checkEvents(): void {
    const currentTime = this.getTime();

    this.events.forEach(event => {
      if (!event.recurring && event.fired) return;
      if (event.dayOfWeek && event.dayOfWeek !== currentTime.dayOfWeek) return;

      if (event.hour === currentTime.hour && event.minute === currentTime.minute) {
        event.callback(currentTime);
        event.fired = true;
      }
    });
  }

  /**
   * Schedule a one-time event
   */
  scheduleEvent(hour: number, minute: number, callback: TimeEventCallback): string {
    const id = this.generateEventId();
    this.events.set(id, {
      id,
      hour,
      minute,
      callback,
      recurring: false,
      fired: false,
    });
    return id;
  }

  /**
   * Schedule a daily recurring event
   */
  scheduleDailyEvent(hour: number, minute: number, callback: TimeEventCallback): string {
    const id = this.generateEventId();
    this.events.set(id, {
      id,
      hour,
      minute,
      callback,
      recurring: true,
    });
    return id;
  }

  /**
   * Schedule a weekly recurring event
   */
  scheduleWeeklyEvent(
    dayOfWeek: DayOfWeek,
    hour: number,
    minute: number,
    callback: TimeEventCallback
  ): string {
    const id = this.generateEventId();
    this.events.set(id, {
      id,
      hour,
      minute,
      dayOfWeek,
      callback,
      recurring: true,
    });
    return id;
  }

  /**
   * Cancel a scheduled event
   */
  cancelEvent(id: string): boolean {
    return this.events.delete(id);
  }

  /**
   * Clear all events
   */
  clearAllEvents(): void {
    this.events.clear();
  }

  /**
   * Get current time
   */
  getTime(): GameTime {
    return {
      hour: this.hour,
      minute: this.minute,
      dayOfWeek: this.dayOfWeek,
      dayNumber: this.dayNumber,
    };
  }

  /**
   * Get formatted time string (HH:MM)
   */
  getTimeString(): string {
    const h = this.hour.toString().padStart(2, '0');
    const m = this.minute.toString().padStart(2, '0');
    return `${h}:${m}`;
  }

  /**
   * Get 12-hour formatted time string (h:MM AM/PM)
   */
  getTime12Hour(): string {
    const period = this.hour < 12 ? 'AM' : 'PM';
    const h = this.hour % 12 || 12;
    const m = this.minute.toString().padStart(2, '0');
    return `${h}:${m} ${period}`;
  }

  /**
   * Set time directly (useful for time skips, debugging)
   */
  setTime(hour: number, minute: number): void {
    const oldDay = this.dayNumber;

    this.hour = hour % 24;
    this.minute = minute % 60;

    if (hour >= 24) {
      const daysToAdd = Math.floor(hour / 24);
      for (let i = 0; i < daysToAdd; i++) {
        this.advanceDay();
      }
    }

    if (this.dayNumber !== oldDay || hour >= 24) {
      this.checkEvents();
    }
  }

  /**
   * Skip ahead by game hours
   */
  skipHours(hours: number): void {
    const totalMinutes = hours * 60;
    for (let i = 0; i < totalMinutes; i++) {
      this.advanceMinute();
    }
  }

  /**
   * Skip to specific time today (or tomorrow if time has passed)
   */
  skipToTime(hour: number, minute: number): void {
    const targetMinutes = hour * 60 + minute;
    const currentMinutes = this.hour * 60 + this.minute;

    if (targetMinutes <= currentMinutes) {
      const minutesToMidnight = (24 * 60) - currentMinutes;
      const minutesFromMidnight = targetMinutes;
      this.skipHours((minutesToMidnight + minutesFromMidnight) / 60);
    } else {
      const minutesToSkip = targetMinutes - currentMinutes;
      this.skipHours(minutesToSkip / 60);
    }
  }

  /**
   * Set time scale (0 = paused, 1 = normal, 2 = double speed, etc.)
   */
  setTimeScale(scale: number): void {
    this.timeScale = Math.max(0, scale);
  }

  /**
   * Get current time scale
   */
  getTimeScale(): number {
    return this.timeScale;
  }

  /**
   * Pause time
   */
  pause(): void {
    this.flowMode = 'paused';
  }

  /**
   * Resume time at normal speed
   */
  resume(): void {
    if (this.flowMode === 'paused') {
      this.flowMode = 'realtime';
    }
  }

  /**
   * Check if currently paused
   */
  isPaused(): boolean {
    return this.flowMode === 'paused';
  }

  /**
   * Check if it's currently a weekend
   */
  isWeekend(): boolean {
    return this.dayOfWeek === 'Saturday' || this.dayOfWeek === 'Sunday';
  }

  /**
   * Check if it's during work hours (9 AM - 5 PM on weekdays)
   */
  isWorkHours(): boolean {
    if (this.isWeekend()) return false;
    return this.hour >= this.WORK_START_HOUR && this.hour < this.WORK_END_HOUR;
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `event-${this.nextEventId++}`;
  }

  /**
   * Export state for saving
   */
  exportState(): any {
    const events: any[] = [];
    this.events.forEach(event => {
      events.push({
        id: event.id,
        hour: event.hour,
        minute: event.minute,
        recurring: event.recurring,
        dayOfWeek: event.dayOfWeek,
        fired: event.fired,
      });
    });

    return {
      hour: this.hour,
      minute: this.minute,
      dayOfWeek: this.dayOfWeek,
      dayNumber: this.dayNumber,
      timeScale: this.timeScale,
      flowMode: this.flowMode,
      nextEventId: this.nextEventId,
      events,
    };
  }

  /**
   * Import state from save data
   */
  importState(data: any): void {
    if (!data) return;

    this.hour = data.hour ?? this.hour;
    this.minute = data.minute ?? this.minute;
    this.dayOfWeek = data.dayOfWeek ?? this.dayOfWeek;
    this.dayNumber = data.dayNumber ?? this.dayNumber;
    this.timeScale = data.timeScale ?? this.timeScale;
    this.flowMode = data.flowMode ?? this.flowMode;
    this.nextEventId = data.nextEventId ?? this.nextEventId;

    this.events.clear();
  }
}
