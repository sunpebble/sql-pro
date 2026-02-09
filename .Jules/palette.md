# Palette's Journal 🎨

## 2025-05-19 - Accessible Hover-Reveal Pattern
**Learning:** This app uses `opacity-0 group-hover:opacity-100` for reveal-on-hover actions (like "Edit" buttons in lists). This makes them invisible to keyboard users when focused.
**Action:** Always add `focus:opacity-100` to any element using hover-reveal patterns to ensure keyboard accessibility.
