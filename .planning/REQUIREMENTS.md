# Requirements: SQL Pro v2.0 功能对齐

**Defined:** 2026-01-29
**Core Value:** 让数据库操作变得简单、高效、愉悦

## v2.0 Requirements

### SSH Tunnels (SSH)

- [ ] **SSH-01**: 用户可以使用密码认证建立 SSH 隧道连接
- [ ] **SSH-02**: 用户可以使用 SSH 密钥认证建立隧道连接
- [ ] **SSH-03**: SSH 凭据使用 Electron safeStorage 安全存储
- [ ] **SSH-04**: 连接配置界面显示 SSH 隧道选项
- [ ] **SSH-05**: 隧道自动进行端口转发（动态分配本地端口）
- [ ] **SSH-06**: 连接状态 UI 显示隧道状态指示
- [ ] **SSH-07**: 网络中断后隧道自动重连
- [ ] **SSH-08**: 支持通过跳板机 (Jump Host) 连接目标数据库

### Table Tags (TAG)

- [ ] **TAG-01**: 用户可以创建自定义标签（名称 + 颜色）
- [ ] **TAG-02**: 用户可以编辑和删除已有标签
- [ ] **TAG-03**: 用户可以为表分配一个或多个标签
- [ ] **TAG-04**: 侧边栏表列表可按标签过滤
- [ ] **TAG-05**: 标签数据持久化到 electron-store
- [ ] **TAG-06**: 每个标签可自定义显示颜色
- [ ] **TAG-07**: 命令面板 (Cmd+K) 中可搜索和跳转到标签

### Saved Queries (QUERY)

- [ ] **QUERY-01**: 用户可以保存当前查询（名称 + 描述）
- [ ] **QUERY-02**: 用户可以浏览已保存的查询列表
- [ ] **QUERY-03**: 用户可以快速运行已保存的查询
- [ ] **QUERY-04**: 用户可以编辑和删除已保存的查询
- [ ] **QUERY-05**: 用户可以用文件夹组织已保存的查询
- [ ] **QUERY-06**: 查询支持参数变量 `{{variable}}` 语法
- [ ] **QUERY-07**: 运行参数化查询时弹出变量输入对话框
- [ ] **QUERY-08**: 命令面板 (Cmd+K) 中可搜索和运行已保存查询

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

| Requirement | Phase | Status  |
| ----------- | ----- | ------- |
| SSH-01      | TBD   | Pending |
| SSH-02      | TBD   | Pending |
| SSH-03      | TBD   | Pending |
| SSH-04      | TBD   | Pending |
| SSH-05      | TBD   | Pending |
| SSH-06      | TBD   | Pending |
| SSH-07      | TBD   | Pending |
| SSH-08      | TBD   | Pending |
| TAG-01      | TBD   | Pending |
| TAG-02      | TBD   | Pending |
| TAG-03      | TBD   | Pending |
| TAG-04      | TBD   | Pending |
| TAG-05      | TBD   | Pending |
| TAG-06      | TBD   | Pending |
| TAG-07      | TBD   | Pending |
| QUERY-01    | TBD   | Pending |
| QUERY-02    | TBD   | Pending |
| QUERY-03    | TBD   | Pending |
| QUERY-04    | TBD   | Pending |
| QUERY-05    | TBD   | Pending |
| QUERY-06    | TBD   | Pending |
| QUERY-07    | TBD   | Pending |
| QUERY-08    | TBD   | Pending |
| AI-01       | TBD   | Pending |
| AI-02       | TBD   | Pending |
| AI-03       | TBD   | Pending |
| AI-04       | TBD   | Pending |
| AI-05       | TBD   | Pending |
| AI-06       | TBD   | Pending |

**Coverage:**

- v2.0 requirements: 29 total
- Mapped to phases: 0 (pending roadmap)
- Unmapped: 29

---

_Requirements defined: 2026-01-29_
_Last updated: 2026-01-29 after milestone v2.0 scoping_
