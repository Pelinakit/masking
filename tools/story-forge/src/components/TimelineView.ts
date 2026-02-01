/**
 * TimelineView Component
 * Week/day grid for organizing game content
 */

import { store } from '../state/store.js';
import type { Week, DayReference, DaySummary, StoryArc } from '../types/index.js';

export class TimelineView {
  private container: HTMLElement;
  private weeks: Week[] = [];
  private draggedDay: DayReference | null = null;
  private draggedFromWeek: number | null = null;
  private arcs: StoryArc[] = [];

  constructor(container: HTMLElement) {
    this.container = container;
    this.loadArcs();
    this.loadWeeks();
    this.render();
  }

  /**
   * Load arcs from shared storage
   */
  private loadArcs(): void {
    // In a real implementation, this would load from the store
    // For now, we'll use the same sample arcs as ArcView
    this.arcs = [
      {
        id: 'arc-client-presentation',
        name: 'Client Presentation',
        description: 'Preparing for and delivering the big client presentation on Friday',
        color: '#4a9eff',
        dayIds: ['week1-monday', 'week1-tuesday', 'week1-wednesday', 'week1-thursday', 'week1-friday'],
      },
      {
        id: 'arc-wellness-week',
        name: 'Wellness Week',
        description: 'Company-wide wellness initiative with meditation and activities',
        color: '#10b981',
        dayIds: ['week1-wednesday', 'week1-thursday'],
      },
      {
        id: 'arc-team-conflict',
        name: 'Team Conflict',
        description: 'Tension with coworker Pug over project ownership',
        color: '#f87171',
        dayIds: ['week1-monday', 'week1-friday'],
      },
    ];
  }

  /**
   * Get arcs for a specific day
   */
  private getArcsForDay(dayId: string): StoryArc[] {
    return this.arcs.filter(arc => arc.dayIds.includes(dayId));
  }

  /**
   * Load weeks from state or create defaults
   */
  private loadWeeks(): void {
    const state = store.getState();

    // For now, create sample weeks
    this.weeks = [
      {
        number: 1,
        days: [
          this.createDayReference('Monday', 1, 'week1-monday.yaml'),
          this.createDayReference('Tuesday', 1, 'week1-tuesday.yaml'),
          this.createDayReference('Wednesday', 1, 'week1-wednesday.yaml'),
          this.createDayReference('Thursday', 1, 'week1-thursday.yaml'),
          this.createDayReference('Friday', 1, 'week1-friday.yaml'),
        ],
      },
      {
        number: 2,
        days: [
          this.createDayReference('Monday', 2, 'week2-monday.yaml'),
          this.createDayReference('Tuesday', 2, 'week2-tuesday.yaml'),
          this.createDayReference('Wednesday', 2, 'week2-wednesday.yaml'),
          this.createDayReference('Thursday', 2, 'week2-thursday.yaml'),
          this.createDayReference('Friday', 2, 'week2-friday.yaml'),
        ],
      },
    ];
  }

  /**
   * Create a day reference with sample data
   */
  private createDayReference(name: string, week: number, fileName: string): DayReference {
    const dayId = `week${week}-${name.toLowerCase()}`;
    const dayArcs = this.getArcsForDay(dayId);

    return {
      id: dayId,
      name,
      filePath: `/data/stories/scenarios/${fileName}`,
      arcs: dayArcs.map(arc => arc.id),
      summary: {
        emailCount: Math.floor(Math.random() * 8) + 2,
        meetingCount: Math.floor(Math.random() * 4) + 1,
        taskCount: Math.floor(Math.random() * 6) + 2,
        eventCount: Math.floor(Math.random() * 5) + 1,
        totalEnergyDrain: Math.floor(Math.random() * 100) + 50,
        totalStressGain: Math.floor(Math.random() * 80) + 20,
      },
    };
  }

  /**
   * Render the timeline view
   */
  render(): void {
    this.container.innerHTML = `
      <div class="timeline-view">
        <div class="timeline-header">
          <h2>Timeline</h2>
          <button class="button" id="add-week-btn">+ Add Week</button>
        </div>
        <div class="timeline-content">
          ${this.weeks.map(week => this.renderWeek(week)).join('')}
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  /**
   * Render a week row
   */
  private renderWeek(week: Week): string {
    return `
      <div class="week-row" data-week="${week.number}">
        <div class="week-header">
          <h3>Week ${week.number}</h3>
          <button class="button button-secondary add-day-btn" data-week="${week.number}">
            + Add Day
          </button>
        </div>
        <div class="day-grid">
          ${week.days.map(day => this.renderDayCard(day, week.number)).join('')}
        </div>
      </div>
    `;
  }

  /**
   * Render a day card
   */
  private renderDayCard(day: DayReference, weekNumber: number): string {
    const dayArcs = this.getArcsForDay(day.id);

    return `
      <div class="day-card"
           data-day-id="${day.id}"
           data-week="${weekNumber}"
           draggable="true">
        ${dayArcs.length > 0 ? `
          <div class="day-card-arc-indicators">
            ${dayArcs.map(arc => `
              <div class="arc-indicator"
                   style="background-color: ${arc.color};"
                   title="${arc.name}"></div>
            `).join('')}
          </div>
        ` : ''}
        <div class="day-card-header">
          <h4>${day.name}</h4>
          <div class="day-card-actions">
            <button class="icon-button edit-day-btn" data-day-id="${day.id}" title="Edit">
              📝
            </button>
            <button class="icon-button delete-day-btn" data-day-id="${day.id}" title="Delete">
              🗑️
            </button>
          </div>
        </div>
        <div class="day-card-stats">
          <div class="stat-item">
            <span class="stat-icon">✉️</span>
            <span class="stat-value">${day.summary.emailCount}</span>
            <span class="stat-label">Emails</span>
          </div>
          <div class="stat-item">
            <span class="stat-icon">📅</span>
            <span class="stat-value">${day.summary.meetingCount}</span>
            <span class="stat-label">Meetings</span>
          </div>
          <div class="stat-item">
            <span class="stat-icon">✓</span>
            <span class="stat-value">${day.summary.taskCount}</span>
            <span class="stat-label">Tasks</span>
          </div>
        </div>
        <div class="day-card-footer">
          <div class="energy-bar">
            <div class="energy-bar-fill" style="width: ${Math.min(100, day.summary.totalEnergyDrain)}%"></div>
            <span class="energy-bar-label">Energy: -${day.summary.totalEnergyDrain}</span>
          </div>
          <div class="stress-bar">
            <div class="stress-bar-fill" style="width: ${Math.min(100, day.summary.totalStressGain)}%"></div>
            <span class="stress-bar-label">Stress: +${day.summary.totalStressGain}</span>
          </div>
        </div>
        ${dayArcs.length > 0 ? `
          <div class="day-card-arcs">
            ${dayArcs.map(arc => `
              <span class="arc-tag" style="background-color: ${arc.color}20; color: ${arc.color}; border-color: ${arc.color};">
                ${arc.name}
              </span>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;
  }

  /**
   * Attach event listeners
   */
  private attachEventListeners(): void {
    // Add week button
    this.container.querySelector('#add-week-btn')?.addEventListener('click', () => {
      this.addWeek();
    });

    // Add day buttons
    this.container.querySelectorAll('.add-day-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const weekNumber = parseInt((e.target as HTMLElement).dataset.week || '0');
        this.addDay(weekNumber);
      });
    });

    // Edit day buttons
    this.container.querySelectorAll('.edit-day-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const dayId = (e.target as HTMLElement).dataset.dayId;
        if (dayId) this.editDay(dayId);
      });
    });

    // Delete day buttons
    this.container.querySelectorAll('.delete-day-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const dayId = (e.target as HTMLElement).dataset.dayId;
        if (dayId) this.deleteDay(dayId);
      });
    });

    // Day card drag and drop
    this.container.querySelectorAll('.day-card').forEach(card => {
      card.addEventListener('dragstart', (e) => this.handleDragStart(e as DragEvent));
      card.addEventListener('dragover', (e) => this.handleDragOver(e as DragEvent));
      card.addEventListener('drop', (e) => this.handleDrop(e as DragEvent));
      card.addEventListener('dragend', () => this.handleDragEnd());

      // Click to edit
      card.addEventListener('click', (e) => {
        if (!(e.target as HTMLElement).closest('.day-card-actions')) {
          const dayId = (card as HTMLElement).dataset.dayId;
          if (dayId) this.editDay(dayId);
        }
      });
    });
  }

  /**
   * Add a new week
   */
  private addWeek(): void {
    const newWeekNumber = this.weeks.length + 1;
    const newWeek: Week = {
      number: newWeekNumber,
      days: [],
    };

    // Add default workweek
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    daysOfWeek.forEach(dayName => {
      newWeek.days.push(
        this.createDayReference(dayName, newWeekNumber, `week${newWeekNumber}-${dayName.toLowerCase()}.yaml`)
      );
    });

    this.weeks.push(newWeek);
    this.render();

    store.setState({ isDirty: true });
  }

  /**
   * Add a new day to a week
   */
  private addDay(weekNumber: number): void {
    const dayName = prompt('Enter day name:');
    if (!dayName) return;

    const week = this.weeks.find(w => w.number === weekNumber);
    if (!week) return;

    const newDay = this.createDayReference(
      dayName,
      weekNumber,
      `week${weekNumber}-${dayName.toLowerCase().replace(/\s+/g, '-')}.yaml`
    );

    week.days.push(newDay);
    this.render();

    store.setState({ isDirty: true });
  }

  /**
   * Edit a day
   */
  private editDay(dayId: string): void {
    console.log('Edit day:', dayId);
    // TODO: Switch to editor view with this day loaded
    store.setState({ currentView: 'editor', currentDayId: dayId });
  }

  /**
   * Delete a day
   */
  private deleteDay(dayId: string): void {
    if (!confirm('Delete this day? This cannot be undone.')) return;

    this.weeks.forEach(week => {
      week.days = week.days.filter(day => day.id !== dayId);
    });

    this.render();
    store.setState({ isDirty: true });
  }

  /**
   * Handle drag start
   */
  private handleDragStart(e: DragEvent): void {
    const card = e.target as HTMLElement;
    const dayId = card.dataset.dayId;
    const weekNumber = parseInt(card.dataset.week || '0');

    if (!dayId) return;

    const week = this.weeks.find(w => w.number === weekNumber);
    const day = week?.days.find(d => d.id === dayId);

    if (day) {
      this.draggedDay = day;
      this.draggedFromWeek = weekNumber;
      card.classList.add('dragging');

      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', dayId);
      }
    }
  }

  /**
   * Handle drag over
   */
  private handleDragOver(e: DragEvent): void {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }

    const card = (e.target as HTMLElement).closest('.day-card') as HTMLElement;
    if (card && !card.classList.contains('dragging')) {
      card.classList.add('drag-over');
    }
  }

  /**
   * Handle drop
   */
  private handleDrop(e: DragEvent): void {
    e.preventDefault();

    const targetCard = (e.target as HTMLElement).closest('.day-card') as HTMLElement;
    if (!targetCard || !this.draggedDay) return;

    const targetDayId = targetCard.dataset.dayId;
    const targetWeekNumber = parseInt(targetCard.dataset.week || '0');

    if (!targetDayId || targetWeekNumber === 0) return;

    // Remove from old position
    if (this.draggedFromWeek !== null) {
      const fromWeek = this.weeks.find(w => w.number === this.draggedFromWeek);
      if (fromWeek) {
        fromWeek.days = fromWeek.days.filter(d => d.id !== this.draggedDay!.id);
      }
    }

    // Insert at new position
    const toWeek = this.weeks.find(w => w.number === targetWeekNumber);
    if (toWeek) {
      const targetIndex = toWeek.days.findIndex(d => d.id === targetDayId);
      if (targetIndex !== -1) {
        toWeek.days.splice(targetIndex, 0, this.draggedDay);
      } else {
        toWeek.days.push(this.draggedDay);
      }
    }

    this.render();
    store.setState({ isDirty: true });
  }

  /**
   * Handle drag end
   */
  private handleDragEnd(): void {
    this.draggedDay = null;
    this.draggedFromWeek = null;

    this.container.querySelectorAll('.day-card').forEach(card => {
      card.classList.remove('dragging', 'drag-over');
    });
  }

  /**
   * Destroy view
   */
  destroy(): void {
    // Cleanup
  }
}
