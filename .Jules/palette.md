## 2025-02-03 - [Accessibility in Sidebar]
**Learning:** Icon-only buttons hidden via opacity (group-hover pattern) are inaccessible to keyboard users unless `focus:opacity-100` is added. Also, `electron-vite` in headless environments makes renderer verification challenging due to IPC dependencies.
**Action:** Always add `focus:opacity-100` when using hover-reveal patterns for controls. For testing, consider mocking IPC or using a dedicated component test environment.
