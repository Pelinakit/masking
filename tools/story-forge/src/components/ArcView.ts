/**
 * ArcView Component
 * Story arc tracker for managing narrative threads across days
 */

import { store } from '../state/store.js';
import type { StoryArc } from '../types/index.js';

export class ArcView {
  private container: HTMLElement;
  private arcs: StoryArc[] = [];
  private selectedArcId: string | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.loadArcs();
    this.render();
  }

  /**
   * Load arcs from storage or create defaults
   */
  private loadArcs(): void {
    // Sample arcs for demonstration
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
   * Render the arc view
   */
  render(): void {
    this.container.innerHTML = `
      <div class="arc-view">
        <div class="arc-header">
          <h2>Story Arcs</h2>
          <button class="button" id="add-arc-btn">+ Add Arc</button>
        </div>
        <div class="arc-content">
          <div class="arc-list">
            ${this.arcs.map(arc => this.renderArcCard(arc)).join('')}
          </div>
          ${this.selectedArcId ? this.renderArcEditor() : this.renderEmptyState()}
        </div>
        <div class="arc-validation">
          ${this.renderContinuityChecker()}
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  /**
   * Render an arc card
   */
  private renderArcCard(arc: StoryArc): string {
    const isSelected = this.selectedArcId === arc.id;
    const dayCount = arc.dayIds.length;
    const hasContinuityIssues = this.checkContinuityIssues(arc);

    return `
      <div class="arc-card ${isSelected ? 'selected' : ''}"
           data-arc-id="${arc.id}"
           style="border-left: 4px solid ${arc.color}">
        <div class="arc-card-header">
          <div class="arc-card-title">
            <div class="arc-color-badge" style="background: ${arc.color}"></div>
            <h4>${arc.name}</h4>
          </div>
          ${hasContinuityIssues ? '<span class="arc-warning" title="Continuity issues detected">⚠️</span>' : ''}
        </div>
        <p class="arc-description">${arc.description}</p>
        <div class="arc-stats">
          <span class="arc-stat">📅 ${dayCount} day${dayCount !== 1 ? 's' : ''}</span>
        </div>
      </div>
    `;
  }

  /**
   * Render empty state when no arc selected
   */
  private renderEmptyState(): string {
    return `
      <div class="arc-editor">
        <div class="empty-state">
          <p class="text-dim">Select an arc to edit or create a new one</p>
        </div>
      </div>
    `;
  }

  /**
   * Render arc editor panel
   */
  private renderArcEditor(): string {
    const arc = this.arcs.find(a => a.id === this.selectedArcId);
    if (!arc) return this.renderEmptyState();

    return `
      <div class="arc-editor">
        <div class="editor-header">
          <h3>Edit Arc</h3>
          <button class="button button-secondary" id="delete-arc-btn">
            🗑️ Delete
          </button>
        </div>
        <div class="editor-form">
          <div class="form-group">
            <label for="arc-name">Arc Name</label>
            <input type="text" id="arc-name" value="${arc.name}" />
          </div>
          <div class="form-group">
            <label for="arc-description">Description</label>
            <textarea id="arc-description" rows="3">${arc.description}</textarea>
          </div>
          <div class="form-group">
            <label for="arc-color">Arc Color</label>
            <div class="color-picker-group">
              <input type="color" id="arc-color" value="${arc.color}" />
              <input type="text" id="arc-color-text" value="${arc.color}" readonly />
            </div>
          </div>
          <div class="form-group">
            <label>Assigned Days (${arc.dayIds.length})</label>
            <div class="day-tags">
              ${arc.dayIds.length > 0 ? arc.dayIds.map(dayId => `
                <span class="day-tag" style="border-left: 3px solid ${arc.color}">
                  ${this.formatDayId(dayId)}
                  <button class="tag-remove" data-day-id="${dayId}">×</button>
                </span>
              `).join('') : '<p class="text-dim text-sm">No days assigned yet</p>'}
            </div>
            <button class="button button-secondary" id="assign-days-btn">
              + Assign Days
            </button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render continuity checker
   */
  private renderContinuityChecker(): string {
    const issues = this.getAllContinuityIssues();

    if (issues.length === 0) {
      return `
        <div class="validation-panel success">
          <h3>✅ Continuity Check</h3>
          <p class="text-success">All story arcs have good continuity!</p>
        </div>
      `;
    }

    return `
      <div class="validation-panel warning">
        <h3>⚠️ Continuity Issues (${issues.length})</h3>
        <ul class="validation-list">
          ${issues.map(issue => `
            <li class="validation-item">
              <strong>${issue.arcName}</strong>: ${issue.message}
            </li>
          `).join('')}
        </ul>
      </div>
    `;
  }

  /**
   * Format day ID for display
   */
  private formatDayId(dayId: string): string {
    // Convert "week1-monday" to "Week 1 - Monday"
    const parts = dayId.split('-');
    if (parts.length === 2) {
      const week = parts[0].replace('week', 'Week ');
      const day = parts[1].charAt(0).toUpperCase() + parts[1].slice(1);
      return `${week} - ${day}`;
    }
    return dayId;
  }

  /**
   * Check if an arc has continuity issues
   */
  private checkContinuityIssues(arc: StoryArc): boolean {
    if (arc.dayIds.length < 2) return false;

    // Check for gaps in week/day sequence
    const sorted = this.sortDayIds(arc.dayIds);
    for (let i = 0; i < sorted.length - 1; i++) {
      const current = sorted[i];
      const next = sorted[i + 1];

      if (!this.areConsecutiveDays(current, next)) {
        const gap = this.getDaysBetween(current, next);
        if (gap > 1) {
          return true; // Gap detected
        }
      }
    }

    return false;
  }

  /**
   * Get all continuity issues across all arcs
   */
  private getAllContinuityIssues(): Array<{ arcName: string; message: string }> {
    const issues: Array<{ arcName: string; message: string }> = [];

    this.arcs.forEach(arc => {
      if (arc.dayIds.length === 0) {
        issues.push({
          arcName: arc.name,
          message: 'No days assigned to this arc',
        });
        return;
      }

      if (arc.dayIds.length === 1) {
        issues.push({
          arcName: arc.name,
          message: 'Arc only spans one day',
        });
        return;
      }

      // Check for gaps
      const sorted = this.sortDayIds(arc.dayIds);
      for (let i = 0; i < sorted.length - 1; i++) {
        const current = sorted[i];
        const next = sorted[i + 1];
        const gap = this.getDaysBetween(current, next);

        if (gap > 1) {
          issues.push({
            arcName: arc.name,
            message: `${gap - 1} day gap between ${this.formatDayId(current)} and ${this.formatDayId(next)}`,
          });
        }
      }
    });

    return issues;
  }

  /**
   * Sort day IDs chronologically
   */
  private sortDayIds(dayIds: string[]): string[] {
    return [...dayIds].sort((a, b) => {
      const orderA = this.getDayOrder(a);
      const orderB = this.getDayOrder(b);
      return orderA - orderB;
    });
  }

  /**
   * Get numeric order for a day ID
   */
  private getDayOrder(dayId: string): number {
    // Parse "week1-monday" -> week*7 + dayOfWeek
    const parts = dayId.split('-');
    if (parts.length !== 2) return 0;

    const week = parseInt(parts[0].replace('week', '')) || 1;
    const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const dayIndex = dayNames.indexOf(parts[1].toLowerCase());

    return week * 7 + (dayIndex >= 0 ? dayIndex : 0);
  }

  /**
   * Check if two day IDs are consecutive
   */
  private areConsecutiveDays(dayId1: string, dayId2: string): boolean {
    const order1 = this.getDayOrder(dayId1);
    const order2 = this.getDayOrder(dayId2);
    return Math.abs(order2 - order1) === 1;
  }

  /**
   * Get number of days between two day IDs
   */
  private getDaysBetween(dayId1: string, dayId2: string): number {
    const order1 = this.getDayOrder(dayId1);
    const order2 = this.getDayOrder(dayId2);
    return Math.abs(order2 - order1);
  }

  /**
   * Attach event listeners
   */
  private attachEventListeners(): void {
    // Add arc button
    this.container.querySelector('#add-arc-btn')?.addEventListener('click', () => {
      this.addArc();
    });

    // Arc card selection
    this.container.querySelectorAll('.arc-card').forEach(card => {
      card.addEventListener('click', () => {
        const arcId = (card as HTMLElement).dataset.arcId;
        if (arcId) {
          this.selectedArcId = arcId;
          this.render();
        }
      });
    });

    // Delete arc
    this.container.querySelector('#delete-arc-btn')?.addEventListener('click', () => {
      this.deleteArc();
    });

    // Form inputs
    this.container.querySelector('#arc-name')?.addEventListener('input', (e) => {
      this.updateArc({ name: (e.target as HTMLInputElement).value });
    });

    this.container.querySelector('#arc-description')?.addEventListener('input', (e) => {
      this.updateArc({ description: (e.target as HTMLTextAreaElement).value });
    });

    this.container.querySelector('#arc-color')?.addEventListener('input', (e) => {
      const color = (e.target as HTMLInputElement).value;
      this.updateArc({ color });
      // Update text input
      const textInput = this.container.querySelector('#arc-color-text') as HTMLInputElement;
      if (textInput) textInput.value = color;
    });

    // Assign days
    this.container.querySelector('#assign-days-btn')?.addEventListener('click', () => {
      this.assignDays();
    });

    // Remove day tags
    this.container.querySelectorAll('.tag-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const dayId = (btn as HTMLElement).dataset.dayId;
        if (dayId) this.removeDayFromArc(dayId);
      });
    });
  }

  /**
   * Add a new arc
   */
  private addArc(): void {
    const name = prompt('Enter arc name:');
    if (!name) return;

    const newArc: StoryArc = {
      id: `arc-${Date.now()}`,
      name,
      description: '',
      color: this.getRandomColor(),
      dayIds: [],
    };

    this.arcs.push(newArc);
    this.selectedArcId = newArc.id;
    this.render();

    store.setState({ isDirty: true });
  }

  /**
   * Delete the selected arc
   */
  private deleteArc(): void {
    if (!this.selectedArcId) return;

    if (!confirm('Delete this arc? This cannot be undone.')) return;

    this.arcs = this.arcs.filter(a => a.id !== this.selectedArcId);
    this.selectedArcId = null;
    this.render();

    store.setState({ isDirty: true });
  }

  /**
   * Update arc properties
   */
  private updateArc(updates: Partial<StoryArc>): void {
    const arc = this.arcs.find(a => a.id === this.selectedArcId);
    if (!arc) return;

    Object.assign(arc, updates);

    // Re-render card
    const card = this.container.querySelector(`[data-arc-id="${arc.id}"]`);
    if (card) {
      card.outerHTML = this.renderArcCard(arc);
    }

    // Update continuity checker
    const validationPanel = this.container.querySelector('.arc-validation');
    if (validationPanel) {
      validationPanel.innerHTML = this.renderContinuityChecker();
    }

    this.attachEventListeners();

    store.setState({ isDirty: true });
  }

  /**
   * Assign days to the selected arc
   */
  private assignDays(): void {
    const arc = this.arcs.find(a => a.id === this.selectedArcId);
    if (!arc) return;

    // Simple prompt for now - in production this would be a modal with checkboxes
    const dayIds = prompt('Enter day IDs (comma-separated, e.g., week1-monday,week1-tuesday):');
    if (!dayIds) return;

    const newDayIds = dayIds.split(',').map(id => id.trim()).filter(id => id);
    arc.dayIds = [...new Set([...arc.dayIds, ...newDayIds])]; // Merge and dedupe

    this.render();
    store.setState({ isDirty: true });
  }

  /**
   * Remove a day from the selected arc
   */
  private removeDayFromArc(dayId: string): void {
    const arc = this.arcs.find(a => a.id === this.selectedArcId);
    if (!arc) return;

    arc.dayIds = arc.dayIds.filter(id => id !== dayId);
    this.render();

    store.setState({ isDirty: true });
  }

  /**
   * Get random color for new arc
   */
  private getRandomColor(): string {
    const colors = [
      '#4a9eff', '#10b981', '#f87171', '#fbbf24',
      '#8b5cf6', '#ec4899', '#06b6d4', '#f59e0b',
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  /**
   * Get all arcs for a specific day
   */
  getArcsForDay(dayId: string): StoryArc[] {
    return this.arcs.filter(arc => arc.dayIds.includes(dayId));
  }

  /**
   * Destroy view
   */
  destroy(): void {
    // Cleanup
  }
}
