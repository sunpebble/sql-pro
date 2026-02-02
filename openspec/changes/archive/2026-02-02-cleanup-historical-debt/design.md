## Context

项目在开发过程中积累了一些调试代码和技术债务，主要问题：

1. `packages/cloudflare/` 中的认证和支付模块包含生产环境的 console.log 调试语句
2. 存在未解决的 TODO 注释
3. 截图脚本中的调试输出过于冗长

当前代码库整体健康度良好（50+ 测试文件，无临时文件，仅 1 个 TODO），但生产代码中的调试语句需要清理。

## Goals / Non-Goals

**Goals:**

- 移除生产代码中的所有 console.log 调试语句
- 解决或记录现有 TODO 注释
- 保持代码行为不变，仅清理调试代码

**Non-Goals:**

- 不引入新的日志系统（保持现有 console.error/warn 用于错误处理）
- 不修改测试文件中的 console 使用
- 不重构业务逻辑

## Decisions

### 1. 直接移除 console.log 而非替换为日志库

**选择**: 直接删除 console.log 语句
**原因**: 这些是临时调试代码，不是必要的运行时日志。引入日志库会增加复杂度且超出清理范围。
**替代方案考虑**: 替换为 winston/pino 等日志库 - 但会增加依赖和改动范围。

### 2. 保留脚本文件中的调试输出

**选择**: 保留 `capture-screenshots.ts` 中的 console.log
**原因**: 这是开发脚本而非生产代码，开发者需要执行反馈。
**替代方案考虑**: 添加 --verbose 开关 - 可作为后续优化。

### 3. 保留 console.error/warn 用于错误处理

**选择**: 只清理 console.log，保留 console.error 和 console.warn
**原因**: 错误和警告日志对于问题排查是必要的。

## Risks / Trade-offs

- **[风险] 移除有用的运行时信息** → 仅移除明确的调试语句（如 "Got access token..."），保留错误处理日志
- **[风险] 遗漏部分调试代码** → 使用 grep 全面搜索 console.log 确保覆盖
