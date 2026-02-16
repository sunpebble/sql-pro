## 2025-05-18 - Titlebar Accessibility
**Learning:** Icon-only buttons (Theme Switcher, Settings, AI Agent) in the Titlebar/Toolbar were inaccessible.
**Action:** Use `t('key', { defaultValue: 'Label' })` for `aria-label` to support localization with robust fallbacks.
