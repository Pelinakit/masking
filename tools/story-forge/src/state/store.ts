/**
 * Central State Store
 *
 * Simple event-driven state management with undo/redo support
 */

import type { AppState, HistoryEntry } from '../types/index.js';

type StateListener = (state: AppState) => void;

const MAX_HISTORY = 50;

class Store {
  private state: AppState;
  private listeners: Set<StateListener> = new Set();

  constructor() {
    this.state = this.getInitialState();
  }

  private getInitialState(): AppState {
    return {
      currentView: 'timeline',
      currentProject: null,
      currentDayId: null,
      currentGraph: null,
      selectedNodeId: null,
      clipboard: null,
      history: [],
      historyIndex: -1,
      isDirty: false,
    };
  }

  /**
   * Get current state (read-only)
   */
  getState(): Readonly<AppState> {
    return this.state;
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Update state with optional history entry
   */
  setState(partial: Partial<AppState>, action?: string): void {
    const prevState = { ...this.state };
    this.state = { ...this.state, ...partial, isDirty: true };

    // Add to history if action is provided
    if (action) {
      this.addToHistory(action, partial);
    }

    // Notify listeners
    this.notifyListeners();
  }

  /**
   * Add entry to history
   */
  private addToHistory(action: string, partial: Partial<AppState>): void {
    const entry: HistoryEntry = {
      timestamp: Date.now(),
      action,
      state: partial,
    };

    // Truncate history if we're not at the end
    const history = this.state.history.slice(0, this.state.historyIndex + 1);

    // Add new entry
    history.push(entry);

    // Limit history size
    if (history.length > MAX_HISTORY) {
      history.shift();
    }

    this.state.history = history;
    this.state.historyIndex = history.length - 1;
  }

  /**
   * Undo last action
   */
  undo(): boolean {
    if (this.state.historyIndex <= 0) {
      return false;
    }

    this.state.historyIndex--;
    const entry = this.state.history[this.state.historyIndex];

    // Revert to previous state
    this.state = { ...this.state, ...entry.state };
    this.notifyListeners();

    return true;
  }

  /**
   * Redo last undone action
   */
  redo(): boolean {
    if (this.state.historyIndex >= this.state.history.length - 1) {
      return false;
    }

    this.state.historyIndex++;
    const entry = this.state.history[this.state.historyIndex];

    // Apply next state
    this.state = { ...this.state, ...entry.state };
    this.notifyListeners();

    return true;
  }

  /**
   * Clear dirty flag
   */
  markClean(): void {
    this.state.isDirty = false;
    this.notifyListeners();
  }

  /**
   * Reset to initial state
   */
  reset(): void {
    this.state = this.getInitialState();
    this.notifyListeners();
  }

  /**
   * Notify all listeners of state change
   */
  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener(this.state));
  }
}

export const store = new Store();
