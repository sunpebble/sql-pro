## ADDED Requirements

### Requirement: 移除生产代码中的调试日志

系统 SHALL 确保生产代码中不包含 console.log 调试语句。调试日志仅允许在开发脚本和测试文件中使用。

#### Scenario: 清理认证路由调试日志

- **WHEN** 审查 `packages/cloudflare/src/api/auth-routes.ts`
- **THEN** 移除所有 console.log 语句（约 5 处），保留 console.error 用于错误处理

#### Scenario: 清理 Stripe 集成调试日志

- **WHEN** 审查 `packages/cloudflare/src/api/stripe.ts`
- **THEN** 移除所有调试用 console.log 语句

### Requirement: 解决 TODO 注释

系统 SHALL 确保所有 TODO 注释被解决或转化为追踪的 issue。

#### Scenario: 处理 Stripe Price IDs TODO

- **WHEN** 审查 `packages/cloudflare/src/api/stripe.ts:14` 的 TODO 注释
- **THEN** 确认 Stripe Price IDs 已正确配置，或将 TODO 转为 GitHub issue 追踪

### Requirement: 保留开发脚本中的调试输出

开发脚本（如截图脚本）中的 console.log 语句 SHALL 被保留，因为这些是开发者工具而非生产代码。

#### Scenario: 截图脚本调试输出

- **WHEN** 审查 `apps/electron/scripts/capture-screenshots.ts`
- **THEN** 保留现有 console.log 语句，不做修改

### Requirement: 保留错误处理日志

console.error 和 console.warn 用于错误处理的语句 SHALL 被保留。

#### Scenario: 区分调试日志和错误日志

- **WHEN** 遇到 console.error 或 console.warn 语句
- **THEN** 保留该语句，仅移除 console.log
