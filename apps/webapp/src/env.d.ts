/// <reference types="vite/client" />

// The canonical SqlProAPI type is exported from the preload script
// (apps/electron/src/preload/index.ts). The webapp cannot import it directly
// because the preload module depends on electron's contextBridge/ipcRenderer.
//
// TODO: Extract a platform-agnostic SqlProAPI interface into @shared/types so
// both Electron and web apps can reference the same contract without depending
// on electron internals.
//
// For now we infer the type from the mockSqlProAPI object which mirrors the
// preload surface.
declare global {
  interface Window {
    sqlPro: typeof import('@/lib/mock-api').mockSqlProAPI;
    electronAPI: Record<string, unknown> | undefined;
  }
}

export {};
