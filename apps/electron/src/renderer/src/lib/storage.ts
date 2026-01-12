/**
 * Electron Store Persistence Utility for Zustand
 *
 * Provides centralized persistence for renderer state via Electron's IPC.
 */

import type {
  RendererConnectionState,
  RendererDiagramState,
  RendererOnboardingState,
  RendererPanelWidths,
  RendererSettingsState,
  RendererStoreSchema,
} from '@shared/types/renderer-store';

// Re-export types for compatibility
export type {
  RendererConnectionState,
  RendererDiagramState,
  RendererOnboardingState,
  RendererPanelWidths,
  RendererSettingsState,
  RendererStoreSchema,
};

// ============ Cache for loaded data ============

interface StorageCache {
  settings: RendererSettingsState | null;
  diagram: RendererDiagramState | null;
  panelWidths: RendererPanelWidths | null;
  connectionUi: RendererConnectionState | null;
  onboarding: RendererOnboardingState | null;
}

const cache: StorageCache = {
  settings: null,
  diagram: null,
  panelWidths: null,
  connectionUi: null,
  onboarding: null,
};

let initialized = false;

/**
 * Initialize storage by loading all data from Electron's renderer store.
 * Call this early in app startup before accessing any cached data.
 * Includes retry logic to handle race condition where IPC handlers
 * may not be fully registered when new windows start.
 */
export async function initializeStorage(): Promise<void> {
  if (initialized) return;

  // Check if Electron APIs are available before attempting storage initialization
  if (!isElectronEnvironment()) {
    console.warn(
      '[Storage] Electron APIs not available, skipping storage initialization'
    );
    initialized = true;
    return;
  }

  const maxRetries = 5;
  const retryDelayMs = 100;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const keys: (keyof RendererStoreSchema)[] = [
        'settings',
        'diagram',
        'panelWidths',
        'connectionUi',
        'onboarding',
      ];

      await Promise.all(
        keys.map(async (key) => {
          const result = await window.sqlPro.rendererStore.get({ key });
          if (result.success && result.data !== undefined) {
            switch (key) {
              case 'settings':
                cache.settings = result.data as RendererSettingsState;
                break;
              case 'diagram':
                cache.diagram = result.data as RendererDiagramState;
                break;
              case 'panelWidths':
                cache.panelWidths = result.data as RendererPanelWidths;
                break;
              case 'connectionUi':
                cache.connectionUi = result.data as RendererConnectionState;
                break;
              case 'onboarding':
                cache.onboarding = result.data as RendererOnboardingState;
                break;
            }
          }
        })
      );

      initialized = true;
      return; // Success, exit retry loop
    } catch (error) {
      if (attempt < maxRetries - 1) {
        // Wait before retrying with exponential backoff
        await new Promise((resolve) =>
          setTimeout(resolve, retryDelayMs * 2 ** attempt)
        );
      } else {
        console.error('Failed to initialize storage after retries:', error);
        initialized = true; // Mark as initialized to prevent infinite retries
      }
    }
  }
}

/**
 * Check if storage has been initialized
 */
export function isStorageInitialized(): boolean {
  return initialized;
}

/**
 * Helper to check if running in Electron environment
 */
export function isElectronEnvironment(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.sqlPro !== 'undefined' &&
    typeof window.electronAPI !== 'undefined'
  );
}

// ============ Getters ============

export function getCachedSettings(): RendererSettingsState | null {
  return cache.settings;
}

export function getCachedDiagram(): RendererDiagramState | null {
  return cache.diagram;
}

export function getCachedPanelWidths(): RendererPanelWidths | null {
  return cache.panelWidths;
}

export function getCachedConnectionUi(): RendererConnectionState | null {
  return cache.connectionUi;
}

export function getCachedOnboarding(): RendererOnboardingState | null {
  return cache.onboarding;
}

// ============ Persistence Functions ============

export function persistSettings(settings: RendererSettingsState): void {
  cache.settings = settings;
  if (!isElectronEnvironment()) return;
  window.sqlPro.rendererStore
    .set({ key: 'settings', value: settings })
    .catch((error: unknown) => {
      console.error('Failed to persist settings:', error);
    });
}

export function persistDiagram(diagram: RendererDiagramState): void {
  cache.diagram = diagram;
  if (!isElectronEnvironment()) return;
  window.sqlPro.rendererStore
    .set({ key: 'diagram', value: diagram })
    .catch((error: unknown) => {
      console.error('Failed to persist diagram:', error);
    });
}

export function persistPanelWidths(panelWidths: RendererPanelWidths): void {
  cache.panelWidths = panelWidths;
  if (!isElectronEnvironment()) return;
  window.sqlPro.rendererStore
    .set({ key: 'panelWidths', value: panelWidths })
    .catch((error: unknown) => {
      console.error('Failed to persist panelWidths:', error);
    });
}

export function persistConnectionUi(
  connectionUi: RendererConnectionState
): void {
  cache.connectionUi = connectionUi;
  if (!isElectronEnvironment()) return;
  window.sqlPro.rendererStore
    .set({ key: 'connectionUi', value: connectionUi })
    .catch((error: unknown) => {
      console.error('Failed to persist connectionUi:', error);
    });
}

export function persistOnboarding(onboarding: RendererOnboardingState): void {
  cache.onboarding = onboarding;
  // Skip persistence in development mode to always trigger tour on restart
  if (import.meta.env.DEV) return;
  if (!isElectronEnvironment()) return;
  window.sqlPro.rendererStore
    .set({ key: 'onboarding', value: onboarding })
    .catch((error: unknown) => {
      console.error('Failed to persist onboarding:', error);
    });
}

// ============ Store Hydration ============

type StoreHydrator<T> = (data: T) => void;

const storeHydrators = {
  settings: null as StoreHydrator<RendererSettingsState> | null,
  diagram: null as StoreHydrator<RendererDiagramState> | null,
  connectionUi: null as StoreHydrator<RendererConnectionState> | null,
  onboarding: null as StoreHydrator<RendererOnboardingState> | null,
};

export function registerSettingsHydrator(
  hydrator: StoreHydrator<RendererSettingsState>
): void {
  storeHydrators.settings = hydrator;
}

export function registerDiagramHydrator(
  hydrator: StoreHydrator<RendererDiagramState>
): void {
  storeHydrators.diagram = hydrator;
}

export function registerConnectionUiHydrator(
  hydrator: StoreHydrator<RendererConnectionState>
): void {
  storeHydrators.connectionUi = hydrator;
}

export function registerOnboardingHydrator(
  hydrator: StoreHydrator<RendererOnboardingState>
): void {
  storeHydrators.onboarding = hydrator;
}

export function hydrateStores(): void {
  if (cache.settings && storeHydrators.settings) {
    storeHydrators.settings(cache.settings);
  }
  if (cache.diagram && storeHydrators.diagram) {
    storeHydrators.diagram(cache.diagram);
  }
  if (cache.connectionUi && storeHydrators.connectionUi) {
    storeHydrators.connectionUi(cache.connectionUi);
  }
  // Skip onboarding hydration in development mode to always trigger tour
  if (cache.onboarding && storeHydrators.onboarding && !import.meta.env.DEV) {
    storeHydrators.onboarding(cache.onboarding);
  }
}
