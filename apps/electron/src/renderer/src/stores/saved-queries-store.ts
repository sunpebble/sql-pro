import type {
  CreateQueryFolderInput,
  CreateSavedQueryInput,
  QueryFolder,
  QueryParameter,
  SavedQuery,
  UpdateQueryFolderInput,
  UpdateSavedQueryInput,
} from '@shared/types/saved-query';

import { toast } from 'sonner';
import { create } from 'zustand';
import { debounce } from '@/lib/debounce';
import {
  getCachedSavedQueries,
  persistSavedQueries,
  registerSavedQueriesHydrator,
} from '@/lib/storage';

// Re-export types for consumers
export type {
  QueryFolder,
  QueryParameter,
  SavedQuery,
} from '@shared/types/saved-query';

// ============ Constants ============

/** Maximum query size in bytes (50KB) */
const MAX_QUERY_SIZE = 50 * 1024;

/** Regex to extract {{variable}} patterns */
const PARAMETER_REGEX = /\{\{([^}]+)\}\}/g;

// ============ Parameter Utilities ============

/**
 * Parse parameters from a query string.
 * Supports:
 * - {{name}} - simple variable
 * - {{name:type}} - variable with type hint
 * - {{name:type=default}} - variable with type and default value
 * - {{name=default}} - variable with default value
 */
export function parseParameters(query: string): QueryParameter[] {
  const matches = query.matchAll(PARAMETER_REGEX);
  const seen = new Set<string>();
  const parameters: QueryParameter[] = [];

  for (const match of matches) {
    const content = match[1].trim();
    if (!content) continue;

    // Parse the content: name:type=default or name=default or name:type or name
    let name = content;
    let type: QueryParameter['type'] | undefined;
    let defaultValue: string | undefined;

    // Check for = (default value)
    const eqIndex = content.indexOf('=');
    if (eqIndex !== -1) {
      defaultValue = content.slice(eqIndex + 1).trim();
      name = content.slice(0, eqIndex).trim();
    }

    // Check for : (type hint)
    const colonIndex = name.indexOf(':');
    if (colonIndex !== -1) {
      const typeStr = name
        .slice(colonIndex + 1)
        .trim()
        .toLowerCase();
      name = name.slice(0, colonIndex).trim();

      if (typeStr === 'string' || typeStr === 'number' || typeStr === 'date') {
        type = typeStr;
      }
    }

    // Skip if we've already seen this parameter name
    if (seen.has(name)) continue;
    seen.add(name);

    parameters.push({
      name,
      type,
      defaultValue,
    });
  }

  return parameters;
}

/**
 * Substitute parameters in a query string with provided values.
 * @param query - The query string with {{variable}} placeholders
 * @param values - Record of variable name to value
 * @returns The query with all variables substituted
 */
export function substituteParameters(
  query: string,
  values: Record<string, string>
): string {
  return query.replace(PARAMETER_REGEX, (match, content) => {
    const trimmedContent = content.trim();
    if (!trimmedContent) return match;

    // Extract the variable name (before : or =)
    let name = trimmedContent;
    const colonIndex = name.indexOf(':');
    const eqIndex = name.indexOf('=');

    if (colonIndex !== -1 && (eqIndex === -1 || colonIndex < eqIndex)) {
      name = name.slice(0, colonIndex).trim();
    } else if (eqIndex !== -1) {
      name = name.slice(0, eqIndex).trim();
    }

    // Return the value if provided, otherwise keep the original placeholder
    if (name in values) {
      return values[name];
    }

    // Try to use default value if no value provided
    if (eqIndex !== -1) {
      return trimmedContent.slice(eqIndex + 1).trim();
    }

    return match;
  });
}

/**
 * Validate query size
 * @returns true if valid, false if too large
 */
function validateQuerySize(query: string): boolean {
  const size = new TextEncoder().encode(query).length;
  if (size > MAX_QUERY_SIZE) {
    toast.error('Query too large', {
      description: `Query exceeds maximum size of ${MAX_QUERY_SIZE / 1024}KB`,
    });
    return false;
  }
  return true;
}

// ============ Store Interface ============

interface SavedQueriesState {
  /** All saved queries */
  queries: SavedQuery[];

  /** All query folders */
  folders: QueryFolder[];

  /** Current search query for filtering */
  searchQuery: string;

  /** Active folder filter (null = show all) */
  activeFolderId: string | null;

  // Query CRUD
  saveQuery: (data: CreateSavedQueryInput) => string | null;
  updateQuery: (id: string, updates: UpdateSavedQueryInput) => void;
  deleteQuery: (id: string) => void;
  duplicateQuery: (id: string) => string | null;

  // Folder CRUD
  createFolder: (data: CreateQueryFolderInput) => string;
  updateFolder: (id: string, updates: UpdateQueryFolderInput) => void;
  deleteFolder: (id: string, deleteQueries?: boolean) => void;

  // Execution tracking
  recordExecution: (id: string) => void;

  // Filter helpers
  setSearchQuery: (query: string) => void;
  setActiveFolderId: (folderId: string | null) => void;
  getFilteredQueries: () => SavedQuery[];

  // Helpers
  getQueryById: (id: string) => SavedQuery | undefined;
  getFolderById: (id: string) => QueryFolder | undefined;
  getQueriesInFolder: (folderId: string | null) => SavedQuery[];
}

// ============ Store Implementation ============

export const useSavedQueriesStore = create<SavedQueriesState>()((set, get) => ({
  queries: [],
  folders: [],
  searchQuery: '',
  activeFolderId: null,

  // Query CRUD
  saveQuery: (data) => {
    if (!validateQuerySize(data.query)) {
      return null;
    }

    const trimmedName = data.name.trim();
    if (!trimmedName) {
      toast.error('Query name is required');
      return null;
    }

    const now = new Date().toISOString();
    const newQuery: SavedQuery = {
      id: crypto.randomUUID(),
      name: trimmedName,
      description: data.description?.trim(),
      query: data.query,
      folderId: data.folderId ?? null,
      connectionId: data.connectionId,
      createdAt: now,
      updatedAt: now,
      executionCount: 0,
    };

    set((state) => ({
      queries: [...state.queries, newQuery],
    }));

    return newQuery.id;
  },

  updateQuery: (id, updates) => {
    if (updates.query !== undefined && !validateQuerySize(updates.query)) {
      return;
    }

    set((state) => ({
      queries: state.queries.map((q) =>
        q.id === id
          ? {
              ...q,
              ...(updates.name !== undefined
                ? { name: updates.name.trim() }
                : {}),
              ...(updates.description !== undefined
                ? { description: updates.description?.trim() }
                : {}),
              ...(updates.query !== undefined ? { query: updates.query } : {}),
              ...(updates.folderId !== undefined
                ? { folderId: updates.folderId }
                : {}),
              ...(updates.connectionId !== undefined
                ? { connectionId: updates.connectionId }
                : {}),
              updatedAt: new Date().toISOString(),
            }
          : q
      ),
    }));
  },

  deleteQuery: (id) => {
    set((state) => ({
      queries: state.queries.filter((q) => q.id !== id),
    }));
  },

  duplicateQuery: (id) => {
    const original = get().queries.find((q) => q.id === id);
    if (!original) return null;

    const now = new Date().toISOString();
    const newQuery: SavedQuery = {
      ...original,
      id: crypto.randomUUID(),
      name: `${original.name} (copy)`,
      createdAt: now,
      updatedAt: now,
      lastExecutedAt: undefined,
      executionCount: 0,
    };

    set((state) => ({
      queries: [...state.queries, newQuery],
    }));

    return newQuery.id;
  },

  // Folder CRUD
  createFolder: (data) => {
    const trimmedName = data.name.trim();
    if (!trimmedName) {
      toast.error('Folder name is required');
      return '';
    }

    const { folders } = get();
    const maxSortOrder = folders.reduce(
      (max, f) => Math.max(max, f.sortOrder),
      0
    );

    const newFolder: QueryFolder = {
      id: crypto.randomUUID(),
      name: trimmedName,
      color: data.color,
      createdAt: new Date().toISOString(),
      sortOrder: maxSortOrder + 1,
    };

    set((state) => ({
      folders: [...state.folders, newFolder],
    }));

    return newFolder.id;
  },

  updateFolder: (id, updates) => {
    set((state) => ({
      folders: state.folders.map((f) =>
        f.id === id
          ? {
              ...f,
              ...(updates.name !== undefined
                ? { name: updates.name.trim() }
                : {}),
              ...(updates.color !== undefined ? { color: updates.color } : {}),
              ...(updates.sortOrder !== undefined
                ? { sortOrder: updates.sortOrder }
                : {}),
            }
          : f
      ),
    }));
  },

  deleteFolder: (id, deleteQueries = false) => {
    set((state) => ({
      folders: state.folders.filter((f) => f.id !== id),
      queries: deleteQueries
        ? state.queries.filter((q) => q.folderId !== id)
        : state.queries.map((q) =>
            q.folderId === id ? { ...q, folderId: null } : q
          ),
      // Clear active folder filter if deleted folder was active
      activeFolderId: state.activeFolderId === id ? null : state.activeFolderId,
    }));
  },

  // Execution tracking
  recordExecution: (id) => {
    set((state) => ({
      queries: state.queries.map((q) =>
        q.id === id
          ? {
              ...q,
              lastExecutedAt: new Date().toISOString(),
              executionCount: q.executionCount + 1,
            }
          : q
      ),
    }));
  },

  // Filter helpers
  setSearchQuery: (query) => set({ searchQuery: query }),
  setActiveFolderId: (folderId) => set({ activeFolderId: folderId }),

  getFilteredQueries: () => {
    const { queries, searchQuery, activeFolderId } = get();

    let filtered = queries;

    // Filter by folder
    if (activeFolderId !== null) {
      filtered = filtered.filter((q) => q.folderId === activeFolderId);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const search = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (q) =>
          q.name.toLowerCase().includes(search) ||
          q.description?.toLowerCase().includes(search) ||
          q.query.toLowerCase().includes(search)
      );
    }

    return filtered;
  },

  // Helpers
  getQueryById: (id) => get().queries.find((q) => q.id === id),
  getFolderById: (id) => get().folders.find((f) => f.id === id),
  getQueriesInFolder: (folderId) =>
    get().queries.filter((q) => q.folderId === folderId),
}));

// ============ Selector Hooks ============

export const useQueries = () => useSavedQueriesStore((s) => s.queries);
export const useFolders = () => useSavedQueriesStore((s) => s.folders);
export const useSearchQuery = () => useSavedQueriesStore((s) => s.searchQuery);
export const useActiveFolderId = () =>
  useSavedQueriesStore((s) => s.activeFolderId);

// ============ Persistence ============

/**
 * Apply persisted saved queries state to the store.
 */
function hydrateSavedQueries(data: {
  queries?: SavedQuery[];
  folders?: QueryFolder[];
}): void {
  useSavedQueriesStore.setState({
    queries: data.queries || [],
    folders: data.folders || [],
  });
}

/**
 * Persist state to electron-store via IPC (debounced)
 */
const persistState = debounce(
  (state: { queries: SavedQuery[]; folders: QueryFolder[] }) => {
    persistSavedQueries({
      queries: state.queries,
      folders: state.folders,
    });
  },
  500
);

// Subscribe to state changes and persist
useSavedQueriesStore.subscribe((state) => {
  persistState({ queries: state.queries, folders: state.folders });
});

// Register hydrator for loading persisted saved queries state
registerSavedQueriesHydrator((data) => {
  hydrateSavedQueries(data);
});

/**
 * Initialize saved queries store from persisted state.
 * Delegates to the centralized storage cache populated by initializeStorage().
 */
export function initializeSavedQueriesStore(): void {
  const cached = getCachedSavedQueries();
  if (cached) {
    hydrateSavedQueries(cached);
  }
}
