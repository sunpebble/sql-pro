## 2025-02-12 - [TooltipTrigger Behavior]
**Learning:** `@sqlpro/ui/tooltip`'s `TooltipTrigger` (from `@base-ui/react`) automatically clones and merges props with its child element if it's a valid React element. The `asChild` prop is not necessary or supported.
**Action:** When using `TooltipTrigger`, pass the interactive element (e.g., `Button`) as a direct child without wrapping it in additional `button` or `div`, and do not use `asChild`.
