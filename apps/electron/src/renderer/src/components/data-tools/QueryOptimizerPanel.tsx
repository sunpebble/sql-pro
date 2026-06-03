import type { QueryPlanNode, QueryPlanStats } from '@shared/types';
import type { ColorMode } from '@xyflow/react';
import type { ErrorInfo, ReactNode } from 'react';
import type {
  ExecutionPlanFlowEdge,
  ExecutionPlanFlowNode,
  Suggestion,
} from '@/lib/query-plan-analyzer';
import { Badge } from '@sqlpro/ui/badge';
import { Button } from '@sqlpro/ui/button';
import { ScrollArea } from '@sqlpro/ui/scroll-area';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@sqlpro/ui/sheet';
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from '@xyflow/react';
import {
  AlertCircle,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Clock,
  Database,
  Download,
  FileText,
  HardDrive,
  LayoutList,
  Lightbulb,
  Loader2,
  Network,
  Search,
  Table,
  X,
  Zap,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { Component, memo, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SqlHighlight } from '@/components/ui/sql-highlight';
import { convertPlanToFlow, exportPlanAsText } from '@/lib/query-plan-analyzer';
import { cn } from '@/lib/utils';
import { exportDiagramAsPng } from '../er-diagram/utils/export-diagram';
import { ExecutionPlanNode as ExecutionPlanNodeComponent } from './ExecutionPlanNode';
import '@xyflow/react/dist/style.css';

// Error Boundary for graceful error handling
class DiagramErrorBoundary extends Component<
  {
    children: ReactNode;
    errorMessage?: string;
    unexpectedErrorMessage?: string;
  },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: {
    children: ReactNode;
    errorMessage?: string;
    unexpectedErrorMessage?: string;
  }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Error logged for debugging
    console.error('Diagram rendering error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full flex-col items-center justify-center p-8">
          <AlertCircle className="text-destructive mb-4 h-12 w-12" />
          <p className="text-destructive mb-2 font-medium">
            {this.props.errorMessage}
          </p>
          <p
            className="text-muted-foreground text-center"
            style={{ fontSize: 'var(--font-ui-size, 13px)' }}
          >
            {this.state.error?.message || this.props.unexpectedErrorMessage}
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

// Register custom node types for execution plan
const nodeTypes = {
  executionPlan: ExecutionPlanNodeComponent,
};

type ViewMode = 'tree' | 'diagram';

interface QueryOptimizerPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  query?: string;
  onAnalyze?: (query: string) => Promise<{
    plan: QueryPlanNode[];
    stats: QueryPlanStats;
    suggestions: Suggestion[];
  }>;
}

const OPERATION_ICONS: Record<string, React.ElementType> = {
  SCAN: Table,
  SEARCH: Search,
  INDEX: Zap,
  PRIMARY: HardDrive,
  default: Database,
};

const getOperationIcon = (detail: string): React.ElementType => {
  const upper = detail.toUpperCase();
  if (upper.includes('SCAN')) return OPERATION_ICONS.SCAN;
  if (upper.includes('SEARCH')) return OPERATION_ICONS.SEARCH;
  if (upper.includes('INDEX')) return OPERATION_ICONS.INDEX;
  if (upper.includes('PRIMARY')) return OPERATION_ICONS.PRIMARY;
  return OPERATION_ICONS.default;
};

interface PlanNodeProps {
  node: QueryPlanNode;
  depth: number;
  children?: QueryPlanNode[];
}

const PlanNode = memo(function PlanNode({
  node,
  depth,
  children = [],
}: PlanNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const { t } = useTranslation('common');

  // Defensive checks for node data
  if (!node || !node.detail) {
    return null;
  }

  const Icon = getOperationIcon(node.detail);
  const hasChildren = children.length > 0;

  return (
    <div className="space-y-1">
      <div
        className={cn(
          'hover:bg-muted/50 flex items-center gap-2 rounded-md p-2 transition-colors',
          depth > 0 && 'ml-4 border-l pl-4'
        )}
        style={{ marginLeft: depth * 16 }}
      >
        {hasChildren ? (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="hover:bg-muted shrink-0 rounded p-0.5"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        ) : (
          <span className="w-5" />
        )}
        <div className="bg-primary/10 rounded p-1">
          <Icon className="text-primary h-4 w-4" />
        </div>
        <div className="flex-1">
          <p
            className="font-mono"
            style={{ fontSize: 'var(--font-ui-size, 13px)' }}
          >
            {node.detail}
          </p>
          {(node.estimatedCost || node.estimatedRows) && (
            <div
              className="text-muted-foreground flex gap-4"
              style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
            >
              {node.estimatedCost && (
                <span>
                  {t('devTools.queryOptimizer.cost', {
                    cost: node.estimatedCost,
                  })}
                </span>
              )}
              {node.estimatedRows && (
                <span>
                  {t('devTools.queryOptimizer.rows', {
                    rows: node.estimatedRows,
                  })}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
      {isExpanded &&
        children.map((child) => (
          <PlanNode key={child.id} node={child} depth={depth + 1} />
        ))}
    </div>
  );
});

export const QueryOptimizerPanel = memo(
  ({ open, onOpenChange, query = '', onAnalyze }: QueryOptimizerPanelProps) => {
    const { resolvedTheme } = useTheme();
    const { t } = useTranslation('common');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [plan, setPlan] = useState<QueryPlanNode[]>([]);
    const [stats, setStats] = useState<QueryPlanStats | null>(null);
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<ViewMode>('tree');
    const [selectedNode, setSelectedNode] =
      useState<ExecutionPlanFlowNode | null>(null);
    const [isExporting, setIsExporting] = useState(false);

    const handleAnalyze = useCallback(async () => {
      if (!onAnalyze || !query.trim()) return;

      setIsAnalyzing(true);
      setError(null);

      try {
        const result = await onAnalyze(query);
        setPlan(result.plan);
        setStats(result.stats);
        setSuggestions(result.suggestions);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : t('queryOptimizer.analysisFailed')
        );
      } finally {
        setIsAnalyzing(false);
      }
    }, [t, onAnalyze, query]);

    // Build tree structure from flat plan
    const buildTree = (nodes: QueryPlanNode[]) => {
      const map = new Map<number, QueryPlanNode[]>();
      nodes.forEach((node) => {
        if (!map.has(node.parent)) {
          map.set(node.parent, []);
        }
        map.get(node.parent)!.push(node);
      });
      return map;
    };

    const tree = buildTree(plan);
    const rootNodes = tree.get(0) || [];

    // Convert plan to React Flow nodes and edges
    const { flowNodes, flowEdges } = useMemo(() => {
      if (plan.length === 0 || viewMode !== 'diagram') {
        return { flowNodes: [], flowEdges: [] };
      }
      try {
        const { nodes, edges } = convertPlanToFlow(plan);
        return { flowNodes: nodes || [], flowEdges: edges || [] };
      } catch (error) {
        console.error('Error converting plan to flow:', error);
        return { flowNodes: [], flowEdges: [] };
      }
    }, [plan, viewMode]);

    const [nodes, setNodes, onNodesChange] =
      useNodesState<ExecutionPlanFlowNode>(flowNodes);
    const [edges, setEdges, onEdgesChange] =
      useEdgesState<ExecutionPlanFlowEdge>(flowEdges);

    // Update nodes when flow changes
    useMemo(() => {
      if (flowNodes.length > 0) {
        setNodes(flowNodes);
        setEdges(flowEdges);
      }
    }, [flowNodes, flowEdges, setNodes, setEdges]);

    // Handle node click - show detail panel
    const handleNodeClick = useCallback(
      (_event: React.MouseEvent, node: ExecutionPlanFlowNode) => {
        setSelectedNode(node);
      },
      []
    );

    // Handle PNG export
    const handleExportPng = useCallback(async () => {
      setIsExporting(true);
      try {
        const container = document.querySelector(
          '.query-optimizer-flow'
        ) as HTMLElement;

        if (!container) {
          return;
        }

        await exportDiagramAsPng(container, {
          filename: `query-execution-plan-${Date.now()}.png`,
        });
      } catch (err) {
        console.error('Query plan PNG export failed:', err);
        toast.error(
          t('devTools.queryOptimizer.exportFailed', 'Failed to export diagram')
        );
      } finally {
        setIsExporting(false);
      }
    }, [t]);

    // Handle text export
    const handleExportText = useCallback(() => {
      if (!stats || plan.length === 0) {
        return;
      }

      try {
        const textContent = exportPlanAsText(plan, stats, query);
        const blob = new Blob([textContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `query-execution-plan-${Date.now()}.txt`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
      } catch (err) {
        console.error('Query plan text export failed:', err);
        toast.error(
          t('devTools.queryOptimizer.exportFailed', 'Failed to export plan')
        );
      }
    }, [plan, stats, query, t]);

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex max-h-[80vh] max-w-3xl flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              {t('devTools.queryOptimizer.title')}
            </DialogTitle>
            <DialogDescription>
              {t('devTools.queryOptimizer.description')}
            </DialogDescription>
          </DialogHeader>

          {/* Query Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span
                className="text-muted-foreground"
                style={{ fontSize: 'var(--font-ui-size, 13px)' }}
              >
                {t('devTools.queryOptimizer.query')}
              </span>
              <Button
                size="sm"
                onClick={handleAnalyze}
                disabled={isAnalyzing || !query.trim()}
              >
                {isAnalyzing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Search className="mr-2 h-4 w-4" />
                )}
                {t('devTools.queryOptimizer.analyze')}
              </Button>
            </div>
            {query ? (
              <SqlHighlight
                code={query}
                maxLines={3}
                className="bg-muted rounded-base p-3"
                style={{ fontSize: 'var(--font-ui-size, 13px)' }}
              />
            ) : (
              <pre
                className="bg-muted text-muted-foreground rounded-base p-3 font-mono"
                style={{ fontSize: 'var(--font-ui-size, 13px)' }}
              >
                {t('devTools.queryOptimizer.noQuery')}
              </pre>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="border-destructive/50 bg-destructive/10 rounded-base flex items-start gap-3 border p-4">
              <AlertCircle className="text-destructive h-5 w-5 shrink-0" />
              <div>
                <p className="text-destructive font-medium">
                  {t('devTools.queryOptimizer.analysisError')}
                </p>
                <p
                  className="text-destructive/80"
                  style={{ fontSize: 'var(--font-ui-size, 13px)' }}
                >
                  {error}
                </p>
              </div>
            </div>
          )}

          {/* Stats Summary */}
          {stats && (
            <div className="bg-muted/50 rounded-base grid grid-cols-4 gap-4 p-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span
                    className="font-semibold"
                    style={{
                      fontSize: 'calc(var(--font-ui-size, 13px) * 1.15)',
                    }}
                  >
                    {(stats.executionTime ?? 0).toFixed(2)}ms
                  </span>
                </div>
                <p
                  className="text-muted-foreground"
                  style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
                >
                  {t('devTools.queryOptimizer.executionTime')}
                </p>
              </div>
              <div className="text-center">
                <p
                  className="font-semibold"
                  style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 1.15)' }}
                >
                  {stats.rowsExamined ?? 0}
                </p>
                <p
                  className="text-muted-foreground"
                  style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
                >
                  {t('devTools.queryOptimizer.rowsExamined')}
                </p>
              </div>
              <div className="text-center">
                <p
                  className="font-semibold"
                  style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 1.15)' }}
                >
                  {stats.rowsReturned ?? 0}
                </p>
                <p
                  className="text-muted-foreground"
                  style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
                >
                  {t('devTools.queryOptimizer.rowsReturned')}
                </p>
              </div>
              <div className="text-center">
                <p
                  className="font-semibold"
                  style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 1.15)' }}
                >
                  {stats.indexesUsed?.length ?? 0}
                </p>
                <p
                  className="text-muted-foreground"
                  style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
                >
                  {t('devTools.queryOptimizer.indexesUsed')}
                </p>
              </div>
            </div>
          )}

          {/* Execution Plan Tree */}
          {plan.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">
                  {t('devTools.queryOptimizer.executionPlan')}
                </h3>
                <div className="flex gap-1">
                  <Button
                    variant={viewMode === 'tree' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('tree')}
                    className="h-8 px-2"
                  >
                    <LayoutList className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'diagram' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('diagram')}
                    className="h-8 px-2"
                  >
                    <Network className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleExportText}
                    disabled={!stats || plan.length === 0}
                    className="h-8 px-2"
                    title={t('devTools.queryOptimizer.exportAsText')}
                  >
                    <FileText className="h-4 w-4" />
                  </Button>
                  {viewMode === 'diagram' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleExportPng}
                      disabled={isExporting}
                      className="h-8 px-2"
                      title={t('devTools.queryOptimizer.exportAsPng')}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {viewMode === 'tree' && (
                <DiagramErrorBoundary
                  errorMessage={t(
                    'devTools.queryOptimizer.failedToRenderDiagram'
                  )}
                  unexpectedErrorMessage={t('common.unexpectedError')}
                >
                  <ScrollArea className="bg-muted/30 rounded-base border-border h-48 border p-2">
                    {rootNodes.length === 0 ? (
                      <div className="text-muted-foreground flex h-full items-center justify-center py-8">
                        {t('devTools.queryOptimizer.noPlanToDisplay')}
                      </div>
                    ) : (
                      rootNodes.map((node) => (
                        <PlanNode
                          key={node.id}
                          node={node}
                          depth={0}
                          children={tree.get(node.id)}
                        />
                      ))
                    )}
                  </ScrollArea>
                </DiagramErrorBoundary>
              )}

              {viewMode === 'diagram' && (
                <DiagramErrorBoundary
                  errorMessage={t(
                    'devTools.queryOptimizer.failedToRenderDiagram'
                  )}
                  unexpectedErrorMessage={t('common.unexpectedError')}
                >
                  <div className="bg-muted/30 query-optimizer-flow rounded-base border-border h-96 border">
                    {flowNodes.length === 0 ? (
                      <div className="text-muted-foreground flex h-full items-center justify-center">
                        {t('devTools.queryOptimizer.noPlanToDisplay')}
                      </div>
                    ) : (
                      <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onNodeClick={handleNodeClick}
                        nodeTypes={nodeTypes}
                        colorMode={resolvedTheme as ColorMode}
                        fitView
                        fitViewOptions={{ padding: 0.3, maxZoom: 1 }}
                        minZoom={0.05}
                        maxZoom={1.5}
                        proOptions={{ hideAttribution: true }}
                      >
                        <Background />
                        <Controls showInteractive={false} />
                        <MiniMap
                          nodeStrokeWidth={3}
                          zoomable
                          pannable
                          className="bg-background! border-border!"
                        />
                      </ReactFlow>
                    )}
                  </div>
                </DiagramErrorBoundary>
              )}
            </div>
          )}

          {/* Optimization Suggestions */}
          {suggestions.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium">
                {t('devTools.queryOptimizer.suggestions')}
              </h3>
              <ScrollArea className="max-h-48">
                <div className="space-y-2">
                  {suggestions.map((suggestion) => (
                    <div
                      key={`${suggestion.type}-${suggestion.titleKey}`}
                      className={cn(
                        'rounded-base border-border flex items-start gap-3 border p-3',
                        suggestion.type === 'warning' &&
                          'border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950',
                        suggestion.type === 'index' &&
                          'border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950',
                        suggestion.type === 'rewrite' &&
                          'border-purple-200 bg-purple-50 dark:border-purple-900 dark:bg-purple-950'
                      )}
                    >
                      <Lightbulb
                        className={cn(
                          'h-5 w-5 shrink-0',
                          suggestion.type === 'warning' && 'text-amber-600',
                          suggestion.type === 'index' && 'text-blue-600',
                          suggestion.type === 'rewrite' && 'text-purple-600'
                        )}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">
                            {t(suggestion.titleKey, suggestion.params)}
                          </p>
                          <Badge
                            variant={
                              suggestion.impact === 'high'
                                ? 'destructive'
                                : suggestion.impact === 'medium'
                                  ? 'default'
                                  : 'secondary'
                            }
                            style={{
                              fontSize:
                                'calc(var(--font-ui-size, 13px) * 0.85)',
                            }}
                          >
                            {t('devTools.queryOptimizer.impact', {
                              impact: suggestion.impact,
                            })}
                          </Badge>
                        </div>
                        <p
                          className="text-muted-foreground"
                          style={{ fontSize: 'var(--font-ui-size, 13px)' }}
                        >
                          {t(suggestion.descriptionKey, suggestion.params)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Empty State */}
          {!isAnalyzing && plan.length === 0 && !error && (
            <div className="text-muted-foreground flex flex-1 flex-col items-center justify-center py-12">
              <Zap className="mb-4 h-12 w-12 opacity-30" />
              <p
                className="font-medium"
                style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 1.15)' }}
              >
                {t('devTools.queryOptimizer.readyToAnalyze')}
              </p>
              <p style={{ fontSize: 'var(--font-ui-size, 13px)' }}>
                {t('devTools.queryOptimizer.clickAnalyze')}
              </p>
            </div>
          )}
        </DialogContent>

        {/* Node Detail Panel */}
        <Sheet
          open={!!selectedNode}
          onOpenChange={(open) => !open && setSelectedNode(null)}
        >
          <SheetContent className="w-100 sm:w-135">
            {selectedNode && (
              <>
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    {selectedNode.data.hasWarning && (
                      <AlertTriangle className="h-5 w-5 text-amber-600" />
                    )}
                    {selectedNode.data.operation}
                  </SheetTitle>
                  <SheetDescription>
                    {t('devTools.queryOptimizer.nodeDetails')}
                  </SheetDescription>
                </SheetHeader>

                <div className="mt-6 space-y-6">
                  {/* Operation Details */}
                  <div className="space-y-2">
                    <h3
                      className="font-medium"
                      style={{ fontSize: 'var(--font-ui-size, 13px)' }}
                    >
                      {t('devTools.queryOptimizer.operation')}
                    </h3>
                    <div className="bg-muted rounded-base p-3">
                      <p
                        className="font-mono"
                        style={{ fontSize: 'var(--font-ui-size, 13px)' }}
                      >
                        {selectedNode.data.detail}
                      </p>
                    </div>
                  </div>

                  {/* Table/Index Info */}
                  {(selectedNode.data.tableName ||
                    selectedNode.data.indexName) && (
                    <div className="space-y-2">
                      <h3
                        className="font-medium"
                        style={{ fontSize: 'var(--font-ui-size, 13px)' }}
                      >
                        {t('devTools.queryOptimizer.tableAndIndex')}
                      </h3>
                      <div className="space-y-2">
                        {selectedNode.data.tableName && (
                          <div className="flex items-center gap-2">
                            <Table className="text-muted-foreground h-4 w-4" />
                            <span
                              className="text-muted-foreground"
                              style={{ fontSize: 'var(--font-ui-size, 13px)' }}
                            >
                              {t('devTools.queryOptimizer.table')}
                            </span>
                            <span
                              className="font-mono font-medium"
                              style={{ fontSize: 'var(--font-ui-size, 13px)' }}
                            >
                              {selectedNode.data.tableName}
                            </span>
                          </div>
                        )}
                        {selectedNode.data.indexName && (
                          <div className="flex items-center gap-2">
                            <Zap className="text-muted-foreground h-4 w-4" />
                            <span
                              className="text-muted-foreground"
                              style={{ fontSize: 'var(--font-ui-size, 13px)' }}
                            >
                              {t('devTools.queryOptimizer.index')}
                            </span>
                            <span
                              className="font-mono font-medium"
                              style={{ fontSize: 'var(--font-ui-size, 13px)' }}
                            >
                              {selectedNode.data.indexName}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Performance Metrics */}
                  {(selectedNode.data.estimatedCost !== undefined ||
                    selectedNode.data.estimatedRows !== undefined) && (
                    <div className="space-y-2">
                      <h3
                        className="font-medium"
                        style={{ fontSize: 'var(--font-ui-size, 13px)' }}
                      >
                        {t('devTools.queryOptimizer.performanceMetrics')}
                      </h3>
                      <div className="bg-muted/50 rounded-base grid grid-cols-2 gap-4 p-4">
                        {selectedNode.data.estimatedCost !== undefined && (
                          <div className="text-center">
                            <p
                              className="font-semibold"
                              style={{
                                fontSize:
                                  'calc(var(--font-ui-size, 13px) * 1.7)',
                              }}
                            >
                              {selectedNode.data.estimatedCost}
                            </p>
                            <p
                              className="text-muted-foreground"
                              style={{
                                fontSize:
                                  'calc(var(--font-ui-size, 13px) * 0.85)',
                              }}
                            >
                              {t('devTools.queryOptimizer.estimatedCost')}
                            </p>
                          </div>
                        )}
                        {selectedNode.data.estimatedRows !== undefined && (
                          <div className="text-center">
                            <p
                              className="font-semibold"
                              style={{
                                fontSize:
                                  'calc(var(--font-ui-size, 13px) * 1.7)',
                              }}
                            >
                              ~{selectedNode.data.estimatedRows}
                            </p>
                            <p
                              className="text-muted-foreground"
                              style={{
                                fontSize:
                                  'calc(var(--font-ui-size, 13px) * 0.85)',
                              }}
                            >
                              {t('devTools.queryOptimizer.estimatedRows')}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Warnings */}
                  {selectedNode.data.hasWarning && (
                    <div className="space-y-2">
                      <h3
                        className="font-medium"
                        style={{ fontSize: 'var(--font-ui-size, 13px)' }}
                      >
                        {t('devTools.queryOptimizer.performanceWarning')}
                      </h3>
                      <div
                        className={cn(
                          'rounded-base border-border flex items-start gap-3 border p-4',
                          selectedNode.data.warningType === 'full-scan' &&
                            'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30',
                          selectedNode.data.warningType === 'temp-btree' &&
                            'border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30',
                          selectedNode.data.warningType === 'subquery' &&
                            'border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30',
                          selectedNode.data.warningType === 'missing-index' &&
                            'border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950/30'
                        )}
                      >
                        <AlertTriangle
                          className={cn(
                            'h-5 w-5 shrink-0',
                            selectedNode.data.warningType === 'full-scan' &&
                              'text-red-600 dark:text-red-400',
                            selectedNode.data.warningType === 'temp-btree' &&
                              'text-amber-600 dark:text-amber-400',
                            selectedNode.data.warningType === 'subquery' &&
                              'text-blue-600 dark:text-blue-400',
                            selectedNode.data.warningType === 'missing-index' &&
                              'text-orange-600 dark:text-orange-400'
                          )}
                        />
                        <div className="flex-1 space-y-1">
                          <p className="font-medium">
                            {selectedNode.data.warningType === 'full-scan' &&
                              t('devTools.queryOptimizer.warning.fullScan')}
                            {selectedNode.data.warningType === 'temp-btree' &&
                              t('devTools.queryOptimizer.warning.tempBtree')}
                            {selectedNode.data.warningType === 'subquery' &&
                              t('devTools.queryOptimizer.warning.subquery')}
                            {selectedNode.data.warningType ===
                              'missing-index' &&
                              t('devTools.queryOptimizer.warning.missingIndex')}
                          </p>
                          <p
                            className="text-muted-foreground"
                            style={{ fontSize: 'var(--font-ui-size, 13px)' }}
                          >
                            {selectedNode.data.warningType === 'full-scan' &&
                              t('devTools.queryOptimizer.warning.fullScanDesc')}
                            {selectedNode.data.warningType === 'temp-btree' &&
                              t(
                                'devTools.queryOptimizer.warning.tempBtreeDesc'
                              )}
                            {selectedNode.data.warningType === 'subquery' &&
                              t('devTools.queryOptimizer.warning.subqueryDesc')}
                            {selectedNode.data.warningType ===
                              'missing-index' &&
                              t(
                                'devTools.queryOptimizer.warning.missingIndexDesc'
                              )}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <SheetClose className="absolute top-4 right-4">
                  <Button variant="ghost" size="icon">
                    <X className="h-4 w-4" />
                  </Button>
                </SheetClose>
              </>
            )}
          </SheetContent>
        </Sheet>
      </Dialog>
    );
  }
);
