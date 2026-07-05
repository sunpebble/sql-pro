/**
 * Quarry API
 *
 * This module provides a unified API for the application.
 * In Electron, it uses the preload-exposed window.quarry API.
 */

import { isMockMode, mockQuarryAPI } from './mock-api';

// Get the appropriate API based on mode
const getAPI = () => {
  if (isMockMode()) {
    return mockQuarryAPI;
  }
  // In Electron, the API is exposed via preload
  return window.quarry;
};

// Create a lazy proxy that defers API resolution
export const quarry = new Proxy({} as typeof window.quarry, {
  get(_target, prop: string) {
    const api = getAPI();
    const value = api[prop as keyof typeof api];
    // If the property is an object (like db, dialog, etc.), wrap it in a proxy too
    if (typeof value === 'object' && value !== null) {
      return new Proxy(value, {
        get(_t, p: string) {
          return (
            getAPI()[prop as keyof typeof api] as Record<string, unknown>
          )[p];
        },
      });
    }
    return value;
  },
});

// Export for direct access when needed
export { getAPI };
