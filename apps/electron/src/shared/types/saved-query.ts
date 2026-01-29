// Saved query types for query management feature

/**
 * A saved SQL query with metadata
 */
export interface SavedQuery {
  /** UUID for stable references */
  id: string;
  /** Display name */
  name: string;
  /** Optional description of what the query does */
  description?: string;
  /** SQL text (may contain {{variables}}) */
  query: string;
  /** Folder ID (null = root level) */
  folderId: string | null;
  /** Optional: scope to specific connection */
  connectionId?: string;
  /** ISO timestamp when query was created */
  createdAt: string;
  /** ISO timestamp when query was last updated */
  updatedAt: string;
  /** ISO timestamp when query was last executed */
  lastExecutedAt?: string;
  /** Number of times this query has been executed */
  executionCount: number;
}

/**
 * A folder for organizing saved queries
 */
export interface QueryFolder {
  /** UUID for stable references */
  id: string;
  /** Folder name */
  name: string;
  /** Optional color (hex) */
  color?: string;
  /** ISO timestamp when folder was created */
  createdAt: string;
  /** Sort order for custom ordering */
  sortOrder: number;
}

/**
 * A parameter extracted from query text
 * Supports {{name}}, {{name:type}}, or {{name:type=default}} syntax
 */
export interface QueryParameter {
  /** Variable name (without braces) */
  name: string;
  /** Optional default value */
  defaultValue?: string;
  /** Optional type hint */
  type?: 'string' | 'number' | 'date';
}

/**
 * Input for creating a new saved query
 */
export interface CreateSavedQueryInput {
  name: string;
  query: string;
  description?: string;
  folderId?: string | null;
  connectionId?: string;
}

/**
 * Input for updating an existing saved query
 */
export interface UpdateSavedQueryInput {
  name?: string;
  query?: string;
  description?: string;
  folderId?: string | null;
  connectionId?: string;
}

/**
 * Input for creating a new query folder
 */
export interface CreateQueryFolderInput {
  name: string;
  color?: string;
}

/**
 * Input for updating an existing query folder
 */
export interface UpdateQueryFolderInput {
  name?: string;
  color?: string;
  sortOrder?: number;
}
