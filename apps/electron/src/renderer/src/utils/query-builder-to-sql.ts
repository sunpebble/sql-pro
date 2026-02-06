import type {
  FilterCondition,
  QueryBuilderEdge,
  QueryBuilderNode,
  SelectedColumn,
  SortConfig,
} from '@/types/query-builder';
import i18n from '@/lib/i18n';

interface GenerateSQLOptions {
  nodes: QueryBuilderNode[];
  edges: QueryBuilderEdge[];
  selectedColumns: SelectedColumn[];
  filters: FilterCondition[];
  sorts: SortConfig[];
  groupBy: string[];
  distinct: boolean;
  limit?: number;
  offset?: number;
}

/**
 * Generate SQL query from query builder state
 */
export function generateSQL(options: GenerateSQLOptions): string {
  const {
    nodes,
    edges,
    selectedColumns,
    filters,
    sorts,
    groupBy,
    distinct,
    limit,
    offset,
  } = options;

  if (nodes.length === 0) {
    return `-- ${  i18n.t('queryBuilder.emptyQueryHint')}`;
  }

  // Build SELECT clause
  const selectClause = buildSelectClause(selectedColumns, distinct);

  // Build FROM clause with JOINs
  const fromClause = buildFromClause(nodes, edges);

  // Build WHERE clause
  const whereClause = buildWhereClause(filters);

  // Build GROUP BY clause
  const groupByClause = buildGroupByClause(groupBy);

  // Build ORDER BY clause
  const orderByClause = buildOrderByClause(sorts);

  // Build LIMIT/OFFSET clause
  const limitClause = buildLimitClause(limit, offset);

  // Combine all clauses
  const parts = [
    selectClause,
    fromClause,
    whereClause,
    groupByClause,
    orderByClause,
    limitClause,
  ].filter(Boolean);

  return parts.join('\n');
}

function buildSelectClause(
  columns: SelectedColumn[],
  distinct: boolean
): string {
  const distinctKeyword = distinct ? 'DISTINCT ' : '';

  if (columns.length === 0) {
    return `SELECT ${distinctKeyword}*`;
  }

  const columnExpressions = columns.map((col) => {
    let expression = `${quoteIdentifier(col.tableAlias)}.${quoteIdentifier(col.column)}`;

    // Apply aggregate function if specified
    if (col.aggregate) {
      if (col.aggregate === 'COUNT_DISTINCT') {
        expression = `COUNT(DISTINCT ${expression})`;
      } else {
        expression = `${col.aggregate}(${expression})`;
      }
    }

    // Add alias if specified
    if (col.alias) {
      expression += ` AS ${quoteIdentifier(col.alias)}`;
    }

    return expression;
  });

  return `SELECT ${distinctKeyword}${columnExpressions.join(',\n       ')}`;
}

function buildFromClause(
  nodes: QueryBuilderNode[],
  edges: QueryBuilderEdge[]
): string {
  if (nodes.length === 0) {
    return '';
  }

  // Build node index map for O(1) lookups (js-index-maps)
  const nodeById = new Map(nodes.map((n) => [n.id, n]));

  // Find the first table (base table)
  const baseNode = nodes[0];
  const usedNodeIds = new Set<string>([baseNode.id]);

  let fromClause = `FROM ${quoteIdentifier(baseNode.data.table.name)}`;
  if (baseNode.data.alias !== baseNode.data.table.name) {
    fromClause += ` AS ${quoteIdentifier(baseNode.data.alias)}`;
  }

  // Build JOINs - traverse edges to find connected tables
  const processedEdges = new Set<string>();

  function addJoins(sourceNodeId: string): void {
    for (const edge of edges) {
      if (processedEdges.has(edge.id)) continue;

      let targetNodeId: string | null = null;
      let sourceColumn = '';
      let targetColumn = '';

      if (edge.source === sourceNodeId && !usedNodeIds.has(edge.target)) {
        targetNodeId = edge.target;
        sourceColumn = edge.data?.sourceColumn || '';
        targetColumn = edge.data?.targetColumn || '';
      } else if (
        edge.target === sourceNodeId &&
        !usedNodeIds.has(edge.source)
      ) {
        targetNodeId = edge.source;
        sourceColumn = edge.data?.targetColumn || '';
        targetColumn = edge.data?.sourceColumn || '';
      }

      if (targetNodeId) {
        processedEdges.add(edge.id);
        usedNodeIds.add(targetNodeId);

        const targetNode = nodeById.get(targetNodeId);
        const sourceNode = nodeById.get(sourceNodeId);

        if (targetNode && sourceNode) {
          const joinType = edge.data?.joinType || 'INNER';
          let joinClause = `${joinType} JOIN ${quoteIdentifier(targetNode.data.table.name)}`;

          if (targetNode.data.alias !== targetNode.data.table.name) {
            joinClause += ` AS ${quoteIdentifier(targetNode.data.alias)}`;
          }

          joinClause += ` ON ${quoteIdentifier(sourceNode.data.alias)}.${quoteIdentifier(sourceColumn)} = ${quoteIdentifier(targetNode.data.alias)}.${quoteIdentifier(targetColumn)}`;

          fromClause += `\n${joinClause}`;

          // Recursively add joins from the target node
          addJoins(targetNodeId);
        }
      }
    }
  }

  addJoins(baseNode.id);

  // Add any remaining unconnected tables as CROSS JOINs
  for (const node of nodes) {
    if (!usedNodeIds.has(node.id)) {
      usedNodeIds.add(node.id);
      let crossJoin = `CROSS JOIN ${quoteIdentifier(node.data.table.name)}`;
      if (node.data.alias !== node.data.table.name) {
        crossJoin += ` AS ${quoteIdentifier(node.data.alias)}`;
      }
      fromClause += `\n${crossJoin}`;
    }
  }

  return fromClause;
}

function buildWhereClause(filters: FilterCondition[]): string {
  if (filters.length === 0) {
    return '';
  }

  const conditions = filters.map((filter, index) => {
    const column = `${quoteIdentifier(filter.table)}.${quoteIdentifier(filter.column)}`;
    let condition = '';

    switch (filter.operator) {
      case 'IS NULL':
        condition = `${column} IS NULL`;
        break;
      case 'IS NOT NULL':
        condition = `${column} IS NOT NULL`;
        break;
      case 'IN':
      case 'NOT IN': {
        // Assume comma-separated values
        const values = filter.value
          .split(',')
          .map((v) => escapeSQLString(v.trim()))
          .join(', ');
        condition = `${column} ${filter.operator} (${values})`;
        break;
      }
      case 'BETWEEN': {
        const [low, high] = filter.value.split(',').map((v) => v.trim());
        condition = `${column} BETWEEN ${escapeSQLString(low)} AND ${escapeSQLString(high)}`;
        break;
      }
      case 'LIKE':
      case 'NOT LIKE':
        condition = `${column} ${filter.operator} ${escapeSQLString(filter.value)}`;
        break;
      default:
        condition = `${column} ${filter.operator} ${escapeSQLString(filter.value)}`;
    }

    // Add conjunction for subsequent conditions
    if (index > 0) {
      return `${filter.conjunction} ${condition}`;
    }
    return condition;
  });

  return `WHERE ${conditions.join('\n      ')}`;
}

function buildGroupByClause(groupBy: string[]): string {
  if (groupBy.length === 0) {
    return '';
  }

  return `GROUP BY ${groupBy.map(quoteIdentifier).join(', ')}`;
}

function buildOrderByClause(sorts: SortConfig[]): string {
  if (sorts.length === 0) {
    return '';
  }

  const sortExpressions = sorts.map(
    (sort) =>
      `${quoteIdentifier(sort.table)}.${quoteIdentifier(sort.column)} ${sort.direction}`
  );

  return `ORDER BY ${sortExpressions.join(', ')}`;
}

function buildLimitClause(limit?: number, offset?: number): string {
  const parts: string[] = [];

  if (limit !== undefined && limit > 0) {
    parts.push(`LIMIT ${limit}`);
  }

  if (offset !== undefined && offset > 0) {
    parts.push(`OFFSET ${offset}`);
  }

  return parts.join(' ');
}

/**
 * Quote identifier (table/column name) for SQL safety
 */
function quoteIdentifier(identifier: string): string {
  // If identifier contains special characters or is a reserved word, quote it
  if (/^[a-z_]\w*$/i.test(identifier)) {
    return identifier;
  }
  return `"${identifier.replace(/"/g, '""')}"`;
}

/**
 * Escape SQL string value
 */
function escapeSQLString(value: string): string {
  // Check if it's a number
  if (/^-?\d+(?:\.\d+)?$/.test(value)) {
    return value;
  }
  // Escape single quotes and wrap in quotes
  return `'${value.replace(/'/g, "''")}'`;
}

/**
 * Format SQL query with proper indentation
 */
export function formatSQL(sql: string): string {
  return sql
    .replace(/\s+/g, ' ')
    .replace(/\s*,\s*/g, ',\n       ')
    .replace(/\bSELECT\b/gi, 'SELECT')
    .replace(/\bFROM\b/gi, '\nFROM')
    .replace(
      /\b(INNER|LEFT|RIGHT|FULL|CROSS)\s+JOIN\b/gi,
      (match) => `\n${match.toUpperCase()}`
    )
    .replace(/\bWHERE\b/gi, '\nWHERE')
    .replace(/\bGROUP BY\b/gi, '\nGROUP BY')
    .replace(/\bORDER BY\b/gi, '\nORDER BY')
    .replace(/\bLIMIT\b/gi, '\nLIMIT')
    .trim();
}
