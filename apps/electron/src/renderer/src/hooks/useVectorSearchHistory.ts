/**
 * Hook for managing vector search history.
 *
 * Stores recent search queries in localStorage and provides
 * methods to add, remove, and clear history entries.
 */

import type { VectorSearchHistoryEntry } from '@shared/types';
import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'vector-search-history';
const MAX_HISTORY_ENTRIES = 50;

interface UseVectorSearchHistoryReturn {
  /** List of search history entries */
  history: VectorSearchHistoryEntry[];
  /** Add a new entry to history */
  addEntry: (entry: Omit<VectorSearchHistoryEntry, 'id' | 'timestamp'>) => void;
  /** Remove an entry from history by ID */
  removeEntry: (id: string) => void;
  /** Clear all history */
  clearHistory: () => void;
  /** Get history filtered by collection */
  getHistoryByCollection: (collection: string) => VectorSearchHistoryEntry[];
}

/**
 * Hook for managing vector search history with localStorage persistence.
 */
export function useVectorSearchHistory(): UseVectorSearchHistoryReturn {
  const [history, setHistory] = useState<VectorSearchHistoryEntry[]>([]);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as VectorSearchHistoryEntry[];
        setHistory(parsed);
      }
    } catch (err) {
      console.error('Failed to load vector search history:', err);
    }
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (err) {
      console.error('Failed to save vector search history:', err);
    }
  }, [history]);

  const addEntry = useCallback(
    (entry: Omit<VectorSearchHistoryEntry, 'id' | 'timestamp'>) => {
      const newEntry: VectorSearchHistoryEntry = {
        ...entry,
        id: crypto.randomUUID(),
        timestamp: Date.now(),
      };

      setHistory((prev) => {
        // Add new entry at the beginning
        const updated = [newEntry, ...prev];
        // Limit to MAX_HISTORY_ENTRIES
        return updated.slice(0, MAX_HISTORY_ENTRIES);
      });
    },
    []
  );

  const removeEntry = useCallback((id: string) => {
    setHistory((prev) => prev.filter((entry) => entry.id !== id));
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  const getHistoryByCollection = useCallback(
    (collection: string) => {
      return history.filter((entry) => entry.collection === collection);
    },
    [history]
  );

  return {
    history,
    addEntry,
    removeEntry,
    clearHistory,
    getHistoryByCollection,
  };
}
