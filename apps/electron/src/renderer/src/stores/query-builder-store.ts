import type { Viewport } from '@xyflow/react';
import type { TableSchema } from '@/types/database';
import type {
  FilterCondition,
  JoinType,
  QueryBuilderEdge,
  QueryBuilderNode,
  SelectedColumn,
  SortConfig,
} from '@/types/query-builder';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface QueryBuilderStore {
  // Canvas state
  nodes: QueryBuilderNode[];
  edges: QueryBuilderEdge[];
  viewport: Viewport;

  // Highlighting state
  highlightedColumn: { nodeId: string; column: string } | null;
  highlightedEdgeIds: Set<string>;

  // Query configuration
  selectedColumns: SelectedColumn[];
  filters: FilterCondition[];
  sorts: SortConfig[];
  groupBy: string[];
  distinct: boolean;
  limit?: number;
  offset?: number;

  // Table alias counter for auto-generating unique aliases
  tableAliasCounter: Record<string, number>;

  // Actions - Highlighting
  setHighlightedColumn: (nodeId: string, column: string) => void;
  clearHighlightedColumn: () => void;

  // Actions - Node management
  addTable: (table: TableSchema, position?: { x: number; y: number }) => void;
  removeTable: (nodeId: string) => void;
  updateNodePosition: (
    nodeId: string,
    position: { x: number; y: number }
  ) => void;
  setNodes: (nodes: QueryBuilderNode[]) => void;
  autoLayout: () => void;

  // Actions - Column selection
  toggleColumn: (
    nodeId: string,
    table: string,
    alias: string,
    column: string
  ) => void;
  toggleAllColumns: (nodeId: string, table: string, alias: string) => void;
  updateColumnAlias: (table: string, column: string, alias: string) => void;
  updateColumnAggregate: (
    table: string,
    column: string,
    aggregate: SelectedColumn['aggregate']
  ) => void;

  // Actions - JOIN management
  addJoin: (
    sourceNodeId: string,
    sourceColumn: string,
    targetNodeId: string,
    targetColumn: string,
    joinType?: JoinType
  ) => void;
  updateJoinType: (edgeId: string, joinType: JoinType) => void;
  removeJoin: (edgeId: string) => void;
  setEdges: (edges: QueryBuilderEdge[]) => void;

  // Actions - Filter management
  addFilter: (filter: Omit<FilterCondition, 'id'>) => void;
  updateFilter: (id: string, filter: Partial<FilterCondition>) => void;
  removeFilter: (id: string) => void;

  // Actions - Sort management
  addSort: (sort: SortConfig) => void;
  updateSort: (index: number, sort: SortConfig) => void;
  removeSort: (index: number) => void;
  reorderSorts: (fromIndex: number, toIndex: number) => void;

  // Actions - Group by
  toggleGroupBy: (column: string) => void;
  setGroupBy: (columns: string[]) => void;

  // Actions - Other options
  setDistinct: (distinct: boolean) => void;
  setLimit: (limit?: number) => void;
  setOffset: (offset?: number) => void;

  // Actions - Viewport
  setViewport: (viewport: Viewport) => void;

  // Actions - Reset
  clearQuery: () => void;
  loadQuery: (state: Partial<QueryBuilderStore>) => void;
}

const initialState = {
  nodes: [] as QueryBuilderNode[],
  edges: [] as QueryBuilderEdge[],
  viewport: { x: 0, y: 0, zoom: 1 },
  highlightedColumn: null as { nodeId: string; column: string } | null,
  highlightedEdgeIds: new Set<string>(),
  selectedColumns: [] as SelectedColumn[],
  filters: [] as FilterCondition[],
  sorts: [] as SortConfig[],
  groupBy: [] as string[],
  distinct: false,
  limit: undefined as number | undefined,
  offset: undefined as number | undefined,
  tableAliasCounter: {} as Record<string, number>,
};

export const useQueryBuilderStore = create<QueryBuilderStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setHighlightedColumn: (nodeId, column) => {
        const { edges } = get();
        const relatedEdgeIds = new Set<string>();

        for (const edge of edges) {
          const sourceCol = edge.data?.sourceColumn;
          const targetCol = edge.data?.targetColumn;
          if (
            (edge.source === nodeId && sourceCol === column) ||
            (edge.target === nodeId && targetCol === column)
          ) {
            relatedEdgeIds.add(edge.id);
          }
        }

        set({
          highlightedColumn: { nodeId, column },
          highlightedEdgeIds: relatedEdgeIds,
        });
      },

      clearHighlightedColumn: () => {
        set({
          highlightedColumn: null,
          highlightedEdgeIds: new Set(),
        });
      },

      addTable: (table, position = { x: 100, y: 100 }) => {
        const { nodes, tableAliasCounter } = get();

        const count = (tableAliasCounter[table.name] || 0) + 1;
        const alias = count === 1 ? table.name : `${table.name}_${count}`;

        const newNode: QueryBuilderNode = {
          id: `${table.name}-${Date.now()}`,
          type: 'queryBuilderTable',
          position,
          dragHandle: '.drag-handle',
          data: {
            table,
            alias,
            selectedColumns: new Set<string>(),
          },
        };

        set({
          nodes: [...nodes, newNode],
          tableAliasCounter: {
            ...tableAliasCounter,
            [table.name]: count,
          },
        });
      },

      removeTable: (nodeId) => {
        const { nodes, edges, selectedColumns } = get();
        const node = nodes.find((n) => n.id === nodeId);
        if (!node) return;

        // Remove associated columns
        const newSelectedColumns = selectedColumns.filter(
          (col) => col.tableAlias !== node.data.alias
        );

        // Remove associated edges
        const newEdges = edges.filter(
          (e) => e.source !== nodeId && e.target !== nodeId
        );

        set({
          nodes: nodes.filter((n) => n.id !== nodeId),
          edges: newEdges,
          selectedColumns: newSelectedColumns,
        });
      },

      updateNodePosition: (nodeId, position) => {
        set((state) => ({
          nodes: state.nodes.map((node) =>
            node.id === nodeId ? { ...node, position } : node
          ),
        }));
      },

      setNodes: (nodes) => set({ nodes }),

      autoLayout: () => {
        const { nodes, edges } = get();
        if (nodes.length === 0) return;

        const NODE_WIDTH = 280;
        const NODE_HEIGHT = 200;
        const HORIZONTAL_GAP = 100;
        const VERTICAL_GAP = 80;
        const COLUMNS = Math.max(2, Math.ceil(Math.sqrt(nodes.length)));

        const connectedNodes = new Map<string, Set<string>>();
        for (const node of nodes) {
          connectedNodes.set(node.id, new Set());
        }
        for (const edge of edges) {
          connectedNodes.get(edge.source)?.add(edge.target);
          connectedNodes.get(edge.target)?.add(edge.source);
        }

        const visited = new Set<string>();
        const ordered: string[] = [];

        const bfs = (startId: string) => {
          const queue = [startId];
          while (queue.length > 0) {
            const current = queue.shift()!;
            if (visited.has(current)) continue;
            visited.add(current);
            ordered.push(current);
            const neighbors = connectedNodes.get(current) || new Set();
            for (const neighbor of neighbors) {
              if (!visited.has(neighbor)) {
                queue.push(neighbor);
              }
            }
          }
        };

        for (const node of nodes) {
          if (!visited.has(node.id)) {
            bfs(node.id);
          }
        }

        const newNodes = nodes.map((node) => {
          const index = ordered.indexOf(node.id);
          const col = index % COLUMNS;
          const row = Math.floor(index / COLUMNS);
          return {
            ...node,
            position: {
              x: 50 + col * (NODE_WIDTH + HORIZONTAL_GAP),
              y: 50 + row * (NODE_HEIGHT + VERTICAL_GAP),
            },
          };
        });

        set({ nodes: newNodes });
      },

      // Column selection
      toggleColumn: (nodeId, table, alias, column) => {
        const { nodes, selectedColumns } = get();

        const node = nodes.find((n) => n.id === nodeId);
        if (!node) return;

        const newSelectedColumns = new Set(node.data.selectedColumns);
        const isSelected = newSelectedColumns.has(column);

        if (isSelected) {
          newSelectedColumns.delete(column);
        } else {
          newSelectedColumns.add(column);
        }

        // Update node
        const newNodes = nodes.map((n) =>
          n.id === nodeId
            ? { ...n, data: { ...n.data, selectedColumns: newSelectedColumns } }
            : n
        );

        // Update selected columns list
        let newColumnsList = [...selectedColumns];
        if (isSelected) {
          newColumnsList = newColumnsList.filter(
            (col) => !(col.tableAlias === alias && col.column === column)
          );
        } else {
          newColumnsList.push({
            table,
            tableAlias: alias,
            column,
            selected: true,
          });
        }

        set({
          nodes: newNodes,
          selectedColumns: newColumnsList,
        });
      },

      toggleAllColumns: (nodeId, table, alias) => {
        const { nodes, selectedColumns } = get();

        const node = nodes.find((n) => n.id === nodeId);
        if (!node) return;

        const allColumns = node.data.table.columns.map((c) => c.name);
        const allSelected = allColumns.every((c) =>
          node.data.selectedColumns.has(c)
        );

        let newSelectedColumns: Set<string>;
        let newColumnsList: SelectedColumn[];

        if (allSelected) {
          // Deselect all
          newSelectedColumns = new Set();
          newColumnsList = selectedColumns.filter(
            (col) => col.tableAlias !== alias
          );
        } else {
          // Select all
          newSelectedColumns = new Set(allColumns);
          // Remove existing and add all
          newColumnsList = selectedColumns.filter(
            (col) => col.tableAlias !== alias
          );
          allColumns.forEach((column) => {
            newColumnsList.push({
              table,
              tableAlias: alias,
              column,
              selected: true,
            });
          });
        }

        const newNodes = nodes.map((n) =>
          n.id === nodeId
            ? { ...n, data: { ...n.data, selectedColumns: newSelectedColumns } }
            : n
        );

        set({
          nodes: newNodes,
          selectedColumns: newColumnsList,
        });
      },

      updateColumnAlias: (table, column, alias) => {
        set((state) => ({
          selectedColumns: state.selectedColumns.map((col) =>
            col.table === table && col.column === column
              ? { ...col, alias }
              : col
          ),
        }));
      },

      updateColumnAggregate: (table, column, aggregate) => {
        set((state) => ({
          selectedColumns: state.selectedColumns.map((col) =>
            col.table === table && col.column === column
              ? { ...col, aggregate }
              : col
          ),
        }));
      },

      // JOIN management
      addJoin: (
        sourceNodeId,
        sourceColumn,
        targetNodeId,
        targetColumn,
        joinType = 'INNER'
      ) => {
        const { edges, nodes } = get();
        const sourceNode = nodes.find((n) => n.id === sourceNodeId);
        const targetNode = nodes.find((n) => n.id === targetNodeId);
        if (!sourceNode || !targetNode) return;

        const newEdge: QueryBuilderEdge = {
          id: `${sourceNodeId}-${targetNodeId}-${Date.now()}`,
          source: sourceNodeId,
          target: targetNodeId,
          sourceHandle: `${sourceColumn}-source`,
          targetHandle: `${targetColumn}-target`,
          type: 'queryBuilderJoin',
          data: {
            joinType,
            sourceColumn,
            targetColumn,
          },
        };

        set({ edges: [...edges, newEdge] });
      },

      updateJoinType: (edgeId, joinType) => {
        set((state) => ({
          edges: state.edges.map((edge) =>
            edge.id === edgeId && edge.data
              ? { ...edge, data: { ...edge.data, joinType } }
              : edge
          ),
        }));
      },

      removeJoin: (edgeId) => {
        set((state) => ({
          edges: state.edges.filter((edge) => edge.id !== edgeId),
        }));
      },

      setEdges: (edges) => set({ edges }),

      // Filter management
      addFilter: (filter) => {
        const id = `filter-${Date.now()}`;
        set((state) => ({
          filters: [...state.filters, { ...filter, id }],
        }));
      },

      updateFilter: (id, updates) => {
        set((state) => ({
          filters: state.filters.map((filter) =>
            filter.id === id ? { ...filter, ...updates } : filter
          ),
        }));
      },

      removeFilter: (id) => {
        set((state) => ({
          filters: state.filters.filter((filter) => filter.id !== id),
        }));
      },

      // Sort management
      addSort: (sort) => {
        set((state) => ({
          sorts: [...state.sorts, sort],
        }));
      },

      updateSort: (index, sort) => {
        set((state) => ({
          sorts: state.sorts.map((s, i) => (i === index ? sort : s)),
        }));
      },

      removeSort: (index) => {
        set((state) => ({
          sorts: state.sorts.filter((_, i) => i !== index),
        }));
      },

      reorderSorts: (fromIndex, toIndex) => {
        set((state) => {
          const newSorts = [...state.sorts];
          const [removed] = newSorts.splice(fromIndex, 1);
          newSorts.splice(toIndex, 0, removed);
          return { sorts: newSorts };
        });
      },

      // Group by
      toggleGroupBy: (column) => {
        set((state) => ({
          groupBy: state.groupBy.includes(column)
            ? state.groupBy.filter((c) => c !== column)
            : [...state.groupBy, column],
        }));
      },

      setGroupBy: (columns) => set({ groupBy: columns }),

      // Other options
      setDistinct: (distinct) => set({ distinct }),
      setLimit: (limit) => set({ limit }),
      setOffset: (offset) => set({ offset }),

      // Viewport
      setViewport: (viewport) => set({ viewport }),

      // Reset
      clearQuery: () => set(initialState),

      loadQuery: (state) => set(state),
    }),
    {
      name: 'query-builder-storage',
      partialize: (state) => ({
        // Don't persist nodes/edges as they contain non-serializable Sets
        filters: state.filters,
        sorts: state.sorts,
        groupBy: state.groupBy,
        distinct: state.distinct,
        limit: state.limit,
        offset: state.offset,
      }),
    }
  )
);
