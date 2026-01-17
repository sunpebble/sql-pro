# Qdrant Phase 2: Vector Search Design

## Overview

为 SQL Pro 的 Qdrant 支持添加向量搜索功能，包括搜索面板、Embedding 集成和 UMAP 可视化。

## 需求总结

- **搜索面板**：分屏布局，支持三种输入模式（文本、向量、相似项）
- **Embedding**：通用 Provider，支持任何 OpenAI 兼容 API
- **可视化**：混合模式，采样背景 + 搜索结果叠加
- **配置**：复用现有 AI 设置

---

## 架构设计

### 新增组件结构

```
apps/electron/src/renderer/src/
├── components/vector-search/
│   ├── VectorSearchPanel.tsx      # 主搜索面板（分屏上半部分）
│   ├── SearchInputSection.tsx     # 搜索输入区（三种模式切换）
│   ├── SearchResultsTable.tsx     # 搜索结果表格
│   ├── VectorVisualization.tsx    # UMAP 可视化组件
│   └── EmbeddingModelSelector.tsx # Embedding 模型选择器
├── hooks/
│   ├── useVectorSearch.ts         # 向量搜索逻辑
│   ├── useEmbedding.ts            # 文本转向量
│   └── useUMAP.ts                 # UMAP 降维计算
└── workers/
    └── umap.worker.ts             # Web Worker 执行降维
```

### 后端扩展

在 `qdrant-adapter.ts` 中添加：

- `vectorSearch()` - 执行向量相似度搜索
- `searchSimilar()` - 基于已有 point 搜索相似项
- `getPointsWithVectors()` - 获取带向量的 points（用于可视化）

---

## 向量搜索面板 UI

### 分屏布局

```
┌─────────────────────────────────────────────────────────────────┐
│  [数据]  [查询]  [向量搜索]                                       │
├─────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 搜索模式: [文本搜索 ▼]  Collection: [test_collection ▼]     │ │
│ │                                                             │ │
│ │ ┌─────────────────────────────────────────────────────────┐ │ │
│ │ │ 输入搜索文本...                                          │ │ │
│ │ └─────────────────────────────────────────────────────────┘ │ │
│ │                                                             │ │
│ │ Top K: [10]  相似度阈值: [0.7]  [+ 过滤条件]    [🔍 搜索]   │ │
│ └─────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│ ┌──────────────────────────┐  ┌──────────────────────────────┐ │
│ │ 搜索结果 (8 条)          │  │ 向量分布        [2D] [3D]   │ │
│ │ ┌────┬──────┬─────────┐ │  │                              │ │
│ │ │分数│ ID   │ Payload │ │  │      •    •  •     •         │ │
│ │ ├────┼──────┼─────────┤ │  │   •     ●  ●   •    •        │ │
│ │ │0.95│ p001 │ {...}   │ │  │     •    ●    •  •    •      │ │
│ │ │0.89│ p002 │ {...}   │ │  │   •          •       •       │ │
│ │ └────┴──────┴─────────┘ │  │        •      •  •           │ │
│ └──────────────────────────┘  └──────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 三种搜索模式

| 模式       | 输入          | 说明                                |
| ---------- | ------------- | ----------------------------------- |
| 文本搜索   | 文本框        | 调用 Embedding API 转为向量后搜索   |
| 向量输入   | JSON 编辑器   | 直接粘贴 `[0.1, 0.2, ...]` 向量数组 |
| 相似项搜索 | Point ID 输入 | 查找与指定 point 相似的其他 points  |

### 搜索参数

- **Top K**: 1-100，默认 10
- **相似度阈值**: 0-1，默认无阈值
- **过滤条件**: 复用现有 filter UI 组件

---

## Embedding 集成

### AI 设置扩展

在现有 `AIProviderSettings` 接口中添加 Embedding 配置：

```typescript
interface AIProviderSettings {
  // 现有字段 (chat/completion)
  provider: 'openai' | 'anthropic' | 'ollama' | 'custom';
  apiKey?: string;
  baseUrl?: string;
  model?: string;

  // 新增 Embedding 配置
  embedding?: {
    enabled: boolean;
    provider: 'openai' | 'ollama' | 'custom';
    model: string; // e.g., "text-embedding-3-small"
    baseUrl?: string; // 自定义 endpoint
    apiKey?: string; // 可单独配置，默认继承主 apiKey
    dimensions?: number; // 输出维度（部分模型支持）
  };
}
```

### Embedding API 调用

```typescript
// useEmbedding.ts
async function embed(text: string): Promise<number[]> {
  const { embedding } = getAISettings();

  // 调用 OpenAI 兼容 API
  const response = await fetch(`${embedding.baseUrl}/embeddings`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${embedding.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: embedding.model,
      input: text,
    }),
  });

  return response.data[0].embedding;
}
```

### 维度验证

搜索前自动检查：

- Embedding 输出维度是否与 Collection 向量维度匹配
- 不匹配时显示明确错误提示

---

## UMAP 可视化

### 数据获取策略（混合模式）

1. **背景采样**：首次打开时，随机获取最多 1000 个 points 的向量
2. **搜索叠加**：搜索完成后，将结果 points 添加到可视化中
3. **增量更新**：如果搜索结果包含新 points，动态添加到散点图

### 降维实现

```typescript
// useUMAP.ts
import { UMAP } from 'umap-js';

// 在 Web Worker 中执行，避免阻塞 UI
function computeUMAP(
  vectors: number[][],
  options: {
    nComponents: 2 | 3; // 2D 或 3D
    nNeighbors: 15; // 邻居数量
    minDist: 0.1; // 最小距离
  }
): number[][] {
  const umap = new UMAP(options);
  return umap.fit(vectors);
}
```

### 可视化组件

使用轻量级 Canvas 渲染：

| 功能      | 实现                           |
| --------- | ------------------------------ |
| 2D 散点图 | Canvas 2D API                  |
| 3D 散点图 | Three.js 或简化的 CSS 3D       |
| 悬停提示  | 显示 Point ID + Payload 摘要   |
| 点击选中  | 高亮 + 在结果表格中定位        |
| 颜色编码  | 搜索结果用强调色，背景点用灰色 |

### 性能优化

- UMAP 计算在 Web Worker 中执行
- 大于 1000 点时自动采样
- 结果缓存，避免重复计算
- 渐进式渲染，先显示框架再填充数据

---

## 后端 API 扩展

### QdrantAdapter 新增方法

```typescript
// qdrant-adapter.ts 新增

// 向量相似度搜索
async vectorSearch(
  connectionId: string,
  collection: string,
  params: {
    vector: number[];           // 查询向量
    limit: number;              // Top K
    scoreThreshold?: number;    // 最低分数
    filter?: QdrantFilter;      // Payload 过滤
    withPayload?: boolean;
    withVector?: boolean;
  }
): Promise<{
  success: true;
  results: Array<{
    id: string | number;
    score: number;
    payload: Record<string, unknown>;
    vector?: number[];
  }>;
} | { success: false; error: string }>

// 相似项搜索（基于已有 point）
async searchSimilar(
  connectionId: string,
  collection: string,
  pointId: string | number,
  limit: number,
  filter?: QdrantFilter
): Promise<...>

// 获取带向量的 points（用于可视化）
async getPointsWithVectors(
  connectionId: string,
  collection: string,
  options: {
    limit: number;              // 最多获取数量
    ids?: (string | number)[];  // 指定 IDs，为空则随机采样
  }
): Promise<{
  success: true;
  points: Array<{
    id: string | number;
    vector: number[];
    payload: Record<string, unknown>;
  }>;
} | { success: false; error: string }>
```

### IPC 通道注册

在 `main/ipc/` 中注册新的 IPC handlers：

```typescript
'db:vectorSearch'         -> vectorSearch()
'db:searchSimilar'        -> searchSimilar()
'db:getPointsWithVectors' -> getPointsWithVectors()
```

---

## 依赖

```json
{
  "umap-js": "^1.4.0"
}
```

---

## 实现阶段

| 阶段    | 内容                                                          | 预计任务数 |
| ------- | ------------------------------------------------------------- | ---------- |
| **2.1** | 后端 API（vectorSearch, searchSimilar, getPointsWithVectors） | 3          |
| **2.2** | 向量搜索面板 UI（分屏布局 + 三种输入模式）                    | 4          |
| **2.3** | Embedding 集成（AI 设置扩展 + useEmbedding hook）             | 3          |
| **2.4** | UMAP 可视化（Web Worker + Canvas 渲染）                       | 4          |
| **2.5** | 集成测试与优化                                                | 2          |

---

## 成功标准

- ✅ 可以输入文本，自动转换为向量并搜索
- ✅ 可以粘贴向量数组直接搜索
- ✅ 可以点击某个 point 搜索相似项
- ✅ 搜索结果以表格形式展示，包含相似度分数
- ✅ 可视化显示向量分布，搜索结果高亮
- ✅ 2D/3D 切换流畅，悬停显示详情
