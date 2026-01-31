/**
 * StateManager
 * Game Logic layer - manages game state and persistence
 */

export interface GameState {
  currentScene: string;
  playerStats: {
    energy: number;
    stress: number;
    masking: number;
  };
  progress: {
    currentDay: number;
    completedScenarios: string[];
  };
}

export class StateManager {
  private static readonly STORAGE_KEY = 'masking-game-state';
  private state: GameState;

  constructor() {
    this.state = this.loadState();
  }

  private getDefaultState(): GameState {
    return {
      currentScene: 'boot',
      playerStats: {
        energy: 100,
        stress: 0,
        masking: 0,
      },
      progress: {
        currentDay: 1,
        completedScenarios: [],
      },
    };
  }

  private loadState(): GameState {
    try {
      const saved = localStorage.getItem(StateManager.STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.warn('Failed to load state from localStorage:', error);
    }
    return this.getDefaultState();
  }

  saveState(): void {
    try {
      localStorage.setItem(StateManager.STORAGE_KEY, JSON.stringify(this.state));
    } catch (error) {
      console.error('Failed to save state to localStorage:', error);
    }
  }

  getState(): GameState {
    return { ...this.state };
  }

  updateState(partial: Partial<GameState>): void {
    this.state = { ...this.state, ...partial };
    this.saveState();
  }

  reset(): void {
    this.state = this.getDefaultState();
    this.saveState();
  }
}
