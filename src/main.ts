/**
 * Main entry point
 * Initializes the game engine
 */

import { GameEngine } from '@core/GameEngine';
import './style.css';

// Initialize game when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  const gameEngine = new GameEngine({
    containerId: 'game-container',
    width: 1920,
    height: 1080,
  });

  gameEngine.initialize();

  // Expose to window for debugging
  (window as any).gameEngine = gameEngine;
});
