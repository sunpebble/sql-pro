/// <reference types="vite/client" />

// Web app type declarations.
// In Electron, window.sqlPro is typed from the preload script. In the web app,
// all calls go through the mock API proxy (lib/api.ts), so these types are only
// needed for the few code paths that access window.sqlPro directly.
// TODO: Extract a shared SqlProAPI interface from the preload types so both
// Electron and web apps can reference the same contract without depending on
// @electron-toolkit/preload.
declare global {
  interface Window {
    sqlPro: typeof import('@/lib/mock-api').mockSqlProAPI;
    electronAPI: Record<string, unknown> | undefined;
  }
}

export {};
