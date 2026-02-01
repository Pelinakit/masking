/**
 * Root Application Component
 */

import { store } from '../state/store.js';
import type { ViewType } from '../types/index.js';
import { fileService } from '../services/FileService.js';

export class App {
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
    this.init();
  }

  private async init(): Promise<void> {
    // Check server connectivity
    const serverReachable = await fileService.ping();
    if (!serverReachable) {
      this.renderError('Cannot connect to server. Make sure the Story Forge server is running.');
      return;
    }

    // Subscribe to state changes
    store.subscribe(() => this.render());

    // Initial render
    this.render();
  }

  private render(): void {
    const state = store.getState();

    this.container.innerHTML = `
      <div class="app-header">
        <h1 class="app-title">🎨 Story Forge</h1>
        <div class="app-actions">
          <button class="button button-secondary" id="save-btn" ${state.isDirty ? '' : 'disabled'}>
            💾 Save
          </button>
          <button class="button button-secondary" id="settings-btn">
            ⚙️
          </button>
        </div>
      </div>
      <div class="app-content">
        <aside class="sidebar">
          <ul class="sidebar-nav">
            ${this.renderNavItem('timeline', '📅 Timeline')}
            ${this.renderNavItem('editor', '📝 Editor')}
            ${this.renderNavItem('characters', '🐱 Characters')}
            ${this.renderNavItem('arcs', '📖 Story Arcs')}
            ${this.renderNavItem('assets', '🖼️ Assets')}
            ${this.renderNavItem('validate', '✅ Validate')}
          </ul>
        </aside>
        <main class="main-view" id="main-view">
          ${this.renderView(state.currentView)}
        </main>
      </div>
    `;

    this.attachEventListeners();
  }

  private renderNavItem(view: ViewType, label: string): string {
    const state = store.getState();
    const isActive = state.currentView === view;
    return `
      <li>
        <button class="${isActive ? 'active' : ''}" data-view="${view}">
          ${label}
        </button>
      </li>
    `;
  }

  private renderView(view: ViewType): string {
    switch (view) {
      case 'timeline':
        return this.renderTimelineView();
      case 'editor':
        return this.renderEditorView();
      case 'characters':
        return this.renderCharactersView();
      case 'arcs':
        return this.renderArcsView();
      case 'assets':
        return this.renderAssetsView();
      case 'validate':
        return this.renderValidateView();
      default:
        return '<p>View not implemented</p>';
    }
  }

  private renderTimelineView(): string {
    return `
      <div class="panel">
        <div class="panel-header">
          <h2 class="panel-title">Timeline</h2>
        </div>
        <p class="text-dim">Timeline view will show week/day grid here.</p>
        <p class="text-sm text-dim" style="margin-top: 16px;">
          This is where you'll organize your game days into weeks and see an overview of content.
        </p>
      </div>
    `;
  }

  private renderEditorView(): string {
    return `
      <div class="panel">
        <div class="panel-header">
          <h2 class="panel-title">Node Editor</h2>
        </div>
        <p class="text-dim">Node editor canvas will appear here.</p>
        <p class="text-sm text-dim" style="margin-top: 16px;">
          This is where you'll create dialogue trees using a visual node interface.
        </p>
      </div>
    `;
  }

  private renderCharactersView(): string {
    return `
      <div class="panel">
        <div class="panel-header">
          <h2 class="panel-title">Character Database</h2>
        </div>
        <p class="text-dim">Character management will appear here.</p>
        <p class="text-sm text-dim" style="margin-top: 16px;">
          Manage NPCs, configure voices, and set up relationships.
        </p>
      </div>
    `;
  }

  private renderArcsView(): string {
    return `
      <div class="panel">
        <div class="panel-header">
          <h2 class="panel-title">Story Arcs</h2>
        </div>
        <p class="text-dim">Story arc tracker will appear here.</p>
        <p class="text-sm text-dim" style="margin-top: 16px;">
          Track narrative threads across multiple days and ensure continuity.
        </p>
      </div>
    `;
  }

  private renderAssetsView(): string {
    return `
      <div class="panel">
        <div class="panel-header">
          <h2 class="panel-title">Asset Manager</h2>
        </div>
        <p class="text-dim">Asset browser will appear here.</p>
        <p class="text-sm text-dim" style="margin-top: 16px;">
          Browse sprites, backgrounds, and sounds. Drag them into your scenes.
        </p>
      </div>
    `;
  }

  private renderValidateView(): string {
    return `
      <div class="panel">
        <div class="panel-header">
          <h2 class="panel-title">Validation</h2>
        </div>
        <p class="text-dim">Validation results will appear here.</p>
        <p class="text-sm text-dim" style="margin-top: 16px;">
          Check for errors, missing assets, and dead ends in your content.
        </p>
      </div>
    `;
  }

  private renderError(message: string): void {
    this.container.innerHTML = `
      <div class="loading">
        <p class="text-error" style="font-size: 18px;">⚠️ ${message}</p>
        <button class="button" onclick="location.reload()">Retry</button>
      </div>
    `;
  }

  private attachEventListeners(): void {
    // Navigation
    this.container.querySelectorAll('[data-view]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const view = btn.getAttribute('data-view') as ViewType;
        store.setState({ currentView: view });
      });
    });

    // Save button
    const saveBtn = this.container.querySelector('#save-btn');
    saveBtn?.addEventListener('click', () => {
      this.handleSave();
    });

    // Settings button
    const settingsBtn = this.container.querySelector('#settings-btn');
    settingsBtn?.addEventListener('click', () => {
      alert('Settings panel coming soon!');
    });
  }

  private async handleSave(): Promise<void> {
    try {
      // TODO: Implement actual save logic
      console.log('Saving project...');
      store.markClean();
      alert('Project saved!');
    } catch (error) {
      console.error('Save failed:', error);
      alert('Failed to save project');
    }
  }
}
