import type { QueryHistoryEntry } from '@shared/types';
import { create } from 'zustand';

export type QueryHistoryStatus = 'all' | 'success' | 'failed';

export interface QueryHistoryDateRange {
  start?: string;
  end?: string;
}

export interface QueryHistoryFilter {
  searchText?: string;
  status?: QueryHistoryStatus;
  dateRange?: QueryHistoryDateRange;
}

interface QueryHistoryState {
  // Filter state
  filter: QueryHistoryFilter;

  // Actions
  setFilter: (filter: Partial<QueryHistoryFilter>) => void;
  clearFilters: () => void;

  // Getters
  getFilteredHistory: (history: QueryHistoryEntry[]) => QueryHistoryEntry[];
  getActiveFilterCount: () => number;
}

export const useQueryHistoryStore = create<QueryHistoryState>((set, get) => ({
  filter: {},

  setFilter: (filter) => {
    set((state) => ({
      filter: { ...state.filter, ...filter },
    }));
  },

  clearFilters: () => {
    set({ filter: {} });
  },

  getFilteredHistory: (history: QueryHistoryEntry[]) => {
    const { filter } = get();
    let result = history;

    // Filter by search text (case-insensitive, matches SQL content)
    if (filter.searchText) {
      const searchLower = filter.searchText.toLowerCase();
      result = result.filter((entry) => {
        const queryText = entry.queryText || entry.query || '';
        return (
          queryText.toLowerCase().includes(searchLower) ||
          entry.description?.toLowerCase().includes(searchLower) ||
          entry.error?.toLowerCase().includes(searchLower)
        );
      });
    }

    // Filter by status
    if (filter.status && filter.status !== 'all') {
      const isSuccess = filter.status === 'success';
      result = result.filter((entry) => entry.success === isSuccess);
    }

    // Filter by date range
    if (filter.dateRange) {
      const { start, end } = filter.dateRange;

      if (start) {
        const startDate = new Date(start);
        startDate.setHours(0, 0, 0, 0);
        result = result.filter((entry) => {
          const entryDate = new Date(entry.executedAt || entry.timestamp || '');
          return entryDate >= startDate;
        });
      }

      if (end) {
        const endDate = new Date(end);
        endDate.setHours(23, 59, 59, 999);
        result = result.filter((entry) => {
          const entryDate = new Date(entry.executedAt || entry.timestamp || '');
          return entryDate <= endDate;
        });
      }
    }

    return result;
  },

  getActiveFilterCount: () => {
    const { filter } = get();
    let count = 0;

    if (filter.searchText) count++;
    if (filter.status && filter.status !== 'all') count++;
    if (filter.dateRange?.start || filter.dateRange?.end) count++;

    return count;
  },
}));
