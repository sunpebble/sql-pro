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
  const previousStateRef = useRef({
    embedding: null as number[][] | null,
    isComputing: false,
    error: null as string | null,
    progress: null as number | null,
  });

  useEffect(() => {
    // Track state changes via refs to batch updates
    const shouldReset = !enabled || vectors.length < MIN_VECTORS;

    // Don't compute if disabled or not enough vectors
    if (shouldReset) {
      const newError =
        vectors.length < MIN_VECTORS && vectors.length > 0
          ? t('umap.needMinVectors', {
              min: MIN_VECTORS,
              count: vectors.length,
            })
          : null;

      // Only update if values actually changed
      if (previousStateRef.current.embedding !== null) {
        previousStateRef.current.embedding = null;
        // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect -- Conditional reset only when value changed
        setEmbedding(null);
      }
      if (previousStateRef.current.isComputing !== false) {
        previousStateRef.current.isComputing = false;
        // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect -- Conditional reset only when value changed
        setIsComputing(false);
      }
      if (previousStateRef.current.error !== newError) {
        previousStateRef.current.error = newError;
        // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect -- Conditional reset only when value changed
        setError(newError);
      }
      if (previousStateRef.current.progress !== null) {
        previousStateRef.current.progress = null;
        // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect -- Conditional reset only when value changed
        setProgress(null);
      }
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

    // Reset state for new computation (batched in single render)
    if (previousStateRef.current.isComputing !== true) {
      previousStateRef.current.isComputing = true;
      // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect -- Conditional update for worker setup
      setIsComputing(true);
    }
    if (previousStateRef.current.error !== null) {
      previousStateRef.current.error = null;
      // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect -- Conditional update for worker setup
      setError(null);
    }
    if (previousStateRef.current.progress !== null) {
      previousStateRef.current.progress = null;
      // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect -- Conditional update for worker setup
      setProgress(null);
    }

    // Handle worker responses
    worker.onmessage = (event: MessageEvent<UMAPResponse>) => {
      const response = event.data;

      switch (response.type) {
        case 'result': {
          const newEmbedding = response.data ?? null;
          if (previousStateRef.current.embedding !== newEmbedding) {
            previousStateRef.current.embedding = newEmbedding;
            setEmbedding(newEmbedding);
          }
          if (previousStateRef.current.isComputing !== false) {
            previousStateRef.current.isComputing = false;
            setIsComputing(false);
          }
          if (previousStateRef.current.progress !== 1) {
            previousStateRef.current.progress = 1;
            setProgress(1);
          }
          break;
        }

        case 'error': {
          const newError = response.error ?? 'Unknown UMAP error';
          if (previousStateRef.current.error !== newError) {
            previousStateRef.current.error = newError;
            setError(newError);
          }
          if (previousStateRef.current.isComputing !== false) {
            previousStateRef.current.isComputing = false;
            setIsComputing(false);
          }
          if (previousStateRef.current.embedding !== null) {
            previousStateRef.current.embedding = null;
            setEmbedding(null);
          }
          break;
        }

        case 'progress': {
          const newProgress = response.progress ?? null;
          if (previousStateRef.current.progress !== newProgress) {
            previousStateRef.current.progress = newProgress;
            setProgress(newProgress);
          }
          break;
        }
      }
    };

    // Handle worker errors
    worker.onerror = (event) => {
      const newError = event.message || t('umap.workerError');
      if (previousStateRef.current.error !== newError) {
        previousStateRef.current.error = newError;
        setError(newError);
      }
      if (previousStateRef.current.isComputing !== false) {
        previousStateRef.current.isComputing = false;
        setIsComputing(false);
      }
      if (previousStateRef.current.embedding !== null) {
        previousStateRef.current.embedding = null;
        setEmbedding(null);
      }
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
