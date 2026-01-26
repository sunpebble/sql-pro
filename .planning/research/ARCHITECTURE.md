# Visual Architecture Research: Linear/Raycast Style

> Research document for upgrading SQL Pro from "Warm Modern" to Linear/Raycast-style design system.
> Generated: 2026-01-26

## Executive Summary

Linear and Raycast represent the pinnacle of modern productivity app design, characterized by:

- **Dark-first, high-density interfaces** with exceptional information clarity
- **Command-driven interaction** with keyboard-first navigation
- **Layered visual hierarchy** using subtle backgrounds, borders, and shadows
- **Minimal chrome, maximum content** design philosophy

This document analyzes their visual architecture patterns and maps them to SQL Pro's refactoring needs.

---

## 1. Layout Architecture Patterns

### 1.1 Three-Panel Layout (Linear Pattern)

Linear uses a consistent three-panel layout hierarchy:

```
┌─────────────────────────────────────────────────────────────────┐
│  Window Chrome / Titlebar                                       │
├────────┬────────────────────────────────────────────────────────┤
│        │  Secondary Navigation / Tabs                            │
│ Rail   ├────────┬───────────────────────────────────────────────┤
│ (48px) │ Sidebar│  Main Content Area                             │
│        │(240px) │                                                │
│        │        │                                                │
│        │        │                                                │
│        │        ├───────────────────────────────────────────────┤
│        │        │  Optional: Detail Panel (slide-in)            │
└────────┴────────┴───────────────────────────────────────────────┘
```

**Key Characteristics:**

- **Activity Rail**: Fixed 48px width, icon-only navigation
- **Sidebar**: Collapsible, 240-320px default, tree navigation
- **Content Area**: Flexible, contains tabs and main view
- **Detail Panels**: Slide-in from right, overlay or push content

### 1.2 Command Palette Architecture (Raycast Pattern)

Raycast pioneered the modal command interface:

```
┌─────────────────────────────────────────────────┐
│  ┌─────────────────────────────────────────┐   │
│  │ 🔍 Search commands...                   │   │
│  ├─────────────────────────────────────────┤   │
│  │ ▸ Section: Actions                       │   │
│  │   ⚡ Action Item             ⌘A          │   │
│  │   📋 Another Action          ⌘B          │   │
│  ├─────────────────────────────────────────┤   │
│  │ ▸ Section: Navigation                    │   │
│  │   🔍 Search                  ⌘F          │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  [backdrop with blur]                           │
└─────────────────────────────────────────────────┘
```

**Component Hierarchy:**

```
CommandPalette
├── Dialog (modal overlay)
│   └── Command (cmdk wrapper)
│       ├── CommandInput (search bar)
│       ├── CommandList (scrollable container)
│       │   ├── CommandEmpty (no results state)
│       │   └── CommandGroup[] (categorized sections)
│       │       ├── heading
│       │       └── CommandItem[]
│       │           ├── icon
│       │           ├── label
│       │           └── shortcut
│       └── Footer (hints, counts)
```

### 1.3 SQL Pro Current vs Target Layout

**Current Layout:**

```
┌─────────────────────────────────────────────────────────────────┐
│  Titlebar                                                        │
├────────┬────────────────────────────────────────────────────────┤
│Activity│  ConnectionTabBar                                       │
│  Bar   ├────────┬───────────────────────────────────────────────┤
│ (48px) │Sidebar │  DataTabBar / QueryTabs                        │
│        │(320px) ├───────────────────────────────────────────────┤
│        │        │  TableView / QueryView / DiagramView          │
│        │        │                                                │
│        │        │                                                │
│        │        ├───────────────────────────────────────────────┤
│        │        │  SQL Log Panel (collapsible bottom)            │
└────────┴────────┴───────────────────────────────────────────────┘
```

**Target Layout (Linear/Raycast Hybrid):**

```
┌─────────────────────────────────────────────────────────────────┐
│  Titlebar (minimal, integrated traffic lights)                  │
├────────┬────────────────────────────────────────────────────────┤
│        │  Context Bar (breadcrumb + actions + search)            │
│ Rail   ├────────┬───────────────────────────────────────────────┤
│ (44px) │ Schema │  Tab Bar (minimal, pill-style)                 │
│        │Explorer├───────────────────────────────────────────────┤
│        │(280px) │  Main View (Table/Query/Diagram/Dashboard)    │
│        │        │                                                │
│        │        │                                                │
│        │        │                                                │
│        │        ├───────────────────────────────────────────────┤
│        │        │  Status Bar (SQL log toggle, connection info)  │
└────────┴────────┴───────────────────────────────────────────────┘
```

---

## 2. Visual Hierarchy and Density

### 2.1 Background Layer System

Linear/Raycast use a sophisticated layering system:

| Layer         | Purpose                 | Color (Dark)           | Color (Light)           |
| ------------- | ----------------------- | ---------------------- | ----------------------- |
| L0 - Base     | Window background       | `oklch(0.13 0.02 250)` | `oklch(0.98 0.002 250)` |
| L1 - Surface  | Cards, panels           | `oklch(0.16 0.02 250)` | `oklch(0.96 0.003 250)` |
| L2 - Elevated | Popovers, dropdowns     | `oklch(0.19 0.02 250)` | `oklch(0.99 0.001 250)` |
| L3 - Overlay  | Modals, command palette | `oklch(0.22 0.02 250)` | `oklch(1.0 0 0)`        |

**Pattern: Subtle elevation through opacity, not shadows**

```css
/* Linear-style layering */
--bg-base: oklch(0.13 0.015 250);
--bg-surface: oklch(0.13 0.015 250 / 80%); /* translucent */
--bg-elevated: oklch(0.16 0.015 250);
--bg-overlay: oklch(0.19 0.015 250);
```

### 2.2 Border Treatment

Linear/Raycast use minimal, subtle borders:

```css
/* Border hierarchy */
--border-subtle: oklch(1 0 0 / 4%); /* Internal divisions */
--border-default: oklch(1 0 0 / 8%); /* Card boundaries */
--border-strong: oklch(1 0 0 / 12%); /* Focus states, emphasis */
--border-interactive: oklch(1 0 0 / 16%); /* Hover states */
```

**Pattern: Inner borders with transparency, not solid lines**

### 2.3 Text Hierarchy

| Level   | Usage         | Weight  | Size    | Color     |
| ------- | ------------- | ------- | ------- | --------- |
| Display | Hero titles   | 700-800 | 32-48px | Primary   |
| Title   | Section heads | 600     | 18-24px | Primary   |
| Heading | Card titles   | 600     | 14-16px | Primary   |
| Body    | Content       | 400     | 14px    | Secondary |
| Caption | Metadata      | 400-500 | 12px    | Tertiary  |
| Mono    | Code, keys    | 500     | 13px    | Tertiary  |

**Raycast text density pattern:**

- Tight line-height (1.3-1.4) for list items
- Standard line-height (1.5-1.6) for body text
- -0.02em letter-spacing for headings

### 2.4 Information Density Patterns

**High-Density List Items (Raycast):**

```
┌─────────────────────────────────────────────────────┐
│ [icon] Title                           [meta] [kbd] │  28-32px height
└─────────────────────────────────────────────────────┘
```

**Medium-Density Cards (Linear):**

```
┌─────────────────────────────────────────────────────┐
│ [icon]                                              │
│ Title                                               │
│ Description text spanning one or two lines...       │  72-96px height
│                                     [badge] [date]  │
└─────────────────────────────────────────────────────┘
```

---

## 3. Component Patterns

### 3.1 Navigation Rail (Activity Bar)

**Current SQL Pro:** 48px, gradient backgrounds, heavy shadows, glow effects

**Target Pattern:**

```css
.activity-rail {
  width: 44px;
  background: var(--bg-surface);
  border-right: 1px solid var(--border-subtle);
}

.activity-rail-item {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  color: var(--text-tertiary);
  transition: all 150ms;
}

.activity-rail-item:hover {
  background: var(--bg-elevated);
  color: var(--text-secondary);
}

.activity-rail-item[data-active] {
  background: var(--accent-bg);
  color: var(--accent);
}
```

**Key Changes:**

- Remove gradients
- Simplify to flat background with subtle border
- Reduce icon size from 18px to 16px
- Remove glow effects, use simple color change

### 3.2 Sidebar / Tree Navigation

**Current SQL Pro:** Glass morphism, decorative gradients, complex hover states

**Target Pattern:**

```
Schema Explorer
├── Search (inline, no box)
├── Filter Bar (pill buttons)
└── Tree
    ├── Section Header (uppercase, 11px)
    │   └── Collapsible items
    └── Tree Item
        ├── Expand chevron (12px)
        ├── Icon (14px)
        ├── Name (truncate)
        └── Meta (right-aligned, muted)
```

**Key Changes:**

- Remove glass morphism background
- Flatten tree item hover states
- Reduce vertical padding (py-1 to py-0.5)
- Inline search without decorative border

### 3.3 Tab Bar Patterns

**Linear Tab Style:**

```css
.tab-bar {
  height: 40px;
  padding: 0 8px;
  background: transparent;
  border-bottom: 1px solid var(--border-subtle);
}

.tab {
  height: 32px;
  padding: 0 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
}

.tab[data-active] {
  background: var(--bg-elevated);
}
```

**Key Changes:**

- Remove underline indicators, use background highlight
- Reduce tab height from 36px to 32px
- Simplify close button (only show on hover)

### 3.4 Dialog / Modal Patterns

**Raycast Dialog Architecture:**

```
┌─────────────────────────────────────────────────────────┐
│  Header                                            [x]  │  44px
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Body Content                                           │
│  (max-height with scroll)                               │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  Footer Actions                            [Cancel][OK] │  56px
└─────────────────────────────────────────────────────────┘
```

**Key Changes:**

- Remove decorative gradients
- Sharper corners (12px vs 20px)
- Reduce padding (p-4 vs p-6)
- Subtle backdrop blur (8px vs 12px)

### 3.5 Command Palette Enhancement

**Current:** Basic cmdk implementation

**Target Enhancements:**

1. Category icons with consistent 16px sizing
2. Keyboard shortcut badges with monospace font
3. Footer with navigation hints
4. Recent items section
5. Fuzzy search highlighting

---

## 4. Spacing and Layout Grid

### 4.1 Spacing Scale (8px Base)

| Token        | Value | Usage                      |
| ------------ | ----- | -------------------------- |
| `--space-0`  | 0px   | Reset                      |
| `--space-1`  | 4px   | Inline spacing, icon gaps  |
| `--space-2`  | 8px   | Component internal padding |
| `--space-3`  | 12px  | Default gap, card padding  |
| `--space-4`  | 16px  | Section gaps               |
| `--space-5`  | 20px  | Large card padding         |
| `--space-6`  | 24px  | Section margins            |
| `--space-8`  | 32px  | Major section gaps         |
| `--space-10` | 40px  | Page-level spacing         |
| `--space-12` | 48px  | Large section dividers     |

### 4.2 Layout Widths

| Element         | Min   | Default | Max   |
| --------------- | ----- | ------- | ----- |
| Activity Rail   | 44px  | 44px    | 44px  |
| Sidebar         | 200px | 280px   | 400px |
| Detail Panel    | 280px | 360px   | 480px |
| Dialog (small)  | 360px | 420px   | 480px |
| Dialog (medium) | 480px | 560px   | 640px |
| Dialog (large)  | 640px | 800px   | 960px |
| Command Palette | 560px | 640px   | 640px |

### 4.3 Density Classes

```css
/* Compact mode - for list views */
.density-compact {
  --item-height: 28px;
  --item-padding-y: 4px;
  --item-padding-x: 8px;
  --item-gap: 4px;
  font-size: 13px;
}

/* Default mode */
.density-default {
  --item-height: 36px;
  --item-padding-y: 8px;
  --item-padding-x: 12px;
  --item-gap: 8px;
  font-size: 14px;
}

/* Comfortable mode - for cards */
.density-comfortable {
  --item-height: 44px;
  --item-padding-y: 12px;
  --item-padding-x: 16px;
  --item-gap: 12px;
  font-size: 14px;
}
```

---

## 5. Color System Transformation

### 5.1 Current "Warm Modern" vs Target "Linear/Raycast"

| Token      | Current (Orange)       | Target (Neutral + Accent)      |
| ---------- | ---------------------- | ------------------------------ |
| Primary    | `#F97316` (Orange 500) | `#3B82F6` (Blue 500) or custom |
| Background | Warm tint `#FFFBF7`    | Neutral `#0A0A0B` / `#FAFAFA`  |
| Surface    | Orange-tinted          | Pure neutral with subtle blue  |
| Border     | Warm borders           | Cool neutral borders           |
| Text       | Stone palette          | Zinc/Neutral palette           |

### 5.2 Recommended Accent Color Options

**Option A: Electric Blue (Linear-style)**

```css
--accent: oklch(0.62 0.21 255); /* Blue 500 */
--accent-light: oklch(0.7 0.18 255); /* Blue 400 */
--accent-dark: oklch(0.54 0.23 255); /* Blue 600 */
```

**Option B: Emerald Green (Keep consistency with current)**

```css
--accent: oklch(0.69 0.17 162); /* Emerald 500 */
--accent-light: oklch(0.77 0.15 162); /* Emerald 400 */
--accent-dark: oklch(0.6 0.19 162); /* Emerald 600 */
```

**Option C: Violet Purple (Raycast-style)**

```css
--accent: oklch(0.59 0.24 293); /* Violet 500 */
--accent-light: oklch(0.67 0.21 293); /* Violet 400 */
--accent-dark: oklch(0.51 0.26 293); /* Violet 600 */
```

### 5.3 Complete Color Token Mapping

```css
/* Dark Mode (Primary) */
:root {
  /* Backgrounds */
  --bg-base: oklch(0.09 0.01 250);
  --bg-surface: oklch(0.12 0.01 250);
  --bg-elevated: oklch(0.15 0.01 250);
  --bg-overlay: oklch(0.18 0.01 250);
  --bg-subtle: oklch(0.1 0.01 250);

  /* Text */
  --text-primary: oklch(0.98 0.005 250);
  --text-secondary: oklch(0.72 0.01 250);
  --text-tertiary: oklch(0.55 0.01 250);
  --text-disabled: oklch(0.4 0.01 250);

  /* Borders */
  --border-subtle: oklch(1 0 0 / 5%);
  --border-default: oklch(1 0 0 / 8%);
  --border-strong: oklch(1 0 0 / 12%);

  /* Accent */
  --accent: oklch(0.62 0.21 255);
  --accent-bg: oklch(0.62 0.21 255 / 12%);
  --accent-border: oklch(0.62 0.21 255 / 25%);

  /* Status */
  --success: oklch(0.72 0.19 142);
  --warning: oklch(0.8 0.17 75);
  --error: oklch(0.65 0.24 25);
  --info: oklch(0.62 0.21 255);
}

/* Light Mode */
.light {
  --bg-base: oklch(0.99 0.002 250);
  --bg-surface: oklch(0.97 0.003 250);
  --bg-elevated: oklch(1 0 0);
  --bg-overlay: oklch(1 0 0);
  --bg-subtle: oklch(0.96 0.004 250);

  --text-primary: oklch(0.12 0.02 250);
  --text-secondary: oklch(0.4 0.02 250);
  --text-tertiary: oklch(0.55 0.015 250);

  --border-subtle: oklch(0 0 0 / 5%);
  --border-default: oklch(0 0 0 / 8%);
  --border-strong: oklch(0 0 0 / 12%);
}
```

---

## 6. Animation and Motion

### 6.1 Timing Functions

```css
/* Linear/Raycast timing curves */
--ease-out: cubic-bezier(0.25, 0.1, 0.25, 1);
--ease-in-out: cubic-bezier(0.42, 0, 0.58, 1);
--ease-spring: cubic-bezier(0.34, 1.3, 0.64, 1); /* Subtle bounce */
--ease-smooth: cubic-bezier(0.4, 0, 0.2, 1); /* Material-like */
```

### 6.2 Duration Scale

| Token                | Value | Usage                 |
| -------------------- | ----- | --------------------- |
| `--duration-instant` | 50ms  | Checkbox, toggle      |
| `--duration-fast`    | 100ms | Hover, focus states   |
| `--duration-normal`  | 150ms | Component transitions |
| `--duration-slow`    | 250ms | Panel slides, modals  |
| `--duration-slower`  | 400ms | Page transitions      |

### 6.3 Common Animations

```css
/* Fade in */
@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Scale in (for modals) */
@keyframes scale-in {
  from {
    opacity: 0;
    transform: scale(0.96);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Slide in from right (for panels) */
@keyframes slide-in-right {
  from {
    opacity: 0;
    transform: translateX(16px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* Subtle float (for skeleton loading) */
@keyframes pulse {
  0%,
  100% {
    opacity: 0.5;
  }
  50% {
    opacity: 0.8;
  }
}
```

---

## 7. Component Refactor Order

Based on dependencies and visual impact, here is the recommended refactor order:

### Phase 1: Foundation (Must Do First)

1. **CSS Variables / Design Tokens**
   - Update `/apps/electron/src/renderer/src/styles/globals.css`
   - Update `/apps/website/src/index.css`
   - Create shared token file if needed

2. **Base Background and Layout Shell**
   - `RootLayout` background treatment
   - `DatabaseView` main container
   - Remove decorative overlays (grid dots, noise)

### Phase 2: Core Navigation (High Impact)

3. **Activity Bar**
   - Current: Heavy gradients, glow effects
   - Target: Flat, minimal, icon-only
   - File: `/apps/electron/src/renderer/src/components/ActivityBar.tsx`

4. **Sidebar**
   - Remove glass morphism
   - Flatten tree items
   - Simplify search and filter controls
   - File: `/apps/electron/src/renderer/src/components/Sidebar.tsx`

5. **Tab Bars**
   - DataTabBar
   - QueryTabs
   - ConnectionTabBar
   - Unify styling, reduce heights

### Phase 3: Content Areas (Medium Impact)

6. **Table View**
   - Header row styling
   - Cell density adjustments
   - Pagination controls

7. **Query View**
   - Editor chrome
   - Results panel
   - Toolbar simplification

8. **Command Palette**
   - Already well-structured
   - Update styling to match new tokens
   - File: `/apps/electron/src/renderer/src/components/CommandPalette.tsx`

### Phase 4: Dialogs and Panels (Lower Priority)

9. **Global Dialogs**
   - Settings dialog
   - Connection dialogs
   - All modals/alerts

10. **Resizable Panels**
    - Schema details panel
    - Diff preview panel
    - AI agent sidebar

### Phase 5: Website (Can Be Parallel)

11. **Hero Section**
    - Remove warm backgrounds
    - Update to dark, professional style

12. **Features Section**
    - Update card styling

13. **Pricing and Download**
    - Update CTAs
    - Adjust color scheme

---

## 8. Dependency Graph

```
Foundation (Phase 1)
    │
    ├──► Activity Bar (Phase 2)
    │       └──► All views depend on rail positioning
    │
    ├──► Sidebar (Phase 2)
    │       ├──► Tree items
    │       └──► Search/filter controls
    │
    └──► Tab Bars (Phase 2)
            └──► All tabbed content views

Content Views (Phase 3)
    │
    ├──► Table View
    │       └──► Uses: Sidebar selection, Tab state
    │
    ├──► Query View
    │       └──► Uses: Tab state, Result panels
    │
    └──► Command Palette
            └──► Uses: Global state, all commands

Dialogs (Phase 4)
    │
    └──► All dialogs share: Button styles, Input styles, Modal chrome

Website (Phase 5) - Mostly independent
    │
    └──► Shares: Design tokens, Brand colors
```

---

## 9. Quality Checklist

### Layouts

- [x] Three-panel layout pattern documented
- [x] Command palette architecture defined
- [x] Current vs target layout comparison
- [x] Component hierarchy diagrams

### Spacing/Density

- [x] 8px grid system defined
- [x] Spacing token scale complete
- [x] Density class definitions
- [x] Layout width constraints

### Build Order

- [x] Five-phase refactor order
- [x] Dependency graph
- [x] File paths for each component
- [x] Impact assessment (high/medium/low)

---

## 10. References

- Raycast API Documentation: https://developers.raycast.com/api-reference/user-interface
- Linear Design System (observed patterns)
- cmdk library: https://cmdk.paco.me/
- shadcn/ui: https://ui.shadcn.com/ (current component base)

---

_This document should be updated as implementation proceeds and patterns are refined._
