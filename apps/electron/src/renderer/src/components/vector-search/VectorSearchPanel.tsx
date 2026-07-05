import type {
  VectorSearchHistoryEntry,
  VectorSearchResult,
} from '@shared/types';
import { Button } from '@quarry/ui/button';
import { Input } from '@quarry/ui/input';
import { Label } from '@quarry/ui/label';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@quarry/ui/resizable';
import { ScrollArea } from '@quarry/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@quarry/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@quarry/ui/tabs';
import { Textarea } from '@quarry/ui/textarea';
import {
  AlertCircle,
  Clock,
  FileText,
  Hash,
  Loader2,
  Search,
  Target,
  Type,
  Waypoints,
} from 'lucide-react';
import { memo, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useVectorSearch } from '@/hooks/useVectorSearch';
import { useVectorSearchHistory } from '@/hooks/useVectorSearchHistory';
import { cn } from '@/lib/utils';
import { VectorSearchFilter } from './VectorSearchFilter';
import { VectorSearchHistory } from './VectorSearchHistory';
import { VectorVisualization } from './VectorVisualization';

// Search mode types
type SearchMode = 'text' | 'vector' | 'similar';

interface VectorSearchPanelProps {
  /** Collection name to search in */
  collection: string;
  /** Connection ID for the Qdrant instance */
  connectionId?: string;
  /** Optional class name for styling */
  className?: string;
}

/**
 * Individual search result card
 */
const ResultCard = memo(
  ({ result, index }: { result: VectorSearchResult; index: number }) => {
    const { t } = useTranslation('common');

    return (
      <div className="hover:bg-muted/50 rounded-base border-border border p-3 transition-colors">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div
              className="bg-muted flex h-6 w-6 items-center justify-center rounded font-medium"
              style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
            >
              {index + 1}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Hash className="text-muted-foreground h-3 w-3" />
                <span
                  className="font-mono"
                  style={{ fontSize: 'var(--font-ui-size, 13px)' }}
                >
                  {String(result.id)}
                </span>
              </div>
            </div>
          </div>
          <div
            className="text-muted-foreground flex items-center gap-1"
            style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
          >
            <span>{t('vectorSearch.score', 'Score')}:</span>
            <span className="text-foreground font-mono font-medium">
              {result.score.toFixed(4)}
            </span>
          </div>
        </div>

        {/* Payload preview */}
        {result.payload && Object.keys(result.payload).length > 0 && (
          <div className="bg-muted/50 mt-2 rounded p-2">
            <pre
              className="text-muted-foreground overflow-x-auto"
              style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
            >
              {JSON.stringify(result.payload, null, 2)}
            </pre>
          </div>
        )}
      </div>
    );
  }
);

ResultCard.displayName = 'ResultCard';

/**
 * VectorSearchPanel component for searching vectors in a Qdrant collection.
 *
 * Provides three search modes:
 * - Text: Search using text input (requires embedding model)
 * - Vector: Search using raw vector input (JSON array)
 * - Similar: Find similar points by point ID
 */
export const VectorSearchPanel = memo(
  ({ collection, connectionId, className }: VectorSearchPanelProps) => {
    const { t } = useTranslation('common');

    // Search mode state
    const [searchMode, setSearchMode] = useState<SearchMode>('text');

    // Text search inputs
    const [textQuery, setTextQuery] = useState('');

    // Vector search inputs
    const [vectorInput, setVectorInput] = useState('');
    const [vectorError, setVectorError] = useState<string | null>(null);

    // Similar search inputs
    const [pointId, setPointId] = useState('');

    // Common search parameters
    const [topK, setTopK] = useState(10);
    const [scoreThreshold, setScoreThreshold] = useState(0);

    // Use the vector search hook
    const {
      results,
      isSearching,
      error: searchError,
      searchByText,
      searchByVector,
      searchSimilar,
      backgroundPoints,
      isLoadingBackground,
      filter,
      setFilter,
    } = useVectorSearch(connectionId ?? null, collection);

    // Use the search history hook
    const {
      addEntry: addHistoryEntry,
      removeEntry: removeHistoryEntry,
      clearHistory,
      getHistoryByCollection,
    } = useVectorSearchHistory();

    // Show history panel state
    const [showHistory, setShowHistory] = useState(false);

    // Get history for current collection
    const collectionHistory = useMemo(
      () => getHistoryByCollection(collection),
      [getHistoryByCollection, collection]
    );

    // Extract unique payload fields from background points for filter dropdown
    const payloadFields = useMemo(() => {
      const fieldSet = new Set<string>();
      for (const point of backgroundPoints) {
        if (point.payload) {
          Object.keys(point.payload).forEach((key) => fieldSet.add(key));
        }
      }
      return Array.from(fieldSet).sort();
    }, [backgroundPoints]);

    // Validate vector JSON input
    const validateVectorInput = useCallback(
      (input: string): number[] | null => {
        if (!input.trim()) {
          setVectorError(null);
          return null;
        }

        try {
          const parsed = JSON.parse(input);
          if (!Array.isArray(parsed)) {
            setVectorError(t('vectorSearch.inputMustBeArray'));
            return null;
          }
          if (parsed.length === 0) {
            setVectorError(t('vectorSearch.vectorCannotBeEmpty'));
            return null;
          }
          if (!parsed.every((v) => typeof v === 'number')) {
            setVectorError(t('vectorSearch.allElementsMustBeNumbers'));
            return null;
          }
          setVectorError(null);
          return parsed;
        } catch {
          setVectorError(t('vectorSearch.invalidJsonFormat'));
          return null;
        }
      },
      [t]
    );

    // Handle vector input change
    const handleVectorInputChange = useCallback(
      (value: string) => {
        setVectorInput(value);
        validateVectorInput(value);
      },
      [validateVectorInput]
    );

    // Handle search
    const handleSearch = useCallback(async () => {
      let query = '';
      let searchResults: VectorSearchResult[] = [];
      switch (searchMode) {
        case 'text':
          query = textQuery;
          searchResults = await searchByText(
            textQuery,
            topK,
            scoreThreshold || undefined,
            filter
          );
          break;
        case 'vector': {
          const vector = validateVectorInput(vectorInput);
          if (vector) {
            query = `[${vector.length} dimensions]`;
            searchResults = await searchByVector(
              vector,
              topK,
              scoreThreshold || undefined,
              filter
            );
          }
          break;
        }
        case 'similar':
          query = `Similar to: ${pointId}`;
          searchResults = await searchSimilar(pointId, topK, filter);
          break;
      }

      // Add to history after search completes, using the returned results
      // so the recorded counts reflect this search (not stale closure state).
      if (query) {
        addHistoryEntry({
          collection,
          mode: searchMode,
          query,
          resultsCount: searchResults.length,
          topScore: searchResults[0]?.score,
        });
      }
    }, [
      searchMode,
      textQuery,
      vectorInput,
      pointId,
      topK,
      scoreThreshold,
      filter,
      collection,
      searchByText,
      searchByVector,
      searchSimilar,
      validateVectorInput,
      addHistoryEntry,
    ]);

    // Check if search can be performed
    const canSearch = useCallback(() => {
      switch (searchMode) {
        case 'text':
          return textQuery.trim().length > 0;
        case 'vector':
          return vectorInput.trim().length > 0 && !vectorError;
        case 'similar':
          return pointId.trim().length > 0;
        default:
          return false;
      }
    }, [searchMode, textQuery, vectorInput, vectorError, pointId]);

    // Handle selecting a history entry
    const handleSelectHistoryEntry = useCallback(
      (entry: VectorSearchHistoryEntry) => {
        setSearchMode(entry.mode);
        if (entry.mode === 'text') {
          setTextQuery(entry.query);
        } else if (
          entry.mode === 'similar' &&
          entry.query.startsWith('Similar to: ')
        ) {
          setPointId(entry.query.replace('Similar to: ', ''));
        }
        setShowHistory(false);
      },
      []
    );

    return (
      <div className={cn('flex h-full flex-col', className)}>
        {/* Header with collection name */}
        <div className="bg-muted/30 flex shrink-0 items-center justify-between border-b px-4 py-2">
          <div className="flex items-center gap-2">
            <Waypoints className="text-muted-foreground h-4 w-4" />
            <span
              className="font-medium"
              style={{ fontSize: 'var(--font-ui-size, 13px)' }}
            >
              {t('vectorSearch.title', 'Vector Search')}
            </span>
            <span
              className="bg-muted text-muted-foreground rounded px-2 py-0.5"
              style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
            >
              {collection}
            </span>
          </div>
          <Button
            variant={showHistory ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setShowHistory(!showHistory)}
            className="gap-1.5"
          >
            <Clock className="h-3.5 w-3.5" />
            {t('vectorSearch.history.button', 'History')}
            {collectionHistory.length > 0 && (
              <span
                className="bg-muted text-muted-foreground ml-1 rounded-full px-1.5 py-0.5"
                style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
              >
                {collectionHistory.length}
              </span>
            )}
          </Button>
        </div>

        {/* History panel (shown when showHistory is true) */}
        {showHistory && (
          <div className="border-b">
            <VectorSearchHistory
              entries={collectionHistory}
              onSelectEntry={handleSelectHistoryEntry}
              onDeleteEntry={removeHistoryEntry}
              onClearHistory={clearHistory}
              className="max-h-64"
            />
          </div>
        )}

        {/* Main content with resizable panels */}
        <ResizablePanelGroup direction="horizontal" className="min-h-0 flex-1">
          {/* Left panel: Search controls and results */}
          <ResizablePanel defaultSize={60} minSize={40}>
            <div className="flex h-full flex-col">
              {/* Search mode tabs */}
              <Tabs
                value={searchMode}
                onValueChange={(v) => setSearchMode(v as SearchMode)}
                className="flex flex-col"
              >
                <div className="border-b px-4 py-2">
                  <TabsList variant="line">
                    <TabsTrigger value="text">
                      <Type className="mr-1.5 h-3.5 w-3.5" />
                      {t('vectorSearch.modes.text', 'Text')}
                    </TabsTrigger>
                    <TabsTrigger value="vector">
                      <FileText className="mr-1.5 h-3.5 w-3.5" />
                      {t('vectorSearch.modes.vector', 'Vector')}
                    </TabsTrigger>
                    <TabsTrigger value="similar">
                      <Target className="mr-1.5 h-3.5 w-3.5" />
                      {t('vectorSearch.modes.similar', 'Similar')}
                    </TabsTrigger>
                  </TabsList>
                </div>

                {/* Search inputs */}
                <div className="space-y-4 p-4">
                  {/* Text search mode */}
                  <TabsContent value="text" className="m-0 space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="text-query">
                        {t('vectorSearch.textQuery', 'Search Query')}
                      </Label>
                      <Textarea
                        id="text-query"
                        placeholder={t(
                          'vectorSearch.textPlaceholder',
                          'Enter your search text...'
                        )}
                        value={textQuery}
                        onChange={(e) => setTextQuery(e.target.value)}
                        className="min-h-20 resize-none"
                      />
                    </div>
                  </TabsContent>

                  {/* Vector search mode */}
                  <TabsContent value="vector" className="m-0 space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="vector-input">
                        {t('vectorSearch.vectorInput', 'Vector (JSON Array)')}
                      </Label>
                      <Textarea
                        id="vector-input"
                        placeholder={t(
                          'vectorSearch.vectorPlaceholder',
                          '[0.1, 0.2, 0.3, ...]'
                        )}
                        value={vectorInput}
                        onChange={(e) =>
                          handleVectorInputChange(e.target.value)
                        }
                        className={cn(
                          'min-h-20 resize-none font-mono',
                          vectorError && 'border-destructive'
                        )}
                        style={{ fontSize: 'var(--font-ui-size, 13px)' }}
                      />
                      {vectorError && (
                        <p
                          className="text-destructive"
                          style={{
                            fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)',
                          }}
                        >
                          {vectorError}
                        </p>
                      )}
                    </div>
                  </TabsContent>

                  {/* Similar search mode */}
                  <TabsContent value="similar" className="m-0 space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="point-id">
                        {t('vectorSearch.pointId', 'Point ID')}
                      </Label>
                      <Input
                        id="point-id"
                        placeholder={t(
                          'vectorSearch.pointIdPlaceholder',
                          'Enter point ID to find similar...'
                        )}
                        value={pointId}
                        onChange={(e) => setPointId(e.target.value)}
                      />
                    </div>
                  </TabsContent>

                  {/* Common search parameters */}
                  <div className="flex items-center gap-6 pt-4">
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <Label
                          htmlFor="top-k"
                          className="text-muted-foreground whitespace-nowrap"
                          style={{
                            fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)',
                          }}
                        >
                          {t('vectorSearch.topK', 'Top K')}
                        </Label>
                        <Select value={topK} onValueChange={(v) => setTopK(v)}>
                          <SelectTrigger id="top-k" className="h-9 w-20">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[5, 10, 20, 50, 100].map((k) => (
                              <SelectItem key={k} value={k}>
                                {k}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center gap-2">
                        <Label
                          htmlFor="score-threshold"
                          className="text-muted-foreground whitespace-nowrap"
                          style={{
                            fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)',
                          }}
                        >
                          {t('vectorSearch.scoreThreshold', 'Min Score')}
                        </Label>
                        <Input
                          id="score-threshold"
                          type="number"
                          min={0}
                          max={1}
                          step={0.1}
                          value={scoreThreshold}
                          onChange={(e) =>
                            setScoreThreshold(
                              Number.parseFloat(e.target.value) || 0
                            )
                          }
                          className="h-9 w-20"
                        />
                      </div>
                    </div>

                    {/* Filter component inline */}
                    <VectorSearchFilter
                      onFilterChange={setFilter}
                      payloadFields={payloadFields}
                    />

                    <Button
                      onClick={handleSearch}
                      disabled={!canSearch() || isSearching}
                      className="h-9 shrink-0"
                    >
                      {isSearching ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="mr-2 h-4 w-4" />
                      )}
                      {t('vectorSearch.search', 'Search')}
                    </Button>
                  </div>
                </div>
              </Tabs>

              {/* Search results */}
              <div className="min-h-0 flex-1 border-t">
                <div className="flex h-full flex-col">
                  <div className="bg-muted/30 flex shrink-0 items-center justify-between px-4 py-2">
                    <span
                      className="text-muted-foreground"
                      style={{ fontSize: 'var(--font-ui-size, 13px)' }}
                    >
                      {t('vectorSearch.results', 'Results')}
                      {results.length > 0 && (
                        <span className="ml-1.5">({results.length})</span>
                      )}
                    </span>
                  </div>

                  <ScrollArea className="flex-1">
                    {/* Error display */}
                    {searchError && (
                      <div
                        className="flex items-center gap-2 border-b border-red-200 bg-red-50 p-3 text-red-600 dark:border-red-900 dark:bg-red-950 dark:text-red-400"
                        style={{ fontSize: 'var(--font-ui-size, 13px)' }}
                      >
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{searchError}</span>
                      </div>
                    )}
                    {results.length === 0 && !searchError ? (
                      <div className="text-muted-foreground flex h-full flex-col items-center justify-center gap-2 p-8">
                        <Search className="h-10 w-10 opacity-20" />
                        <p style={{ fontSize: 'var(--font-ui-size, 13px)' }}>
                          {t(
                            'vectorSearch.noResults',
                            'Enter a query to search for similar vectors'
                          )}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2 p-4">
                        {results.map((result, index) => (
                          <ResultCard
                            key={result.id}
                            result={result}
                            index={index}
                          />
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </div>
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Right panel: Visualization */}
          <ResizablePanel defaultSize={40} minSize={25}>
            <VectorVisualization
              backgroundPoints={backgroundPoints}
              searchResults={results}
              isLoading={isLoadingBackground}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    );
  }
);

VectorSearchPanel.displayName = 'VectorSearchPanel';
