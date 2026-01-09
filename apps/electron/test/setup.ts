// Test setup file for Vitest
// This file is run before each test file

import '@testing-library/jest-dom/vitest';

// Mock localStorage for Zustand persist middleware
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => Object.keys(store)[index] ?? null,
  };
})();
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Mock window.matchMedia for tests that use media queries
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// Mock IntersectionObserver
class MockIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  value: MockIntersectionObserver,
});

// Mock ResizeObserver
class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: MockResizeObserver,
});

// Mock scrollTo
Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: () => {},
});

// Mock Electron APIs for renderer tests
const mockSqlProAPI = {
  db: {
    open: vi.fn(),
    close: vi.fn(),
    executeQuery: vi.fn(),
    getTableData: vi.fn(),
    getSchema: vi.fn(),
    getTables: vi.fn(),
  },
  connection: {
    test: vi.fn(),
    getAll: vi.fn(),
    save: vi.fn(),
    delete: vi.fn(),
  },
  profile: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    export: vi.fn(),
    import: vi.fn(),
  },
  ai: {
    generateSQL: vi.fn(),
    optimizeQuery: vi.fn(),
    analyzeData: vi.fn(),
  },
  store: {
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  },
  shell: {
    openExternal: vi.fn(),
  },
  dialog: {
    showOpenDialog: vi.fn(),
    showSaveDialog: vi.fn(),
    showMessageBox: vi.fn(),
  },
  clipboard: {
    writeText: vi.fn(),
    readText: vi.fn(),
  },
};

Object.defineProperty(window, 'sqlPro', {
  writable: true,
  value: mockSqlProAPI,
});

// Reset all mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
});
