import type { ColorMode, Connection, OnConnect } from '@xyflow/react';
import type { QueryBuilderEdge, QueryBuilderNode } from '@/types/query-builder';
import { Button } from '@sqlpro/ui/button';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@sqlpro/ui/resizable';
import { Tooltip, TooltipContent, TooltipTrigger } from '@sqlpro/ui/tooltip';
import {
  Background,
  MiniMap,
  Panel,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from '@xyflow/react';
import { Code, Copy } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useConnectionStore } from '@/stores/connection-store';
import { useQueryBuilderStore } from '@/stores/query-builder-store';
import { useQueryTabsStore } from '@/stores/query-tabs-store';
import { generateSQL } from '@/utils/query-builder-to-sql';
import { QueryBuilderJoinEdge } from './QueryBuilderJoinEdge';
import { QueryBuilderTableNode } from './QueryBuilderTableNode';
import { QueryBuilderToolbar } from './QueryBuilderToolbar';
import '@xyflow/react/dist/style.css';

// Register custom node and edge types
const nodeTypes = {
  queryBuilderTable: QueryBuilderTableNode,
};

const edgeTypes = {
  queryBuilderJoin: QueryBuilderJoinEdge,
};

export function QueryBuilder() {
  const { t } = useTranslation();
  const { resolvedTheme } = useTheme();
  const { connection, schema } = useConnectionStore();
  const { createTab, activeConnectionId } = useQueryTabsStore();

  const {
    nodes: storeNodes,
    edges: storeEdges,
    selectedColumns,
    filters,
    sorts,
    groupBy,
    distinct,
    limit,
    offset,
    setNodes: setStoreNodes,
    setEdges: _setStoreEdges,
    addJoin,
    setViewport,
    viewport,
  } = useQueryBuilderStore();

  const [nodes, setNodes, onNodesChange] = useNodesState<QueryBuilderNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<QueryBuilderEdge>([]);

  // Sync nodes/edges from store
  useEffect(() => {
    setNodes(storeNodes);
  }, [storeNodes, setNodes]);

  useEffect(() => {
    setEdges(storeEdges);
  }, [storeEdges, setEdges]);

  // Generate SQL from current state
  const generatedSQL = useMemo(() => {
    return generateSQL({
      nodes: storeNodes,
      edges: storeEdges,
      selectedColumns,
      filters,
      sorts,
      groupBy,
      distinct,
      limit,
      offset,
    });
  }, [
    storeNodes,
    storeEdges,
    selectedColumns,
    filters,
    sorts,
    groupBy,
    distinct,
    limit,
    offset,
  ]);

  // Handle node changes and sync to store
  const handleNodesChange = useCallback(
    (changes: Parameters<typeof onNodesChange>[0]) => {
      onNodesChange(changes);

      // Sync position changes to store
      changes.forEach((change) => {
        if (change.type === 'position' && change.position && !change.dragging) {
          setStoreNodes(
            storeNodes.map((node) =>
              node.id === change.id
                ? { ...node, position: change.position! }
                : node
            )
          );
        }
      });
    },
    [onNodesChange, storeNodes, setStoreNodes]
  );

  // Handle edge changes and sync to store
  const handleEdgesChange = useCallback(
    (changes: Parameters<typeof onEdgesChange>[0]) => {
      onEdgesChange(changes);
    },
    [onEdgesChange]
  );

  // Handle new connections (JOINs)
  const handleConnect: OnConnect = useCallback(
    (params: Connection) => {
      if (
        !params.source ||
        !params.target ||
        !params.sourceHandle ||
        !params.targetHandle
      ) {
        return;
      }

      // Extract column names from handles
      const sourceColumn = params.sourceHandle.replace('-source', '');
      const targetColumn = params.targetHandle.replace('-target', '');

      addJoin(
        params.source,
        sourceColumn,
        params.target,
        targetColumn,
        'INNER'
      );
    },
    [addJoin]
  );

  // Handle viewport changes
  const handleMoveEnd = useCallback(
    (_event: unknown, newViewport: { x: number; y: number; zoom: number }) => {
      setViewport(newViewport);
    },
    [setViewport]
  );

  // Copy SQL to clipboard
  const handleCopySQL = useCallback(() => {
    navigator.clipboard.writeText(generatedSQL);
    toast.success(t('queryBuilder.sqlCopied', 'SQL copied to clipboard'));
  }, [generatedSQL, t]);

  // Run the generated query
  const handleRunQuery = useCallback(() => {
    if (!connection) {
      toast.error(t('queryBuilder.noConnection', 'No database connection'));
      return;
    }

    if (storeNodes.length === 0) {
      toast.error(t('queryBuilder.noTables', 'Add tables to build a query'));
      return;
    }

    // Open in a new query tab and let the user execute from there
    if (activeConnectionId) {
      createTab(
        activeConnectionId,
        t('queryBuilder.generatedQuery', 'Generated Query'),
        generatedSQL
      );
      toast.success(t('queryBuilder.openedInEditor', 'Opened in query editor'));
    }
  }, [connection, storeNodes, generatedSQL, activeConnectionId, createTab, t]);

  // Open SQL in new query tab
  const handleOpenInEditor = useCallback(() => {
    if (!activeConnectionId) {
      toast.error(t('queryBuilder.noConnection', 'No database connection'));
      return;
    }
    createTab(
      activeConnectionId,
      t('queryBuilder.generatedQuery', 'Generated Query'),
      generatedSQL
    );
    toast.success(t('queryBuilder.openedInEditor', 'Opened in query editor'));
  }, [activeConnectionId, createTab, generatedSQL, t]);

  if (!schema) {
    return (
      <div className="text-muted-foreground flex h-full items-center justify-center">
        {t(
          'queryBuilder.noSchema',
          'Connect to a database to use the Query Builder'
        )}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <QueryBuilderToolbar onRunQuery={handleRunQuery} />

      {/* Main content */}
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* Canvas */}
        <ResizablePanel defaultSize={65} minSize={40}>
          <div className="h-full w-full">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={handleNodesChange}
              onEdgesChange={handleEdgesChange}
              onConnect={handleConnect}
              onMoveEnd={handleMoveEnd}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              colorMode={resolvedTheme as ColorMode}
              defaultViewport={viewport}
              fitView={storeNodes.length === 0}
              fitViewOptions={{ padding: 0.2 }}
              minZoom={0.1}
              maxZoom={2}
              proOptions={{ hideAttribution: true }}
              nodeDragThreshold={5}
              connectionLineStyle={{
                stroke: 'var(--color-primary)',
                strokeWidth: 2,
              }}
              defaultEdgeOptions={{
                type: 'queryBuilderJoin',
                data: { joinType: 'INNER' },
              }}
            >
              <Background />
              <MiniMap
                nodeStrokeWidth={3}
                zoomable
                pannable
                className="bg-background! border-border!"
              />

              {/* Help panel */}
              {storeNodes.length === 0 && (
                <Panel position="top-center" className="mt-20">
                  <div className="bg-card max-w-md rounded-lg border p-6 text-center shadow-lg">
                    <h3 className="mb-2 font-semibold">
                      {t('queryBuilder.getStarted', 'Get Started')}
                    </h3>
                    <p className="text-muted-foreground mb-4 text-sm">
                      {t(
                        'queryBuilder.getStartedHint',
                        'Click "Add Table" in the toolbar to add tables to your query. Drag columns between tables to create JOINs.'
                      )}
                    </p>
                  </div>
                </Panel>
              )}
            </ReactFlow>
          </div>
        </ResizablePanel>

        <ResizableHandle />

        {/* SQL Preview Panel */}
        <ResizablePanel defaultSize={35} minSize={25}>
          <div className="flex h-full flex-col border-l">
            <div className="flex items-center justify-between border-b px-4 py-2">
              <h3 className="font-medium">
                {t('queryBuilder.sqlPreview', 'SQL Preview')}
              </h3>
              <div className="flex gap-1">
                <Tooltip>
                  <TooltipTrigger>
                    <Button variant="ghost" size="icon" onClick={handleCopySQL}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {t('queryBuilder.copySQL', 'Copy SQL')}
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleOpenInEditor}
                    >
                      <Code className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {t('queryBuilder.openInEditor', 'Open in Query Editor')}
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4">
              <pre
                className={cn(
                  'bg-muted/30 rounded-md border p-4 font-mono text-sm',
                  'break-words whitespace-pre-wrap'
                )}
              >
                {generatedSQL}
              </pre>
            </div>

            {/* Column selection summary */}
            {selectedColumns.length > 0 && (
              <div className="border-t px-4 py-3">
                <h4 className="mb-2 text-sm font-medium">
                  {t('queryBuilder.selectedColumns', 'Selected Columns')} (
                  {selectedColumns.length})
                </h4>
                <div className="flex flex-wrap gap-1">
                  {selectedColumns.slice(0, 10).map((col) => (
                    <span
                      key={`${col.tableAlias}.${col.column}`}
                      className="bg-primary/10 inline-flex items-center rounded-full px-2 py-0.5 text-xs"
                    >
                      {col.tableAlias}.{col.column}
                    </span>
                  ))}
                  {selectedColumns.length > 10 && (
                    <span className="text-muted-foreground text-xs">
                      +{selectedColumns.length - 10} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
