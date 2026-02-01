## 1. 基础设施准备

- [x] 1.1 创建主进程新目录结构 (core/, database/, agent/, observability/, features/, ipc/)
- [x] 1.2 创建渲染进程新目录结构 (app/, features/, shared/)
- [x] 1.3 创建 packages/ipc-contracts 包并配置 package.json
- [x] 1.4 更新 tsconfig.json 添加 path aliases (@core/_, @database/_, @features/\*, etc.)
- [x] 1.5 更新 Nx 项目配置以识别新包

## 2. 可观测系统 (Observability)

- [x] 2.1 创建 observability/logger/index.ts 统一日志服务
- [x] 2.2 实现 ConsoleTransport 和 FileTransport
- [x] 2.3 创建 observability/memory/monitor.ts 内存监控服务
- [x] 2.4 创建 observability/metrics/trace.ts 性能追踪服务
- [x] 2.5 创建 observability/errors/boundary.ts 错误边界服务
- [x] 2.6 迁移现有 logger.ts 和 memory-monitor.ts 到新结构
- [x] 2.7 更新所有日志调用使用新 Logger 服务

## 3. IPC 系统

- [x] 3.1 创建 ipc/contracts/channels.ts 类型安全通道定义
- [x] 3.2 创建 ipc/base/handler.ts IPC 处理器基类
- [x] 3.3 创建 ipc/base/client.ts 渲染进程 IPC 客户端
- [x] 3.4 定义所有现有 IPC 通道的类型合约
- [x] 3.5 迁移 database.ts IPC 处理器到新基类
- [x] 3.6 迁移 schema.ts IPC 处理器到新基类
- [x] 3.7 迁移 history.ts IPC 处理器到新基类
- [x] 3.8 迁移剩余 18 个 IPC 处理器到新基类
- [x] 3.9 更新 preload/index.ts 使用新通道定义
- [x] 3.10 验证所有 IPC 调用类型安全

## 4. 核心系统 (Core)

- [x] 4.1 创建 core/lifecycle/index.ts 应用生命周期管理
- [x] 4.2 迁移 window-manager.ts 到 core/window/
- [x] 4.3 迁移 window-state.ts 到 core/window/
- [x] 4.4 迁移 menu.ts 到 core/menu/
- [x] 4.5 迁移 store.ts 到 core/store/
- [x] 4.6 迁移 renderer-store.ts 到 core/store/
- [x] 4.7 更新 index.ts 入口文件使用新核心系统
- [x] 4.8 验证应用启动和关闭流程

## 5. 数据库系统 (Database)

- [x] 5.1 创建 database/adapters/interface.ts 统一适配器接口
- [x] 5.2 创建 database/pool/manager.ts 连接池管理器
- [x] 5.3 创建 database/query/engine.ts 查询执行引擎
- [x] 5.4 创建 database/schema/introspector.ts Schema 内省服务
- [x] 5.5 迁移 sqlite-adapter.ts 到 database/adapters/
- [x] 5.6 迁移 postgresql-adapter.ts 到 database/adapters/
- [x] 5.7 迁移 mysql-adapter.ts 到 database/adapters/
- [x] 5.8 迁移 turso-adapter.ts 到 database/adapters/
- [x] 5.9 迁移 qdrant-adapter.ts 到 database/adapters/
- [x] 5.10 迁移 database-manager.ts 到 database/
- [x] 5.11 迁移 schema-comparison.ts 到 database/schema/
- [x] 5.12 更新所有数据库相关 IPC 使用新结构

## 6. Agent 系统

- [x] 6.1 创建 agent/models/registry.ts 模型注册表
- [x] 6.2 创建 agent/tools/registry.ts 工具注册表
- [x] 6.3 迁移 model.ts 到 agent/models/
- [x] 6.4 迁移 prompts/ 目录到 agent/prompts/
- [x] 6.5 迁移 tools/ 目录到 agent/tools/
- [x] 6.6 迁移 chat-handler.ts 到 agent/handlers/
- [x] 6.7 迁移 nl-query-handler.ts 到 agent/handlers/
- [x] 6.8 迁移 settings-store.ts 和 history-store.ts 到 agent/
- [x] 6.9 更新 Agent IPC 处理器使用新结构

## 7. 功能模块 (Features) - 主进程

- [x] 7.1 创建 features/backup/ 并迁移备份相关代码
- [x] 7.2 创建 features/export/ 并迁移导出相关代码
- [x] 7.3 创建 features/import/ 并迁移导入相关代码
- [x] 7.4 创建 features/ssh/ 并迁移 SSH 隧道相关代码
- [x] 7.5 创建 features/plugin/ 并迁移插件系统代码
- [x] 7.6 更新各功能模块的 IPC 处理器

## 8. 渲染进程 App Shell

- [x] 8.1 创建 app/routes/ 并迁移路由定义
- [x] 8.2 创建 app/providers/ 并提取全局 Providers
- [x] 8.3 创建 app/layouts/ 并迁移布局组件
- [x] 8.4 更新 main.tsx 使用新 App Shell 结构

## 9. 渲染进程 Shared 层

- [x] 9.1 创建 shared/components/ 并迁移通用组件 (ErrorBoundary, ResizablePanel, etc.)
- [x] 9.2 创建 shared/hooks/ 并迁移通用 hooks (useDebounce, useCopyToClipboard, etc.)
- [x] 9.3 创建 shared/lib/ 并迁移工具函数
- [x] 9.4 创建 shared/stores/settings-store.ts 合并 theme-store 和 settings-store
- [x] 9.5 创建桶文件 (index.ts) 导出所有共享模块

## 10. 渲染进程功能模块 - Query

- [x] 10.1 创建 features/query/components/ 并迁移 QueryView, QueryResults, MonacoSqlEditor
- [x] 10.2 创建 features/query/hooks/ 并迁移 query 相关 hooks
- [x] 10.3 创建 features/query/stores/query-store.ts 合并 5 个 query stores
- [x] 10.4 更新所有 query 功能的导入路径

## 11. 渲染进程功能模块 - Table

- [x] 11.1 创建 features/table/components/ 并迁移 data-table/ 目录
- [x] 11.2 创建 features/table/hooks/ 并迁移 table 相关 hooks
- [x] 11.3 创建 features/table/stores/table-store.ts 合并 3 个 table stores
- [x] 11.4 更新所有 table 功能的导入路径

## 12. 渲染进程功能模块 - Database

- [x] 12.1 创建 features/database/components/ 并迁移连接相关组件
- [x] 12.2 创建 features/database/hooks/ 并迁移 useDatabase 等
- [x] 12.3 创建 features/database/stores/connection-store.ts 合并连接 stores
- [x] 12.4 更新所有 database 功能的导入路径

## 13. 渲染进程功能模块 - 其他

- [x] 13.1 创建 features/diagram/ 并迁移 er-diagram/ 和 query-builder/
- [x] 13.2 创建 features/ai/ 并迁移 AI 聊天相关组件和 hooks
- [x] 13.3 创建 features/backup/ 并迁移备份相关渲染进程代码
- [x] 13.4 创建 features/export/ 并迁移导出相关渲染进程代码
- [x] 13.5 创建 features/settings/ 并迁移设置对话框等
- [x] 13.6 创建 features/onboarding/ 并迁移新手引导组件
- [x] 13.7 创建 features/vector-search/ 并迁移向量搜索组件
- [x] 13.8 创建 features/image-gallery/ 并迁移图片库组件
- [x] 13.9 创建 features/schema-comparison/ 并迁移 Schema 比较组件

## 14. 清理和验证

- [x] 14.1 删除旧目录结构中的空文件夹
- [x] 14.2 更新所有剩余的导入路径
- [x] 14.3 运行 TypeScript 编译验证无类型错误
- [ ] 14.4 运行所有测试确保无回归
- [ ] 14.5 运行应用进行端到端验证
- [ ] 14.6 更新开发文档反映新目录结构
