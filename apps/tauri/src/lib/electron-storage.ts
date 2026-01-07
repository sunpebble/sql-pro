/**
 * Tauri Store Persistence Utility for Zustand
 *
 * Provides centralized persistence for renderer state via tauri-plugin-store.
 * This is a Tauri-compatible replacement for the Electron version.
 */

import type {
  RendererConnectionState,
  RendererDiagramState,
  RendererOnboardingState,
  RendererPanelWidths,
  RendererSettingsState,
  RendererStoreSchema,
} from '@shared/types/renderer-store';
import { LazyStore } from '@tauri-apps/plugin-store';

// Re-export types for compatibility
export type {
  RendererConnectionState,
  RendererDiagramState,
  RendererOnboardingState,
  RendererPanelWidths,
  RendererSettingsState,
  RendererStoreSchema,
};

// ============ Lazy Store Instance ============

const store = new LazyStore('sql-pro-renderer.json', {
  defaults: {},
  autoSave: true,
});

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

// ============ Initialization ============

/**
 * Initialize storage by loading all data from tauri-plugin-store.
 * Call this early in app startup before accessing any cached data.
 */
export async function initializeElectronStorage(): Promise<void> {
  if (initialized) return;

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
        try {
          const value = await store.get(key);
          if (value !== null && value !== undefined) {
            switch (key) {
              case 'settings':
                cache.settings = value as RendererSettingsState;
                break;
              case 'diagram':
                cache.diagram = value as RendererDiagramState;
                break;
              case 'panelWidths':
                cache.panelWidths = value as RendererPanelWidths;
                break;
              case 'connectionUi':
                cache.connectionUi = value as RendererConnectionState;
                break;
              case 'onboarding':
                cache.onboarding = value as RendererOnboardingState;
                break;
            }
          }
        } catch (error) {
          console.error(`Failed to load ${key} from store:`, error);
        }
      })
    );

    initialized = true;
  } catch (error) {
    console.error('Failed to initialize storage:', error);
    initialized = true; // Still mark as initialized to prevent retries
  }
}

/**
 * Check if storage has been initialized
 */
export function isStorageInitialized(): boolean {
  return initialized;
}

/**
 * Helper to check if running in Tauri environment
 */
export function isElectronEnvironment(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in window;
}

/**
 * Alias for Tauri environment check (for compatibility)
 */
export function isTauriEnvironment(): boolean {
  return isElectronEnvironment();
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
  store.set('settings', settings).catch((error) => {
    console.error('Failed to persist settings:', error);
  });
}

export function persistDiagram(diagram: RendererDiagramState): void {
  cache.diagram = diagram;
  store.set('diagram', diagram).catch((error) => {
    console.error('Failed to persist diagram:', error);
  });
}

export function persistPanelWidths(panelWidths: RendererPanelWidths): void {
  cache.panelWidths = panelWidths;
  store.set('panelWidths', panelWidths).catch((error) => {
    console.error('Failed to persist panelWidths:', error);
  });
}

export function persistConnectionUi(
  connectionUi: RendererConnectionState
): void {
  cache.connectionUi = connectionUi;
  store.set('connectionUi', connectionUi).catch((error) => {
    console.error('Failed to persist connectionUi:', error);
  });
}

export function persistOnboarding(onboarding: RendererOnboardingState): void {
  cache.onboarding = onboarding;
  store.set('onboarding', onboarding).catch((error) => {
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
  if (cache.onboarding && storeHydrators.onboarding) {
    storeHydrators.onboarding(cache.onboarding);
  }
}
