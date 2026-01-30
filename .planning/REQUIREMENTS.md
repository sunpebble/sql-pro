# Requirements: SQL Pro v2.0 功能对齐

**Defined:** 2026-01-29
**Core Value:** 让数据库操作变得简单、高效、愉悦

## v2.0 Requirements

### SSH Tunnels (SSH) ✓

- [x] **SSH-01**: 用户可以使用密码认证建立 SSH 隧道连接
- [x] **SSH-02**: 用户可以使用 SSH 密钥认证建立隧道连接
- [x] **SSH-03**: SSH 凭据使用 Electron safeStorage 安全存储
- [x] **SSH-04**: 连接配置界面显示 SSH 隧道选项
- [x] **SSH-05**: 隧道自动进行端口转发（动态分配本地端口）
- [x] **SSH-06**: 连接状态 UI 显示隧道状态指示
- [x] **SSH-07**: 网络中断后隧道自动重连
- [x] **SSH-08**: 支持通过跳板机 (Jump Host) 连接目标数据库

### Table Tags (TAG) ✓

- [x] **TAG-01**: 用户可以创建自定义标签（名称 + 颜色）
- [x] **TAG-02**: 用户可以编辑和删除已有标签
- [x] **TAG-03**: 用户可以为表分配一个或多个标签
- [x] **TAG-04**: 侧边栏表列表可按标签过滤
- [x] **TAG-05**: 标签数据持久化到 electron-store
- [x] **TAG-06**: 每个标签可自定义显示颜色
- [x] **TAG-07**: 命令面板 (Cmd+K) 中可搜索和跳转到标签

### Saved Queries (QUERY) ✓

- [x] **QUERY-01**: 用户可以保存当前查询（名称 + 描述）
- [x] **QUERY-02**: 用户可以浏览已保存的查询列表
- [x] **QUERY-03**: 用户可以快速运行已保存的查询
- [x] **QUERY-04**: 用户可以编辑和删除已保存的查询
- [x] **QUERY-05**: 用户可以用文件夹组织已保存的查询
- [x] **QUERY-06**: 查询支持参数变量 `{{variable}}` 语法
- [x] **QUERY-07**: 运行参数化查询时弹出变量输入对话框
- [x] **QUERY-08**: 命令面板 (Cmd+K) 中可搜索和运行已保存查询

### AI Natural Language Query (AI)

- [ ] **AI-01**: 用户可以用自然语言描述查询需求
- [ ] **AI-02**: AI 基于当前数据库 Schema 生成 SQL
- [ ] **AI-03**: 生成的 SQL 显示预览，用户确认后才执行
- [ ] **AI-04**: 命令面板支持快速查询模式（Cmd+K 直接输入自然语言）
- [ ] **AI-05**: 用户可以选中 SQL 让 AI 解释其含义
- [ ] **AI-06**: AI 可以分析查询并提供优化建议

## Future Requirements (v3.0+)

### 更多数据库支持

- **DB-01**: MongoDB 支持
- **DB-02**: SQL Server 支持
- **DB-03**: Redis 支持

### 数据可视化

- **VIZ-01**: 查询结果图表可视化
- **VIZ-02**: 仪表板创建和管理
- **VIZ-03**: Notebook-like 报告

### 团队协作

- **TEAM-01**: 查询共享
- **TEAM-02**: 云端同步

## Out of Scope

| Feature            | Reason                           |
| ------------------ | -------------------------------- |
| SSH Agent 转发     | 复杂度高，用户可直接使用密钥文件 |
| 跨连接共享标签定义 | v2.0 先实现连接级别标签          |
| 查询版本历史       | 延后到 v3.0                      |
| AI 自动执行查询    | 安全风险，必须用户确认           |
| 移动端             | 桌面应用优先                     |

## Traceability

| Requirement | Phase | Status   |
| ----------- | ----- | -------- |
| TAG-01      | 12    | Complete |
| TAG-02      | 12    | Complete |
| TAG-03      | 12    | Complete |
| TAG-04      | 12    | Complete |
| TAG-05      | 12    | Complete |
| TAG-06      | 12    | Complete |
| TAG-07      | 12    | Complete |
| QUERY-01    | 13    | Complete |
| QUERY-02    | 13    | Complete |
| QUERY-03    | 13    | Complete |
| QUERY-04    | 13    | Complete |
| QUERY-05    | 13    | Complete |
| QUERY-06    | 13    | Complete |
| QUERY-07    | 13    | Complete |
| QUERY-08    | 13    | Complete |
| SSH-01      | 14    | Complete |
| SSH-02      | 14    | Complete |
| SSH-03      | 14    | Complete |
| SSH-04      | 14    | Complete |
| SSH-05      | 14    | Complete |
| SSH-06      | 14    | Complete |
| SSH-07      | 14    | Complete |
| SSH-08      | 14    | Complete |
| AI-01       | 15    | Pending  |
| AI-02       | 15    | Pending  |
| AI-03       | 15    | Pending  |
| AI-04       | 15    | Pending  |
| AI-05       | 15    | Pending  |
| AI-06       | 15    | Pending  |

**Coverage:**

- v2.0 requirements: 29 total
- Mapped to phases: 29
- Unmapped: 0

---

_Requirements defined: 2026-01-29_
_Last updated: 2026-01-30 after Phase 12 completion_
