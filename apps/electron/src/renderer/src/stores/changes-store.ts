import type { ChangeType, PendingChange } from '@/types/database';
import { create } from 'zustand';

/**
 * Creates a composite key for indexing changes by table+rowId+connectionId.
 * This enables O(1) lookups instead of O(n) array searches.
 */
function createChangeKey(
  table: string,
  rowId: string | number,
  connectionId?: string
): string {
  return connectionId
    ? `${connectionId}:${table}:${rowId}`
    : `*:${table}:${rowId}`;
}

interface ChangesState {
  // Pending changes (now includes connectionId)
  changes: PendingChange[];

  // Index for O(1) lookups by table+rowId+connectionId
  changeIndex: Map<string, PendingChange>;

  // Validation state
  isValidating: boolean;
  isApplying: boolean;

  // Actions
  addChange: (
    change: Omit<PendingChange, 'id' | 'timestamp' | 'isValid'>
  ) => void;
  updateChange: (id: string, updates: Partial<PendingChange>) => void;
  removeChange: (id: string) => void;
  clearChanges: () => void;
  clearChangesForConnection: (connectionId: string) => void;
  setValidationResult: (
    results: Array<{ changeId: string; isValid: boolean; error?: string }>
  ) => void;
  setIsValidating: (isValidating: boolean) => void;
  setIsApplying: (isApplying: boolean) => void;

  // Computed
  hasChanges: () => boolean;
  hasChangesForConnection: (connectionId: string) => boolean;
  getChangesForTable: (table: string, connectionId?: string) => PendingChange[];
  getChangesForConnection: (connectionId: string) => PendingChange[];
  getChangeForRow: (
    table: string,
    rowId: string | number,
    connectionId?: string
  ) => PendingChange | undefined;
}

let changeIdCounter = 0;
function generateChangeId(): string {
  changeIdCounter += 1;
  return `change_${changeIdCounter}_${Math.random().toString(36).substring(2, 7)}`;
}

export const useChangesStore = create<ChangesState>((set, get) => ({
  changes: [],
  changeIndex: new Map(),
  isValidating: false,
  isApplying: false,

  addChange: (change) => {
    const key = createChangeKey(
      change.table,
      change.rowId,
      change.connectionId
    );
    const existingChange = get().changeIndex.get(key);

    if (existingChange) {
      // Merge with existing change
      if (change.type === 'delete') {
        // If we're deleting a newly inserted row, just remove the insert
        if (existingChange.type === 'insert') {
          set((state) => {
            const newIndex = new Map(state.changeIndex);
            newIndex.delete(key);
            return {
              changes: state.changes.filter((c) => c.id !== existingChange.id),
              changeIndex: newIndex,
            };
          });
          return;
        }
        // Otherwise, update to delete
        set((state) => {
          const updatedChange = {
            ...existingChange,
            type: 'delete' as ChangeType,
            newValues: null,
            timestamp: new Date(),
          };
          const newIndex = new Map(state.changeIndex);
          newIndex.set(key, updatedChange);
          return {
            changes: state.changes.map((c) =>
              c.id === existingChange.id ? updatedChange : c
            ),
            changeIndex: newIndex,
          };
        });
      } else if (change.type === 'update') {
        // Merge updates
        set((state) => {
          const updatedChange = {
            ...existingChange,
            newValues: { ...existingChange.newValues, ...change.newValues },
            timestamp: new Date(),
          };
          const newIndex = new Map(state.changeIndex);
          newIndex.set(key, updatedChange);
          return {
            changes: state.changes.map((c) =>
              c.id === existingChange.id ? updatedChange : c
            ),
            changeIndex: newIndex,
          };
        });
      } else if (change.type === 'insert' && existingChange.type === 'insert') {
        // Update existing insert with new values
        set((state) => {
          const updatedChange = {
            ...existingChange,
            newValues: { ...existingChange.newValues, ...change.newValues },
            timestamp: new Date(),
          };
          const newIndex = new Map(state.changeIndex);
          newIndex.set(key, updatedChange);
          return {
            changes: state.changes.map((c) =>
              c.id === existingChange.id ? updatedChange : c
            ),
            changeIndex: newIndex,
          };
        });
      }
    } else {
      // Add new change
      const newChange: PendingChange = {
        ...change,
        id: generateChangeId(),
        timestamp: new Date(),
        isValid: true,
      };
      set((state) => {
        const newIndex = new Map(state.changeIndex);
        newIndex.set(key, newChange);
        return {
          changes: [...state.changes, newChange],
          changeIndex: newIndex,
        };
      });
    }
  },

  updateChange: (id, updates) =>
    set((state) => {
      const updatedChanges = state.changes.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      );
      // Rebuild index with updated changes
      const newIndex = new Map<string, PendingChange>();
      for (const change of updatedChanges) {
        const key = createChangeKey(
          change.table,
          change.rowId,
          change.connectionId
        );
        newIndex.set(key, change);
      }
      return { changes: updatedChanges, changeIndex: newIndex };
    }),

  removeChange: (id) =>
    set((state) => {
      const changeToRemove = state.changes.find((c) => c.id === id);
      if (!changeToRemove) return state;

      const key = createChangeKey(
        changeToRemove.table,
        changeToRemove.rowId,
        changeToRemove.connectionId
      );
      const newIndex = new Map(state.changeIndex);
      newIndex.delete(key);

      return {
        changes: state.changes.filter((c) => c.id !== id),
        changeIndex: newIndex,
      };
    }),

  clearChanges: () => set({ changes: [], changeIndex: new Map() }),

  clearChangesForConnection: (connectionId) =>
    set((state) => {
      const remainingChanges = state.changes.filter(
        (c) => c.connectionId !== connectionId
      );
      // Rebuild index with remaining changes
      const newIndex = new Map<string, PendingChange>();
      for (const change of remainingChanges) {
        const key = createChangeKey(
          change.table,
          change.rowId,
          change.connectionId
        );
        newIndex.set(key, change);
      }
      return { changes: remainingChanges, changeIndex: newIndex };
    }),

  setValidationResult: (results) =>
    set((state) => {
      const updatedChanges = state.changes.map((c) => {
        const result = results.find((r) => r.changeId === c.id);
        if (result) {
          return {
            ...c,
            isValid: result.isValid,
            validationError: result.error,
          };
        }
        return c;
      });
      // Rebuild index with updated changes
      const newIndex = new Map<string, PendingChange>();
      for (const change of updatedChanges) {
        const key = createChangeKey(
          change.table,
          change.rowId,
          change.connectionId
        );
        newIndex.set(key, change);
      }
      return { changes: updatedChanges, changeIndex: newIndex };
    }),

  setIsValidating: (isValidating) => set({ isValidating }),
  setIsApplying: (isApplying) => set({ isApplying }),

  hasChanges: () => get().changes.length > 0,

  hasChangesForConnection: (connectionId) =>
    get().changes.some((c) => c.connectionId === connectionId),

  getChangesForTable: (table, connectionId) => {
    const changes = get().changes.filter((c) => c.table === table);
    if (connectionId) {
      return changes.filter((c) => c.connectionId === connectionId);
    }
    return changes;
  },

  getChangesForConnection: (connectionId) =>
    get().changes.filter((c) => c.connectionId === connectionId),

  // O(1) lookup using the index instead of O(n) array search
  getChangeForRow: (table, rowId, connectionId) => {
    const key = createChangeKey(table, rowId, connectionId);
    const indexed = get().changeIndex.get(key);
    if (indexed) return indexed;

    // Fallback for lookups without connectionId - check all keys ending with table:rowId
    if (!connectionId) {
      const suffix = `:${table}:${rowId}`;
      for (const [k, v] of get().changeIndex) {
        if (k.endsWith(suffix)) return v;
      }
    }
    return undefined;
  },
}));
