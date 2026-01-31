import type { ColorMode, NodeChange, OnNodesChange } from '@xyflow/react';
import type { ERRelationshipEdge, ERTableNode } from '@/types/er-diagram';
import {
  Background,
  MiniMap,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from '@xyflow/react';
import { Database, GitFork } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { EmptyView } from '@/components/EmptyView';
import { useConnectionStore } from '@/stores/connection-store';
import { useDiagramStore } from '@/stores/diagram-store';
import { useThemeStore } from '@/stores/theme-store';
import { ERControls } from './ERControls';
import { ERRelationshipEdge as ERRelationshipEdgeComponent } from './ERRelationshipEdge';
import { ERTableNode as ERTableNodeComponent } from './ERTableNode';
import { applyAutoLayout } from './utils/layout-algorithm';
import { schemaToNodesAndEdges } from './utils/schema-to-diagram';
import '@xyflow/react/dist/style.css';

// Register custom node and edge types
const nodeTypes = {
  erTable: ERTableNodeComponent,
};

const edgeTypes = {
  erRelationship: ERRelationshipEdgeComponent,
};

export function ERDiagram() {
  const { schema, connection, setSelectedTable } = useConnectionStore();
  const { theme } = useThemeStore();
  const resolvedTheme =
    theme === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : theme;
  const {
    nodePositionsMap,
    setNodePosition,
    setNodePositions,
    viewportMap,
    setViewport,
    resetLayout,
  } = useDiagramStore();

  const dbPath = connection?.path || '';
  const hasAppliedInitialLayout = useRef(false);

  // Get stored positions for current database
  const storedPositions = useMemo(() => {
    return nodePositionsMap[dbPath] || {};
  }, [nodePositionsMap, dbPath]);

  // Get stored viewport for current database
  const storedViewport = useMemo(() => {
    return viewportMap[dbPath];
  }, [viewportMap, dbPath]);

  // Convert schema to nodes and edges
  const { rawNodes, rawEdges } = useMemo(() => {
    if (!schema) {
      return { rawNodes: [], rawEdges: [] };
    }
    const { nodes, edges } = schemaToNodesAndEdges(schema);
    return { rawNodes: nodes, rawEdges: edges };
  }, [schema]);

  // Apply layout to nodes
  const layoutedNodes = useMemo(() => {
    if (rawNodes.length === 0) {
      return [];
    }

    const hasStoredPositions = Object.keys(storedPositions).length > 0;

    // Check if all nodes have stored positions
    const allNodesHavePositions =
      hasStoredPositions &&
      rawNodes.every((node) => {
        const pos = storedPositions[node.id];
        return pos && typeof pos.x === 'number' && typeof pos.y === 'number';
      });

    if (allNodesHavePositions) {
      // Use stored positions
      return rawNodes.map((node) => ({
        ...node,
        position: storedPositions[node.id],
      }));
    }

    // Apply auto-layout for all nodes
    return applyAutoLayout(rawNodes, rawEdges, 'LR');
  }, [rawNodes, rawEdges, storedPositions]);

  const [nodes, setNodes, onNodesChange] = useNodesState<ERTableNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<ERRelationshipEdge>(
    []
  );

  // Update nodes when schema or layout changes
  useEffect(() => {
    // Always update nodes and edges when layoutedNodes changes
    /* eslint-disable react-hooks-extra/no-direct-set-state-in-use-effect -- Sync external layout state */
    setNodes(layoutedNodes);
    setEdges(rawEdges);
    /* eslint-enable react-hooks-extra/no-direct-set-state-in-use-effect */

    // Save positions if this is a fresh layout (no stored positions)
    if (layoutedNodes.length > 0) {
      const hasStoredPositions = Object.keys(storedPositions).length > 0;
      if (!hasStoredPositions && !hasAppliedInitialLayout.current) {
        hasAppliedInitialLayout.current = true;
        const newPositions: Record<string, { x: number; y: number }> = {};
        layoutedNodes.forEach((node) => {
          newPositions[node.id] = node.position;
        });
        setNodePositions(dbPath, newPositions);
      }
    }
  }, [
    layoutedNodes,
    rawEdges,
    setNodes,
    setEdges,
    storedPositions,
    dbPath,
    setNodePositions,
  ]);

  // Reset the initial layout flag when database changes
  useEffect(() => {
    hasAppliedInitialLayout.current = false;
  }, [dbPath]);

  // Handle node position changes with persistence
  const handleNodesChange: OnNodesChange<ERTableNode> = useCallback(
    (changes: NodeChange<ERTableNode>[]) => {
      onNodesChange(changes);

      // Persist position changes
      changes.forEach((change) => {
        if (
          change.type === 'position' &&
          change.position &&
          change.dragging === false
        ) {
          setNodePosition(dbPath, change.id, change.position);
        }
      });
    },
    [onNodesChange, dbPath, setNodePosition]
  );

  // Handle viewport changes
  const handleMoveEnd = useCallback(
    (_event: unknown, viewport: { x: number; y: number; zoom: number }) => {
      setViewport(dbPath, viewport);
    },
    [dbPath, setViewport]
  );

  // Handle reset layout
  const handleResetLayout = useCallback(() => {
    if (!schema) return;

    resetLayout(dbPath);

    const { nodes: freshNodes, edges: freshEdges } =
      schemaToNodesAndEdges(schema);
    const layoutedNewNodes = applyAutoLayout(freshNodes, freshEdges, 'LR');

    // Save new positions
    const newPositions: Record<string, { x: number; y: number }> = {};
    layoutedNewNodes.forEach((node) => {
      newPositions[node.id] = node.position;
    });
    setNodePositions(dbPath, newPositions);

    setNodes(layoutedNewNodes);
    setEdges(freshEdges);
  }, [schema, dbPath, resetLayout, setNodePositions, setNodes, setEdges]);

  // Handle node click - navigate to table
  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: ERTableNode) => {
      const table = schema?.tables.find(
        (t) => t.name === node.data.tableName && t.schema === node.data.schema
      );
      if (table) {
        setSelectedTable(table);
      }
    },
    [schema, setSelectedTable]
  );

  const { t } = useTranslation('common');

  // Get initial viewport
  const defaultViewport = storedViewport || { x: 0, y: 0, zoom: 1 };

  if (!schema) {
    return (
      <EmptyView
        icon={Database}
        title={t('diagram.noSchema', { defaultValue: 'No Schema Loaded' })}
        description={t('diagram.noSchemaDescription', {
          defaultValue:
            'Connect to a database to view its entity relationship diagram',
        })}
      />
    );
  }

  // Check rawNodes instead of nodes state to avoid race conditions
  if (rawNodes.length === 0) {
    return (
      <EmptyView
        icon={GitFork}
        title={t('diagram.noTables', { defaultValue: 'No Tables Found' })}
        description={t('diagram.noTablesDescription', {
          defaultValue: 'This database has no tables to display in the diagram',
        })}
      />
    );
  }

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        onMoveEnd={handleMoveEnd}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        colorMode={resolvedTheme as ColorMode}
        defaultViewport={defaultViewport}
        fitView={!storedViewport}
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background />
        <MiniMap
          nodeStrokeWidth={3}
          zoomable
          pannable
          className="bg-background! border-border!"
        />
        <ERControls onResetLayout={handleResetLayout} />
      </ReactFlow>
    </div>
  );
}
