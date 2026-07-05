# Electron → SwiftUI 迁移记录

2026-07：Electron 版（apps/electron）、其浏览器壳（apps/webapp）与专属包
（packages/ui、packages/ipc-contracts）已从仓库移除，macOS 原生 SwiftUI 版为唯一应用。

## 本次迁移补齐的功能

| 功能                    | 实现                                                                                      |
| ----------------------- | ----------------------------------------------------------------------------------------- |
| 数据比较 + 同步 SQL     | `QuarryCore/DataDiff.swift`（主键匹配行 diff、INSERT/UPDATE/DELETE 生成），Compare 工作区 |
| 跨会话 Schema 比较      | `SchemaSnapshot.capture` 泛化到任意 `DatabaseEngine`，Compare 工作区 Schema 页签          |
| SQL 导出（INSERT dump） | `QuarryCore/SQLExporter.swift`，File → Export SQL…                                        |
| SQL 执行日志            | `QuarryCore/SqlLog.swift` + SQL 工作区 Log 面板                                           |
| 列分布统计              | `DatabaseEngine.columnDistribution`（各引擎方言 quoting），表工作区 Column Stats          |
| Keychain 密码存储       | `QuarryCore/KeychainPasswordStore.swift`，连接成功后保存、重连免输入                      |
| Pro 许可证              | `QuarryCore/LicenseClient.swift`（激活/验证/停用/portal，7 天离线宽限），设置页           |

迁移前已有：SQLite(+SQLCipher)/PostgreSQL/MySQL 引擎、SSH 隧道、多会话、表浏览
（筛选/排序/分页/行内编辑/待定更改/批量编辑）、SQL 查询 + EXPLAIN、查询库、全库搜索、
ER 图、维护工具、Schema 快照 + 迁移 SQL、备份/恢复、CSV/JSON 导入导出、
Mock 数据、演示库、中英文本地化。

## 有意不迁移（及原因）

- **MongoDB / Redis / ClickHouse / SQL Server / Qdrant / Turso 适配器** — 各需重量级驱动或私有协议实现；SwiftUI 版聚焦 SQLite/PG/MySQL。如需扩展，实现 `DatabaseEngine` 协议即可。
- **向量搜索 + UMAP 可视化** — 依赖 Qdrant 适配器。
- **Monaco 编辑器 / 自动补全 / Vim 模式** — 原生 `SQLEditor` 覆盖基本编辑；富编辑体验另行立项。
- **可视化查询构建器、Chart Builder、Dashboard、图片画廊、Data Profiler/Validation** — 增值视图，非核心路径。
- **XLSX 导出** — CSV/JSON/SQL 已覆盖交换需求，避免引入 xlsx 写库。
- **自动更新（Sparkle）** — 目前经 GitHub Releases 分发公证 zip；Sparkle 集成单独立项。
- **Command Palette、Onboarding Tour、主题/字体自定义** — 原生 App 以系统菜单/快捷键与系统外观为准。
- **内存监控、图片代理、视频探测、PG LISTEN/NOTIFY、文件监听** — Electron 架构特有或低频功能。

## 周边影响

- 根 `package.json` 脚本改指 SwiftPM；`vitest.config.ts` 移除。
- CI（`.github/workflows/ci.yml`）：lint + swift build/test（macOS）+ docs build。
- Release（release.yml）：仅保留 release-please + build-swiftui。
- `apps/video` 使用静态截图，不受影响；文档站移除 Electron 专属描述。
