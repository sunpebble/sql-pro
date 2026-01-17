# Qdrant Vector Database Support Design

## Overview

为 SQL Pro 添加 Qdrant 向量数据库支持，采用完全集成适配器方案，将 Qdrant 作为新的数据库类型集成到现有架构中。

## 目标

- 支持 Qdrant 向量数据库的完整 CRUD 操作
- 提供向量搜索专属面板，支持多种输入方式
- 实现向量数据 2D/3D 可视化
- 支持 Collection 管理、索引管理、快照管理等高级功能

---

## 架构设计

### 新增组件

```
apps/electron/src/
├── main/services/database-adapters/
│   └── qdrant-adapter.ts          # Qdrant 适配器实现
├── renderer/src/
│   ├── components/
│   │   └── vector-search/         # 向量搜索专属组件
│   │       ├── VectorSearchPanel.tsx
│   │       ├── VectorVisualization.tsx
│   │       └── EmbeddingInput.tsx
│   └── hooks/
│       └── useVectorSearch.ts     # 向量搜索 hook
└── shared/types/
    └── vector.ts                  # 向量数据库类型定义
```

### 概念映射

| Qdrant 概念 | SQL Pro 映射       |
| ----------- | ------------------ |
| Collection  | 表 (Table)         |
| Point       | 行 (Row)           |
| Payload     | 列数据             |
| Vector      | 特殊 `__vector` 列 |
| Point ID    | `__rowId`          |

### 连接配置

`DatabaseType` 新增 `'qdrant'`，连接配置包含：

```typescript
interface QdrantConnectionConfig {
  type: 'qdrant';
  host: string; // Qdrant 服务地址
  port: number; // gRPC/REST 端口 (默认 6333)
  apiKey?: string; // 可选的 API 密钥
  useTLS?: boolean; // 是否使用 HTTPS
}
```

---

## QdrantAdapter 实现

### 接口适配

```typescript
class QdrantAdapter implements DatabaseAdapter {
  // 连接管理
  open(config)      → 创建 QdrantClient 实例
  close(id)         → 断开连接
  testConnection()  → client.healthCheck()

  // Schema 查询
  getSchema()       → 返回 collections 列表作为 "tables"
  getTableStructure() → 返回 collection info + payload schema

  // 数据查询
  getTableData()    → client.scroll() 分页获取 points
  query()           → 执行向量搜索或 payload 过滤

  // 数据修改
  applyChanges()    → upsert/delete points
}
```

### Qdrant 客户端

使用官方 `@qdrant/js-client-rest` 包：

- 纯 JavaScript，无原生依赖
- 支持所有 Qdrant REST API
- TypeScript 类型完整

### 特殊处理

- **向量列**：不在表格中直接显示完整向量，显示为 `[384 dims]` 摘要
- **Payload 动态 schema**：首次加载时从 points 采样推断 payload 结构
- **Point ID 类型**：支持 UUID 和整数两种格式

---

## 向量搜索面板

### UI 布局

向量搜索作为新的 Tab 类型，与 "数据" 和 "查询" 并列：

```
┌─────────────────────────────────────────────────────┐
│  [数据]  [查询]  [向量搜索]                           │
├─────────────────────────────────────────────────────┤
│ ┌─────────────────┐  ┌────────────────────────────┐ │
│ │ 搜索输入        │  │ 搜索结果                    │ │
│ │                 │  │                            │ │
│ │ ○ 文本搜索      │  │ ┌────┬────────┬─────────┐  │ │
│ │ ○ 向量输入      │  │ │相似度│ ID    │ Payload │  │ │
│ │ ○ 相似项搜索    │  │ ├────┼────────┼─────────┤  │ │
│ │                 │  │ │0.95│ abc123 │ {...}   │  │ │
│ │ [Collection ▼]  │  │ │0.89│ def456 │ {...}   │  │ │
│ │ Top K: [10]     │  │ └────┴────────┴─────────┘  │ │
│ │                 │  │                            │ │
│ │ [搜索]          │  │                            │ │
│ └─────────────────┘  └────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### 三种输入模式

1. **文本搜索**：文本框 + Embedding 模型选择器（复用现有 AI 设置）
2. **向量输入**：JSON 编辑器，支持粘贴向量数组
3. **相似项搜索**：Point ID 输入或从结果中选择

### 搜索参数

- `limit`：返回结果数量（1-100）
- `score_threshold`：最低相似度阈值
- `filter`：Payload 过滤条件（复用现有过滤器 UI）
- `with_payload` / `with_vector`：返回内容控制

---

## 向量可视化

### 降维算法

使用 **UMAP** 作为主要降维方法：

- 比 t-SNE 更快，适合交互式使用
- 更好地保留全局结构
- 使用 `umap-js` 纯 JavaScript 实现，无原生依赖

### 可视化组件

```
┌──────────────────────────────────────────┐
│  向量分布 (UMAP 2D)          [2D] [3D]  │
├──────────────────────────────────────────┤
│                    •                     │
│         •    •  •     •                  │
│      •     •  ●搜索结果  •   •           │
│        •    •    •  •      •             │
│     •          •       •                 │
│           •      •  •                    │
│                                          │
│  图例: ● 搜索结果  • 其他 Points         │
└──────────────────────────────────────────┘
```

### 交互功能

- **悬停**：显示 Point ID 和 Payload 摘要
- **点击**：选中并在表格中定位
- **框选**：批量选择多个 Points
- **颜色编码**：按 Payload 字段值着色（可选）

### 性能考虑

- 默认采样 1000 个 Points 进行可视化
- 降维计算在 Web Worker 中进行，避免阻塞 UI
- 支持渐进式加载，先显示采样结果

---

## Collection 管理与高级功能

### Collection 管理

在侧边栏右键菜单和工具栏中添加：

| 操作            | 说明                                   |
| --------------- | -------------------------------------- |
| 创建 Collection | 向导式配置：向量维度、距离度量、分片数 |
| 删除 Collection | 确认对话框，显示 Points 数量           |
| Collection 信息 | 显示配置、Points 数、索引状态          |
| 重命名          | 调用 `update_collection_aliases`       |

### Payload 索引管理

新增 "索引" Tab 在 Collection 详情中：

```
┌─────────────────────────────────────────┐
│ Payload 索引                    [+ 新建] │
├──────────────┬──────────┬───────────────┤
│ 字段名       │ 类型     │ 操作          │
├──────────────┼──────────┼───────────────┤
│ category     │ keyword  │ [删除]        │
│ price        │ float    │ [删除]        │
│ tags         │ keyword[]│ [删除]        │
└──────────────┴──────────┴───────────────┘
```

### 快照管理

在 Collection 右键菜单中：

- **创建快照**：生成 .snapshot 文件
- **恢复快照**：从文件恢复
- **下载快照**：导出到本地

### Collection 配置

支持修改：

- `replication_factor`
- `write_consistency_factor`
- `on_disk_payload`
- HNSW 参数（m, ef_construct）

---

## Points CRUD 操作

### 表格视图中的操作

复用现有数据表格的交互模式：

| 操作 | 实现                                              |
| ---- | ------------------------------------------------- |
| 查看 | 分页滚动加载，双击展开完整 Payload                |
| 新增 | 工具栏 "+" 按钮，弹出表单填写 ID、Vector、Payload |
| 编辑 | 双击单元格编辑 Payload 字段（向量不可直接编辑）   |
| 删除 | 选中行后按 Delete 或右键删除                      |
| 批量 | 复用现有的批量操作和 Diff 预览                    |

### 新增 Point 表单

```
┌─────────────────────────────────────────┐
│ 新增 Point                              │
├─────────────────────────────────────────┤
│ ID (可选):  [________________] [自动生成] │
│                                         │
│ Vector:                                 │
│ ○ 粘贴向量  ○ 从文本生成                  │
│ ┌─────────────────────────────────────┐ │
│ │ [0.1, 0.2, 0.3, ...]               │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Payload (JSON):                         │
│ ┌─────────────────────────────────────┐ │
│ │ {                                   │ │
│ │   "title": "...",                   │ │
│ │   "category": "..."                 │ │
│ │ }                                   │ │
│ └─────────────────────────────────────┘ │
│                                         │
│              [取消]  [创建]              │
└─────────────────────────────────────────┘
```

### Diff 预览

复用现有的 `DataDiffPanel`：

- 显示待修改/删除的 Points
- Payload 变更高亮显示
- 支持撤销单个变更

### 批量导入

支持从 JSON/JSONL 文件批量导入 Points：

- 自动检测向量维度
- 验证与 Collection 配置匹配
- 进度条显示导入状态

---

## Embedding 集成

### 复用现有 AI 设置

扩展 AI Provider 配置支持 Embedding：

```typescript
interface AIProviderSettings {
  // 现有字段...
  embedding?: {
    enabled: boolean;
    model: string; // 如 "text-embedding-3-small"
  };
}
```

### 支持的 Embedding 提供商

| 提供商 | 模型                      | 维度   |
| ------ | ------------------------- | ------ |
| OpenAI | text-embedding-3-small    | 1536   |
| OpenAI | text-embedding-3-large    | 3072   |
| Custom | 用户自定义 API            | 可配置 |
| 本地   | Ollama (nomic-embed-text) | 768    |

### 维度匹配验证

在向量搜索/插入时自动检查：

- Embedding 模型输出维度
- Collection 配置的向量维度
- 不匹配时显示明确错误提示

---

## 实现阶段

### 第一阶段：核心功能（MVP）

1. `QdrantAdapter` 基础实现（连接、断开、测试连接）
2. Collection 列表和基本信息展示
3. Points 表格视图（分页、Payload 展示）
4. 基础向量搜索面板（直接向量输入）
5. Points CRUD 操作

### 第二阶段：搜索增强

1. 文本搜索 + Embedding 集成
2. 相似项搜索（从现有 Point 选择）
3. Payload 过滤器
4. 搜索历史记录

### 第三阶段：可视化与管理

1. UMAP 降维可视化
2. Collection 创建/删除向导
3. Payload 索引管理
4. 快照管理

### 第四阶段：高级功能

1. 批量导入/导出
2. 3D 可视化
3. Collection 配置修改
4. 多向量支持（Named Vectors）

---

## 技术依赖

```json
{
  "@qdrant/js-client-rest": "^1.x",
  "umap-js": "^1.x"
}
```

---

## 参考资料

- [Qdrant Documentation](https://qdrant.tech/documentation/)
- [Qdrant JS Client](https://github.com/qdrant/qdrant-js)
- [UMAP Algorithm](https://umap-learn.readthedocs.io/)
