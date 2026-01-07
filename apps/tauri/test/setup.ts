/**
 * Test setup file for Vitest
 */

import { vi } from 'vitest';

// Mock Tauri APIs
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn().mockImplementation((_cmd: string, _args?: unknown) => {
    return Promise.resolve({ success: true });
  }),
}));

vi.mock('@tauri-apps/plugin-dialog', () => ({
  open: vi.fn().mockResolvedValue(null),
  save: vi.fn().mockResolvedValue(null),
}));

vi.mock('@tauri-apps/plugin-shell', () => ({
  open: vi.fn().mockResolvedValue(undefined),
}));

// Mock window.__TAURI__ for global access
Object.defineProperty(window, '__TAURI__', {
  value: {
    core: {
      invoke: vi.fn().mockResolvedValue({ success: true }),
    },
  },
  writable: true,
});

// Reset mocks between tests
beforeEach(() => {
  vi.clearAllMocks();
});
