# Turso 数据库支持设计文档

> 创建日期: 2026-01-18

## 概述

为 SQL Pro 添加 Turso 边缘数据库的支持，使用户能够连接和管理托管在 Turso Cloud 上的数据库。

## 需求决策

| 项目       | 决策                                     |
| ---------- | ---------------------------------------- |
| 连接方式   | 仅远程 Turso Cloud                       |
| 功能范围   | 完整功能（查询 + 数据编辑 + 表结构管理） |
| Token 存储 | 使用现有 safeStorage 加密机制            |
| 高级功能   | 支持多数据库 + 分支管理                  |
| 认证方式   | 统一 Token（Platform API + 数据库）      |

## 架构设计

### 核心组件

```
┌─────────────────────────────────────────────────────────┐
│                    Turso 支持架构                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────┐     ┌─────────────────────────┐   │
│  │  TursoAdapter   │────▶│  @libsql/client         │   │
│  │  (数据库操作)    │     │  (SQL 查询/执行)         │   │
│  └─────────────────┘     └─────────────────────────┘   │
│           │                                             │
│           │ 共享 Token                                  │
│           ▼                                             │
│  ┌─────────────────┐     ┌─────────────────────────┐   │
│  │ TursoPlatformAPI│────▶│  Turso Platform API     │   │
│  │ (组织/数据库管理) │     │  (REST API)             │   │
│  └─────────────────┘     └─────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 职责划分

- **TursoAdapter** - 实现 `DatabaseAdapter` 接口，负责 SQL 查询执行、schema 读取、数据操作
- **TursoPlatformService** - 封装 Platform API 调用，负责列出数据库、获取分支、切换数据库

### 依赖项

- `@libsql/client` - Turso 官方 TypeScript 客户端，用于数据库操作
- 无需额外 HTTP 库，使用 Node.js 内置 `fetch` 调用 Platform API

## 数据模型

### 类型定义

```typescript
// 在 DatabaseType 枚举中添加
type DatabaseType =
  | 'sqlite'
  | 'mysql'
  | 'postgres'
  | 'supabase'
  | 'qdrant'
  | 'turso';

// Turso 连接配置
interface TursoConnectionConfig {
  type: 'turso';
  name: string; // 连接名称（用户自定义）
  organizationSlug: string; // Turso 组织标识
  authToken: string; // 统一认证 Token

  // 当前选中的数据库和分支
  selectedDatabase?: string; // 数据库名称
  selectedBranch?: string; // 分支名称（默认 'main'）
}

// Platform API 返回的数据库信息
interface TursoDatabase {
  name: string;
  hostname: string; // 如: xxx.turso.io
  primaryRegion: string;
  regions: string[];
  group: string;
}

// 分支信息
interface TursoBranch {
  name: string;
  createdAt: string;
}
```

### 连接 URL 生成规则

```typescript
// 数据库 URL 格式
`libsql://${databaseName}-${organizationSlug}.turso.io`
// 分支 URL 格式（非 main 分支）
`libsql://${databaseName}-${branchName}-${organizationSlug}.turso.io`;
```

### 存储策略

- `organizationSlug` 和 `selectedDatabase` 存储在连接配置中（明文）
- `authToken` 使用现有 `passwordStorageService` 加密存储
- 连接标识符使用 `turso:${organizationSlug}` 作为 key

## TursoAdapter 实现

### 接口实现

```typescript
class TursoAdapter implements DatabaseAdapter {
  private client: Client | null = null;
  private platformService: TursoPlatformService;

  // 连接管理
  async open(config: TursoConnectionConfig): Promise<void>;
  async close(): Promise<void>;
  async testConnection(): Promise<boolean>;

  // 查询执行（核心功能）
  async queryAsync(sql: string): Promise<QueryResult>;
  async executeAsync(sql: string): Promise<ExecuteResult>;

  // Schema 读取（复用 SQLite 的 PRAGMA 语法）
  async getSchemaAsync(): Promise<DatabaseSchema>;
  async getTableInfoAsync(table: string): Promise<TableInfo>;
  async getIndexesAsync(table: string): Promise<IndexInfo[]>;

  // 数据编辑
  async insertRowAsync(
    table: string,
    data: Record<string, unknown>
  ): Promise<void>;
  async updateRowAsync(
    table: string,
    key: RowKey,
    data: Record<string, unknown>
  ): Promise<void>;
  async deleteRowAsync(table: string, key: RowKey): Promise<void>;

  // 表结构管理
  async createTableAsync(definition: TableDefinition): Promise<void>;
  async alterTableAsync(
    table: string,
    changes: AlterTableChanges
  ): Promise<void>;
  async dropTableAsync(table: string): Promise<void>;

  // Turso 特有功能
  async listDatabases(): Promise<TursoDatabase[]>;
  async listBranches(database: string): Promise<TursoBranch[]>;
  async switchDatabase(database: string, branch?: string): Promise<void>;
}
```

### Schema 查询复用

由于 Turso 基于 libSQL（SQLite 分叉），可以直接复用 SQLite 的元数据查询：

```sql
-- 获取表列表
SELECT name FROM sqlite_master WHERE type='table'

-- 获取表结构
PRAGMA table_info('table_name')

-- 获取索引
PRAGMA index_list('table_name')
```

## TursoPlatformService

### Platform API 封装

```typescript
class TursoPlatformService {
  private baseUrl = 'https://api.turso.tech/v1';
  private authToken: string;

  constructor(authToken: string) {
    this.authToken = authToken;
  }

  // 组织相关
  async listOrganizations(): Promise<Organization[]>;

  // 数据库管理
  async listDatabases(orgSlug: string): Promise<TursoDatabase[]>;
  async getDatabase(orgSlug: string, dbName: string): Promise<TursoDatabase>;
  async createDatabaseToken(orgSlug: string, dbName: string): Promise<string>;

  // 分支管理
  async listBranches(orgSlug: string, dbName: string): Promise<TursoBranch[]>;
  async createBranch(
    orgSlug: string,
    dbName: string,
    branchName: string
  ): Promise<TursoBranch>;
  async deleteBranch(
    orgSlug: string,
    dbName: string,
    branchName: string
  ): Promise<void>;
}
```

### API 端点映射

| 功能           | HTTP 方法 | 端点                                                    |
| -------------- | --------- | ------------------------------------------------------- |
| 列出数据库     | GET       | `/organizations/{org}/databases`                        |
| 获取数据库详情 | GET       | `/organizations/{org}/databases/{db}`                   |
| 列出分支       | GET       | `/organizations/{org}/databases/{db}/branches`          |
| 创建分支       | POST      | `/organizations/{org}/databases/{db}/branches`          |
| 删除分支       | DELETE    | `/organizations/{org}/databases/{db}/branches/{branch}` |

### 错误处理

```typescript
class TursoApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string, // 如: 'unauthorized', 'not_found'
    message: string
  ) {
    super(message);
  }
}
```

常见错误码映射：

- `401` → Token 无效或过期
- `403` → 权限不足
- `404` → 数据库/分支不存在
- `429` → 请求频率限制

## UI 界面

### 连接配置对话框

在 `ServerConnectionDialog` 中新增 Turso 类型的配置表单：

```
┌─────────────────────────────────────────────────────────┐
│  新建 Turso 连接                                    [X] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  连接名称:  [________________________]                  │
│                                                         │
│  Organization Slug:  [________________]                 │
│  (在 Turso Dashboard 中可找到)                          │
│                                                         │
│  Auth Token:  [________________________] 👁              │
│  (需要具有 Platform API 权限的 Token)                   │
│                                                         │
│  ☑ 记住 Token                                          │
│                                                         │
│         [测试连接]              [取消]  [保存]          │
└─────────────────────────────────────────────────────────┘
```

### 数据库/分支选择器

连接成功后，在侧边栏或工具栏显示数据库和分支选择器：

```
┌──────────────────────────────────┐
│ 📦 my-turso-connection           │
├──────────────────────────────────┤
│ 数据库: [production-db    ▼]     │
│ 分支:   [main             ▼]     │
├──────────────────────────────────┤
│ 📋 Tables                        │
│   ├─ users                       │
│   ├─ orders                      │
│   └─ products                    │
└──────────────────────────────────┘
```

### 组件改动清单

| 文件                             | 改动                        |
| -------------------------------- | --------------------------- |
| `DatabaseTypeSelector.tsx`       | 添加 Turso 选项和图标       |
| `ServerConnectionDialog.tsx`     | 添加 Turso 连接表单         |
| `ConnectionSidebar.tsx` (或类似) | 添加数据库/分支选择器       |
| `locales/*/`                     | 添加 Turso 相关的多语言文案 |

## 文件结构

### 新增/修改的文件

```
apps/electron/
├── src/
│   ├── main/services/
│   │   └── database-adapters/
│   │       ├── turso-adapter.ts          # 新增：数据库适配器
│   │       ├── turso-platform.ts         # 新增：Platform API 服务
│   │       ├── database-manager.ts       # 修改：注册 Turso 适配器
│   │       └── types.ts                  # 修改：添加 Turso 相关类型
│   │
│   ├── shared/
│   │   └── types.ts                      # 修改：添加 DatabaseType、连接配置类型
│   │
│   └── renderer/src/
│       ├── components/
│       │   ├── DatabaseTypeSelector.tsx  # 修改：添加 Turso 选项
│       │   ├── ServerConnectionDialog.tsx# 修改：添加 Turso 表单
│       │   └── turso/
│       │       └── TursoDatabaseSelector.tsx  # 新增：数据库/分支选择器
│       │
│       └── locales/
│           ├── en/*.json                 # 修改：英文文案
│           └── zh/*.json                 # 修改：中文文案

package.json                              # 修改：添加 @libsql/client 依赖
```

### 实现顺序

1. **基础设施** - 添加类型定义、安装依赖
2. **后端核心** - 实现 TursoPlatformService 和 TursoAdapter
3. **后端集成** - 在 DatabaseManager 中注册适配器，添加 IPC handlers
4. **前端 UI** - 实现连接配置表单和数据库选择器
5. **多语言** - 添加国际化文案
6. **测试验证** - 端到端测试连接、查询、数据编辑功能

## 技术风险与缓解

| 风险               | 缓解措施                                   |
| ------------------ | ------------------------------------------ |
| Platform API 变更  | 封装在独立服务层，便于适配                 |
| Token 权限不足     | 在连接测试时验证所需权限，给出明确错误提示 |
| 分支切换时连接状态 | 切换时重新创建 libsql client 实例          |
| 网络延迟影响体验   | 使用 loading 状态，考虑添加结果缓存        |

## 不在本次范围内

- 本地嵌入式 libSQL 支持
- Embedded Replicas（嵌入式副本同步）
- 数据库创建/删除（通过 Platform API）
- 分支创建/删除（仅查看和切换）
