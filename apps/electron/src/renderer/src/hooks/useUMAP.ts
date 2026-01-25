/**
 * Hook for UMAP dimensionality reduction using Web Worker.
 *
 * Manages UMAP computation in a background worker to avoid blocking the main thread.
 * Automatically handles worker lifecycle, cancellation, and cleanup.
 */

import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface UMAPResponse {
  type: 'result' | 'error' | 'progress';
  data?: number[][];
  error?: string;
  progress?: number;
}

interface UMAPResult {
  /** The computed 2D or 3D embedding, or null if not yet computed */
  embedding: number[][] | null;
  /** Whether UMAP computation is currently in progress */
  isComputing: boolean;
  /** Error message from the most recent computation, if any */
  error: string | null;
  /** Progress of the computation (0-1), if available */
  progress: number | null;
}

interface UMAPOptions {
  /** Number of output dimensions (2 or 3) */
  nComponents?: 2 | 3;
  /** Number of neighbors to consider for each point */
  nNeighbors?: number;
  /** Minimum distance between points in the embedding */
  minDist?: number;
  /** Whether UMAP computation is enabled */
  enabled?: boolean;
}

/** Minimum number of vectors required for UMAP computation */
const MIN_VECTORS = 3;

/**
 * Hook for computing UMAP dimensionality reduction in a Web Worker.
 *
 * @param vectors - High-dimensional vectors to reduce
 * @param options - UMAP configuration options
 * @returns Object with embedding result, loading state, and error
 *
 * @example
 * ```tsx
 * const { embedding, isComputing, error } = useUMAP(vectors, {
 *   nComponents: 2,
 *   nNeighbors: 15,
 *   enabled: true,
 * });
 * ```
 */
export function useUMAP(
  vectors: number[][],
  options: UMAPOptions = {}
): UMAPResult {
  const { t } = useTranslation('common');
  const {
    nComponents = 2,
    nNeighbors = 15,
    minDist = 0.1,
    enabled = true,
  } = options;

  const [embedding, setEmbedding] = useState<number[][] | null>(null);
  const [isComputing, setIsComputing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);

  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    // Don't compute if disabled or not enough vectors
    if (!enabled || vectors.length < MIN_VECTORS) {
      /* eslint-disable react-hooks-extra/no-direct-set-state-in-use-effect -- State reset on condition change */
      setEmbedding(null);
      setIsComputing(false);
      setError(
        vectors.length < MIN_VECTORS && vectors.length > 0
          ? t('umap.needMinVectors', {
              min: MIN_VECTORS,
              count: vectors.length,
            })
          : null
      );
      setProgress(null);
      /* eslint-enable react-hooks-extra/no-direct-set-state-in-use-effect */
      return;
    }

    // Terminate existing worker if any (handles mid-computation cancellation)
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }

    // Create new worker
    const worker = new Worker(
      new URL('../workers/umap.worker.ts', import.meta.url),
      { type: 'module' }
    );
    workerRef.current = worker;

    // Reset state for new computation
    /* eslint-disable react-hooks-extra/no-direct-set-state-in-use-effect -- State reset for new computation */
    setIsComputing(true);
    setError(null);
    setProgress(null);
    /* eslint-enable react-hooks-extra/no-direct-set-state-in-use-effect */

    // Handle worker responses
    worker.onmessage = (event: MessageEvent<UMAPResponse>) => {
      const response = event.data;

      switch (response.type) {
        case 'result':
          setEmbedding(response.data ?? null);
          setIsComputing(false);
          setProgress(1);
          break;

        case 'error':
          setError(response.error ?? 'Unknown UMAP error');
          setIsComputing(false);
          setEmbedding(null);
          break;

        case 'progress':
          setProgress(response.progress ?? null);
          break;
      }
    };

    // Handle worker errors
    worker.onerror = (event) => {
      setError(event.message || t('umap.workerError'));
      setIsComputing(false);
      setEmbedding(null);
    };

    // Send vectors to worker
    worker.postMessage({
      vectors,
      nComponents,
      nNeighbors,
      minDist,
    });

    // Cleanup on unmount or when dependencies change
    return () => {
      worker.terminate();
      if (workerRef.current === worker) {
        workerRef.current = null;
      }
    };
  }, [t, vectors, nComponents, nNeighbors, minDist, enabled]);

  return {
    embedding,
    isComputing,
    error,
    progress,
  };
}
