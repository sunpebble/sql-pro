## Why

项目中存在历史遗留的调试代码和技术债务，主要集中在生产代码中的 console.log 调试语句。这些代码会影响生产环境的日志质量，并可能泄露敏感信息。现在需要清理以提升代码质量和安全性。

## What Changes

- 移除 `packages/cloudflare/src/api/auth-routes.ts` 中的调试日志（约 5 处 console.log）
- 解决 `packages/cloudflare/src/api/stripe.ts` 中的 TODO 注释
- 评估并清理 `apps/electron/scripts/capture-screenshots.ts` 中的过多调试输出
- 审查各 Store 和组件中的 console.error/warn 使用，确保一致性

## Capabilities

### New Capabilities

- `code-cleanup`: 清理生产代码中的调试语句和技术债务

### Modified Capabilities

（无现有规格需要修改）

## Impact

- **受影响的代码**:
  - `packages/cloudflare/src/api/auth-routes.ts` - 认证路由
  - `packages/cloudflare/src/api/stripe.ts` - 支付集成
  - `apps/electron/scripts/capture-screenshots.ts` - 截图脚本
- **风险**: 低 - 仅移除调试代码，不影响业务逻辑
- **依赖**: 无外部依赖变更
