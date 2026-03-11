# SQL Pro — Ink & Paper Design Specification

**Date:** 2026-03-11
**Status:** Approved
**Scope:** Replace Neobrutalism design system with Ink & Paper minimalism

---

## Design Philosophy

Three pillars:

1. **Ink & Paper (墨水风)** — Hierarchy through font weight, font size, and whitespace. No borders, no shadows. Cards distinguished by micro background color differences (1-2% lightness).
2. **Near Colorless (近乎无色)** — Grayscale UI with color only for focus ring and semantic status dots. No brand accent color.
3. **Content First (内容为王)** — UI disappears; SQL code and data are the sole visual focus.

### Key Principles

- **No borders**: `--border: transparent`. Use background color steps instead.
- **No shadows**: All `--shadow-*` set to `none`.
- **Typography-driven hierarchy**: Font weight and size create all visual structure.
- **Labels**: 10px, uppercase, letter-spacing 1.5px — the Ink & Paper signature.
- **Focus ring only**: The sole interactive color is a zinc ring on `:focus-visible`.
- **Dark/light equal**: Both modes are first-class citizens. Follow system preference.

---

## Color Tokens

### Light Mode (`:root`)

| Token                    | Old Value               | New Value     | Notes                |
| ------------------------ | ----------------------- | ------------- | -------------------- |
| `--background`           | `#ffffff`               | `#ffffff`     | Unchanged            |
| `--foreground`           | `#09090b`               | `#09090b`     | Unchanged            |
| `--card`                 | `#ffffff`               | `#fafafa`     | 1% darker than bg    |
| `--card-foreground`      | `#09090b`               | `#09090b`     | Unchanged            |
| `--primary`              | `#f97316` (orange)      | `#09090b`     | Black                |
| `--primary-foreground`   | `#ffffff`               | `#fafafa`     | Near-white           |
| `--secondary`            | `#f4f4f5`               | `#f4f4f5`     | 2% darker than bg    |
| `--secondary-foreground` | `#18181b`               | `#3f3f46`     | Slightly lighter     |
| `--muted`                | `#f4f4f5`               | `#fafafa`     | Same as card         |
| `--muted-foreground`     | `#71717a`               | `#71717a`     | Unchanged            |
| `--accent`               | `#fff7ed` (orange tint) | `#f4f4f5`     | Same as secondary    |
| `--accent-foreground`    | `#9a3412`               | `#3f3f46`     | Neutral              |
| `--border`               | `#e4e4e7`               | `transparent` | **No borders**       |
| `--input`                | `#e4e4e7`               | `#fafafa`     | Background fill      |
| `--ring`                 | `#f97316` (orange)      | `#a1a1aa`     | zinc-400, focus only |
| `--main`                 | `#f97316` (orange)      | `#09090b`     | Black                |
| `--shadow-sm`            | `0 1px 2px...`          | `none`        | Removed              |
| `--shadow`               | `0 1px 3px...`          | `none`        | Removed              |
| `--shadow-lg`            | `0 10px 15px...`        | `none`        | Removed              |

### Dark Mode (`.dark`)

| Token                  | Old Value               | New Value     | Notes                |
| ---------------------- | ----------------------- | ------------- | -------------------- |
| `--background`         | `#09090b`               | `#09090b`     | Unchanged            |
| `--foreground`         | `#fafafa`               | `#fafafa`     | Unchanged            |
| `--card`               | `#09090b`               | `#111113`     | 1% lighter than bg   |
| `--primary`            | `#fb923c` (orange)      | `#fafafa`     | White                |
| `--primary-foreground` | `#431407`               | `#09090b`     | Black                |
| `--secondary`          | `#27272a`               | `#18181b`     | 2% lighter than bg   |
| `--muted`              | `#27272a`               | `#111113`     | Same as card         |
| `--muted-foreground`   | `#a1a1aa`               | `#71717a`     | Slightly dimmer      |
| `--accent`             | `#431407` (orange dark) | `#18181b`     | Same as secondary    |
| `--border`             | `#27272a`               | `transparent` | **No borders**       |
| `--input`              | `#27272a`               | `#111113`     | Background fill      |
| `--ring`               | `#fb923c` (orange)      | `#52525b`     | zinc-600, focus only |
| `--main`               | `#fb923c` (orange)      | `#fafafa`     | White                |
| `--shadow-*`           | various                 | `none`        | All removed          |

### Radius Scale

| Token           | Old      | New      |
| --------------- | -------- | -------- |
| `--radius-sm`   | `6px`    | `4px`    |
| `--radius-md`   | `8px`    | `6px`    |
| `--radius-lg`   | `12px`   | `8px`    |
| `--radius-xl`   | `16px`   | `8px`    |
| `--radius-2xl`  | `20px`   | `8px`    |
| `--radius-full` | `9999px` | `9999px` |

---

## Typography Scale

The core of Ink & Paper — font weight and size drive all hierarchy.

| Role         | Size | Weight | Color (Light)      | Color (Dark)       | Usage                                                             |
| ------------ | ---- | ------ | ------------------ | ------------------ | ----------------------------------------------------------------- |
| Label        | 10px | 400    | zinc-400 `#a1a1aa` | zinc-600 `#52525b` | Section headers, table headers. Uppercase + letter-spacing 1.5px. |
| Body Small   | 12px | 400    | zinc-500 `#71717a` | zinc-500 `#71717a` | Descriptions, metadata, secondary info                            |
| Body         | 13px | 400    | zinc-700 `#3f3f46` | zinc-300 `#d4d4d8` | Primary content                                                   |
| Body Medium  | 13px | 500    | zinc-950 `#09090b` | zinc-200 `#e4e4e7` | Buttons, menu items, emphasis                                     |
| Title        | 15px | 600    | zinc-950 `#09090b` | zinc-200 `#e4e4e7` | Card titles, panel titles                                         |
| Page Heading | 20px | 700    | zinc-950 `#09090b` | zinc-200 `#e4e4e7` | Page titles. tracking-tight.                                      |

---

## Component Specifications

### Buttons

- **Primary**: Solid black/white fill. No shadow, no border. `border-radius: 6px`.
- **Secondary**: `#f4f4f5` / `#18181b` fill. No border.
- **Ghost**: No background. Text only.
- **Disabled**: 50% opacity on any variant.
- **Hover**: Subtle opacity change only — no translateY, no shadow transitions.

### Cards

- **No border**. Distinguished by background color step:
  - Light: Page `#f4f4f5` → Card `#fafafa` → Nested `#ffffff`
  - Dark: Page `#09090b` → Card `#111113` → Nested `#18181b`
- **No shadow**. No hover effects.
- `border-radius: 8px`

### Inputs

- **No border**. Background fill: `#fafafa` (light) / `#111113` (dark).
- **Focus**: 2px ring in `--ring` color with 2px offset. This is the only visual emphasis.
- `border-radius: 6px`

### Sidebar

- Background: `#fafafa` (light) / `#0c0c0e` (dark) — slightly different from main bg.
- Active item: `#f4f4f5` fill + `font-weight: 600` (light) / `#18181b` fill (dark).
- Section labels: 10px uppercase + letter-spacing.
- No borders between sidebar and content — separated by background color.

### Data Table

- Zebra striping via background alternation: `#fafafa` / `#ffffff` (light), `#111113` / `#09090b` (dark).
- No horizontal/vertical lines.
- Table headers: 10px uppercase + letter-spacing, zinc-400/zinc-600.
- Name columns: `font-weight: 500`. Number columns: monospace.

### Dialog

- Overlay: semi-transparent background (no backdrop-blur in Ink & Paper style).
  - Light: `rgba(228, 228, 231, 0.7)` (zinc-200 based)
  - Dark: `rgba(9, 9, 11, 0.85)` (zinc-950 based)
- Dialog panel: `#ffffff` / `#111113` background. No border.
- Title: 16px/700. Body: 13px/400 zinc-500.
- `border-radius: 8px`

### Status Indicators

- **6px dots only**. No colored text or backgrounds.
- Connected: `#22c55e` (green-500)
- Error: `#ef4444` (red-500)
- Warning: `#eab308` (yellow-500)
- Idle: `#a1a1aa` (light) / `#52525b` (dark)

### Query Editor (Monaco)

- Background: `#ffffff` (light) / `#111113` (dark) — same as card level.
- SQL keywords: `#71717a` + `font-weight: 600` — gray + bold distinguishes without color.
- No border around editor area. Separated by background step.
- Toolbar below: Primary "Run" button + ghost "Format" button.
- Results metadata: 11px zinc-400/zinc-600, right-aligned.

---

## Removal Checklist

### From `globals.css`

- [ ] `.glass`, `.glass-panel`, `.glass-gold` — glassmorphism utilities
- [ ] `.card-neo`, `.btn-neo` — neo-modern hover/shadow effects
- [ ] `.shadow-shadow`, `.shadow-shadow-sm`, `.shadow-shadow-lg` — shadow utilities
- [ ] `.text-gradient-gold`, `.glow-gold`, `.hover-gold`, `.btn-gold-active` — gold theme
- [ ] `.bg-grid-dot`, `.bg-grid-line` — grid background patterns
- [ ] All `--gold-*` CSS variables (`--gold`, `--gold-bright`, `--gold-dark`, `--gold-glow`, `--gold-subtle`)
- [ ] `.card-interactive` hover translateY effect
- [ ] `row-highlight` animation orange color → zinc
- [ ] `::selection` orange background → zinc

### From UI Components (`packages/ui/src/`)

- [ ] All `shadow-sm`, `shadow`, `shadow-lg`, `shadow-md` classes
- [ ] All `border border-border` → remove (transparent border is effectively none)
- [ ] `rounded-[3px]`, `rounded-[5px]` Neobrutalism residuals → use `rounded-md` (6px)
- [ ] `hover:shadow-none`, `hover:shadow-md` transitions
- [ ] `backdrop-blur-*` on dialog overlays
- [ ] `bg-black/40` on overlays → semi-transparent solid color
- [ ] All orange/primary color hardcoded references

### Portal Element Styles

- [ ] Remove `box-shadow: var(--shadow-lg) !important` from popover, dropdown, context-menu
- [ ] Remove `border: 1px solid var(--border) !important` from portal elements (border is transparent)

---

## Sidebar Variables

| Token                          | Light         | Dark          |
| ------------------------------ | ------------- | ------------- |
| `--sidebar-background`         | `#fafafa`     | `#0c0c0e`     |
| `--sidebar-foreground`         | `#09090b`     | `#e4e4e7`     |
| `--sidebar-primary`            | `#09090b`     | `#fafafa`     |
| `--sidebar-primary-foreground` | `#fafafa`     | `#09090b`     |
| `--sidebar-accent`             | `#f4f4f5`     | `#18181b`     |
| `--sidebar-accent-foreground`  | `#3f3f46`     | `#a1a1aa`     |
| `--sidebar-border`             | `transparent` | `transparent` |
| `--sidebar-ring`               | `#a1a1aa`     | `#52525b`     |

---

## Chart Colors

Grayscale-only chart palette:

| Token       | Light     | Dark      |
| ----------- | --------- | --------- |
| `--chart-1` | `#18181b` | `#e4e4e7` |
| `--chart-2` | `#3f3f46` | `#a1a1aa` |
| `--chart-3` | `#71717a` | `#71717a` |
| `--chart-4` | `#a1a1aa` | `#52525b` |
| `--chart-5` | `#d4d4d8` | `#3f3f46` |

---

## Implementation Notes

- **Primary target file**: `apps/electron/src/renderer/src/styles/globals.css` (1127 lines) — this is the single source of truth for all design tokens.
- **Tailwind v4**: Uses `@theme inline {}` blocks. All token aliases defined there.
- **Component files**: `packages/ui/src/` — button, card, dialog, badge, input, tabs, dropdown-menu, select all need class cleanup.
- **Monaco editor**: Custom styles in globals.css (lines 927-970) use border and shadow — need update.
- **React Flow**: Customization (lines 542-582) uses `--main`, `--border`, `--card` — will inherit new values.
- **Website theme**: `sanctum.ts` exports for website are independent (emerald primary) — not affected.
- **Animations**: `row-highlight` keyframe uses `rgba(249, 115, 22, 0.4)` (orange) — change to zinc.
