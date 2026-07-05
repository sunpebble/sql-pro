# Quarry — 领域语言（Domain Language）

核心领域及其职责边界，作为架构讨论的共识术语。应用本体是 `apps/swiftui` 下的原生 macOS 应用（SwiftPM 双 target：`QuarryCore` 纯逻辑库 + `QuarrySwiftUI` 界面层）。

## Domain Modules（领域模块）

| 领域        | 职责                                                                                    | 实现位置（QuarryCore）                                               |
| ----------- | --------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| **engine**  | 数据库引擎抽象：连接、表列表、分页数据、Schema 内省、查询、关系图、全库搜索、列分布统计 | `DatabaseEngine.swift` + SQLite/Postgres/MySQL 引擎                  |
| **schema**  | Schema 快照（保存/比较）、schema diff、迁移 SQL 生成                                    | `SchemaDiff.swift`                                                   |
| **data**    | 数据行级比较（主键匹配的增/删/改）、同步 SQL 生成、批量编辑                             | `DataDiff.swift`、`TableBulkEdit.swift`                              |
| **export**  | CSV/JSON/SQL 导出、CSV/JSON 导入、备份与恢复（SQLite）                                  | `CSVExporter/Importer`、`JSONExporter/Importer`、`SQLExporter.swift` |
| **profile** | 连接配置文件、最近数据库列表、查询库（历史 + 收藏）                                     | `ConnectionProfiles.swift`、`QueryLibrary.swift`                     |
| **ssh**     | SSH 隧道（本地端口转发，支撑远程 PG/MySQL）                                             | `SSHTunnel.swift`                                                    |
| **license** | 专业版许可证：激活/验证/停用（api.sqlpro.app）、7 天离线宽限、Keychain 缓存             | `LicenseClient.swift`                                                |
| **system**  | Keychain 密码存储、SQL 执行日志                                                         | `KeychainPasswordStore.swift`、`SqlLog.swift`                        |

## Seams（接缝）

- **Engine 接缝**：所有数据库操作经 `DatabaseEngine` 协议，UI 不感知具体引擎。各引擎绑定系统库（SQLCipher/libpq/libmysqlclient），新引擎只需实现协议。
- **Core/UI 接缝**：`QuarryCore` 不依赖 SwiftUI/AppKit，逻辑全部可单测；`QuarrySwiftUI` 的 `QuarryAppState` 是唯一的状态容器。

## Architectural Decisions（架构决策）

- **系统库绑定而非纯 Swift 驱动**：SQLCipher、libpq、libmysqlclient 经 homebrew 提供，SwiftPM systemLibrary target 链接。
- **密码不落盘配置**：连接密码只存 macOS Keychain（`KeychainPasswordStore`），配置文件 JSON 不含密码。
- **许可证缓存在 Keychain**：`LicenseClient` 的缓存 JSON 也走 Keychain，验证 7 天内离线可用。

## 周边项目

- `packages/license-api` / `packages/cloudflare` — Cloudflare Workers 后端（Stripe 许可证、发布分发）。
- `packages/docs` — VitePress 文档站。
- `apps/video` — Remotion 宣传视频（使用 `public/screenshots` 静态截图）。
