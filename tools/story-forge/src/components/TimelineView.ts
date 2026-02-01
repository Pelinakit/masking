/**
 * TimelineView Component
 * Week/day grid for organizing game content
 * Connected to actual game YAML scenario files
 */

import { store } from '../state/store.js';
import { fileService } from '../services/FileService.js';
import { parse } from 'yaml';
import type { Week, DayReference, DaySummary, StoryArc } from '../types/index.js';

// Path to scenarios directory (relative to project root)
const SCENARIOS_PATH = 'public/data/stories/scenarios';

export class TimelineView {
  private container: HTMLElement;
  private weeks: Week[] = [];
  private draggedDay: DayReference | null = null;
  private draggedFromWeek: number | null = null;
  private arcs: StoryArc[] = [];
  private loading: boolean = true;

  constructor(container: HTMLElement) {
    this.container = container;
    this.loadArcs();
    this.init();
  }

  /**
   * Initialize and load data
   */
  private async init(): Promise<void> {
    this.renderLoading();
    await this.loadWeeksFromFiles();
    this.loading = false;
    this.render();
  }

  /**
   * Render loading state
   */
  private renderLoading(): void {
    this.container.innerHTML = `
      <div class="timeline-view">
        <div class="timeline-header">
          <h2>Timeline</h2>
        </div>
        <div class="timeline-content" style="display: flex; justify-content: center; padding: 60px;">
          <p class="text-dim">Loading scenarios...</p>
        </div>
      </div>
    `;
  }

  /**
   * Load arcs from shared storage
   */
  private loadArcs(): void {
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
   * Load weeks from actual YAML files
   */
  private async loadWeeksFromFiles(): Promise<void> {
    try {
      // List all scenario files
      const files = await fileService.listFiles(SCENARIOS_PATH);
      const yamlFiles = files.filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));

      // Group files by week
      const weekMap = new Map<number, DayReference[]>();

      for (const fileName of yamlFiles) {
        const filePath = `${SCENARIOS_PATH}/${fileName}`;

        // Try to load the file content to get metadata
        let weekNum = 1;
        let dayName = 'Unknown';
        let summary: DaySummary = this.createEmptySummary();

        try {
          const fileData = await fileService.readFile(filePath);
          const data = parse(fileData.content);

          // Extract week/day from metadata if available
          if (data?.metadata) {
            weekNum = data.metadata.week ?? 1;
            dayName = data.metadata.day ?? this.extractDayFromFilename(fileName);
          } else {
            // Fallback: try to parse from filename (e.g., "week1-monday.yaml")
            const match = fileName.match(/week(\d+)-(\w+)\.ya?ml$/i);
            if (match) {
              weekNum = parseInt(match[1]);
              dayName = match[2].charAt(0).toUpperCase() + match[2].slice(1);
            } else {
              // Try other common patterns like "monday-full-day.yaml"
              dayName = this.extractDayFromFilename(fileName);
            }
          }

          summary = this.parseYAMLStats(fileData.content);
        } catch (err) {
          console.warn(`Could not load ${fileName}:`, err);
          continue;
        }

        // Capitalize day name
        dayName = dayName.charAt(0).toUpperCase() + dayName.slice(1).toLowerCase();

        const dayId = `week${weekNum}-${dayName.toLowerCase()}`;
        const dayRef: DayReference = {
          id: dayId,
          name: dayName,
          filePath: filePath,
          arcs: this.getArcsForDay(dayId).map(a => a.id),
          summary,
        };

        if (!weekMap.has(weekNum)) {
          weekMap.set(weekNum, []);
        }
        weekMap.get(weekNum)!.push(dayRef);
      }

      // Convert to weeks array, sorted by week number
      this.weeks = Array.from(weekMap.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([number, days]) => ({
          number,
          days: this.sortDays(days),
        }));

      // If no files found, weeks stays empty - we'll show empty state

    } catch (err) {
      console.error('Failed to load scenarios:', err);
      // On error, show empty state
      this.weeks = [];
    }
  }

  /**
   * Sort days in weekday order
   */
  private sortDays(days: DayReference[]): DayReference[] {
    const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    return days.sort((a, b) => {
      const aIndex = dayOrder.indexOf(a.name.toLowerCase());
      const bIndex = dayOrder.indexOf(b.name.toLowerCase());
      return aIndex - bIndex;
    });
  }

  /**
   * Extract day name from filename (e.g., "monday-full-day.yaml" -> "Monday")
   */
  private extractDayFromFilename(fileName: string): string {
    const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const lowerName = fileName.toLowerCase();

    for (const day of dayNames) {
      if (lowerName.includes(day)) {
        return day.charAt(0).toUpperCase() + day.slice(1);
      }
    }

    // Return filename without extension as fallback
    return fileName.replace(/\.ya?ml$/i, '').replace(/-/g, ' ');
  }

  /**
   * Create empty summary
   */
  private createEmptySummary(): DaySummary {
    return {
      emailCount: 0,
      meetingCount: 0,
      taskCount: 0,
      eventCount: 0,
      totalEnergyDrain: 0,
      totalStressGain: 0,
    };
  }

  /**
   * Parse YAML content and extract stats
   */
  private parseYAMLStats(content: string): DaySummary {
    try {
      const data = parse(content);
      if (!data) return this.createEmptySummary();

      const emailCount = Array.isArray(data.emails) ? data.emails.length : 0;
      const meetingCount = Array.isArray(data.meetings) ? data.meetings.length : 0;
      const taskCount = Array.isArray(data.tasks) ? data.tasks.length : 0;
      const eventCount = Array.isArray(data.events) ? data.events.length : 0;

      // Calculate total energy drain and stress gain from all sources
      let totalEnergyDrain = 0;
      let totalStressGain = 0;

      // From meetings
      if (Array.isArray(data.meetings)) {
        data.meetings.forEach((meeting: any) => {
          if (Array.isArray(meeting.events)) {
            meeting.events.forEach((event: any) => {
              if (Array.isArray(event.choices)) {
                event.choices.forEach((choice: any) => {
                  if (choice.energyCost) totalEnergyDrain += choice.energyCost;
                  if (choice.stressCost) totalStressGain += choice.stressCost;
                });
              }
            });
          }
        });
      }

      // From tasks
      if (Array.isArray(data.tasks)) {
        data.tasks.forEach((task: any) => {
          if (task.energyCost) totalEnergyDrain += task.energyCost;
        });
      }

      // From random events
      if (Array.isArray(data.events)) {
        data.events.forEach((event: any) => {
          if (Array.isArray(event.choices)) {
            event.choices.forEach((choice: any) => {
              if (choice.energyCost) totalEnergyDrain += Math.abs(choice.energyCost);
              if (choice.stressCost) totalStressGain += Math.abs(choice.stressCost);
            });
          }
        });
      }

      return {
        emailCount,
        meetingCount,
        taskCount,
        eventCount,
        totalEnergyDrain,
        totalStressGain,
      };
    } catch (err) {
      console.warn('Failed to parse YAML stats:', err);
      return this.createEmptySummary();
    }
  }

  /**
   * Render the timeline view
   */
  render(): void {
    this.container.innerHTML = `
      <div class="timeline-view">
        <div class="timeline-header">
          <h2>Timeline</h2>
          <div class="timeline-actions">
            <button class="button button-secondary" id="refresh-btn" title="Reload from files">
              🔄 Refresh
            </button>
            <button class="button" id="add-week-btn">+ Add Week</button>
          </div>
        </div>
        <div class="timeline-content">
          ${this.weeks.length === 0
            ? `<div class="empty-state" style="padding: 60px; text-align: center;">
                <p class="text-dim" style="margin-bottom: 20px;">No scenario files found in <code>public/data/stories/scenarios/</code></p>
                <button class="button" id="create-first-day-btn">+ Create First Day</button>
              </div>`
            : this.weeks.map(week => this.renderWeek(week)).join('')
          }
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
    const hasContent = day.summary.emailCount > 0 || day.summary.meetingCount > 0 || day.summary.taskCount > 0;

    return `
      <div class="day-card ${hasContent ? 'has-content' : 'empty'}"
           data-day-id="${day.id}"
           data-file-path="${day.filePath}"
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
    // Refresh button
    this.container.querySelector('#refresh-btn')?.addEventListener('click', () => {
      this.init();
    });

    // Create first day button (empty state)
    this.container.querySelector('#create-first-day-btn')?.addEventListener('click', () => {
      this.createNewDay(1);
    });

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
   * Add a new week - just prompts to create a day for that week
   */
  private addWeek(): void {
    const newWeekNumber = this.weeks.length > 0
      ? Math.max(...this.weeks.map(w => w.number)) + 1
      : 1;

    this.createNewDay(newWeekNumber);
  }

  /**
   * Add a new day to a week
   */
  private addDay(weekNumber: number): void {
    this.createNewDay(weekNumber);
  }

  /**
   * Create a new day file and open it in the editor
   */
  private async createNewDay(weekNumber: number): Promise<void> {
    const dayName = prompt('Enter day name (e.g., Monday, Tuesday):');
    if (!dayName) return;

    const sanitizedName = dayName.toLowerCase().replace(/\s+/g, '-');
    const fileName = `week${weekNumber}-${sanitizedName}.yaml`;
    const filePath = `${SCENARIOS_PATH}/${fileName}`;

    // Create minimal YAML content
    const yamlContent = `# ${dayName} - Week ${weekNumber}
# Created by Story Forge

metadata:
  day: ${dayName}
  week: ${weekNumber}
  difficulty: normal

emails: []

meetings: []

tasks: []

events: []
`;

    try {
      // Write the file to the server
      await fileService.writeFile(filePath, yamlContent);
      console.log(`Created new day file: ${filePath}`);

      // Reload the timeline to show the new file
      await this.loadWeeksFromFiles();
      this.render();

      // Navigate to editor with the new file
      store.setState({
        currentView: 'editor',
        currentDayId: `week${weekNumber}-${sanitizedName}`,
        currentProject: {
          name: `${dayName} (Week ${weekNumber})`,
          filePath: filePath,
        } as any,
      });
    } catch (error) {
      console.error('Failed to create day file:', error);
      alert(`Failed to create file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Edit a day - load its YAML and switch to editor
   */
  private async editDay(dayId: string): Promise<void> {
    // Find the day
    let day: DayReference | undefined;
    for (const week of this.weeks) {
      day = week.days.find(d => d.id === dayId);
      if (day) break;
    }

    if (!day) {
      console.error('Day not found:', dayId);
      return;
    }

    console.log('Opening day:', day.name, 'from', day.filePath);

    // Store the day info and switch to editor
    store.setState({
      currentView: 'editor',
      currentDayId: dayId,
      // Store file path for the editor to load
      currentProject: {
        name: day.name,
        filePath: day.filePath,
      } as any,
    });
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
