import type { Edge, Node } from '@xyflow/react';
import type { TableSchema } from './database';

// Column selection state
export interface SelectedColumn {
  table: string;
  tableAlias: string;
  column: string;
  alias?: string;
  aggregate?: AggregateFunction;
  selected: boolean;
}

// Aggregate functions
export type AggregateFunction =
  | 'COUNT'
  | 'SUM'
  | 'AVG'
  | 'MIN'
  | 'MAX'
  | 'COUNT_DISTINCT';

// Sort direction
export type SortDirection = 'ASC' | 'DESC';

// Sort configuration
export interface SortConfig {
  table: string;
  column: string;
  direction: SortDirection;
}

// Filter operator
export type FilterOperator =
  | '='
  | '!='
  | '>'
  | '<'
  | '>='
  | '<='
  | 'LIKE'
  | 'NOT LIKE'
  | 'IN'
  | 'NOT IN'
  | 'IS NULL'
  | 'IS NOT NULL'
  | 'BETWEEN';

// Filter condition
export interface FilterCondition {
  id: string;
  table: string;
  column: string;
  operator: FilterOperator;
  value: string;
  conjunction: 'AND' | 'OR';
}

// JOIN type
export type JoinType = 'INNER' | 'LEFT' | 'RIGHT' | 'FULL' | 'CROSS';

// JOIN configuration
export interface JoinConfig {
  id: string;
  type: JoinType;
  sourceTable: string;
  sourceColumn: string;
  targetTable: string;
  targetColumn: string;
}

// Query builder table node data
export interface QueryBuilderNodeData {
  [key: string]: unknown;
  table: TableSchema;
  alias: string;
  selectedColumns: Set<string>;
}

// Query builder node type
export type QueryBuilderNode = Node<QueryBuilderNodeData, 'queryBuilderTable'>;

// Query builder edge data
export interface QueryBuilderEdgeData {
  [key: string]: unknown;
  joinType: JoinType;
  sourceColumn: string;
  targetColumn: string;
}

// Query builder edge type
export type QueryBuilderEdge = Edge<QueryBuilderEdgeData>;

// Complete query state
export interface QueryBuilderState {
  tables: QueryBuilderNode[];
  joins: QueryBuilderEdge[];
  selectedColumns: SelectedColumn[];
  filters: FilterCondition[];
  sorts: SortConfig[];
  groupBy: string[];
  having: FilterCondition[];
  limit?: number;
  offset?: number;
  distinct: boolean;
}

// Table position in canvas
export interface TablePosition {
  x: number;
  y: number;
}

// Stored query builder state for persistence
export interface StoredQueryBuilderState {
  nodes: QueryBuilderNode[];
  edges: QueryBuilderEdge[];
  viewport?: {
    x: number;
    y: number;
    zoom: number;
  };
}
