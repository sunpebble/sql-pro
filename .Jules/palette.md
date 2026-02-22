## 2025-02-20 - Password Input Accessibility
**Learning:** `aria-invalid` requires boolean or specific string ("true", "false") in React 19/TypeScript, strict type checking catches `string | false`.
**Action:** Always cast conditions to boolean `Boolean(condition)` or `!!condition` for `aria-invalid`.
