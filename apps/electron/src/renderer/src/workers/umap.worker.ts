import { UMAP } from 'umap-js';

interface UMAPRequest {
  vectors: number[][];
  nComponents: 2 | 3;
  nNeighbors?: number;
  minDist?: number;
}

interface UMAPResponse {
  type: 'result' | 'error' | 'progress';
  data?: number[][];
  error?: string;
  progress?: number;
}

globalThis.onmessage = (event: MessageEvent<UMAPRequest>) => {
  const { vectors, nComponents, nNeighbors = 15, minDist = 0.1 } = event.data;

  try {
    if (vectors.length < nNeighbors) {
      globalThis.postMessage({
        type: 'error',
        error: `Need at least ${nNeighbors} vectors for UMAP (got ${vectors.length})`,
      } as UMAPResponse);
      return;
    }

    const umap = new UMAP({
      nComponents,
      nNeighbors: Math.min(nNeighbors, vectors.length - 1),
      minDist,
    });

    // Fit and transform
    const embedding = umap.fit(vectors);

    globalThis.postMessage({
      type: 'result',
      data: embedding,
    } as UMAPResponse);
  } catch (error) {
    globalThis.postMessage({
      type: 'error',
      error: error instanceof Error ? error.message : String(error),
    } as UMAPResponse);
  }
};
