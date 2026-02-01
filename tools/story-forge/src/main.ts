/**
 * Story Forge Entry Point
 */

import { App } from './components/App.js';

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

function init(): void {
  const appContainer = document.getElementById('app');
  if (!appContainer) {
    console.error('App container not found');
    return;
  }

  // Initialize app
  new App(appContainer);

  console.log('🎨 Story Forge initialized');
}
