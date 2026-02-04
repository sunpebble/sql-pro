## 2025-02-12 - Sidebar Accessibility Pattern
**Learning:** Collapsible sidebar sections (schemas, tables, views) were implemented as buttons but lacked `aria-expanded` state, making them confusing for screen readers. The "Expand/Collapse All" icon-only button also lacked an accessible name.
**Action:** When working on tree-like navigation structures in this codebase, always ensure toggle buttons have `aria-expanded` state and icon-only buttons have explicit `aria-label`s, even if they have tooltips.
