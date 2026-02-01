// Test setup file for Vitest
// This file is run before each test file

import '@testing-library/jest-dom/vitest';

// Mock react-i18next with comprehensive translation support
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      // Translation mapping for common test scenarios
      const translations: Record<
        string,
        string | ((p: Record<string, unknown>) => string)
      > = {
        // TypeBadge
        'common.dataType': (p) => `Data type: ${p?.type ?? ''}`,

        // UnsavedChangesDialog
        'unsavedChangesDialog.title': 'Unsaved Changes',
        'unsavedChangesDialog.description': (p) =>
          `You have ${p?.count ?? 0} unsaved ${(p?.count as number) === 1 ? 'change' : 'changes'}`,
        'unsavedChangesDialog.discardChanges': 'Discard Changes',
        'unsavedChangesDialog.saveChanges': 'Save Changes',
        'unsavedChangesDialog.saving': 'Saving...',
        'unsavedChangesDialog.failedToSave': 'Failed to save changes',
        'unsavedChangesDialog.inserts': (p) =>
          `${p?.count ?? 0} ${(p?.count as number) === 1 ? 'insert' : 'inserts'}`,
        'unsavedChangesDialog.updates': (p) =>
          `${p?.count ?? 0} ${(p?.count as number) === 1 ? 'update' : 'updates'}`,
        'unsavedChangesDialog.deletes': (p) =>
          `${p?.count ?? 0} ${(p?.count as number) === 1 ? 'delete' : 'deletes'}`,

        // Common actions
        'actions.cancel': 'Cancel',
        'actions.save': 'Save',
        'actions.discard': 'Discard',
        'actions.close': 'Close',
        'common.unexpectedError': 'An unexpected error occurred',

        // DataDiffPanel - compare namespace
        'compare.dataComparison': 'Data Comparison',
        'compare.dataDescription':
          'Compare data between tables to identify row-level differences',
        'compare.showShortcuts': 'Show keyboard shortcuts',
        'compare.shortcuts': 'Shortcuts',
        'compare.keyboardShortcuts': 'Keyboard Shortcuts',
        'compare.runComparison': 'Run comparison',
        'compare.toggleOnlyDifferences': 'Toggle only differences',
        'compare.resetFilters': 'Reset filters',
        'compare.source': 'Source',
        'compare.target': 'Target',
        'compare.connection': 'Connection',
        'compare.table': 'Table',
        'compare.selectConnection': 'Select connection...',
        'compare.selectTable': 'Select table...',
        'compare.comparing': 'Comparing...',
        'compare.compareData': 'Compare Data',
        'compare.comparisonError': 'Comparison Error',
        'compare.comparisonResults': 'Comparison Results',
        'compare.sourceLabel': 'Source:',
        'compare.targetLabel': 'Target:',
        'compare.rowsSummary': (p) => `${p?.total ?? 0} rows compared`,
        'compare.rowsAdded': 'Added',
        'compare.rowsRemoved': 'Removed',
        'compare.rowsModified': 'Modified',
        'compare.rowsUnchanged': 'Unchanged',
        'compare.rowDifferences': 'Row Differences',
        'compare.detailedDiffPlaceholder': 'Detailed diff will appear here',
        'compare.readyToCompare': 'Ready to Compare',
        'compare.selectSourceAndTargetData':
          'Select source and target tables, then click Compare Data',

        // DataDiffPanel - dataDiff namespace
        'dataDiff.title': 'Data Diff',
        'dataDiff.noChanges': 'No changes',
        'dataDiff.added': 'Added',
        'dataDiff.removed': 'Removed',
        'dataDiff.modified': 'Modified',
        'dataDiff.selectBothTables':
          'Please select both source and target tables',
        'dataDiff.sourceRequired': 'Source table is required',
        'dataDiff.targetRequired': 'Target table is required',
        'dataDiff.failedToCompareTables': 'Failed to compare tables',
        'dataDiff.compareTablesShortcut': 'Compare tables (Cmd/Ctrl+Enter)',
      };

      const translation = translations[key];
      if (typeof translation === 'function') {
        return translation(params || {});
      }
      if (typeof translation === 'string') {
        return translation;
      }

      // Fallback: return key with params interpolated
      if (params) {
        let result = key;
        for (const [k, v] of Object.entries(params)) {
          result = result.replace(`{{${k}}}`, String(v));
        }
        return result;
      }
      return key;
    },
    i18n: {
      language: 'en',
      changeLanguage: vi.fn(),
    },
  }),
  Trans: ({ children }: { children: React.ReactNode }) => children,
  initReactI18next: {
    type: '3rdParty',
    init: vi.fn(),
  },
}));

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

// Mock Element.getAnimations for @base-ui/react ScrollArea component
// jsdom doesn't support Web Animations API
if (typeof Element.prototype.getAnimations === 'undefined') {
  Element.prototype.getAnimations = function () {
    return [];
  };
}

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
