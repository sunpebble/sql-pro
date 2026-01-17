import type { VectorSearchResult } from '@shared/types';
import { Button } from '@sqlpro/ui/button';
import { Input } from '@sqlpro/ui/input';
import { Label } from '@sqlpro/ui/label';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@sqlpro/ui/resizable';
import { ScrollArea } from '@sqlpro/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@sqlpro/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@sqlpro/ui/tabs';
import { Textarea } from '@sqlpro/ui/textarea';
import {
  FileText,
  Hash,
  Loader2,
  Search,
  Target,
  Type,
  Waypoints,
} from 'lucide-react';
import { memo, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

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
const ResultCard = memo(({
  result,
  index,
}: {
  result: VectorSearchResult;
  index: number;
}) => {
  const { t } = useTranslation('common');

  return (
    <div className="hover:bg-muted/50 rounded-lg border p-3 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="bg-muted flex h-6 w-6 items-center justify-center rounded text-xs font-medium">
            {index + 1}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Hash className="text-muted-foreground h-3 w-3" />
              <span className="font-mono text-sm">{String(result.id)}</span>
            </div>
          </div>
        </div>
        <div className="text-muted-foreground flex items-center gap-1 text-xs">
          <span>{t('vectorSearch.score', 'Score')}:</span>
          <span className="text-foreground font-mono font-medium">
            {result.score.toFixed(4)}
          </span>
        </div>
      </div>

      {/* Payload preview */}
      {result.payload && Object.keys(result.payload).length > 0 && (
        <div className="bg-muted/50 mt-2 rounded p-2">
          <pre className="text-muted-foreground overflow-x-auto text-xs">
            {JSON.stringify(result.payload, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
});

/**
 * VectorSearchPanel component for searching vectors in a Qdrant collection.
 *
 * Provides three search modes:
 * - Text: Search using text input (requires embedding model)
 * - Vector: Search using raw vector input (JSON array)
 * - Similar: Find similar points by point ID
 */
export const VectorSearchPanel = memo(({
  collection,
  connectionId: _connectionId,
  className,
}: VectorSearchPanelProps) => {
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

  // Search state
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<VectorSearchResult[]>([]);

  // Validate vector JSON input
  const validateVectorInput = useCallback((input: string): number[] | null => {
    if (!input.trim()) {
      setVectorError(null);
      return null;
    }

    try {
      const parsed = JSON.parse(input);
      if (!Array.isArray(parsed)) {
        setVectorError('Input must be a JSON array');
        return null;
      }
      if (parsed.length === 0) {
        setVectorError('Vector cannot be empty');
        return null;
      }
      if (!parsed.every((v) => typeof v === 'number')) {
        setVectorError('All elements must be numbers');
        return null;
      }
      setVectorError(null);
      return parsed;
    } catch {
      setVectorError('Invalid JSON format');
      return null;
    }
  }, []);

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
    setIsSearching(true);

    // Placeholder: simulate search delay
    // Real implementation will use useVectorSearch hook (Task 9)
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Generate placeholder results
    const placeholderResults: VectorSearchResult[] = Array.from(
      { length: Math.min(topK, 5) },
      (_, i) => ({
        id: `point-${i + 1}`,
        score: 1 - i * 0.1,
        payload: {
          title: `Result ${i + 1}`,
          description: `Sample result from ${collection}`,
          metadata: { index: i },
        },
      })
    );

    setResults(placeholderResults);
    setIsSearching(false);
  }, [topK, collection]);

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

  return (
    <div className={cn('flex h-full flex-col', className)}>
      {/* Header with collection name */}
      <div className="bg-muted/30 flex shrink-0 items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-2">
          <Waypoints className="text-muted-foreground h-4 w-4" />
          <span className="text-sm font-medium">
            {t('vectorSearch.title', 'Vector Search')}
          </span>
          <span className="bg-muted text-muted-foreground rounded px-2 py-0.5 text-xs">
            {collection}
          </span>
        </div>
      </div>

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
                      onChange={(e) => handleVectorInputChange(e.target.value)}
                      className={cn(
                        'min-h-20 resize-none font-mono text-sm',
                        vectorError && 'border-destructive'
                      )}
                    />
                    {vectorError && (
                      <p className="text-destructive text-xs">{vectorError}</p>
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
                <div className="flex items-end gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="top-k">
                      {t('vectorSearch.topK', 'Top K')}
                    </Label>
                    <Select value={topK} onValueChange={(v) => setTopK(v)}>
                      <SelectTrigger id="top-k" className="w-24">
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

                  <div className="space-y-2">
                    <Label htmlFor="score-threshold">
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
                        setScoreThreshold(Number.parseFloat(e.target.value) || 0)
                      }
                      className="w-24"
                    />
                  </div>

                  <Button
                    onClick={handleSearch}
                    disabled={!canSearch() || isSearching}
                    className="shrink-0"
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
                  <span className="text-muted-foreground text-sm">
                    {t('vectorSearch.results', 'Results')}
                    {results.length > 0 && (
                      <span className="ml-1.5">({results.length})</span>
                    )}
                  </span>
                </div>

                <ScrollArea className="flex-1">
                  {results.length === 0 ? (
                    <div className="text-muted-foreground flex h-full flex-col items-center justify-center gap-2 p-8">
                      <Search className="h-10 w-10 opacity-20" />
                      <p className="text-sm">
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

        {/* Right panel: Visualization placeholder */}
        <ResizablePanel defaultSize={40} minSize={25}>
          <div className="flex h-full flex-col">
            <div className="bg-muted/30 flex shrink-0 items-center justify-between border-b px-4 py-2">
              <span className="text-muted-foreground text-sm">
                {t('vectorSearch.visualization', 'Visualization')}
              </span>
            </div>
            <div className="text-muted-foreground flex flex-1 flex-col items-center justify-center gap-2 p-8">
              <Waypoints className="h-10 w-10 opacity-20" />
              <p className="text-center text-sm">
                {t(
                  'vectorSearch.visualizationPlaceholder',
                  'Vector visualization will be displayed here'
                )}
              </p>
              <p className="text-center text-xs opacity-60">
                {t(
                  'vectorSearch.visualizationHint',
                  'Coming in a future update'
                )}
              </p>
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
});
