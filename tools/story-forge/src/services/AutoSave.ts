/**
 * Auto-Save Service
 * Automatic saving to localStorage with debouncing
 */

import { store } from '../state/store.js';
import type { AppState } from '../types/index.js';

const AUTO_SAVE_KEY = 'story-forge-autosave';
const AUTO_SAVE_INTERVAL = 30000; // 30 seconds
const DEBOUNCE_DELAY = 2000; // 2 seconds

export class AutoSave {
  private debounceTimer: number | null = null;
  private intervalTimer: number | null = null;
  private lastSaveTime: number = 0;
  private enabled: boolean = true;

  constructor() {
    this.init();
  }

  /**
   * Initialize auto-save
   */
  private init(): void {
    // Subscribe to state changes
    store.subscribe(() => {
      if (this.enabled) {
        this.scheduleAutoSave();
      }
    });

    // Set up periodic auto-save
    this.startPeriodicSave();

    // Load auto-saved state on init
    this.restore();

    // Save on page unload
    window.addEventListener('beforeunload', () => {
      this.saveImmediate();
    });

    console.log('Auto-save enabled (30s interval, 2s debounce)');
  }

  /**
   * Schedule debounced auto-save
   */
  private scheduleAutoSave(): void {
    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = window.setTimeout(() => {
      this.saveImmediate();
      this.debounceTimer = null;
    }, DEBOUNCE_DELAY);
  }

  /**
   * Start periodic auto-save
   */
  private startPeriodicSave(): void {
    this.intervalTimer = window.setInterval(() => {
      const state = store.getState();
      if (state.isDirty) {
        this.saveImmediate();
      }
    }, AUTO_SAVE_INTERVAL);
  }

  /**
   * Stop periodic auto-save
   */
  private stopPeriodicSave(): void {
    if (this.intervalTimer !== null) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
  }

  /**
   * Save immediately
   */
  private saveImmediate(): void {
    const state = store.getState();

    try {
      const saveData = {
        timestamp: Date.now(),
        state: {
          currentView: state.currentView,
          currentDayId: state.currentDayId,
          currentGraph: state.currentGraph,
          isDirty: state.isDirty,
        },
      };

      localStorage.setItem(AUTO_SAVE_KEY, JSON.stringify(saveData));
      this.lastSaveTime = Date.now();

      console.log('Auto-saved to localStorage');
    } catch (error) {
      console.error('Auto-save failed:', error);

      // Check if quota exceeded
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.warn('localStorage quota exceeded, clearing old auto-saves');
        this.clearOldSaves();
      }
    }
  }

  /**
   * Restore auto-saved state
   */
  restore(): boolean {
    try {
      const saved = localStorage.getItem(AUTO_SAVE_KEY);
      if (!saved) {
        console.log('No auto-save found');
        return false;
      }

      const data = JSON.parse(saved);
      const age = Date.now() - data.timestamp;
      const ageMinutes = Math.floor(age / 60000);

      console.log(`Found auto-save from ${ageMinutes} minute(s) ago`);

      // Only restore if less than 24 hours old
      if (age > 24 * 60 * 60 * 1000) {
        console.log('Auto-save too old, ignoring');
        return false;
      }

      // Ask user if they want to restore
      if (confirm(`Restore auto-saved work from ${ageMinutes} minute(s) ago?`)) {
        store.setState(data.state);
        console.log('Auto-save restored');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to restore auto-save:', error);
      return false;
    }
  }

  /**
   * Clear auto-save
   */
  clear(): void {
    localStorage.removeItem(AUTO_SAVE_KEY);
    console.log('Auto-save cleared');
  }

  /**
   * Clear old saves to free up space
   */
  private clearOldSaves(): void {
    // Clear auto-save
    this.clear();

    // Clear other old data (you can expand this)
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('story-forge-') && key !== AUTO_SAVE_KEY) {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '{}');
          if (data.timestamp && Date.now() - data.timestamp > 7 * 24 * 60 * 60 * 1000) {
            localStorage.removeItem(key);
            console.log(`Cleared old save: ${key}`);
          }
        } catch (e) {
          // Not JSON, skip
        }
      }
    });
  }

  /**
   * Enable auto-save
   */
  enable(): void {
    this.enabled = true;
    this.startPeriodicSave();
    console.log('Auto-save enabled');
  }

  /**
   * Disable auto-save
   */
  disable(): void {
    this.enabled = false;
    this.stopPeriodicSave();
    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    console.log('Auto-save disabled');
  }

  /**
   * Get last save time
   */
  getLastSaveTime(): number {
    return this.lastSaveTime;
  }

  /**
   * Get auto-save age in minutes
   */
  getAutoSaveAge(): number | null {
    try {
      const saved = localStorage.getItem(AUTO_SAVE_KEY);
      if (!saved) return null;

      const data = JSON.parse(saved);
      const age = Date.now() - data.timestamp;
      return Math.floor(age / 60000);
    } catch {
      return null;
    }
  }
}

// Export singleton instance
export const autoSave = new AutoSave();
