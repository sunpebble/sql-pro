/**
 * Hook for vector search operations on Qdrant collections.
 *
 * Provides three search modes:
 * - Text: Embed text using AI provider and search by vector
 * - Vector: Direct vector search with raw vector array
 * - Similar: Find similar points by point ID
 *
 * Also loads background points for visualization.
 */

import type { PointWithVector, VectorSearchResult } from '@shared/types';
import { useCallback, useEffect, useState } from 'react';
import { sqlPro } from '@/lib/api';
import { useAIStore } from '@/stores/ai-store';

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
    threshold?: number
  ) => Promise<void>;
  /** Search by raw vector array */
  searchByVector: (
    vector: number[],
    limit: number,
    threshold?: number
  ) => Promise<void>;
  /** Find similar points by point ID */
  searchSimilar: (pointId: string | number, limit: number) => Promise<void>;
  /** Background points for visualization (sampled from collection) */
  backgroundPoints: PointWithVector[];
  /** Whether background points are loading */
  isLoadingBackground: boolean;
  /** Vector dimension of the collection */
  vectorDimension: number;
  /** Clear search results and error */
  clearResults: () => void;
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
  const [results, setResults] = useState<VectorSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backgroundPoints, setBackgroundPoints] = useState<PointWithVector[]>(
    []
  );
  const [isLoadingBackground, setIsLoadingBackground] = useState(false);
  const [vectorDimension, setVectorDimension] = useState(0);

  const { provider, providerSettings, getEffectiveBaseUrl } = useAIStore();

  // Load background points for visualization when connection/collection changes
  useEffect(() => {
    if (!connectionId || !collection) {
      setBackgroundPoints([]);
      setVectorDimension(0);
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
          setBackgroundPoints(response.points);
          setVectorDimension(response.vectorDimension);
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
   * Embed text using the configured AI provider.
   * Uses OpenAI-compatible embedding endpoint.
   */
  const embedText = useCallback(
    async (text: string): Promise<number[] | null> => {
      const settings = providerSettings[provider];
      const baseUrl = getEffectiveBaseUrl();

      if (!settings?.apiKey) {
        setError(
          'AI API key not configured. Please configure in Settings > AI.'
        );
        return null;
      }

      try {
        // Build embedding URL based on provider
        // OpenAI and compatible providers use /v1/embeddings
        let embeddingUrl: string;
        if (provider === 'openai' && !baseUrl.includes('/v1')) {
          embeddingUrl = `${baseUrl}/v1/embeddings`;
        } else if (baseUrl.endsWith('/v1')) {
          embeddingUrl = `${baseUrl}/embeddings`;
        } else {
          embeddingUrl = `${baseUrl}/v1/embeddings`;
        }

        const response = await fetch(embeddingUrl, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${settings.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'text-embedding-3-small', // Default OpenAI embedding model
            input: text,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error?.message || `HTTP ${response.status}`
          );
        }

        const data = await response.json();
        const embedding = data.data?.[0]?.embedding;

        if (!embedding || !Array.isArray(embedding)) {
          throw new Error('Invalid embedding response format');
        }

        return embedding;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(`Embedding failed: ${message}`);
        return null;
      }
    },
    [provider, providerSettings, getEffectiveBaseUrl]
  );

  /**
   * Search by text: embed the text and perform vector search
   */
  const searchByText = useCallback(
    async (text: string, limit: number, threshold?: number) => {
      if (!connectionId) {
        setError('No connection');
        return;
      }

      if (!text.trim()) {
        setError('Search text is empty');
        return;
      }

      setIsSearching(true);
      setError(null);

      // First, embed the text
      const vector = await embedText(text);
      if (!vector) {
        setIsSearching(false);
        return; // embedText sets the error
      }

      try {
        const response = await sqlPro.db.vectorSearch({
          connectionId,
          collection,
          vector,
          limit,
          scoreThreshold: threshold,
          withPayload: true,
          withVector: false,
        });

        if (response.success) {
          setResults(response.results);
        } else {
          setError(response.error);
          setResults([]);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    [connectionId, collection, embedText]
  );

  /**
   * Search by raw vector array
   */
  const searchByVector = useCallback(
    async (vector: number[], limit: number, threshold?: number) => {
      if (!connectionId) {
        setError('No connection');
        return;
      }

      if (!Array.isArray(vector) || vector.length === 0) {
        setError('Vector is empty or invalid');
        return;
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
          withPayload: true,
          withVector: false,
        });

        if (response.success) {
          setResults(response.results);
        } else {
          setError(response.error);
          setResults([]);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    [connectionId, collection]
  );

  /**
   * Find similar points by point ID
   */
  const searchSimilar = useCallback(
    async (pointId: string | number, limit: number) => {
      if (!connectionId) {
        setError('No connection');
        return;
      }

      if (pointId === '' || pointId === null || pointId === undefined) {
        setError('Point ID is required');
        return;
      }

      setIsSearching(true);
      setError(null);

      try {
        const response = await sqlPro.db.searchSimilar({
          connectionId,
          collection,
          pointId,
          limit,
        });

        if (response.success) {
          setResults(response.results);
        } else {
          setError(response.error);
          setResults([]);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    [connectionId, collection]
  );

  /**
   * Clear search results and error
   */
  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  return {
    results,
    isSearching,
    error,
    searchByText,
    searchByVector,
    searchSimilar,
    backgroundPoints,
    isLoadingBackground,
    vectorDimension,
    clearResults,
  };
}
