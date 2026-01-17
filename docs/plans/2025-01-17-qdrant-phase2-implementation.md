# Qdrant Phase 2: Vector Search Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add vector search functionality to SQL Pro's Qdrant support, including search panel, Embedding integration, and UMAP visualization.

**Architecture:** Split-screen UI with search input on top and results/visualization below. Backend extends QdrantAdapter with vector search methods. Embedding uses existing AI provider infrastructure. UMAP runs in Web Worker.

**Tech Stack:** React, TypeScript, umap-js, Canvas 2D API, OpenAI-compatible Embedding API

---

## Phase 2.1: Backend API Extension

### Task 1: Add Vector Search Types

**Files:**

- Modify: `apps/electron/src/shared/types.ts`

**Step 1: Add vector search types to shared/types.ts**

Add after the Qdrant connection config section (around line 134):

```typescript
// ============ Qdrant Vector Search Types ============

/** Filter condition for Qdrant vector search */
export interface QdrantSearchFilter {
  must?: QdrantFilterCondition[];
  should?: QdrantFilterCondition[];
  must_not?: QdrantFilterCondition[];
}

export interface QdrantFilterCondition {
  key: string;
  match?: { value: string | number | boolean };
  range?: { gt?: number; gte?: number; lt?: number; lte?: number };
}

/** Vector search request parameters */
export interface VectorSearchRequest {
  connectionId: string;
  collection: string;
  vector: number[];
  limit: number;
  scoreThreshold?: number;
  filter?: QdrantSearchFilter;
  withPayload?: boolean;
  withVector?: boolean;
}

/** Vector search result */
export interface VectorSearchResult {
  id: string | number;
  score: number;
  payload: Record<string, unknown>;
  vector?: number[];
}

export interface VectorSearchResponse {
  success: true;
  results: VectorSearchResult[];
} | {
  success: false;
  error: string;
}

/** Search similar points request */
export interface SearchSimilarRequest {
  connectionId: string;
  collection: string;
  pointId: string | number;
  limit: number;
  filter?: QdrantSearchFilter;
}

/** Get points with vectors request (for visualization) */
export interface GetPointsWithVectorsRequest {
  connectionId: string;
  collection: string;
  limit: number;
  ids?: (string | number)[];
}

export interface PointWithVector {
  id: string | number;
  vector: number[];
  payload: Record<string, unknown>;
}

export interface GetPointsWithVectorsResponse {
  success: true;
  points: PointWithVector[];
  vectorDimension: number;
} | {
  success: false;
  error: string;
}
```

**Step 2: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS

**Step 3: Commit**

```bash
git add apps/electron/src/shared/types.ts
git commit -m "feat(qdrant): add vector search types"
```

---

### Task 2: Implement vectorSearch in QdrantAdapter

**Files:**

- Modify: `apps/electron/src/main/services/database-adapters/qdrant-adapter.ts`

**Step 1: Add vectorSearch method**

Add after the `applyChangesAsync` method (around line 740):

```typescript
  // ============================================
  // Vector Search Methods
  // ============================================

  async vectorSearch(
    connectionId: string,
    collection: string,
    params: {
      vector: number[];
      limit: number;
      scoreThreshold?: number;
      filter?: { must?: Array<Record<string, unknown>> };
      withPayload?: boolean;
      withVector?: boolean;
    }
  ): Promise<
    | {
        success: true;
        results: Array<{
          id: string | number;
          score: number;
          payload: Record<string, unknown>;
          vector?: number[];
        }>;
      }
    | { success: false; error: string }
  > {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      return { success: false, error: 'Connection not found' };
    }

    try {
      const searchResult = await connection.client.search(collection, {
        vector: params.vector,
        limit: params.limit,
        score_threshold: params.scoreThreshold,
        filter: params.filter,
        with_payload: params.withPayload ?? true,
        with_vector: params.withVector ?? false,
      });

      const results = searchResult.map((point) => ({
        id: point.id,
        score: point.score,
        payload: (point.payload as Record<string, unknown>) || {},
        vector: point.vector as number[] | undefined,
      }));

      return { success: true, results };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
    }
  }
```

**Step 2: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS

**Step 3: Commit**

```bash
git add apps/electron/src/main/services/database-adapters/qdrant-adapter.ts
git commit -m "feat(qdrant): add vectorSearch method"
```

---

### Task 3: Implement searchSimilar in QdrantAdapter

**Files:**

- Modify: `apps/electron/src/main/services/database-adapters/qdrant-adapter.ts`

**Step 1: Add searchSimilar method**

Add after the `vectorSearch` method:

```typescript
  async searchSimilar(
    connectionId: string,
    collection: string,
    pointId: string | number,
    limit: number,
    filter?: { must?: Array<Record<string, unknown>> }
  ): Promise<
    | {
        success: true;
        results: Array<{
          id: string | number;
          score: number;
          payload: Record<string, unknown>;
        }>;
      }
    | { success: false; error: string }
  > {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      return { success: false, error: 'Connection not found' };
    }

    try {
      // First, get the vector for the specified point
      const pointResult = await connection.client.retrieve(collection, {
        ids: [pointId],
        with_vector: true,
        with_payload: false,
      });

      if (pointResult.length === 0) {
        return { success: false, error: `Point ${pointId} not found` };
      }

      const sourceVector = pointResult[0].vector as number[];
      if (!sourceVector || !Array.isArray(sourceVector)) {
        return { success: false, error: 'Point does not have a vector' };
      }

      // Search for similar points, excluding the source point
      const searchResult = await connection.client.search(collection, {
        vector: sourceVector,
        limit: limit + 1, // Get one extra to filter out the source
        filter: filter,
        with_payload: true,
        with_vector: false,
      });

      // Filter out the source point and limit results
      const results = searchResult
        .filter((point) => String(point.id) !== String(pointId))
        .slice(0, limit)
        .map((point) => ({
          id: point.id,
          score: point.score,
          payload: (point.payload as Record<string, unknown>) || {},
        }));

      return { success: true, results };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
    }
  }
```

**Step 2: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS

**Step 3: Commit**

```bash
git add apps/electron/src/main/services/database-adapters/qdrant-adapter.ts
git commit -m "feat(qdrant): add searchSimilar method"
```

---

### Task 4: Implement getPointsWithVectors in QdrantAdapter

**Files:**

- Modify: `apps/electron/src/main/services/database-adapters/qdrant-adapter.ts`

**Step 1: Add getPointsWithVectors method**

Add after the `searchSimilar` method:

```typescript
  async getPointsWithVectors(
    connectionId: string,
    collection: string,
    options: {
      limit: number;
      ids?: (string | number)[];
    }
  ): Promise<
    | {
        success: true;
        points: Array<{
          id: string | number;
          vector: number[];
          payload: Record<string, unknown>;
        }>;
        vectorDimension: number;
      }
    | { success: false; error: string }
  > {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      return { success: false, error: 'Connection not found' };
    }

    try {
      // Get collection info for vector dimension
      const collectionInfo = await connection.client.getCollection(collection);
      const vectorConfig = collectionInfo.config.params.vectors;
      let vectorDimension = 0;
      if (
        typeof vectorConfig === 'object' &&
        vectorConfig !== null &&
        'size' in vectorConfig
      ) {
        vectorDimension = vectorConfig.size as number;
      }

      let points: Array<{
        id: string | number;
        vector: number[];
        payload: Record<string, unknown>;
      }>;

      if (options.ids && options.ids.length > 0) {
        // Retrieve specific points by ID
        const result = await connection.client.retrieve(collection, {
          ids: options.ids,
          with_vector: true,
          with_payload: true,
        });

        points = result.map((point) => ({
          id: point.id,
          vector: point.vector as number[],
          payload: (point.payload as Record<string, unknown>) || {},
        }));
      } else {
        // Random sample using scroll
        const result = await connection.client.scroll(collection, {
          limit: options.limit,
          with_vector: true,
          with_payload: true,
        });

        points = result.points.map((point) => ({
          id: point.id,
          vector: point.vector as number[],
          payload: (point.payload as Record<string, unknown>) || {},
        }));
      }

      return { success: true, points, vectorDimension };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
    }
  }
```

**Step 2: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS

**Step 3: Commit**

```bash
git add apps/electron/src/main/services/database-adapters/qdrant-adapter.ts
git commit -m "feat(qdrant): add getPointsWithVectors method"
```

---

### Task 5: Register IPC Handlers for Vector Search

**Files:**

- Modify: `apps/electron/src/main/ipc/database.ts`

**Step 1: Find the IPC handlers file and add new handlers**

First, locate the existing IPC handler registration pattern by reading the file.

**Step 2: Add IPC handlers for vector search operations**

Add handlers for:

- `db:vectorSearch`
- `db:searchSimilar`
- `db:getPointsWithVectors`

**Step 3: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS

**Step 4: Commit**

```bash
git add apps/electron/src/main/ipc/database.ts
git commit -m "feat(qdrant): register vector search IPC handlers"
```

---

### Task 6: Add API Client Methods for Vector Search

**Files:**

- Modify: `apps/electron/src/renderer/src/lib/api.ts`

**Step 1: Add vectorSearch, searchSimilar, and getPointsWithVectors to the API client**

Add under the Qdrant or database section:

```typescript
vectorSearch: async (params: {
  connectionId: string;
  collection: string;
  vector: number[];
  limit: number;
  scoreThreshold?: number;
  filter?: Record<string, unknown>;
  withPayload?: boolean;
  withVector?: boolean;
}) => invoke<VectorSearchResponse>('db:vectorSearch', params),

searchSimilar: async (params: {
  connectionId: string;
  collection: string;
  pointId: string | number;
  limit: number;
  filter?: Record<string, unknown>;
}) => invoke<SearchSimilarResponse>('db:searchSimilar', params),

getPointsWithVectors: async (params: {
  connectionId: string;
  collection: string;
  limit: number;
  ids?: (string | number)[];
}) => invoke<GetPointsWithVectorsResponse>('db:getPointsWithVectors', params),
```

**Step 2: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS

**Step 3: Commit**

```bash
git add apps/electron/src/renderer/src/lib/api.ts
git commit -m "feat(qdrant): add vector search API client methods"
```

---

## Phase 2.2: Vector Search Panel UI

### Task 7: Create VectorSearchPanel Component

**Files:**

- Create: `apps/electron/src/renderer/src/components/vector-search/VectorSearchPanel.tsx`
- Create: `apps/electron/src/renderer/src/components/vector-search/index.ts`

**Step 1: Create the index.ts barrel export**

```typescript
export { VectorSearchPanel } from './VectorSearchPanel';
```

**Step 2: Create VectorSearchPanel.tsx**

```typescript
import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Hash, Link2 } from 'lucide-react';
import { Button } from '@sqlpro/ui/button';
import { Input } from '@sqlpro/ui/input';
import { Label } from '@sqlpro/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@sqlpro/ui/tabs';
import { Textarea } from '@sqlpro/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@sqlpro/ui/select';
import { ResizablePanel } from '@/components/ResizablePanel';
import { useConnectionStore } from '@/stores';
import { SearchResultsTable } from './SearchResultsTable';
import { VectorVisualization } from './VectorVisualization';
import { useVectorSearch } from '@/hooks/useVectorSearch';

type SearchMode = 'text' | 'vector' | 'similar';

interface VectorSearchPanelProps {
  collection: string;
}

export function VectorSearchPanel({ collection }: VectorSearchPanelProps) {
  const { t } = useTranslation('qdrant');
  const { activeConnectionId } = useConnectionStore();

  const [searchMode, setSearchMode] = useState<SearchMode>('text');
  const [textInput, setTextInput] = useState('');
  const [vectorInput, setVectorInput] = useState('');
  const [pointIdInput, setPointIdInput] = useState('');
  const [topK, setTopK] = useState(10);
  const [scoreThreshold, setScoreThreshold] = useState<number | undefined>();

  const {
    results,
    isSearching,
    error,
    searchByText,
    searchByVector,
    searchSimilar,
    backgroundPoints,
    isLoadingBackground,
  } = useVectorSearch(activeConnectionId, collection);

  const handleSearch = useCallback(async () => {
    if (!activeConnectionId) return;

    switch (searchMode) {
      case 'text':
        if (textInput.trim()) {
          await searchByText(textInput, topK, scoreThreshold);
        }
        break;
      case 'vector':
        if (vectorInput.trim()) {
          try {
            const vector = JSON.parse(vectorInput);
            if (Array.isArray(vector)) {
              await searchByVector(vector, topK, scoreThreshold);
            }
          } catch {
            // Invalid JSON
          }
        }
        break;
      case 'similar':
        if (pointIdInput.trim()) {
          await searchSimilar(pointIdInput, topK);
        }
        break;
    }
  }, [searchMode, textInput, vectorInput, pointIdInput, topK, scoreThreshold, activeConnectionId, searchByText, searchByVector, searchSimilar]);

  return (
    <div className="flex h-full flex-col">
      {/* Search Input Section */}
      <div className="border-b p-4 space-y-4">
        <div className="flex items-center gap-4">
          <Label>{t('searchMode', 'Search Mode')}</Label>
          <Tabs value={searchMode} onValueChange={(v) => setSearchMode(v as SearchMode)}>
            <TabsList>
              <TabsTrigger value="text" className="gap-1.5">
                <Search className="h-3.5 w-3.5" />
                {t('textSearch', 'Text')}
              </TabsTrigger>
              <TabsTrigger value="vector" className="gap-1.5">
                <Hash className="h-3.5 w-3.5" />
                {t('vectorInput', 'Vector')}
              </TabsTrigger>
              <TabsTrigger value="similar" className="gap-1.5">
                <Link2 className="h-3.5 w-3.5" />
                {t('similarSearch', 'Similar')}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Mode-specific input */}
        <div className="space-y-2">
          {searchMode === 'text' && (
            <Input
              placeholder={t('textSearchPlaceholder', 'Enter search text...')}
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          )}
          {searchMode === 'vector' && (
            <Textarea
              placeholder={t('vectorInputPlaceholder', '[0.1, 0.2, 0.3, ...]')}
              value={vectorInput}
              onChange={(e) => setVectorInput(e.target.value)}
              rows={3}
              className="font-mono text-sm"
            />
          )}
          {searchMode === 'similar' && (
            <Input
              placeholder={t('pointIdPlaceholder', 'Enter point ID...')}
              value={pointIdInput}
              onChange={(e) => setPointIdInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          )}
        </div>

        {/* Search parameters */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="topK">Top K:</Label>
            <Input
              id="topK"
              type="number"
              min={1}
              max={100}
              value={topK}
              onChange={(e) => setTopK(parseInt(e.target.value) || 10)}
              className="w-20"
            />
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="threshold">{t('scoreThreshold', 'Score Threshold')}:</Label>
            <Input
              id="threshold"
              type="number"
              min={0}
              max={1}
              step={0.1}
              value={scoreThreshold ?? ''}
              onChange={(e) => setScoreThreshold(e.target.value ? parseFloat(e.target.value) : undefined)}
              placeholder="0.0 - 1.0"
              className="w-24"
            />
          </div>
          <Button onClick={handleSearch} disabled={isSearching}>
            <Search className="mr-2 h-4 w-4" />
            {isSearching ? t('searching', 'Searching...') : t('search', 'Search')}
          </Button>
        </div>

        {error && (
          <p className="text-destructive text-sm">{error}</p>
        )}
      </div>

      {/* Results Section - Split View */}
      <div className="flex min-h-0 flex-1">
        {/* Results Table */}
        <div className="flex-1 min-w-0 overflow-auto">
          <SearchResultsTable
            results={results}
            onSelectPoint={(id) => {
              setSearchMode('similar');
              setPointIdInput(String(id));
            }}
          />
        </div>

        {/* Visualization Panel */}
        <ResizablePanel
          side="right"
          defaultWidth={400}
          minWidth={300}
          maxWidth={600}
          storageKey="vector-visualization"
        >
          <VectorVisualization
            backgroundPoints={backgroundPoints}
            searchResults={results}
            isLoading={isLoadingBackground}
          />
        </ResizablePanel>
      </div>
    </div>
  );
}
```

**Step 3: Run typecheck**

Run: `pnpm typecheck`
Expected: May fail (missing components/hooks) - continue to next tasks

**Step 4: Commit**

```bash
git add apps/electron/src/renderer/src/components/vector-search/
git commit -m "feat(qdrant): add VectorSearchPanel component skeleton"
```

---

### Task 8: Create SearchResultsTable Component

**Files:**

- Create: `apps/electron/src/renderer/src/components/vector-search/SearchResultsTable.tsx`

**Step 1: Create SearchResultsTable.tsx**

```typescript
import { useTranslation } from 'react-i18next';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@sqlpro/ui/table';
import { Button } from '@sqlpro/ui/button';
import { Search } from 'lucide-react';
import type { VectorSearchResult } from '@shared/types';

interface SearchResultsTableProps {
  results: VectorSearchResult[];
  onSelectPoint?: (id: string | number) => void;
}

export function SearchResultsTable({ results, onSelectPoint }: SearchResultsTableProps) {
  const { t } = useTranslation('qdrant');

  if (results.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <p>{t('noResults', 'No search results')}</p>
      </div>
    );
  }

  // Get all unique payload keys from results
  const payloadKeys = Array.from(
    new Set(results.flatMap((r) => Object.keys(r.payload)))
  ).slice(0, 5); // Limit to 5 payload columns

  return (
    <div className="h-full overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">{t('score', 'Score')}</TableHead>
            <TableHead className="w-32">{t('id', 'ID')}</TableHead>
            {payloadKeys.map((key) => (
              <TableHead key={key}>{key}</TableHead>
            ))}
            <TableHead className="w-16"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {results.map((result) => (
            <TableRow key={String(result.id)}>
              <TableCell className="font-mono text-sm">
                {result.score.toFixed(4)}
              </TableCell>
              <TableCell className="font-mono text-sm truncate max-w-32">
                {String(result.id)}
              </TableCell>
              {payloadKeys.map((key) => (
                <TableCell key={key} className="max-w-48 truncate">
                  {formatPayloadValue(result.payload[key])}
                </TableCell>
              ))}
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onSelectPoint?.(result.id)}
                  title={t('findSimilar', 'Find similar')}
                >
                  <Search className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function formatPayloadValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return `[${value.length} items]`;
  if (typeof value === 'object') return JSON.stringify(value).slice(0, 50);
  return String(value);
}
```

**Step 2: Run typecheck**

Run: `pnpm typecheck`
Expected: May fail (missing types) - will be fixed when types are added

**Step 3: Commit**

```bash
git add apps/electron/src/renderer/src/components/vector-search/SearchResultsTable.tsx
git commit -m "feat(qdrant): add SearchResultsTable component"
```

---

### Task 9: Create useVectorSearch Hook

**Files:**

- Create: `apps/electron/src/renderer/src/hooks/useVectorSearch.ts`

**Step 1: Create useVectorSearch.ts**

```typescript
import { useState, useEffect, useCallback } from 'react';
import { sqlPro } from '@/lib/api';
import { useAIStore } from '@/stores';
import type { VectorSearchResult, PointWithVector } from '@shared/types';

interface UseVectorSearchReturn {
  results: VectorSearchResult[];
  isSearching: boolean;
  error: string | null;
  searchByText: (
    text: string,
    limit: number,
    threshold?: number
  ) => Promise<void>;
  searchByVector: (
    vector: number[],
    limit: number,
    threshold?: number
  ) => Promise<void>;
  searchSimilar: (pointId: string | number, limit: number) => Promise<void>;
  backgroundPoints: PointWithVector[];
  isLoadingBackground: boolean;
  vectorDimension: number;
  clearResults: () => void;
}

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

  // Load background points for visualization
  useEffect(() => {
    if (!connectionId || !collection) return;

    const loadBackground = async () => {
      setIsLoadingBackground(true);
      try {
        const response = await sqlPro.db.getPointsWithVectors({
          connectionId,
          collection,
          limit: 1000,
        });
        if (response.success) {
          setBackgroundPoints(response.points);
          setVectorDimension(response.vectorDimension);
        }
      } catch (err) {
        console.error('Failed to load background points:', err);
      } finally {
        setIsLoadingBackground(false);
      }
    };

    loadBackground();
  }, [connectionId, collection]);

  // Embed text using AI provider
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
        // Use OpenAI-compatible embedding API
        const embeddingUrl =
          provider === 'openai'
            ? `${baseUrl}/embeddings`
            : `${baseUrl}/v1/embeddings`; // For custom providers

        const response = await fetch(embeddingUrl, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${settings.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'text-embedding-3-small', // Default model, could be configurable
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
        return data.data?.[0]?.embedding || null;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(`Embedding failed: ${message}`);
        return null;
      }
    },
    [provider, providerSettings, getEffectiveBaseUrl]
  );

  const searchByText = useCallback(
    async (text: string, limit: number, threshold?: number) => {
      if (!connectionId) return;

      setIsSearching(true);
      setError(null);

      const vector = await embedText(text);
      if (!vector) {
        setIsSearching(false);
        return;
      }

      try {
        const response = await sqlPro.db.vectorSearch({
          connectionId,
          collection,
          vector,
          limit,
          scoreThreshold: threshold,
          withPayload: true,
        });

        if (response.success) {
          setResults(response.results);
        } else {
          setError(response.error);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setIsSearching(false);
      }
    },
    [connectionId, collection, embedText]
  );

  const searchByVector = useCallback(
    async (vector: number[], limit: number, threshold?: number) => {
      if (!connectionId) return;

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
        });

        if (response.success) {
          setResults(response.results);
        } else {
          setError(response.error);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setIsSearching(false);
      }
    },
    [connectionId, collection]
  );

  const searchSimilar = useCallback(
    async (pointId: string | number, limit: number) => {
      if (!connectionId) return;

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
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setIsSearching(false);
      }
    },
    [connectionId, collection]
  );

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
```

**Step 2: Run typecheck**

Run: `pnpm typecheck`
Expected: May fail until API methods are added

**Step 3: Commit**

```bash
git add apps/electron/src/renderer/src/hooks/useVectorSearch.ts
git commit -m "feat(qdrant): add useVectorSearch hook"
```

---

## Phase 2.3: Embedding Configuration

### Task 10: Extend AI Settings with Embedding Configuration

**Files:**

- Modify: `apps/electron/src/shared/types.ts`
- Modify: `apps/electron/src/renderer/src/stores/ai-store.ts`

**Step 1: Add EmbeddingSettings to shared types**

Add after AIProviderSettings:

```typescript
export interface EmbeddingSettings {
  enabled: boolean;
  provider: 'openai' | 'custom';
  model: string;
  baseUrl?: string;
  apiKey?: string; // Optional, falls back to main provider key
  dimensions?: number;
}
```

Update AISettings to include embedding:

```typescript
export interface AISettings {
  provider: AIProvider;
  providerSettings?: {
    anthropic?: AIProviderSettings;
    openai?: AIProviderSettings;
    custom?: AIProviderSettings;
  };
  claudeCodePath?: string;
  embedding?: EmbeddingSettings;
}
```

**Step 2: Update AI store to handle embedding settings**

**Step 3: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS

**Step 4: Commit**

```bash
git add apps/electron/src/shared/types.ts apps/electron/src/renderer/src/stores/ai-store.ts
git commit -m "feat(qdrant): add embedding settings to AI configuration"
```

---

## Phase 2.4: UMAP Visualization

### Task 11: Install umap-js Dependency

**Files:**

- Modify: `apps/electron/package.json`

**Step 1: Install umap-js**

Run: `pnpm add umap-js --filter @sqlpro/app`

**Step 2: Commit**

```bash
git add apps/electron/package.json pnpm-lock.yaml
git commit -m "chore(deps): add umap-js for vector visualization"
```

---

### Task 12: Create UMAP Web Worker

**Files:**

- Create: `apps/electron/src/renderer/src/workers/umap.worker.ts`

**Step 1: Create the Web Worker**

```typescript
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

self.onmessage = (event: MessageEvent<UMAPRequest>) => {
  const { vectors, nComponents, nNeighbors = 15, minDist = 0.1 } = event.data;

  try {
    if (vectors.length < nNeighbors) {
      self.postMessage({
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

    self.postMessage({
      type: 'result',
      data: embedding,
    } as UMAPResponse);
  } catch (error) {
    self.postMessage({
      type: 'error',
      error: error instanceof Error ? error.message : String(error),
    } as UMAPResponse);
  }
};
```

**Step 2: Commit**

```bash
git add apps/electron/src/renderer/src/workers/umap.worker.ts
git commit -m "feat(qdrant): add UMAP Web Worker"
```

---

### Task 13: Create useUMAP Hook

**Files:**

- Create: `apps/electron/src/renderer/src/hooks/useUMAP.ts`

**Step 1: Create useUMAP.ts**

```typescript
import { useState, useEffect, useRef, useCallback } from 'react';

interface UMAPResult {
  embedding: number[][] | null;
  isComputing: boolean;
  error: string | null;
}

export function useUMAP(
  vectors: number[][],
  options: {
    nComponents?: 2 | 3;
    nNeighbors?: number;
    minDist?: number;
    enabled?: boolean;
  } = {}
): UMAPResult {
  const {
    nComponents = 2,
    nNeighbors = 15,
    minDist = 0.1,
    enabled = true,
  } = options;

  const [embedding, setEmbedding] = useState<number[][] | null>(null);
  const [isComputing, setIsComputing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const abortRef = useRef(false);

  // Cleanup worker on unmount
  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  // Compute UMAP when vectors change
  useEffect(() => {
    if (!enabled || vectors.length < 3) {
      setEmbedding(null);
      return;
    }

    abortRef.current = false;
    setIsComputing(true);
    setError(null);

    // Terminate existing worker
    if (workerRef.current) {
      workerRef.current.terminate();
    }

    // Create new worker
    workerRef.current = new Worker(
      new URL('../workers/umap.worker.ts', import.meta.url),
      { type: 'module' }
    );

    workerRef.current.onmessage = (event) => {
      if (abortRef.current) return;

      const { type, data, error: workerError } = event.data;

      switch (type) {
        case 'result':
          setEmbedding(data);
          setIsComputing(false);
          break;
        case 'error':
          setError(workerError);
          setIsComputing(false);
          break;
        case 'progress':
          // Could update progress state here
          break;
      }
    };

    workerRef.current.onerror = (err) => {
      if (abortRef.current) return;
      setError(err.message);
      setIsComputing(false);
    };

    // Send data to worker
    workerRef.current.postMessage({
      vectors,
      nComponents,
      nNeighbors,
      minDist,
    });

    return () => {
      abortRef.current = true;
    };
  }, [vectors, nComponents, nNeighbors, minDist, enabled]);

  return { embedding, isComputing, error };
}
```

**Step 2: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS

**Step 3: Commit**

```bash
git add apps/electron/src/renderer/src/hooks/useUMAP.ts
git commit -m "feat(qdrant): add useUMAP hook"
```

---

### Task 14: Create VectorVisualization Component

**Files:**

- Create: `apps/electron/src/renderer/src/components/vector-search/VectorVisualization.tsx`

**Step 1: Create VectorVisualization.tsx**

```typescript
import { useRef, useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { Button } from '@sqlpro/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@sqlpro/ui/toggle-group';
import { useUMAP } from '@/hooks/useUMAP';
import type { VectorSearchResult, PointWithVector } from '@shared/types';

interface VectorVisualizationProps {
  backgroundPoints: PointWithVector[];
  searchResults: VectorSearchResult[];
  isLoading: boolean;
}

export function VectorVisualization({
  backgroundPoints,
  searchResults,
  isLoading,
}: VectorVisualizationProps) {
  const { t } = useTranslation('qdrant');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState<2 | 3>(2);
  const [hoveredPoint, setHoveredPoint] = useState<PointWithVector | VectorSearchResult | null>(null);

  // Combine background and search result vectors
  const allVectors = useMemo(() => {
    const vectors: number[][] = [];
    const searchIds = new Set(searchResults.map((r) => String(r.id)));

    // Add background points (excluding search results to avoid duplicates)
    for (const point of backgroundPoints) {
      if (!searchIds.has(String(point.id)) && point.vector) {
        vectors.push(point.vector);
      }
    }

    // Add search result vectors if available
    for (const result of searchResults) {
      if (result.vector) {
        vectors.push(result.vector);
      }
    }

    return vectors;
  }, [backgroundPoints, searchResults]);

  // Compute UMAP embedding
  const { embedding, isComputing, error } = useUMAP(allVectors, {
    nComponents: dimensions,
    enabled: allVectors.length > 0,
  });

  // Build point data with UMAP coordinates
  const pointsWithCoords = useMemo(() => {
    if (!embedding) return { background: [], results: [] };

    const searchIds = new Set(searchResults.map((r) => String(r.id)));
    let embeddingIndex = 0;

    const background: Array<{ x: number; y: number; z?: number; point: PointWithVector }> = [];
    const results: Array<{ x: number; y: number; z?: number; point: VectorSearchResult }> = [];

    // Map background points
    for (const point of backgroundPoints) {
      if (!searchIds.has(String(point.id)) && point.vector) {
        const coord = embedding[embeddingIndex++];
        if (coord) {
          background.push({
            x: coord[0],
            y: coord[1],
            z: dimensions === 3 ? coord[2] : undefined,
            point,
          });
        }
      }
    }

    // Map search results
    for (const result of searchResults) {
      if (result.vector) {
        const coord = embedding[embeddingIndex++];
        if (coord) {
          results.push({
            x: coord[0],
            y: coord[1],
            z: dimensions === 3 ? coord[2] : undefined,
            point: result,
          });
        }
      }
    }

    return { background, results };
  }, [embedding, backgroundPoints, searchResults, dimensions]);

  // Draw on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !embedding) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;
    const padding = 40;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Find bounds
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    for (const coord of embedding) {
      minX = Math.min(minX, coord[0]);
      maxX = Math.max(maxX, coord[0]);
      minY = Math.min(minY, coord[1]);
      maxY = Math.max(maxY, coord[1]);
    }

    const scaleX = (width - 2 * padding) / (maxX - minX || 1);
    const scaleY = (height - 2 * padding) / (maxY - minY || 1);

    const toCanvas = (x: number, y: number) => ({
      cx: padding + (x - minX) * scaleX,
      cy: padding + (y - minY) * scaleY,
    });

    // Draw background points
    ctx.fillStyle = 'rgba(100, 100, 100, 0.4)';
    for (const { x, y } of pointsWithCoords.background) {
      const { cx, cy } = toCanvas(x, y);
      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw search results with emphasis
    ctx.fillStyle = 'rgba(59, 130, 246, 0.9)'; // Blue
    ctx.strokeStyle = 'rgba(59, 130, 246, 1)';
    ctx.lineWidth = 2;
    for (const { x, y, point } of pointsWithCoords.results) {
      const { cx, cy } = toCanvas(x, y);
      ctx.beginPath();
      ctx.arc(cx, cy, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }, [embedding, pointsWithCoords, dimensions]);

  if (isLoading || isComputing) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">
          {isLoading ? t('loadingPoints', 'Loading points...') : t('computingUMAP', 'Computing UMAP...')}
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center text-destructive">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Controls */}
      <div className="flex items-center justify-between border-b p-2">
        <span className="text-sm font-medium">{t('vectorDistribution', 'Vector Distribution')}</span>
        <ToggleGroup
          type="single"
          value={String(dimensions)}
          onValueChange={(v) => v && setDimensions(parseInt(v) as 2 | 3)}
        >
          <ToggleGroupItem value="2" size="sm">2D</ToggleGroupItem>
          <ToggleGroupItem value="3" size="sm">3D</ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Canvas */}
      <div className="relative flex-1 min-h-0">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          width={400}
          height={400}
        />

        {/* Hover tooltip */}
        {hoveredPoint && (
          <div className="absolute bg-popover border rounded p-2 text-sm pointer-events-none">
            <p className="font-mono">ID: {String('id' in hoveredPoint ? hoveredPoint.id : '')}</p>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 border-t p-2 text-xs">
        <div className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-gray-400" />
          <span>{t('backgroundPoints', 'Background')}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-blue-500" />
          <span>{t('searchResults', 'Search Results')}</span>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS

**Step 3: Commit**

```bash
git add apps/electron/src/renderer/src/components/vector-search/VectorVisualization.tsx
git commit -m "feat(qdrant): add VectorVisualization component with UMAP"
```

---

## Phase 2.5: Integration

### Task 15: Integrate Vector Search into Database View

**Files:**

- Modify: `apps/electron/src/renderer/src/components/ActivityBar.tsx`
- Modify: `apps/electron/src/renderer/src/components/DatabaseView.tsx`

**Step 1: Add vector search view to ActivityBar**

Add a new view type for vector search (only visible for Qdrant connections).

**Step 2: Add conditional rendering in DatabaseView**

When connected to Qdrant and vector search view is active, render VectorSearchPanel.

**Step 3: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS

**Step 4: Commit**

```bash
git add apps/electron/src/renderer/src/components/ActivityBar.tsx
git add apps/electron/src/renderer/src/components/DatabaseView.tsx
git commit -m "feat(qdrant): integrate vector search panel into database view"
```

---

### Task 16: Add Translations

**Files:**

- Create: `apps/electron/src/renderer/src/locales/en/qdrant.json`
- Create: `apps/electron/src/renderer/src/locales/zh/qdrant.json`
- Modify: `apps/electron/src/renderer/src/i18n.ts` (if needed to register namespace)

**Step 1: Create English translations**

```json
{
  "vectorSearch": "Vector Search",
  "searchMode": "Search Mode",
  "textSearch": "Text",
  "vectorInput": "Vector",
  "similarSearch": "Similar",
  "textSearchPlaceholder": "Enter search text...",
  "vectorInputPlaceholder": "[0.1, 0.2, 0.3, ...]",
  "pointIdPlaceholder": "Enter point ID...",
  "scoreThreshold": "Score Threshold",
  "search": "Search",
  "searching": "Searching...",
  "noResults": "No search results",
  "score": "Score",
  "id": "ID",
  "findSimilar": "Find similar",
  "loadingPoints": "Loading points...",
  "computingUMAP": "Computing UMAP...",
  "vectorDistribution": "Vector Distribution",
  "backgroundPoints": "Background",
  "searchResults": "Search Results"
}
```

**Step 2: Create Chinese translations**

```json
{
  "vectorSearch": "向量搜索",
  "searchMode": "搜索模式",
  "textSearch": "文本",
  "vectorInput": "向量",
  "similarSearch": "相似",
  "textSearchPlaceholder": "输入搜索文本...",
  "vectorInputPlaceholder": "[0.1, 0.2, 0.3, ...]",
  "pointIdPlaceholder": "输入点 ID...",
  "scoreThreshold": "相似度阈值",
  "search": "搜索",
  "searching": "搜索中...",
  "noResults": "无搜索结果",
  "score": "分数",
  "id": "ID",
  "findSimilar": "查找相似",
  "loadingPoints": "加载点数据...",
  "computingUMAP": "计算 UMAP...",
  "vectorDistribution": "向量分布",
  "backgroundPoints": "背景点",
  "searchResults": "搜索结果"
}
```

**Step 3: Run typecheck and build**

Run: `pnpm typecheck && pnpm build`
Expected: PASS

**Step 4: Commit**

```bash
git add apps/electron/src/renderer/src/locales/
git commit -m "feat(qdrant): add vector search translations"
```

---

## Final Verification

After all tasks are complete:

1. Run full test suite: `pnpm test`
2. Run typecheck: `pnpm typecheck`
3. Run lint: `pnpm lint`
4. Manual testing with Qdrant Docker container

---

## Success Criteria

- ✅ Text search: input text → embed → vector search → results
- ✅ Vector input: paste vector array → search → results
- ✅ Similar search: click point ID → find similar points
- ✅ Results table: shows score, ID, payload columns
- ✅ UMAP visualization: 2D scatter plot with background + highlighted results
- ✅ 2D/3D toggle works
- ✅ Hover shows point details
