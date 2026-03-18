import * as React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App';
import { hydrateStores, initializeStorage } from '@/lib/storage';
import { initializeTableOrganizationStore } from '@/stores/table-organization-store';

import '@/styles/globals.css';

import '@/lib/i18n';
import '@/stores/connection-store';
import '@/stores/diagram-store';
import '@/stores/settings-store';
import '@/stores/onboarding-store';

async function bootstrap() {
  try {
    await initializeStorage();
    hydrateStores();
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
