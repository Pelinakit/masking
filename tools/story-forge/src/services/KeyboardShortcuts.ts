/**
 * Keyboard Shortcuts Service
 * Global keyboard shortcut handling for Story Forge
 */

import { store } from '../state/store.js';

type ShortcutHandler = (event: KeyboardEvent) => void;

interface Shortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  handler: ShortcutHandler;
  description: string;
}

export class KeyboardShortcuts {
  private shortcuts: Map<string, Shortcut> = new Map();
  private enabled: boolean = true;

  constructor() {
    this.registerDefaultShortcuts();
    this.attachGlobalListener();
  }

  /**
   * Register default shortcuts
   */
  private registerDefaultShortcuts(): void {
    // Save
    this.register({
      key: 's',
      ctrl: true,
      description: 'Save project',
      handler: (e) => {
        e.preventDefault();
        this.handleSave();
      },
    });

    // Undo
    this.register({
      key: 'z',
      ctrl: true,
      description: 'Undo last action',
      handler: (e) => {
        e.preventDefault();
        this.handleUndo();
      },
    });

    // Redo
    this.register({
      key: 'y',
      ctrl: true,
      description: 'Redo last undone action',
      handler: (e) => {
        e.preventDefault();
        this.handleRedo();
      },
    });

    // New node (in editor)
    this.register({
      key: 'n',
      ctrl: true,
      description: 'Create new node (in editor)',
      handler: (e) => {
        e.preventDefault();
        this.handleNewNode();
      },
    });

    // Delete (in editor)
    this.register({
      key: 'Delete',
      description: 'Delete selected node',
      handler: (e) => {
        e.preventDefault();
        this.handleDelete();
      },
    });

    // Copy
    this.register({
      key: 'c',
      ctrl: true,
      description: 'Copy selected node',
      handler: (e) => {
        e.preventDefault();
        this.handleCopy();
      },
    });

    // Paste
    this.register({
      key: 'v',
      ctrl: true,
      description: 'Paste copied node',
      handler: (e) => {
        e.preventDefault();
        this.handlePaste();
      },
    });

    // Search
    this.register({
      key: 'f',
      ctrl: true,
      description: 'Focus search',
      handler: (e) => {
        e.preventDefault();
        this.handleSearch();
      },
    });

    // Help
    this.register({
      key: '?',
      shift: true,
      description: 'Show keyboard shortcuts',
      handler: (e) => {
        e.preventDefault();
        this.showHelp();
      },
    });
  }

  /**
   * Register a keyboard shortcut
   */
  register(shortcut: Shortcut): void {
    const key = this.getShortcutKey(shortcut);
    this.shortcuts.set(key, shortcut);
  }

  /**
   * Unregister a shortcut
   */
  unregister(key: string, ctrl?: boolean, shift?: boolean, alt?: boolean): void {
    const shortcutKey = this.getShortcutKey({ key, ctrl, shift, alt } as Shortcut);
    this.shortcuts.delete(shortcutKey);
  }

  /**
   * Get shortcut key string
   */
  private getShortcutKey(shortcut: { key: string; ctrl?: boolean; shift?: boolean; alt?: boolean }): string {
    const parts: string[] = [];
    if (shortcut.ctrl) parts.push('ctrl');
    if (shortcut.shift) parts.push('shift');
    if (shortcut.alt) parts.push('alt');
    parts.push(shortcut.key.toLowerCase());
    return parts.join('+');
  }

  /**
   * Attach global keyboard listener
   */
  private attachGlobalListener(): void {
    document.addEventListener('keydown', (e) => {
      if (!this.enabled) return;

      // Don't trigger shortcuts when typing in inputs
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        // Allow Ctrl+S even in inputs
        if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          this.handleSave();
        }
        return;
      }

      const key = this.getShortcutKey({
        key: e.key,
        ctrl: e.ctrlKey || e.metaKey,
        shift: e.shiftKey,
        alt: e.altKey,
      });

      const shortcut = this.shortcuts.get(key);
      if (shortcut) {
        shortcut.handler(e);
      }
    });
  }

  /**
   * Handle save
   */
  private handleSave(): void {
    const state = store.getState();
    if (!state.isDirty) return;

    console.log('Keyboard shortcut: Save');
    // Trigger save event
    window.dispatchEvent(new CustomEvent('keyboard-save'));
  }

  /**
   * Handle undo
   */
  private handleUndo(): void {
    console.log('Keyboard shortcut: Undo');
    const success = store.undo();
    if (success) {
      console.log('Undo successful');
    } else {
      console.log('Nothing to undo');
    }
  }

  /**
   * Handle redo
   */
  private handleRedo(): void {
    console.log('Keyboard shortcut: Redo');
    const success = store.redo();
    if (success) {
      console.log('Redo successful');
    } else {
      console.log('Nothing to redo');
    }
  }

  /**
   * Handle new node
   */
  private handleNewNode(): void {
    const state = store.getState();
    if (state.currentView !== 'editor') return;

    console.log('Keyboard shortcut: New node');
    window.dispatchEvent(new CustomEvent('keyboard-new-node'));
  }

  /**
   * Handle delete
   */
  private handleDelete(): void {
    const state = store.getState();
    if (state.currentView !== 'editor' || !state.selectedNodeId) return;

    console.log('Keyboard shortcut: Delete');
    window.dispatchEvent(new CustomEvent('keyboard-delete'));
  }

  /**
   * Handle copy
   */
  private handleCopy(): void {
    const state = store.getState();
    if (state.currentView !== 'editor' || !state.selectedNodeId) return;

    console.log('Keyboard shortcut: Copy');
    window.dispatchEvent(new CustomEvent('keyboard-copy'));
  }

  /**
   * Handle paste
   */
  private handlePaste(): void {
    const state = store.getState();
    if (state.currentView !== 'editor' || !state.clipboard) return;

    console.log('Keyboard shortcut: Paste');
    window.dispatchEvent(new CustomEvent('keyboard-paste'));
  }

  /**
   * Handle search
   */
  private handleSearch(): void {
    console.log('Keyboard shortcut: Search');
    const searchInput = document.querySelector('#asset-search-input') as HTMLInputElement;
    if (searchInput) {
      searchInput.focus();
      searchInput.select();
    }
  }

  /**
   * Show help dialog
   */
  private showHelp(): void {
    const shortcuts = Array.from(this.shortcuts.values());
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

  /**
   * Enable shortcuts
   */
  enable(): void {
    this.enabled = true;
  }

  /**
   * Disable shortcuts
   */
  disable(): void {
    this.enabled = false;
  }

  /**
   * Get all shortcuts
   */
  getShortcuts(): Shortcut[] {
    return Array.from(this.shortcuts.values());
  }
}

// Export singleton instance
export const keyboardShortcuts = new KeyboardShortcuts();
