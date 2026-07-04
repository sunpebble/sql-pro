/**
 * Hook for vector search operations on Qdrant collections.
 *
 * Provides three search modes:
 * - Text: Embed text using AI provider and search by vector (currently disabled)
 * - Vector: Direct vector search with raw vector array
 * - Similar: Find similar points by point ID
 *
 * Also loads background points for visualization.
 */

import type {
  BatchVectorSearchResult,
  PointWithVector,
  QdrantSearchFilter,
  VectorSearchResult,
} from '@shared/types';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { sqlPro } from '@/lib/api';

interface UseVectorSearchReturn {
  /** Search results from the most recent search */
  results: VectorSearchResult[];
  /** Whether a search is currently in progress */
  isSearching: boolean;
  /** Error message from the most recent search, if any */
  error: string | null;
  /** Search by text (embeds text and performs vector search) */
  searchByText: (
    text: string,
    limit: number,
    threshold?: number,
    filter?: QdrantSearchFilter
  ) => Promise<VectorSearchResult[]>;
  /** Search by raw vector array */
  searchByVector: (
    vector: number[],
    limit: number,
    threshold?: number,
    filter?: QdrantSearchFilter
  ) => Promise<VectorSearchResult[]>;
  /** Find similar points by point ID */
  searchSimilar: (
    pointId: string | number,
    limit: number,
    filter?: QdrantSearchFilter
  ) => Promise<VectorSearchResult[]>;
  /** Batch search with multiple vectors */
  batchSearch: (
    vectors: number[][],
    limit: number,
    threshold?: number,
    filter?: QdrantSearchFilter
  ) => Promise<BatchVectorSearchResult[]>;
  /** Background points for visualization (sampled from collection) */
  backgroundPoints: PointWithVector[];
  /** Whether background points are loading */
  isLoadingBackground: boolean;
  /** Vector dimension of the collection */
  vectorDimension: number;
  /** Clear search results and error */
  clearResults: () => void;
  /** Current filter applied to searches */
  filter: QdrantSearchFilter | undefined;
  /** Set filter for searches */
  setFilter: (filter: QdrantSearchFilter | undefined) => void;
}

/**
 * Hook for performing vector search operations on a Qdrant collection.
 *
 * @param connectionId - The connection ID for the Qdrant instance
 * @param collection - The collection name to search in
 * @returns Object with search methods, results, and state
 */
export function useVectorSearch(
  connectionId: string | null,
  collection: string
): UseVectorSearchReturn {
  const { t } = useTranslation('common');
  const [results, setResults] = useState<VectorSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backgroundPoints, setBackgroundPoints] = useState<PointWithVector[]>(
    []
  );
  const [isLoadingBackground, setIsLoadingBackground] = useState(false);
  const [vectorDimension, setVectorDimension] = useState(0);
  const [filter, setFilter] = useState<QdrantSearchFilter | undefined>(
    undefined
  );

  // Track previous values to avoid unnecessary setState calls
  const previousValuesRef = useRef({
    backgroundPoints: [] as PointWithVector[],
    vectorDimension: 0,
  });

  // Load background points for visualization when connection/collection changes
  useEffect(() => {
    if (!connectionId || !collection) {
      if (previousValuesRef.current.backgroundPoints.length !== 0) {
        previousValuesRef.current.backgroundPoints = [];
         
        setBackgroundPoints([]);
      }
      if (previousValuesRef.current.vectorDimension !== 0) {
        previousValuesRef.current.vectorDimension = 0;
         
        setVectorDimension(0);
      }
      return;
    }

    let cancelled = false;

    const loadBackground = async () => {
      setIsLoadingBackground(true);
      try {
        const response = await sqlPro.db.getPointsWithVectors({
          connectionId,
          collection,
          limit: 1000, // Sample up to 1000 points for visualization
        });
        if (cancelled) return;

        if (response.success) {
          if (
            JSON.stringify(previousValuesRef.current.backgroundPoints) !==
            JSON.stringify(response.points)
          ) {
            previousValuesRef.current.backgroundPoints = response.points;
            setBackgroundPoints(response.points);
          }
          if (
            previousValuesRef.current.vectorDimension !==
            response.vectorDimension
          ) {
            previousValuesRef.current.vectorDimension =
              response.vectorDimension;
            setVectorDimension(response.vectorDimension);
          }
        } else {
          console.error('Failed to load background points:', response.error);
        }
      } catch (err) {
        if (cancelled) return;
        console.error('Failed to load background points:', err);
      } finally {
        if (!cancelled) {
          setIsLoadingBackground(false);
        }
      }
    };

    loadBackground();

    return () => {
      cancelled = true;
    };
  }, [connectionId, collection]);

  /**
   * Embed text is currently disabled.
   * Text-based embedding requires AI configuration which has been removed.
   */
  const embedText = useCallback(
    async (_text: string): Promise<number[] | null> => {
      setError(
        t('vectorSearch.embeddingNotConfigured', {
          defaultValue:
            'Text embedding is not available. Use vector search instead.',
        })
      );
      return null;
    },
    [t]
  );

  /**
   * Search by text: embed the text and perform vector search
   */
  const searchByText = useCallback(
    async (
      text: string,
      limit: number,
      threshold?: number,
      searchFilter?: QdrantSearchFilter
    ): Promise<VectorSearchResult[]> => {
      if (!connectionId) {
        setError(t('vectorSearch.noConnection'));
        return [];
      }

      if (!text.trim()) {
        setError(t('vectorSearch.searchTextEmpty'));
        return [];
      }

      setIsSearching(true);
      setError(null);

      // First, embed the text
      const vector = await embedText(text);
      if (!vector) {
        setIsSearching(false);
        return []; // embedText sets the error
      }

      try {
        const response = await sqlPro.db.vectorSearch({
          connectionId,
          collection,
          vector,
          limit,
          scoreThreshold: threshold,
          filter: searchFilter ?? filter,
          withPayload: true,
          withVector: false,
        });

        if (response.success) {
          setResults(response.results);
          return response.results;
        } else {
          setError(response.error);
          setResults([]);
          return [];
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        setResults([]);
        return [];
      } finally {
        setIsSearching(false);
      }
    },
    [t, connectionId, collection, embedText, filter]
  );

  /**
   * Search by raw vector array
   */
  const searchByVector = useCallback(
    async (
      vector: number[],
      limit: number,
      threshold?: number,
      searchFilter?: QdrantSearchFilter
    ): Promise<VectorSearchResult[]> => {
      if (!connectionId) {
        setError(t('vectorSearch.noConnection'));
        return [];
      }

      if (!Array.isArray(vector) || vector.length === 0) {
        setError(t('vectorSearch.vectorEmptyOrInvalid'));
        return [];
      }

      setIsSearching(true);
      setError(null);

      try {
        const response = await sqlPro.db.vectorSearch({
          connectionId,
          collection,
          vector,
          limit,
          scoreThreshold: threshold,
          filter: searchFilter ?? filter,
          withPayload: true,
          withVector: false,
        });

        if (response.success) {
          setResults(response.results);
          return response.results;
        } else {
          setError(response.error);
          setResults([]);
          return [];
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        setResults([]);
        return [];
      } finally {
        setIsSearching(false);
      }
    },
    [t, connectionId, collection, filter]
  );

  /**
   * Find similar points by point ID
   */
  const searchSimilar = useCallback(
    async (
      pointId: string | number,
      limit: number,
      searchFilter?: QdrantSearchFilter
    ): Promise<VectorSearchResult[]> => {
      if (!connectionId) {
        setError(t('vectorSearch.noConnection'));
        return [];
      }

      if (pointId === '' || pointId === null || pointId === undefined) {
        setError(t('vectorSearch.pointIdRequired'));
        return [];
      }

      setIsSearching(true);
      setError(null);

      try {
        const response = await sqlPro.db.searchSimilar({
          connectionId,
          collection,
          pointId,
          limit,
          filter: searchFilter ?? filter,
        });

        if (response.success) {
          setResults(response.results);
          return response.results;
        } else {
          setError(response.error);
          setResults([]);
          return [];
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        setResults([]);
        return [];
      } finally {
        setIsSearching(false);
      }
    },
    [t, connectionId, collection, filter]
  );

  /**
   * Clear search results and error
   */
  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  /**
   * Batch search with multiple vectors at once
   */
  const batchSearch = useCallback(
    async (
      vectors: number[][],
      limit: number,
      threshold?: number,
      searchFilter?: QdrantSearchFilter
    ): Promise<BatchVectorSearchResult[]> => {
      if (!connectionId) {
        setError(t('vectorSearch.noConnection'));
        return [];
      }

      if (!Array.isArray(vectors) || vectors.length === 0) {
        setError(t('vectorSearch.vectorEmptyOrInvalid'));
        return [];
      }

      setIsSearching(true);
      setError(null);

      try {
        const response = await sqlPro.db.batchVectorSearch({
          connectionId,
          collection,
          vectors,
          limit,
          scoreThreshold: threshold,
          filter: searchFilter ?? filter,
          withPayload: true,
          withVector: false,
        });

        if (response.success) {
          return response.batchResults;
        } else {
          setError(response.error);
          return [];
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        return [];
      } finally {
        setIsSearching(false);
      }
    },
    [t, connectionId, collection, filter]
  );

  return {
    results,
    isSearching,
    error,
    searchByText,
    searchByVector,
    searchSimilar,
    batchSearch,
    backgroundPoints,
    isLoadingBackground,
    vectorDimension,
    clearResults,
    filter,
    setFilter,
  };
}
