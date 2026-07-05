import * as React from 'react';

import ReactDOM from 'react-dom/client';
import App from '@/App';
// Install global shims FIRST, before any renderer code runs. Some renderer
// modules access window.quarry directly (not via the quarry proxy), so the
// mock API must be on the window object before side-effect store imports.
import { mockQuarryAPI } from '@/lib/mock-api';
import { hydrateStores, initializeStorage } from '@/lib/storage';
import { initializeTableOrganizationStore } from '@/stores/table-organization-store';

import '@/styles/globals.css';

import '@/lib/i18n';
import '@/stores/connection-store';
import '@/stores/diagram-store';
import '@/stores/settings-store';
import '@/stores/onboarding-store';

window.quarry = mockQuarryAPI;
window.electronAPI = { platform: 'browser' } as any;

async function bootstrap() {
  let initError: Error | null = null;
  try {
    await initializeStorage();
    hydrateStores();
    await initializeTableOrganizationStore();
  } catch (error) {
    console.error('Failed to initialize:', error);
    initError = error as Error;
  }

  const root = document.getElementById('root')!;

  if (initError) {
    ReactDOM.createRoot(root).render(
      <React.StrictMode>
        <div style={{ padding: 32, fontFamily: 'system-ui, sans-serif' }}>
          <h1>Initialization Error</h1>
          <p>Quarry Web failed to start. Please reload the page.</p>
          <pre style={{ color: '#ef4444' }}>{initError.message}</pre>
        </div>
      </React.StrictMode>
    );
    return;
  }

  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

bootstrap();
