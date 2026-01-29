import * as React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
// Import storage utilities
import { hydrateStores, initializeStorage } from './lib/storage';

import { initializeTableOrganizationStore } from './stores/table-organization-store';

import './styles/globals.css';

// Initialize i18n (must be before any components that use translations)
import './lib/i18n';
// Initialize stores (they register their hydrators on import)
import './stores/connection-store';
import './stores/diagram-store';
import './stores/settings-store';
import './stores/onboarding-store';

// Initialize Tauri storage and bootstrap the app
async function bootstrap() {
  try {
    // Initialize storage and load persisted data
    await initializeStorage();

    // Hydrate Zustand stores with persisted data
    hydrateStores();

    // Initialize table organization store (separate from hydration system)
    await initializeTableOrganizationStore();
  } catch (error) {
    console.error('Failed to initialize:', error);
  }

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

bootstrap();
