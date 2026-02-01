/**
 * Story Forge Entry Point
 */

import { App } from './components/App.js';
import { entityRegistry } from './services/EntityRegistry.js';

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

async function init(): Promise<void> {
  const appContainer = document.getElementById('app');
  if (!appContainer) {
    console.error('App container not found');
    return;
  }

  // Initialize entity registry first
  await entityRegistry.init();

  // Initialize app
  new App(appContainer);

  console.log('🎨 Story Forge initialized');
}
