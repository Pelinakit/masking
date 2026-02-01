/**
 * Root Application Component
 */

import { store } from '../state/store.js';
import type { ViewType } from '../types/index.js';
import { fileService } from '../services/FileService.js';
import { keyboardShortcuts } from '../services/KeyboardShortcuts.js';
import { autoSave } from '../services/AutoSave.js';
import { themeManager } from '../services/ThemeManager.js';
import { NodeEditorView } from './NodeEditorView.js';
import { TimelineView } from './TimelineView.js';
import { CharacterView } from './CharacterView.js';
import { ArcView } from './ArcView.js';
import { AssetView } from './AssetView.js';
import { ValidationView } from './ValidationView.js';

export class App {
  private container: HTMLElement;
  private currentView: any = null;
  private currentViewType: ViewType | null = null;

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

    // Initialize services
    keyboardShortcuts; // Singleton auto-initializes
    autoSave; // Singleton auto-initializes
    themeManager; // Singleton auto-initializes

    // Listen for keyboard save event
    window.addEventListener('keyboard-save', () => {
      this.handleSave();
    });

    // Subscribe to state changes - only re-render when view changes or on initial render
    store.subscribe((state) => {
      // Only full re-render if view changed
      if (state.currentView !== this.currentViewType) {
        this.render();
      } else {
        // Just update header (save button state, etc.)
        this.updateHeader();
      }
    });

    // Initial render
    this.render();
  }

  /**
   * Update just the header without re-rendering the whole app
   */
  private updateHeader(): void {
    const state = store.getState();
    const saveBtn = this.container.querySelector('#save-btn') as HTMLButtonElement;
    if (saveBtn) {
      saveBtn.disabled = !state.isDirty;
    }
  }

  private render(): void {
    const state = store.getState();
    const themeIcon = themeManager.getThemeIcon();

    this.container.innerHTML = `
      <div class="app-header">
        <h1 class="app-title">🎨 Story Forge</h1>
        <div class="app-actions">
          <button class="button button-secondary" id="theme-btn" title="Toggle theme">
            ${themeIcon}
          </button>
          <button class="button button-secondary" id="save-btn" ${state.isDirty ? '' : 'disabled'} title="Save (Ctrl+S)">
            💾 Save
          </button>
          <button class="button button-secondary" id="shortcuts-btn" title="Keyboard shortcuts (Shift+?)">
            ⌨️
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
          <div class="sidebar-footer">
            <div class="auto-save-indicator">
              <span class="status-dot ${state.isDirty ? 'unsaved' : 'saved'}"></span>
              <span class="status-text">${state.isDirty ? 'Unsaved changes' : 'All changes saved'}</span>
            </div>
          </div>
        </aside>
        <main class="main-view" id="main-view">
          ${this.renderViewPlaceholder(state.currentView)}
        </main>
      </div>
    `;

    this.attachEventListeners();
    this.renderDynamicView(state.currentView);
    this.currentViewType = state.currentView;
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

  private renderViewPlaceholder(view: ViewType): string {
    // Return empty div for all views that need component instances
    return '<div id="dynamic-view-container" style="width: 100%; height: 100%;"></div>';
  }

  private renderDynamicView(view: ViewType): void {
    // Cleanup previous view
    if (this.currentView && typeof this.currentView.destroy === 'function') {
      this.currentView.destroy();
      this.currentView = null;
    }

    const container = this.container.querySelector('#dynamic-view-container');
    if (!container) return;

    // Render new view
    if (view === 'timeline') {
      this.currentView = new TimelineView(container as HTMLElement);
    } else if (view === 'editor') {
      this.currentView = new NodeEditorView(container as HTMLElement);
    } else if (view === 'characters') {
      this.currentView = new CharacterView(container as HTMLElement);
    } else if (view === 'arcs') {
      this.currentView = new ArcView(container as HTMLElement);
    } else if (view === 'assets') {
      this.currentView = new AssetView(container as HTMLElement);
    } else if (view === 'validate') {
      this.currentView = new ValidationView(container as HTMLElement);
    }
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

    // Theme toggle button
    const themeBtn = this.container.querySelector('#theme-btn');
    themeBtn?.addEventListener('click', () => {
      themeManager.toggle();
      this.render();
    });

    // Shortcuts button
    const shortcutsBtn = this.container.querySelector('#shortcuts-btn');
    shortcutsBtn?.addEventListener('click', () => {
      this.showShortcuts();
    });

    // Settings button
    const settingsBtn = this.container.querySelector('#settings-btn');
    settingsBtn?.addEventListener('click', () => {
      this.showSettings();
    });
  }

  private async handleSave(): Promise<void> {
    try {
      const state = store.getState();
      if (!state.isDirty) return;

      console.log('Saving project...');

      // In a real implementation, this would save to the server
      // For now, we just mark as clean (auto-save handles localStorage)
      store.markClean();

      // Show brief notification
      const saveBtn = this.container.querySelector('#save-btn');
      if (saveBtn) {
        const originalText = saveBtn.textContent;
        saveBtn.textContent = '✓ Saved';
        setTimeout(() => {
          if (saveBtn.textContent === '✓ Saved') {
            saveBtn.textContent = originalText;
          }
        }, 2000);
      }
    } catch (error) {
      console.error('Save failed:', error);
      alert('Failed to save project');
    }
  }

  private showShortcuts(): void {
    const shortcuts = keyboardShortcuts.getShortcuts();
    const helpText = shortcuts
      .map(s => {
        const keys: string[] = [];
        if (s.ctrl) keys.push('Ctrl');
        if (s.shift) keys.push('Shift');
        if (s.alt) keys.push('Alt');
        keys.push(s.key.toUpperCase());
        return `${keys.join('+')} - ${s.description}`;
      })
      .join('\n');

    alert(`Keyboard Shortcuts:\n\n${helpText}`);
  }

  private showSettings(): void {
    const age = autoSave.getAutoSaveAge();
    const ageText = age !== null ? `Last auto-save: ${age} minute(s) ago` : 'No auto-save';

    alert(`Story Forge Settings\n\n` +
      `Theme: ${themeManager.getTheme()}\n` +
      `Auto-save: Enabled (30s interval)\n` +
      `${ageText}\n\n` +
      `Use the theme button (☀️/🌙) to toggle dark/light mode.\n` +
      `Press Shift+? to view keyboard shortcuts.`);
  }
}
