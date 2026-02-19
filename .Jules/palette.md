# Palette's Journal

## 2025-02-23 - Input Icons and Padding
**Learning:** When adding absolute positioned icons inside an input (like a password toggle), standard padding (`px-3`) is insufficient. The text will overlap with the icon.
**Action:** Always add specific padding (e.g., `pr-10`) to the input on the side where the icon is placed.

## 2025-02-23 - Robust Localization
**Learning:** Relying on existing locale keys without checking the file is risky.
**Action:** Use `defaultValue` in `t()` calls (e.g., `t('key', { defaultValue: 'Fallback' })`) to ensure UI works even if translation is missing.
