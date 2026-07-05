## Context

Quarry 是一个跨平台数据库管理应用，采用 Electron + React + TypeScript 技术栈。当前代码库存在以下问题：

**现状：**

- 主进程：21个分散的 IPC 处理器、6个数据库适配器、AI Agent 服务、SSH 隧道、插件系统
- 渲染进程：36个 Zustand stores、40+ hooks、100+ 扁平组件
- 共享层：类型定义分散在多处，IPC 通道缺乏类型安全

**约束：**

- 必须保持向后兼容（用户数据、配置）
- 不能中断现有功能
- 需要渐进式迁移，避免大爆炸式重构

## Goals / Non-Goals

**Goals:**

- 按系统边界重组代码，提升可维护性
- 建立清晰的模块依赖关系
- 统一错误处理和日志记录
- 提供端到端类型安全的 IPC 通信
- 支持功能模块的独立开发和测试

**Non-Goals:**

- 不更改现有功能行为
- 不引入新的外部依赖（除必要的类型工具）
- 不重写核心业务逻辑
- 不更改用户界面设计

## Decisions

### Decision 1: 主进程采用分层系统架构

**选择：** 按系统边界分层组织代码

```
src/main/
├── core/           # 核心系统 - 应用生命周期
│   ├── window/     # 窗口管理
│   ├── menu/       # 菜单系统
│   ├── store/      # 持久化存储
│   └── lifecycle/  # 应用生命周期
├── database/       # 数据库系统
│   ├── adapters/   # 数据库适配器
│   ├── query/      # 查询执行引擎
│   ├── schema/     # Schema 管理
│   └── pool/       # 连接池
├── agent/          # Agent 系统
│   ├── models/     # 模型配置
│   ├── tools/      # Agent 工具
│   ├── prompts/    # 提示词模板
│   └── handlers/   # 聊天处理器
├── observability/  # 可观测系统
│   ├── logger/     # 统一日志
│   ├── metrics/    # 性能指标
│   ├── memory/     # 内存监控
│   └── errors/     # 错误追踪
├── features/       # 功能模块
│   ├── backup/
│   ├── export/
│   ├── import/
│   ├── ssh/
│   └── plugin/
└── ipc/            # IPC 层
    ├── base/       # 处理器基类
    ├── handlers/   # 具体处理器
    └── contracts/  # 类型定义
```

**理由：**

- 每个系统有明确边界和职责
- 依赖方向清晰：features → database/agent → core
- 便于独立测试和维护

**备选方案：**

- Feature-first 组织：按功能而非系统分层 → 拒绝，因为会导致重复代码
- 保持现状 + 添加抽象层 → 拒绝，因为不解决根本问题

### Decision 2: 渲染进程采用 Feature-based 架构

**选择：** 每个功能模块包含自己的 components/hooks/stores

```
src/renderer/src/
├── app/                    # 应用壳
│   ├── routes/             # 路由定义
│   ├── providers/          # 全局 providers
│   └── layouts/            # 布局组件
├── features/               # 功能模块
│   ├── database/           # 数据库管理
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── stores/
│   │   └── index.ts
│   ├── query/              # 查询功能
│   ├── table/              # 表格视图
│   ├── diagram/            # ER 图
│   ├── ai/                 # AI 功能
│   ├── backup/             # 备份功能
│   ├── export/             # 导出功能
│   ├── settings/           # 设置
│   └── onboarding/         # 新手引导
└── shared/                 # 共享代码
    ├── components/         # 共享组件
    ├── hooks/              # 共享 hooks
    ├── lib/                # 工具函数
    └── stores/             # 全局 stores
```

**理由：**

- 功能模块高内聚、低耦合
- 便于按需加载和代码分割
- 新功能开发只需创建新目录

**备选方案：**

- 按技术类型分层 (components/hooks/stores) → 拒绝，这是现状的问题所在
- Domain-Driven Design → 过度设计，项目规模不需要

### Decision 3: 统一 IPC 通信层

**选择：** 创建类型安全的 IPC 抽象层

```typescript
// packages/ipc-contracts/src/channels.ts
export const channels = {
  database: {
    connect: channel<ConnectInput, ConnectOutput>('database:connect'),
    query: channel<QueryInput, QueryOutput>('database:query'),
    disconnect: channel<DisconnectInput, void>('database:disconnect'),
  },
  // ...
} as const;

// 主进程使用
class DatabaseHandler extends IpcHandler {
  register() {
    this.handle(channels.database.connect, async (input) => {
      // 类型安全的输入输出
    });
  }
}

// 渲染进程使用
const result = await ipc.invoke(channels.database.connect, { ... });
```

**理由：**

- 编译时类型检查，避免运行时错误
- 集中管理所有 IPC 通道
- 便于生成文档和测试

**备选方案：**

- Electron Trpc → 引入额外依赖，学习成本高
- 保持字符串常量 → 无类型安全

### Decision 4: 统一可观测性系统

**选择：** 创建统一的 Logger 和 Metrics 服务

```typescript
// observability/logger/index.ts
export const logger = createLogger({
  namespace: 'quarry',
  transports: [consoleTransport, fileTransport],
});

// 使用
logger.info('database.connect', { adapter: 'postgresql', host });
logger.error('query.failed', { error, query });
```

**理由：**

- 统一日志格式便于分析
- 可配置的传输层（控制台、文件、远程）
- 支持结构化日志

### Decision 5: Store 合并策略

**选择：** 合并相关 stores，减少到 15-20 个

| 当前 Stores                                                                                                         | 合并后                                         |
| ------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| query-store, query-tabs-store, query-history-store, query-builder-store, query-templates-store, saved-queries-store | `features/query/stores/query-store.ts`         |
| table-data-store, table-organization-store, data-tabs-store                                                         | `features/table/stores/table-store.ts`         |
| connection-store, connection-switcher-store                                                                         | `features/database/stores/connection-store.ts` |
| theme-store, settings-store, preferences                                                                            | `shared/stores/settings-store.ts`              |

**理由：**

- 减少 store 数量降低复杂度
- 相关状态放在一起便于管理
- 使用 Zustand slices 保持模块化

## Risks / Trade-offs

### Risk 1: 迁移期间功能回归

**风险级别：** 高
**影响：** 用户功能中断
**缓解措施：**

- 渐进式迁移，一次一个系统
- 保持旧代码可用，通过 re-export 维持兼容
- 每个迁移步骤都有完整测试覆盖
- 建立回滚计划

### Risk 2: 导入路径变更导致构建失败

**风险级别：** 中
**影响：** 开发效率下降
**缓解措施：**

- 使用 TypeScript path aliases
- 创建迁移脚本自动更新导入
- 桶文件 (index.ts) 保持向后兼容

### Risk 3: 团队学习曲线

**风险级别：** 低
**影响：** 短期开发效率下降
**缓解措施：**

- 详细的架构文档
- 代码示例和模板
- 渐进式采用新模式

## Migration Plan

### Phase 1: 基础设施准备 (Week 1)

1. 创建新目录结构（空目录）
2. 配置 TypeScript path aliases
3. 创建 IPC 基类和类型定义
4. 创建 Logger 服务

### Phase 2: 主进程核心系统 (Week 2)

1. 迁移 window-manager → core/window
2. 迁移 menu → core/menu
3. 迁移 store → core/store
4. 更新 index.ts 导入

### Phase 3: 数据库系统 (Week 2-3)

1. 迁移 database-adapters → database/adapters
2. 创建查询执行引擎
3. 迁移 IPC 处理器到新基类

### Phase 4: 渲染进程功能模块 (Week 3-4)

1. 创建 features/ 目录结构
2. 迁移 query 相关代码
3. 迁移 table 相关代码
4. 合并 stores

### Phase 5: 清理和优化 (Week 5)

1. 删除旧目录
2. 更新文档
3. 性能测试

### Rollback Strategy

- 每个 Phase 是独立的 Git 分支
- 保留旧代码路径直到下一 Phase 完成
- 出现严重问题时可以 revert 单个 Phase
