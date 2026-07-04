// Mock SQL Pro API
//
// Each namespace is validated against its domain mock interface.
// During domain migration, replace individual sections with imports from
// shared/domains/<domain>/mock.ts factory functions.

import type {
  AnalyzeQueryPlanRequest,
  ApplyChangesRequest,
  ClearQueryHistoryRequest,
  CloseDatabaseRequest,
  CompareConnectionsRequest,
  CompareConnectionToSnapshotRequest,
  CompareSnapshotsRequest,
  CompareTablesRequest,
  DeleteQueryHistoryRequest,
  DeleteSchemaSnapshotRequest,
  ExecuteQueryRequest,
  ExportComparisonReportRequest,
  ExportRequest,
  GenerateMigrationSQLRequest,
  GetPasswordRequest,
  GetQueryHistoryRequest,
  GetSchemaRequest,
  GetSchemaSnapshotRequest,
  GetTableDataRequest,
  GetTableRowRangeRequest,
  HasPasswordRequest,
  OpenDatabaseRequest,
  OpenFileDialogRequest,
  ProActivateRequest,
  RemoveConnectionRequest,
  RemovePasswordRequest,
  SaveAISettingsRequest,
  SaveFileDialogRequest,
  SavePasswordRequest,
  SaveQueryHistoryRequest,
  SaveSchemaSnapshotRequest,
  SetPreferencesRequest,
  TableInfo,
  UpdateConnectionRequest,
  ValidateChangesRequest,
} from '@shared/types';

// Static regex patterns
const LIMIT_REGEX = /limit\s+(\d+)/i;

// Mock tables schema
const mockTables: TableInfo[] = [
  {
    name: 'users',
    schema: 'main',
    type: 'table',
    columns: [
      {
        name: 'id',
        type: 'INTEGER',
        nullable: false,
        defaultValue: null,
        isPrimaryKey: true,
      },
      {
        name: 'name',
        type: 'TEXT',
        nullable: false,
        defaultValue: null,
        isPrimaryKey: false,
      },
      {
        name: 'email',
        type: 'TEXT',
        nullable: false,
        defaultValue: null,
        isPrimaryKey: false,
      },
      {
        name: 'age',
        type: 'INTEGER',
        nullable: true,
        defaultValue: null,
        isPrimaryKey: false,
      },
      {
        name: 'created_at',
        type: 'DATETIME',
        nullable: false,
        defaultValue: 'CURRENT_TIMESTAMP',
        isPrimaryKey: false,
      },
      {
        name: 'is_active',
        type: 'BOOLEAN',
        nullable: false,
        defaultValue: '1',
        isPrimaryKey: false,
      },
    ],
    primaryKey: ['id'],
    foreignKeys: [],
    indexes: [
      {
        name: 'idx_users_email',
        columns: ['email'],
        isUnique: true,
        sql: 'CREATE UNIQUE INDEX idx_users_email ON users(email)',
      },
    ],
    triggers: [],
    rowCount: 150,
    sql: 'CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL, age INTEGER, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, is_active BOOLEAN DEFAULT 1)',
  },
  {
    name: 'products',
    schema: 'main',
    type: 'table',
    columns: [
      {
        name: 'id',
        type: 'INTEGER',
        nullable: false,
        defaultValue: null,
        isPrimaryKey: true,
      },
      {
        name: 'name',
        type: 'TEXT',
        nullable: false,
        defaultValue: null,
        isPrimaryKey: false,
      },
      {
        name: 'description',
        type: 'TEXT',
        nullable: true,
        defaultValue: null,
        isPrimaryKey: false,
      },
      {
        name: 'price',
        type: 'REAL',
        nullable: false,
        defaultValue: null,
        isPrimaryKey: false,
      },
      {
        name: 'stock',
        type: 'INTEGER',
        nullable: false,
        defaultValue: '0',
        isPrimaryKey: false,
      },
      {
        name: 'category_id',
        type: 'INTEGER',
        nullable: true,
        defaultValue: null,
        isPrimaryKey: false,
      },
    ],
    primaryKey: ['id'],
    foreignKeys: [
      {
        column: 'category_id',
        referencedTable: 'categories',
        referencedColumn: 'id',
        onDelete: 'SET NULL',
      },
    ],
    indexes: [],
    triggers: [],
    rowCount: 85,
    sql: 'CREATE TABLE products (id INTEGER PRIMARY KEY, name TEXT NOT NULL, description TEXT, price REAL NOT NULL, stock INTEGER DEFAULT 0, category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL)',
  },
  {
    name: 'orders',
    schema: 'main',
    type: 'table',
    columns: [
      {
        name: 'id',
        type: 'INTEGER',
        nullable: false,
        defaultValue: null,
        isPrimaryKey: true,
      },
      {
        name: 'user_id',
        type: 'INTEGER',
        nullable: false,
        defaultValue: null,
        isPrimaryKey: false,
      },
      {
        name: 'total',
        type: 'REAL',
        nullable: false,
        defaultValue: null,
        isPrimaryKey: false,
      },
      {
        name: 'status',
        type: 'TEXT',
        nullable: false,
        defaultValue: "'pending'",
        isPrimaryKey: false,
      },
      {
        name: 'created_at',
        type: 'DATETIME',
        nullable: false,
        defaultValue: 'CURRENT_TIMESTAMP',
        isPrimaryKey: false,
      },
    ],
    primaryKey: ['id'],
    foreignKeys: [
      {
        column: 'user_id',
        referencedTable: 'users',
        referencedColumn: 'id',
        onDelete: 'CASCADE',
      },
    ],
    indexes: [
      {
        name: 'idx_orders_user',
        columns: ['user_id'],
        isUnique: false,
        sql: 'CREATE INDEX idx_orders_user ON orders(user_id)',
      },
      {
        name: 'idx_orders_status',
        columns: ['status'],
        isUnique: false,
        sql: 'CREATE INDEX idx_orders_status ON orders(status)',
      },
    ],
    triggers: [],
    rowCount: 320,
    sql: "CREATE TABLE orders (id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, total REAL NOT NULL, status TEXT DEFAULT 'pending', created_at DATETIME DEFAULT CURRENT_TIMESTAMP)",
  },
  {
    name: 'categories',
    schema: 'main',
    type: 'table',
    columns: [
      {
        name: 'id',
        type: 'INTEGER',
        nullable: false,
        defaultValue: null,
        isPrimaryKey: true,
      },
      {
        name: 'name',
        type: 'TEXT',
        nullable: false,
        defaultValue: null,
        isPrimaryKey: false,
      },
      {
        name: 'parent_id',
        type: 'INTEGER',
        nullable: true,
        defaultValue: null,
        isPrimaryKey: false,
      },
    ],
    primaryKey: ['id'],
    foreignKeys: [
      {
        column: 'parent_id',
        referencedTable: 'categories',
        referencedColumn: 'id',
      },
    ],
    indexes: [],
    triggers: [],
    rowCount: 12,
    sql: 'CREATE TABLE categories (id INTEGER PRIMARY KEY, name TEXT NOT NULL, parent_id INTEGER REFERENCES categories(id))',
  },
];

// Mock views schema
const mockViews: TableInfo[] = [
  {
    name: 'active_users',
    schema: 'main',
    type: 'view',
    columns: [
      {
        name: 'id',
        type: 'INTEGER',
        nullable: false,
        defaultValue: null,
        isPrimaryKey: false,
      },
      {
        name: 'name',
        type: 'TEXT',
        nullable: false,
        defaultValue: null,
        isPrimaryKey: false,
      },
      {
        name: 'email',
        type: 'TEXT',
        nullable: false,
        defaultValue: null,
        isPrimaryKey: false,
      },
    ],
    primaryKey: [],
    foreignKeys: [],
    indexes: [],
    triggers: [],
    sql: 'CREATE VIEW active_users AS SELECT id, name, email FROM users WHERE is_active = 1',
  },
  {
    name: 'order_summary',
    schema: 'main',
    type: 'view',
    columns: [
      {
        name: 'user_id',
        type: 'INTEGER',
        nullable: false,
        defaultValue: null,
        isPrimaryKey: false,
      },
      {
        name: 'user_name',
        type: 'TEXT',
        nullable: false,
        defaultValue: null,
        isPrimaryKey: false,
      },
      {
        name: 'total_orders',
        type: 'INTEGER',
        nullable: false,
        defaultValue: null,
        isPrimaryKey: false,
      },
      {
        name: 'total_spent',
        type: 'REAL',
        nullable: false,
        defaultValue: null,
        isPrimaryKey: false,
      },
    ],
    primaryKey: [],
    foreignKeys: [],
    indexes: [],
    triggers: [],
    sql: 'CREATE VIEW order_summary AS SELECT u.id as user_id, u.name as user_name, COUNT(o.id) as total_orders, SUM(o.total) as total_spent FROM users u LEFT JOIN orders o ON u.id = o.user_id GROUP BY u.id',
  },
];

// Mock table data
const mockTableData: Record<string, Record<string, unknown>[]> = {
  users: [
    {
      id: 1,
      name: 'Alice Johnson',
      email: 'alice@example.com',
      age: 28,
      created_at: '2024-01-15 10:30:00',
      is_active: 1,
    },
    {
      id: 2,
      name: 'Bob Smith',
      email: 'bob@example.com',
      age: 35,
      created_at: '2024-02-20 14:45:00',
      is_active: 1,
    },
    {
      id: 3,
      name: 'Charlie Brown',
      email: 'charlie@example.com',
      age: 42,
      created_at: '2024-03-10 09:15:00',
      is_active: 0,
    },
    {
      id: 4,
      name: 'Diana Ross',
      email: 'diana@example.com',
      age: 31,
      created_at: '2024-03-25 16:20:00',
      is_active: 1,
    },
    {
      id: 5,
      name: 'Edward Chen',
      email: 'edward@example.com',
      age: 29,
      created_at: '2024-04-05 11:00:00',
      is_active: 1,
    },
    {
      id: 6,
      name: 'Fiona Garcia',
      email: 'fiona@example.com',
      age: 38,
      created_at: '2024-04-18 13:30:00',
      is_active: 1,
    },
    {
      id: 7,
      name: 'George Wilson',
      email: 'george@example.com',
      age: 45,
      created_at: '2024-05-02 08:45:00',
      is_active: 0,
    },
    {
      id: 8,
      name: 'Hannah Lee',
      email: 'hannah@example.com',
      age: 26,
      created_at: '2024-05-20 15:10:00',
      is_active: 1,
    },
    {
      id: 9,
      name: 'Ivan Petrov',
      email: 'ivan@example.com',
      age: 33,
      created_at: '2024-06-08 10:25:00',
      is_active: 1,
    },
    {
      id: 10,
      name: 'Julia Martinez',
      email: 'julia@example.com',
      age: 27,
      created_at: '2024-06-22 12:40:00',
      is_active: 1,
    },
  ],
  products: [
    {
      id: 1,
      name: 'MacBook Pro 16"',
      description: 'Apple M3 Pro chip, 18GB RAM, 512GB SSD',
      price: 2499.0,
      stock: 25,
      category_id: 1,
    },
    {
      id: 2,
      name: 'iPhone 15 Pro',
      description: 'A17 Pro chip, 256GB, Titanium',
      price: 1199.0,
      stock: 150,
      category_id: 2,
    },
    {
      id: 3,
      name: 'AirPods Pro 2',
      description: 'Active Noise Cancellation, USB-C',
      price: 249.0,
      stock: 200,
      category_id: 3,
    },
    {
      id: 4,
      name: 'iPad Air',
      description: 'M2 chip, 11-inch, 128GB',
      price: 599.0,
      stock: 80,
      category_id: 4,
    },
    {
      id: 5,
      name: 'Apple Watch Ultra 2',
      description: 'GPS + Cellular, Titanium Case',
      price: 799.0,
      stock: 45,
      category_id: 5,
    },
    {
      id: 6,
      name: 'Magic Keyboard',
      description: 'Wireless, Touch ID, Numeric Keypad',
      price: 199.0,
      stock: 120,
      category_id: 3,
    },
    {
      id: 7,
      name: 'Studio Display',
      description: '27-inch 5K Retina, Nano-texture glass',
      price: 1999.0,
      stock: 15,
      category_id: 1,
    },
    {
      id: 8,
      name: 'HomePod mini',
      description: 'Smart speaker with Siri',
      price: 99.0,
      stock: 300,
      category_id: 3,
    },
  ],
  orders: [
    {
      id: 1,
      user_id: 1,
      total: 2748.0,
      status: 'completed',
      created_at: '2024-06-01 10:00:00',
    },
    {
      id: 2,
      user_id: 2,
      total: 1199.0,
      status: 'completed',
      created_at: '2024-06-05 14:30:00',
    },
    {
      id: 3,
      user_id: 1,
      total: 249.0,
      status: 'shipped',
      created_at: '2024-06-10 09:15:00',
    },
    {
      id: 4,
      user_id: 4,
      total: 599.0,
      status: 'pending',
      created_at: '2024-06-15 16:45:00',
    },
    {
      id: 5,
      user_id: 5,
      total: 2499.0,
      status: 'processing',
      created_at: '2024-06-18 11:20:00',
    },
    {
      id: 6,
      user_id: 3,
      total: 99.0,
      status: 'cancelled',
      created_at: '2024-06-20 13:00:00',
    },
    {
      id: 7,
      user_id: 6,
      total: 1998.0,
      status: 'completed',
      created_at: '2024-06-22 08:30:00',
    },
    {
      id: 8,
      user_id: 8,
      total: 448.0,
      status: 'shipped',
      created_at: '2024-06-25 15:45:00',
    },
  ],
  categories: [
    { id: 1, name: 'Computers', parent_id: null },
    { id: 2, name: 'Phones', parent_id: null },
    { id: 3, name: 'Accessories', parent_id: null },
    { id: 4, name: 'Tablets', parent_id: null },
    { id: 5, name: 'Wearables', parent_id: null },
  ],
  active_users: [
    { id: 1, name: 'Alice Johnson', email: 'alice@example.com' },
    { id: 2, name: 'Bob Smith', email: 'bob@example.com' },
    { id: 4, name: 'Diana Ross', email: 'diana@example.com' },
    { id: 5, name: 'Edward Chen', email: 'edward@example.com' },
    { id: 6, name: 'Fiona Garcia', email: 'fiona@example.com' },
    { id: 8, name: 'Hannah Lee', email: 'hannah@example.com' },
    { id: 9, name: 'Ivan Petrov', email: 'ivan@example.com' },
    { id: 10, name: 'Julia Martinez', email: 'julia@example.com' },
  ],
  order_summary: [
    {
      user_id: 1,
      user_name: 'Alice Johnson',
      total_orders: 2,
      total_spent: 2997.0,
    },
    {
      user_id: 2,
      user_name: 'Bob Smith',
      total_orders: 1,
      total_spent: 1199.0,
    },
    {
      user_id: 3,
      user_name: 'Charlie Brown',
      total_orders: 1,
      total_spent: 99.0,
    },
    {
      user_id: 4,
      user_name: 'Diana Ross',
      total_orders: 1,
      total_spent: 599.0,
    },
    {
      user_id: 5,
      user_name: 'Edward Chen',
      total_orders: 1,
      total_spent: 2499.0,
    },
    {
      user_id: 6,
      user_name: 'Fiona Garcia',
      total_orders: 1,
      total_spent: 1998.0,
    },
    {
      user_id: 8,
      user_name: 'Hannah Lee',
      total_orders: 1,
      total_spent: 448.0,
    },
  ],
};

// Simulated delay for realistic feel
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Mock mode state
let _isMockMode = false;

// Check if mock mode is enabled via URL parameter or environment variable
function checkMockModeFromURL(): boolean {
  // Check environment variable first
  if (import.meta.env.VITE_MOCK_MODE === 'true') {
    return true;
  }
  // Then check URL parameter
  if (typeof window === 'undefined') return false;
  const hashParams = new URLSearchParams(
    window.location.hash.split('?')[1] || ''
  );
  return hashParams.get('mock') === 'true';
}

// Mock connection data for initialization
const mockConnectionData = {
  connection: {
    id: 'mock-connection-1',
    path: '/Users/demo/databases/shop.db',
    filename: 'shop.db',
    isEncrypted: false,
    isReadOnly: false,
    status: 'connected' as const,
    connectedAt: new Date(),
  },
  schema: {
    schemas: [
      {
        name: 'main',
        tables: mockTables,
        views: mockViews,
      },
    ],
    tables: mockTables,
    views: mockViews,
  },
};

export async function initMockMode(): Promise<
  typeof mockConnectionData | null
> {
  _isMockMode = true;
  return mockConnectionData;
}

export function isMockMode(): boolean {
  return _isMockMode || checkMockModeFromURL();
}

// Shared mock method sets to avoid duplication between aliases
const mockUpdateMethods = {
  check: async () => {
    await delay(100);
    return { success: true };
  },
  download: async () => {
    await delay(200);
    return { success: false };
  },
  install: async () => {
    await delay(200);
    return { success: false };
  },
};

const mockPluginMethods = {
  list: async () => {
    await delay(100);
    return { success: true, plugins: [] };
  },
  get: async () => {
    await delay(100);
    return { success: false };
  },
  install: async () => {
    await delay(200);
    return { success: false };
  },
  uninstall: async () => {
    await delay(200);
    return { success: true };
  },
  enable: async () => {
    await delay(100);
    return { success: true };
  },
  disable: async () => {
    await delay(100);
    return { success: true };
  },
  update: async () => {
    await delay(200);
    return { success: true };
  },
  fetchMarketplace: async () => {
    await delay(300);
    return { success: true, plugins: [] };
  },
  checkUpdates: async () => {
    await delay(200);
    return { success: true, updates: [] };
  },
  onEvent: () => {
    return () => {};
  },
};

// Mutable recent connections list shared between getRecentConnections and removeRecentConnection
const mockRecentConnections = [
  {
    id: 'recent-1',
    path: '/Users/demo/databases/shop.db',
    filename: 'shop.db',
    isEncrypted: false,
    lastOpenedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: 'recent-2',
    path: '/Users/demo/databases/inventory.db',
    filename: 'inventory.db',
    isEncrypted: false,
    lastOpenedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: 'recent-3',
    path: '/Users/demo/databases/analytics.db',
    filename: 'analytics.db',
    isEncrypted: true,
    lastOpenedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: 'recent-4',
    path: '/Users/demo/projects/webapp/data.sqlite',
    filename: 'data.sqlite',
    isEncrypted: false,
    lastOpenedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
  },
];

// The mock implements a partial subset of SqlProAPI with some structural differences.
// Type-safe validation is enforced per-namespace via domain test files.
export const mockSqlProAPI = {
  db: {
    open: async (_request: OpenDatabaseRequest) => {
      await delay(300);
      return {
        success: true,
        connection: {
          id: 'mock-connection-1',
          path: '/Users/demo/databases/shop.db',
          filename: 'shop.db',
          isEncrypted: false,
          isReadOnly: false,
        },
      };
    },
    close: async (_request: CloseDatabaseRequest) => {
      await delay(200);
      return { success: true };
    },
    getSchema: async (_request: GetSchemaRequest) => {
      await delay(400);
      return {
        success: true,
        schemas: [
          {
            name: 'main',
            tables: mockTables,
            views: mockViews,
          },
        ],
        tables: mockTables,
        views: mockViews,
      };
    },
    getTableData: async (_request: GetTableDataRequest) => {
      await delay(300);
      const tableName = _request.table;
      const data = mockTableData[tableName] || [];
      const pageSize = _request.pageSize || 100;
      const page = _request.page || 1;
      const offset = (page - 1) * pageSize;

      // Find the table schema to get columns
      const tableSchema = mockTables.find((t) => t.name === tableName);
      const columns = tableSchema?.columns || [];

      return {
        success: true,
        columns,
        rows: data.slice(offset, offset + pageSize),
        totalRows: data.length,
      };
    },
    getTableRowRange: async (_request: GetTableRowRangeRequest) => {
      await delay(200);
      const tableName = _request.table;
      const data = mockTableData[tableName] || [];
      const startRow = Math.max(0, _request.startRow);
      const endRow = Math.min(data.length, _request.endRow);

      // Find the table schema to get columns
      const tableSchema = mockTables.find((t) => t.name === tableName);
      const columns = tableSchema?.columns || [];

      return {
        success: true,
        columns,
        rows: data.slice(startRow, endRow),
        totalRows: data.length,
        isEstimatedTotal: false,
        actualStartRow: startRow,
        actualEndRow: startRow + data.slice(startRow, endRow).length,
      };
    },
    executeQuery: async (_request: ExecuteQueryRequest) => {
      await delay(300);
      const query = _request.query?.trim().toLowerCase() || '';

      // Simple query parsing for demo purposes
      if (query.includes('select') && query.includes('from products')) {
        const tableSchema = mockTables.find((t) => t.name === 'products');
        // ExecuteQueryResponse.columns is string[], unlike getTableData's column objects
        const columns = (tableSchema?.columns || []).map((c) => c.name);
        const data = mockTableData.products || [];

        // Handle LIMIT clause
        let limitedData = data;
        const limitMatch = query.match(LIMIT_REGEX);
        if (limitMatch) {
          const limit = Number.parseInt(limitMatch[1], 10);
          limitedData = data.slice(0, limit);
        }

        return {
          success: true,
          columns,
          rows: limitedData,
          totalRows: limitedData.length,
          executionTime: 42,
        };
      }

      // Default response for other queries
      return {
        success: true,
        columns: [],
        rows: [],
        totalRows: 0,
        executionTime: 15,
      };
    },
  },
  query: {
    execute: async (_request: ExecuteQueryRequest) => {
      await delay(400);
      return {
        rows: [],
        columns: [],
        affectedRows: 0,
        executionTime: 45,
      };
    },
    validateChanges: async (_request: ValidateChangesRequest) => {
      await delay(300);
      return {
        isValid: true,
        errors: [],
      };
    },
    applyChanges: async (_request: ApplyChangesRequest) => {
      await delay(500);
      return {
        success: true,
        affectedRows: 1,
      };
    },
    analyzeQueryPlan: async (_request: AnalyzeQueryPlanRequest) => {
      await delay(300);
      return {
        plan: [
          {
            id: 0,
            parent: -1,
            notused: 0,
            detail: 'SCAN TABLE users',
          },
        ],
        executionTime: 0.5,
      };
    },
  },
  history: {
    get: async (_request: GetQueryHistoryRequest) => {
      await delay(200);
      return {
        success: true,
        history: [],
        total: 0,
      };
    },
    save: async (_request: SaveQueryHistoryRequest) => {
      await delay(200);
      return {
        success: true,
        id: 'mock-history-1',
      };
    },
    delete: async (_request: DeleteQueryHistoryRequest) => {
      await delay(200);
      return {
        success: true,
      };
    },
    clear: async (_request: ClearQueryHistoryRequest) => {
      await delay(200);
      return {
        success: true,
      };
    },
  },
  export: {
    export: async (_request: ExportRequest) => {
      await delay(500);
      return {
        success: true,
        data: 'mock-export-data',
      };
    },
  },
  file: {
    openFileDialog: async (_request: OpenFileDialogRequest) => {
      await delay(200);
      return {
        filePath: '/Users/demo/databases/shop.db',
      };
    },
    saveFileDialog: async (_request: SaveFileDialogRequest) => {
      await delay(200);
      return {
        filePath: '/Users/demo/databases/export.csv',
      };
    },
  },
  connection: {
    getRecentConnections: async () => {
      await delay(200);
      return {
        connections: [],
      };
    },
    updateConnection: async (_request: UpdateConnectionRequest) => {
      await delay(200);
      return {
        success: true,
      };
    },
    removeConnection: async (_request: RemoveConnectionRequest) => {
      await delay(200);
      return {
        success: true,
      };
    },
  },
  preferences: {
    getPreferences: async () => {
      await delay(200);
      return {
        theme: 'dark',
        fontSize: 14,
      };
    },
    setPreferences: async (_request: SetPreferencesRequest) => {
      await delay(200);
      return {
        success: true,
      };
    },
  },
  password: {
    get: async (_request: GetPasswordRequest) => {
      await delay(200);
      return {
        password: 'mock-password',
      };
    },
    has: async (_request: HasPasswordRequest) => {
      await delay(200);
      return {
        hasPassword: false,
      };
    },
    save: async (_request: SavePasswordRequest) => {
      await delay(200);
      return {
        success: true,
      };
    },
    remove: async (_request: RemovePasswordRequest) => {
      await delay(200);
      return {
        success: true,
      };
    },
    isAvailable: async () => {
      await delay(200);
      return {
        available: true,
      };
    },
  },
  ai: {
    getAISettings: async () => {
      await delay(200);
      return {
        settings: {
          apiKey: 'mock-api-key',
          model: 'gpt-4',
          enabled: true,
        },
      };
    },
    saveAISettings: async (_request: SaveAISettingsRequest) => {
      await delay(200);
      return {
        success: true,
      };
    },
  },
  pro: {
    getStatus: async () => {
      await delay(200);
      return {
        isActive: false,
        expiresAt: null,
        licenseKey: null,
      };
    },
    activate: async (_request: ProActivateRequest) => {
      await delay(300);
      return {
        success: true,
        expiresAt: new Date(
          Date.now() + 365 * 24 * 60 * 60 * 1000
        ).toISOString(),
      };
    },
    deactivate: async () => {
      await delay(200);
      return {
        success: true,
      };
    },
  },
  schemaSnapshot: {
    save: async (_request: SaveSchemaSnapshotRequest) => {
      await delay(300);
      return {
        success: true,
        snapshot: {
          id: `snapshot-${Date.now()}`,
          name: _request.name,
          connectionId: _request.connectionId,
          createdAt: new Date().toISOString(),
          schema: {
            tables: mockTables,
          },
        },
      };
    },
    getAll: async () => {
      await delay(200);
      return {
        snapshots: [
          {
            id: 'snapshot-1',
            name: 'Production Schema - 2024-01-15',
            connectionId: 'conn-1',
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            schema: { tables: mockTables },
          },
        ],
      };
    },
    get: async (_request: GetSchemaSnapshotRequest) => {
      await delay(200);
      return {
        snapshot: {
          id: _request.snapshotId,
          name: 'Production Schema - 2024-01-15',
          connectionId: 'conn-1',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          schema: { tables: mockTables },
        },
      };
    },
    delete: async (_request: DeleteSchemaSnapshotRequest) => {
      await delay(200);
      return {
        success: true,
      };
    },
  },
  schemaComparison: {
    compareConnections: async (_request: CompareConnectionsRequest) => {
      await delay(500);
      return {
        success: true,
        result: {
          source: {
            type: 'connection' as const,
            id: _request.sourceConnectionId,
            name: 'Source Database',
          },
          target: {
            type: 'connection' as const,
            id: _request.targetConnectionId,
            name: 'Target Database',
          },
          tableDiffs: [],
          summary: {
            tablesAdded: 0,
            tablesRemoved: 0,
            tablesModified: 0,
            columnsAdded: 0,
            columnsRemoved: 0,
            columnsModified: 0,
            indexesAdded: 0,
            indexesRemoved: 0,
            indexesModified: 0,
            triggersAdded: 0,
            triggersRemoved: 0,
            triggersModified: 0,
            foreignKeysAdded: 0,
            foreignKeysRemoved: 0,
            foreignKeysModified: 0,
          },
        },
      };
    },
    compareConnectionToSnapshot: async (
      _request: CompareConnectionToSnapshotRequest
    ) => {
      await delay(500);
      return {
        success: true,
        result: {
          source: {
            type: 'connection' as const,
            id: _request.connectionId,
            name: 'Current Database',
          },
          target: {
            type: 'snapshot' as const,
            id: _request.snapshotId,
            name: 'Saved Snapshot',
          },
          tableDiffs: [],
          summary: {
            tablesAdded: 0,
            tablesRemoved: 0,
            tablesModified: 0,
            columnsAdded: 0,
            columnsRemoved: 0,
            columnsModified: 0,
            indexesAdded: 0,
            indexesRemoved: 0,
            indexesModified: 0,
            triggersAdded: 0,
            triggersRemoved: 0,
            triggersModified: 0,
            foreignKeysAdded: 0,
            foreignKeysRemoved: 0,
            foreignKeysModified: 0,
          },
        },
      };
    },
    compareSnapshots: async (_request: CompareSnapshotsRequest) => {
      await delay(500);
      return {
        success: true,
        result: {
          source: {
            type: 'snapshot' as const,
            id: _request.sourceSnapshotId,
            name: 'Source Snapshot',
          },
          target: {
            type: 'snapshot' as const,
            id: _request.targetSnapshotId,
            name: 'Target Snapshot',
          },
          tableDiffs: [],
          summary: {
            tablesAdded: 0,
            tablesRemoved: 0,
            tablesModified: 0,
            columnsAdded: 0,
            columnsRemoved: 0,
            columnsModified: 0,
            indexesAdded: 0,
            indexesRemoved: 0,
            indexesModified: 0,
            triggersAdded: 0,
            triggersRemoved: 0,
            triggersModified: 0,
            foreignKeysAdded: 0,
            foreignKeysRemoved: 0,
            foreignKeysModified: 0,
          },
        },
      };
    },
    generateMigrationSQL: async (_request: GenerateMigrationSQLRequest) => {
      await delay(300);
      return {
        success: true,
        sql: '-- Mock migration SQL\n-- No changes detected in mock mode',
        statements: [],
        warnings: [],
      };
    },
    exportReport: async (_request: ExportComparisonReportRequest) => {
      await delay(400);
      return {
        success: true,
        filePath: _request.filePath,
      };
    },
  },

  // Comparison operations (alias for schemaComparison + data diff)
  comparison: {
    compareConnections: async (_request: CompareConnectionsRequest) => {
      await delay(500);
      return {
        success: true,
        result: {
          sourceName: 'Source Database',
          targetName: 'Target Database',
          tableDiffs: [],
          summary: {
            sourceTables: 4,
            targetTables: 4,
            tablesAdded: 0,
            tablesRemoved: 0,
            tablesModified: 0,
            columnsAdded: 0,
            columnsRemoved: 0,
            columnsModified: 0,
            indexesAdded: 0,
            indexesRemoved: 0,
            indexesModified: 0,
            triggersAdded: 0,
            triggersRemoved: 0,
            triggersModified: 0,
            foreignKeysAdded: 0,
            foreignKeysRemoved: 0,
            foreignKeysModified: 0,
          },
        },
      };
    },
    compareConnectionToSnapshot: async (
      _request: CompareConnectionToSnapshotRequest
    ) => {
      await delay(500);
      return {
        success: true,
        result: {
          sourceName: 'Current Database',
          targetName: 'Saved Snapshot',
          tableDiffs: [],
          summary: {
            sourceTables: 4,
            targetTables: 4,
            tablesAdded: 0,
            tablesRemoved: 0,
            tablesModified: 0,
            columnsAdded: 0,
            columnsRemoved: 0,
            columnsModified: 0,
            indexesAdded: 0,
            indexesRemoved: 0,
            indexesModified: 0,
            triggersAdded: 0,
            triggersRemoved: 0,
            triggersModified: 0,
            foreignKeysAdded: 0,
            foreignKeysRemoved: 0,
            foreignKeysModified: 0,
          },
        },
      };
    },
    compareSnapshots: async (_request: CompareSnapshotsRequest) => {
      await delay(500);
      return {
        success: true,
        result: {
          sourceName: 'Source Snapshot',
          targetName: 'Target Snapshot',
          tableDiffs: [],
          summary: {
            sourceTables: 4,
            targetTables: 4,
            tablesAdded: 0,
            tablesRemoved: 0,
            tablesModified: 0,
            columnsAdded: 0,
            columnsRemoved: 0,
            columnsModified: 0,
            indexesAdded: 0,
            indexesRemoved: 0,
            indexesModified: 0,
            triggersAdded: 0,
            triggersRemoved: 0,
            triggersModified: 0,
            foreignKeysAdded: 0,
            foreignKeysRemoved: 0,
            foreignKeysModified: 0,
          },
        },
      };
    },
    compareTables: async (_request: CompareTablesRequest) => {
      await delay(500);
      return {
        success: true,
        result: {
          sourceName: `${_request.sourceTable}`,
          targetName: `${_request.targetTable}`,
          columns: [],
          rows: [],
          summary: {
            sourceRows: 0,
            targetRows: 0,
            rowsAdded: 0,
            rowsRemoved: 0,
            rowsModified: 0,
            rowsUnchanged: 0,
          },
        },
      };
    },
    exportComparisonReport: async (_request: ExportComparisonReportRequest) => {
      await delay(400);
      return {
        success: true,
        filePath: _request.filePath,
      };
    },
  },

  // Menu operations (mock)
  menu: {
    onAction: (): (() => void) => {
      return () => {};
    },
    updateShortcuts: async () => {
      return { success: true };
    },
  },

  // Shortcuts operations (mock)
  shortcuts: {
    update: async () => {
      return { success: true };
    },
  },

  // Language operations (mock)
  language: {
    update: async () => {
      return { success: true };
    },
  },

  // Dialog operations (mock)
  dialog: {
    openFile: async () => {
      await delay(100);
      return { canceled: true, filePaths: [] };
    },
    saveFile: async () => {
      await delay(100);
      return { canceled: true, filePath: '' };
    },
    writeFile: async () => {
      await delay(100);
      return { success: true };
    },
  },

  // System operations (mock)
  system: {
    showItemInFolder: async () => {
      await delay(50);
      return { success: true };
    },
    openExternal: async (request: string | { url: string }) => {
      const url = typeof request === 'string' ? request : request.url;
      const opened = window.open(url, '_blank', 'noopener,noreferrer');
      return { success: opened !== null };
    },
  },

  // Shell operations (mock)
  shell: {
    openExternal: async (request: string | { url: string }) => {
      const url = typeof request === 'string' ? request : request.url;
      const opened = window.open(url, '_blank', 'noopener,noreferrer');
      return { success: opened !== null };
    },
    showItemInFolder: async () => {
      await delay(50);
      return { success: true };
    },
  },

  // Window operations (mock)
  window: {
    create: async () => {
      await delay(100);
      return { success: true };
    },
    close: async () => {
      await delay(50);
      return { success: true };
    },
    focus: async () => {
      await delay(50);
      return { success: true };
    },
    getAll: async () => {
      await delay(50);
      return { windows: [] };
    },
    getCurrent: async () => {
      await delay(50);
      return { id: 'web-window-1' };
    },
  },

  // Update operations (mock) — shared between update/updates aliases
  update: mockUpdateMethods,
  updates: mockUpdateMethods,

  // Memory operations (mock)
  memory: {
    getStats: async () => {
      await delay(50);
      return {
        heapUsed: 50 * 1024 * 1024,
        heapTotal: 100 * 1024 * 1024,
        rss: 150 * 1024 * 1024,
        external: 10 * 1024 * 1024,
      };
    },
    subscribe: async () => {
      await delay(50);
      return { success: true };
    },
    unsubscribe: async () => {
      await delay(50);
      return { success: true };
    },
    triggerGC: async () => {
      await delay(100);
      return { success: true };
    },
    onStatsUpdate: (): (() => void) => {
      return () => {};
    },
    onPressureChange: (): (() => void) => {
      return () => {};
    },
  },

  // License operations (mock)
  license: {
    getMachineId: async () => {
      await delay(50);
      return { machineId: 'web-browser-instance' };
    },
    createCheckout: async () => {
      await delay(200);
      return { url: '' };
    },
    activate: async () => {
      await delay(300);
      return { success: false };
    },
    verify: async () => {
      await delay(200);
      return { valid: false };
    },
    deactivate: async () => {
      await delay(200);
      return { success: true };
    },
    getPortalUrl: async () => {
      await delay(100);
      return { url: '' };
    },
  },

  // SSH operations (mock)
  ssh: {
    saveCredentials: async () => {
      await delay(100);
      return { success: true };
    },
    hasCredentials: async () => {
      await delay(50);
      return { hasCredentials: false };
    },
    getCredentials: async () => {
      await delay(50);
      return { credentials: null };
    },
    removeCredentials: async () => {
      await delay(100);
      return { success: true };
    },
    getTunnelStatus: async () => {
      await delay(50);
      return { connected: false };
    },
    closeTunnel: async () => {
      await delay(100);
      return { success: true };
    },
    testConnection: async () => {
      await delay(300);
      return { success: false, error: 'SSH not available in web mode' };
    },
    hasTunnel: async () => {
      await delay(50);
      return { hasTunnel: false };
    },
  },

  // Backup operations (mock)
  backup: {
    create: async () => {
      await delay(300);
      return { success: true };
    },
    restore: async () => {
      await delay(300);
      return { success: true };
    },
    list: async () => {
      await delay(100);
      return { backups: [] };
    },
    delete: async () => {
      await delay(100);
      return { success: true };
    },
  },

  // Profile operations (mock)
  profile: {
    save: async () => {
      await delay(100);
      return { success: true };
    },
    update: async () => {
      await delay(100);
      return { success: true };
    },
    delete: async () => {
      await delay(100);
      return { success: true };
    },
    getAll: async () => {
      await delay(100);
      return { profiles: [] };
    },
    export: async () => {
      await delay(200);
      return { success: true };
    },
    import: async () => {
      await delay(200);
      return { success: true };
    },
  },

  // Folder operations (mock)
  folder: {
    create: async () => {
      await delay(100);
      return { success: true };
    },
    update: async () => {
      await delay(100);
      return { success: true };
    },
    delete: async () => {
      await delay(100);
      return { success: true };
    },
    getAll: async () => {
      await delay(100);
      return { folders: [] };
    },
  },

  // Plugin operations (mock) — shared between plugin/plugins aliases
  plugin: mockPluginMethods,
  plugins: mockPluginMethods,

  // Agent/AI operations (mock)
  agent: {
    getSettings: async () => {
      await delay(100);
      return { settings: { enabled: false } };
    },
    saveSettings: async () => {
      await delay(100);
      return { success: true };
    },
    sendChat: async () => {
      await delay(300);
      return { response: 'AI features are not available in web mode' };
    },
    cancelChat: async () => {
      await delay(50);
      return { success: true };
    },
    onChatStream: (): (() => void) => {
      return () => {};
    },
    getSessions: async () => {
      await delay(100);
      return { sessions: [] };
    },
    getSession: async () => {
      await delay(100);
      return { session: null };
    },
    deleteSession: async () => {
      await delay(100);
      return { success: true };
    },
    clearHistory: async () => {
      await delay(100);
      return { success: true };
    },
    nlGenerateSQL: async () => {
      await delay(200);
      return { sql: '' };
    },
    nlExplainSQL: async () => {
      await delay(200);
      return { explanation: '' };
    },
    nlOptimizeSQL: async () => {
      await delay(200);
      return { sql: '' };
    },
  },

  // Image operations (mock)
  image: {
    getMetadata: async () => {
      await delay(100);
      return { metadata: null };
    },
    getFileMetadata: async () => {
      await delay(100);
      return { metadata: null };
    },
    getCacheStats: async () => {
      await delay(50);
      return { hits: 0, misses: 0, size: 0 };
    },
    clearCache: async () => {
      await delay(100);
      return { success: true };
    },
    checkUrl: async () => {
      await delay(100);
      return { valid: false };
    },
    validateUrl: async () => {
      await delay(100);
      return { valid: false };
    },
    checkFile: async () => {
      await delay(50);
      return { exists: false };
    },
  },

  // Video operations (mock)
  video: {
    getMetadata: async () => {
      await delay(100);
      return { metadata: null };
    },
    checkUrl: async () => {
      await delay(100);
      return { valid: false };
    },
    validateUrl: async () => {
      await delay(100);
      return { valid: false };
    },
    checkFile: async () => {
      await delay(50);
      return { exists: false };
    },
  },

  // Sharing operations (mock)
  sharing: {
    exportBundle: async () => {
      await delay(200);
      return { success: false };
    },
    importBundle: async () => {
      await delay(200);
      return { success: false };
    },
    exportQuery: async () => {
      await delay(100);
      return { success: false };
    },
    importQuery: async () => {
      await delay(100);
      return { success: false };
    },
    exportSchema: async () => {
      await delay(200);
      return { success: false };
    },
    importSchema: async () => {
      await delay(200);
      return { success: false };
    },
  },

  // Data diff operations (mock)
  dataDiff: {
    generateSyncSQL: async () => {
      await delay(200);
      return { sql: '' };
    },
    compareTables: async () => {
      await delay(300);
      return { result: null };
    },
  },

  // PgNotify operations (mock)
  pgNotify: {
    subscribe: async () => {
      await delay(100);
      return { success: true };
    },
    unsubscribe: async () => {
      await delay(100);
      return { success: true };
    },
    getSubscriptions: async () => {
      await delay(50);
      return { subscriptions: [] };
    },
    onEvent: (): (() => void) => {
      return () => {};
    },
  },

  // Database maintenance operations (mock)
  database: {
    getDatabaseStats: async () => {
      await delay(100);
      return { stats: {} };
    },
    vacuum: async () => {
      await delay(300);
      return { success: true };
    },
    analyze: async () => {
      await delay(200);
      return { success: true };
    },
    getSchema: async () => {
      await delay(100);
      return { schema: {} };
    },
    query: async () => {
      await delay(200);
      return { rows: [], columns: [] };
    },
  },

  // Unsaved changes operations (mock)
  unsavedChanges: {
    check: async () => {
      await delay(50);
      return { hasChanges: false };
    },
  },

  // Schema export/import operations (mock)
  schema: {
    export: async () => {
      await delay(200);
      return { success: false };
    },
    import: async () => {
      await delay(200);
      return { success: false };
    },
  },

  // Bundle operations (mock)
  bundle: {
    export: async () => {
      await delay(200);
      return { success: false };
    },
    import: async () => {
      await delay(200);
      return { success: false };
    },
  },

  // Migration operations (mock)
  migration: {
    generateSQL: async () => {
      await delay(200);
      return { sql: '' };
    },
    generateSyncSQL: async () => {
      await delay(200);
      return { sql: '' };
    },
  },

  // SQL log operations (mock)
  sqlLog: {
    get: async () => {
      await delay(100);
      return { logs: [] };
    },
    clear: async () => {
      await delay(100);
      return { success: true };
    },
    onEntry: (): (() => void) => {
      // Return a no-op unsubscribe function in mock mode
      return () => {};
    },
  },

  // Renderer store operations (mock - uses in-memory storage)
  rendererStore: {
    get: async ({ key }: { key: string }) => {
      try {
        const stored = localStorage.getItem(`sqlpro-store-${key}`);
        return {
          success: true,
          data: stored ? JSON.parse(stored) : undefined,
        };
      } catch {
        return { success: false, data: undefined };
      }
    },
    set: async ({ key, value }: { key: string; value: unknown }) => {
      try {
        localStorage.setItem(`sqlpro-store-${key}`, JSON.stringify(value));
        return { success: true };
      } catch {
        return { success: false };
      }
    },
    update: async ({ key, value }: { key: string; value: unknown }) => {
      try {
        if (
          typeof value !== 'object' ||
          value === null ||
          Array.isArray(value)
        ) {
          localStorage.setItem(`sqlpro-store-${key}`, JSON.stringify(value));
          return { success: true };
        }
        const existing = localStorage.getItem(`sqlpro-store-${key}`);
        const parsed = existing ? JSON.parse(existing) : null;
        const merged =
          parsed && typeof parsed === 'object' && !Array.isArray(parsed)
            ? { ...parsed, ...value }
            : value;
        localStorage.setItem(`sqlpro-store-${key}`, JSON.stringify(merged));
        return { success: true };
      } catch {
        return { success: false };
      }
    },
    reset: async ({ key }: { key: string }) => {
      try {
        localStorage.removeItem(`sqlpro-store-${key}`);
        return { success: true };
      } catch {
        return { success: false };
      }
    },
  },

  // App operations (mock)
  app: {
    getRecentConnections: async () => {
      await delay(100);
      return {
        success: true,
        connections: [...mockRecentConnections],
      };
    },
    getPreferences: async () => {
      await delay(50);
      return {
        success: true,
        preferences: {
          theme: 'dark',
          fontSize: 14,
          tabSize: 2,
        },
      };
    },
    setPreferences: async () => {
      await delay(50);
      return { success: true };
    },
    onBeforeQuit: (): (() => void) => {
      return () => {};
    },
    confirmQuit: async () => {
      return { success: true };
    },
    removeRecentConnection: async (request?: { connectionId?: string }) => {
      await delay(50);
      if (request?.connectionId) {
        const idx = mockRecentConnections.findIndex(
          (c) => c.id === request.connectionId
        );
        if (idx !== -1) mockRecentConnections.splice(idx, 1);
      }
      return { success: true };
    },
  },
};
