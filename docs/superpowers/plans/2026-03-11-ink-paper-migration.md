# Ink & Paper Design Migration — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Neobrutalism design system with Ink & Paper minimalism — no borders, no shadows, typography-driven hierarchy, near-colorless UI.

**Architecture:** All design tokens live in `globals.css` via Tailwind v4 `@theme inline {}` + `:root`/`.dark` CSS custom properties. UI components in `packages/ui/src/` consume these tokens via Tailwind classes. App-level components in `apps/electron/src/renderer/src/` use both Tailwind classes and some legacy gold/glass utility classes that must be removed.

**Tech Stack:** Tailwind CSS v4, CSS custom properties, React, shadcn/ui (CVA), Monaco Editor

**Spec:** `docs/superpowers/specs/2026-03-11-ink-paper-design.md`

---

## File Map

### Modified Files

| File                                                                              | Responsibility                                                     |
| --------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `apps/electron/src/renderer/src/styles/globals.css`                               | All design tokens, utility classes, portal/Monaco/animation styles |
| `packages/ui/src/button.tsx`                                                      | Button variants — remove shadows                                   |
| `packages/ui/src/card.tsx`                                                        | Card component — remove hover shadow                               |
| `packages/ui/src/badge.tsx`                                                       | Badge — remove border, shadow                                      |
| `packages/ui/src/input.tsx`                                                       | Input — remove border, shadow                                      |
| `packages/ui/src/dialog.tsx`                                                      | Dialog — remove backdrop-blur, shadow                              |
| `packages/ui/src/alert-dialog.tsx`                                                | Alert dialog — remove backdrop-blur                                |
| `packages/ui/src/sheet.tsx`                                                       | Sheet — remove backdrop-blur, shadow                               |
| `packages/ui/src/tabs.tsx`                                                        | Tabs — fix rounded residuals                                       |
| `packages/ui/src/dropdown-menu.tsx`                                               | Dropdown — fix rounded, remove blur/shadow                         |
| `packages/ui/src/select.tsx`                                                      | Select — fix rounded, remove shadow                                |
| `packages/ui/src/context-menu.tsx`                                                | Context menu — remove blur, shadow                                 |
| `packages/ui/src/popover.tsx`                                                     | Popover — remove shadow, border                                    |
| `packages/ui/src/menubar.tsx`                                                     | Menubar — remove shadows                                           |
| `packages/ui/src/tooltip.tsx`                                                     | Tooltip — remove shadow, border                                    |
| `packages/ui/src/alert.tsx`                                                       | Alert — remove shadow, border                                      |
| `packages/ui/src/checkbox.tsx`                                                    | Checkbox — fix rounded residual                                    |
| `packages/ui/src/switch.tsx`                                                      | Switch — remove shadow                                             |
| `packages/ui/src/slider.tsx`                                                      | Slider — remove shadow                                             |
| `packages/ui/src/sonner.tsx`                                                      | Toast — remove shadow, blur                                        |
| `packages/ui/src/chart.tsx`                                                       | Chart tooltip — remove shadow                                      |
| `packages/ui/src/combobox.tsx`                                                    | Combobox — remove shadow                                           |
| `packages/ui/src/command.tsx`                                                     | Command — remove shadow override                                   |
| `packages/ui/src/navigation-menu.tsx`                                             | Navigation menu — remove shadow                                    |
| `packages/ui/src/sidebar.tsx`                                                     | Sidebar — remove shadows, update tokens                            |
| `packages/ui/src/decorations.tsx`                                                 | Decorations — remove gold colors                                   |
| `packages/ui/src/sanctum-card.tsx`                                                | Brand card — remove shadow/border (website component)              |
| `packages/ui/src/resizable-table.tsx`                                             | Table — remove shadow, border in context menus                     |
| `apps/electron/src/renderer/src/components/QueryEditor.tsx`                       | Replace GoldButton → Button                                        |
| `apps/electron/src/renderer/src/components/query-editor/QueryPane.tsx`            | Replace GoldButton → Button                                        |
| `apps/electron/src/renderer/src/components/settings/sections/ProSection.tsx`      | Replace GoldButton → Button                                        |
| `apps/electron/src/renderer/src/components/onboarding/WelcomeDialog.tsx`          | Replace GoldButton → Button                                        |
| `apps/electron/src/renderer/src/components/EmptyView.tsx`                         | Replace GoldButton, remove bg-grid-dot                             |
| `apps/electron/src/renderer/src/components/agent/AIAgentSidebar.tsx`              | Remove glass-gold, bg-grid-dot                                     |
| `apps/electron/src/renderer/src/components/settings/SettingsNav.tsx`              | Replace btn-gold-active / hover-gold                               |
| `apps/electron/src/renderer/src/components/agent/MessageContent.tsx`              | Remove --gold-\* var references                                    |
| `apps/electron/src/renderer/src/components/ui/ai/reasoning.tsx`                   | Remove --gold-\* var references                                    |
| `apps/electron/src/renderer/src/components/DataGrid.tsx`                          | Remove bg-grid-dot                                                 |
| `apps/electron/src/renderer/src/components/image-gallery/ImageGallery.tsx`        | Remove bg-grid-dot                                                 |
| `apps/electron/src/renderer/src/components/settings/sections/AdvancedSection.tsx` | Replace card-interactive                                           |
| `apps/electron/src/renderer/src/components/settings/sections/EditorSection.tsx`   | Replace card-interactive                                           |

---

## Chunk 1: CSS Design Tokens

### Task 1: Update `:root` Light Mode Tokens

**Files:**

- Modify: `apps/electron/src/renderer/src/styles/globals.css` (lines 125-215)

- [ ] **Step 1: Update core color tokens in `:root`**

Replace the following values in the first `:root` block:

```css
/* BEFORE → AFTER */
--main: #f97316;                    → --main: #09090b;
--main-foreground: #ffffff;         → --main-foreground: #fafafa;
--border: #e4e4e7;                  → --border: transparent;
--ring: #f97316;                    → --ring: #a1a1aa;
--input: #e4e4e7;                   → --input: #fafafa;
--card: #ffffff;                    → --card: #fafafa;
--primary: #f97316;                 → --primary: #09090b;
--primary-foreground: #ffffff;      → --primary-foreground: #fafafa;
--secondary-foreground: #09090b;    → --secondary-foreground: #3f3f46;
--muted: #f4f4f5;                   → --muted: #fafafa;
--accent: #fff7ed;                  → --accent: #f4f4f5;
--accent-foreground: #ea580c;       → --accent-foreground: #3f3f46;
--overlay: rgba(0, 0, 0, 0.4);     → --overlay: rgba(228, 228, 231, 0.7);
--popover: #ffffff;                 → --popover: #fafafa;
```

- [ ] **Step 2: Update sidebar tokens in `:root`**

```css
--sidebar-primary: #f97316;         → --sidebar-primary: #09090b;
--sidebar-primary-foreground: #ffffff; → --sidebar-primary-foreground: #fafafa;
--sidebar-border: #e4e4e7;          → --sidebar-border: transparent;
--sidebar-ring: #f97316;            → --sidebar-ring: #a1a1aa;
```

- [ ] **Step 3: Update chart colors to grayscale in `:root`**

```css
--chart-1: #f97316;  → --chart-1: #18181b;
--chart-2: #3b82f6;  → --chart-2: #3f3f46;
--chart-3: #22c55e;  → --chart-3: #71717a;
--chart-4: #a855f7;  → --chart-4: #a1a1aa;
--chart-5: #f59e0b;  → --chart-5: #d4d4d8;
```

- [ ] **Step 4: Update shadow tokens to `none` in `:root`**

```css
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);  → --shadow-sm: none;
--shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);  → --shadow: none;
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);  → --shadow-lg: none;
```

- [ ] **Step 5: Commit**

```bash
git add apps/electron/src/renderer/src/styles/globals.css
git commit -m "style: update light mode tokens for Ink & Paper design"
```

---

### Task 2: Update `.dark` Mode Tokens

**Files:**

- Modify: `apps/electron/src/renderer/src/styles/globals.css` (lines 221-301)

- [ ] **Step 1: Update core color tokens in `.dark`**

```css
--main: #fb923c;                    → --main: #fafafa;
--main-foreground: #09090b;         → --main-foreground: #09090b;
--border: #27272a;                  → --border: transparent;
--ring: #fb923c;                    → --ring: #52525b;
--input: #27272a;                   → --input: #111113;
--card: #09090b;                    → --card: #111113;
--popover: #09090b;                 → --popover: #111113;
--primary: #fb923c;                 → --primary: #fafafa;
--primary-foreground: #09090b;      → --primary-foreground: #09090b;
--secondary: #27272a;               → --secondary: #18181b;
--muted: #27272a;                   → --muted: #111113;
--muted-foreground: #a1a1aa;        → --muted-foreground: #71717a;
--accent: #27272a;                  → --accent: #18181b;
--overlay: rgba(0, 0, 0, 0.8);     → --overlay: rgba(9, 9, 11, 0.85);
--destructive: #f87171;             → --destructive: #f87171;  /* keep */
```

- [ ] **Step 2: Update sidebar tokens in `.dark`**

```css
--sidebar: #09090b;                    → --sidebar: #0c0c0e;
--sidebar-primary: #fb923c;            → --sidebar-primary: #fafafa;
--sidebar-primary-foreground: #09090b; → --sidebar-primary-foreground: #09090b;
--sidebar-border: #27272a;             → --sidebar-border: transparent;
--sidebar-ring: #fb923c;               → --sidebar-ring: #52525b;
```

- [ ] **Step 3: Update dark chart colors**

```css
/* Add dark chart colors (currently not defined in .dark, only in :root) */
--chart-1: #e4e4e7;
--chart-2: #a1a1aa;
--chart-3: #71717a;
--chart-4: #52525b;
--chart-5: #3f3f46;
```

- [ ] **Step 4: Update dark shadow tokens to `none`**

```css
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.3);  → --shadow-sm: none;
--shadow: 0 4px 6px -1px rgb(0 0 0 / 0.3)...  → --shadow: none;
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.4)...  → --shadow-lg: none;
```

- [ ] **Step 5: Commit**

```bash
git add apps/electron/src/renderer/src/styles/globals.css
git commit -m "style: update dark mode tokens for Ink & Paper design"
```

---

### Task 3: Update Radius Scale in `@theme inline {}`

**Files:**

- Modify: `apps/electron/src/renderer/src/styles/globals.css` (lines 16-119, radius section)

- [ ] **Step 1: Update radius values**

```css
--radius-sm: 6px;   → --radius-sm: 4px;
--radius-md: 8px;   → --radius-md: 6px;
--radius-lg: 12px;  → --radius-lg: 8px;
--radius-xl: 16px;  → --radius-xl: 8px;
--radius-2xl: 20px; → --radius-2xl: 8px;
--radius-3xl: 24px; → --radius-3xl: 8px;
--radius-4xl: 32px; → --radius-4xl: 8px;
```

- [ ] **Step 2: Commit**

```bash
git add apps/electron/src/renderer/src/styles/globals.css
git commit -m "style: compress radius scale for Ink & Paper design"
```

---

## Chunk 2: CSS Utility Removal & Style Updates

### Task 4: Remove Legacy Utility Classes from globals.css

**Files:**

- Modify: `apps/electron/src/renderer/src/styles/globals.css`

- [ ] **Step 1: Remove glass utilities (lines ~435-451)**

Delete the `.glass`, `.dark .glass`, `.glass-panel`, `.dark .glass-panel` rules.

- [ ] **Step 2: Remove `.glass-gold` (line ~763-767)**

Delete the `.glass-gold` rule.

- [ ] **Step 3: Remove shadow utility classes (lines ~453-462)**

Delete `.shadow-shadow`, `.shadow-shadow-sm`, `.shadow-shadow-lg` rules.
Also delete the `[class*='shadow-shadow']:active:not(:disabled)` rule (line ~981).

- [ ] **Step 4: Remove gold CSS variables and utilities (lines ~858-888)**

Delete the entire gold `:root` block:

```css
:root {
  --gold: var(--main);
  --gold-bright: var(--main);
  --gold-dark: #ea580c;
  --gold-glow: rgba(249, 115, 22, 0.2);
  --gold-subtle: rgba(249, 115, 22, 0.1);
}
```

Delete all gold utility classes:

```css
.text-gradient-gold { ... }
.glow-gold { ... }
.btn-gold-active { ... }
.hover-gold:hover { ... }
.text-gold { ... }
.bg-gold { ... }
.border-gold { ... }
```

- [ ] **Step 5: Remove `.btn-neo` and `.card-neo` (lines ~714-734, ~976)**

Delete `.btn-neo`, `.btn-neo:active`, `.card-neo`, `.card-neo:hover` rules.
Also delete the duplicate `.btn-neo:active` at line ~976.

- [ ] **Step 6: Remove `.bg-grid-dot` and `.bg-grid-line` (lines ~744-760)**

Delete both grid background pattern rules.

- [ ] **Step 7: Remove `.card-interactive` (lines ~827-841)**

Delete `.card-interactive`, `.card-interactive:hover`, `.card-interactive:active` rules.

- [ ] **Step 8: Commit**

```bash
git add apps/electron/src/renderer/src/styles/globals.css
git commit -m "style: remove legacy utility classes (glass, gold, neo, shadow, grid)"
```

---

### Task 5: Update Portal, Monaco, Animation & Selection Styles

**Files:**

- Modify: `apps/electron/src/renderer/src/styles/globals.css`

- [ ] **Step 1: Update portal element styles (lines ~485-495)**

In the `[data-slot='popover-content'], [data-slot='dropdown-menu-content']...` rule:

- Remove: `box-shadow: var(--shadow-lg) !important;`
- Remove: `border: 1px solid var(--border) !important;`

(These are now `none` and `transparent` respectively, so the `!important` declarations are unnecessary visual noise.)

- [ ] **Step 2: Update dialog overlay style (line ~1064)**

In the `[data-slot='dialog-overlay']` rule:

- Remove: `backdrop-filter: blur(4px);` (Ink & Paper: no backdrop-blur)

In the `[data-slot='dialog-content']` rule (line ~1071):

- Remove: `border: 1px solid var(--border);`
- Remove: `box-shadow: var(--shadow-lg);`
- Update: `border-radius: var(--radius-xl)` → `border-radius: var(--radius-lg)` (8px)

- [ ] **Step 3: Update Monaco editor styles (lines ~931-970)**

For all Monaco rules (`.suggest-widget`, `.suggest-details`, `.monaco-hover`, `.find-widget`, `.parameter-hints-widget`, `.monaco-menu`):

- Remove: all `border: 1px solid var(--border) !important;` lines
- Remove: all `box-shadow: var(--shadow-lg) !important;` lines
- Keep: `border-radius` and `background` declarations

- [ ] **Step 4: Update `row-highlight` animation (lines ~602-612)**

```css
/* BEFORE */
@keyframes row-highlight {
  0% {
    background-color: rgba(249, 115, 22, 0.4);
  }
  50% {
    background-color: rgba(249, 115, 22, 0.25);
  }
  100% {
    background-color: transparent;
  }
}

/* AFTER — use zinc-400 */
@keyframes row-highlight {
  0% {
    background-color: rgba(161, 161, 170, 0.4);
  }
  50% {
    background-color: rgba(161, 161, 170, 0.25);
  }
  100% {
    background-color: transparent;
  }
}
```

- [ ] **Step 5: Update `::selection` (lines ~1119-1122)**

```css
/* BEFORE */
::selection {
  background: rgba(249, 115, 22, 0.2);
  color: var(--foreground);
}

/* AFTER — use zinc-400 */
::selection {
  background: rgba(161, 161, 170, 0.2);
  color: var(--foreground);
}
```

- [ ] **Step 6: Commit**

```bash
git add apps/electron/src/renderer/src/styles/globals.css
git commit -m "style: update portal, Monaco, animation & selection for Ink & Paper"
```

---

## Chunk 3: UI Component Cleanup — Shadows, Borders, Blur

### Task 6: Update Core Form Components

**Files:**

- Modify: `packages/ui/src/button.tsx`
- Modify: `packages/ui/src/input.tsx`
- Modify: `packages/ui/src/checkbox.tsx`
- Modify: `packages/ui/src/switch.tsx`
- Modify: `packages/ui/src/slider.tsx`

- [ ] **Step 1: button.tsx — remove shadow-sm from all variants**

In every variant that has `shadow-sm`, remove it. The variants are: `default`, `neutral`, `outline`, `destructive`, `accent`. Keep all other classes intact.

- [ ] **Step 2: button.tsx — remove hover:shadow-md from `reverse` variant**

The `reverse` variant has `hover:shadow-md` — remove it.

- [ ] **Step 3: input.tsx — remove border and shadow**

Remove `border-border border` and `shadow-sm` from the base input class string. The input's `--input` token is now a background fill (`#fafafa` / `#111113`), so the background class already handles styling.

- [ ] **Step 4: checkbox.tsx — fix rounded and remove shadow**

- Change `rounded-[4px]` → `rounded-sm` (4px via new radius scale)
- Remove `shadow-sm` if present

- [ ] **Step 5: switch.tsx — remove shadow-sm**

Remove `shadow-sm` from the outer track and the thumb element.

- [ ] **Step 6: slider.tsx — remove shadow-sm**

Remove `shadow-sm` from the thumb element.

- [ ] **Step 7: Commit**

```bash
git add packages/ui/src/button.tsx packages/ui/src/input.tsx packages/ui/src/checkbox.tsx packages/ui/src/switch.tsx packages/ui/src/slider.tsx
git commit -m "style(ui): remove shadows from core form components"
```

---

### Task 7: Update Badge, Alert, Tooltip

**Files:**

- Modify: `packages/ui/src/badge.tsx`
- Modify: `packages/ui/src/alert.tsx`
- Modify: `packages/ui/src/tooltip.tsx`

- [ ] **Step 1: badge.tsx — remove border and shadow from base**

Remove `border border-border` and `shadow-sm` from the base badge class string. Keep `shadow-none` on specific variants (it's harmless and was intentional for override).

- [ ] **Step 2: alert.tsx — remove border and shadow**

Remove `border border-border` and `shadow-sm` from the base alert class string.

- [ ] **Step 3: tooltip.tsx — remove border and shadow**

Remove `border-border border` and `shadow-sm` from `TooltipContent`.

- [ ] **Step 4: Commit**

```bash
git add packages/ui/src/badge.tsx packages/ui/src/alert.tsx packages/ui/src/tooltip.tsx
git commit -m "style(ui): remove borders and shadows from badge, alert, tooltip"
```

---

### Task 8: Update Overlay Components (Dialog, AlertDialog, Sheet)

**Files:**

- Modify: `packages/ui/src/dialog.tsx`
- Modify: `packages/ui/src/alert-dialog.tsx`
- Modify: `packages/ui/src/sheet.tsx`
- Modify: `packages/ui/src/sonner.tsx`

- [ ] **Step 1: dialog.tsx — remove backdrop-blur and shadow**

- `DialogOverlay`: remove `backdrop-blur-sm`
- `DialogContent`: remove `shadow-lg`, remove `border-border border`

- [ ] **Step 2: alert-dialog.tsx — remove backdrop-blur**

- Overlay: remove `backdrop-blur-xs` (via supports query)
- Content: remove `backdrop-blur-md` if present

- [ ] **Step 3: sheet.tsx — remove backdrop-blur and shadow**

- Overlay: remove `backdrop-blur-xs`
- Content: remove `backdrop-blur-md`, remove `shadow-lg`

- [ ] **Step 4: sonner.tsx — remove shadow and blur**

Remove `shadow-lg` and `backdrop-blur-sm` from toast styles.

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/dialog.tsx packages/ui/src/alert-dialog.tsx packages/ui/src/sheet.tsx packages/ui/src/sonner.tsx
git commit -m "style(ui): remove blur and shadows from overlay components"
```

---

### Task 9: Update Menu & Popover Components

**Files:**

- Modify: `packages/ui/src/dropdown-menu.tsx`
- Modify: `packages/ui/src/select.tsx`
- Modify: `packages/ui/src/context-menu.tsx`
- Modify: `packages/ui/src/popover.tsx`
- Modify: `packages/ui/src/menubar.tsx`
- Modify: `packages/ui/src/combobox.tsx`
- Modify: `packages/ui/src/command.tsx`
- Modify: `packages/ui/src/navigation-menu.tsx`

- [ ] **Step 1: dropdown-menu.tsx**

- `DropdownMenuContent`: remove `backdrop-blur-md`, `shadow-lg`, `border-border`
- `DropdownMenuSubContent`: remove `backdrop-blur-md`, `shadow-lg`, `border-border`
- All items (`DropdownMenuItem`, `DropdownMenuSubTrigger`, `DropdownMenuCheckboxItem`, `DropdownMenuRadioItem`): change `rounded-[3px]` → `rounded-sm`

- [ ] **Step 2: select.tsx**

- `SelectContent`: remove `shadow-md`, `border-border ... border`
- `SelectItem`: change `rounded-[3px]` → `rounded-sm`

- [ ] **Step 3: context-menu.tsx**

- `ContextMenuContent`: remove `backdrop-blur-md`, `shadow-lg`
- `ContextMenuSubContent`: remove `shadow-lg`

- [ ] **Step 4: popover.tsx**

- `PopoverContent`: remove `shadow-md`, `border-border`

- [ ] **Step 5: menubar.tsx**

- `Menubar` root: remove `shadow-xs`
- `MenubarContent`: remove `shadow-md`
- `MenubarSubContent`: remove `shadow-lg`

- [ ] **Step 6: combobox.tsx**

- `ComboboxContent`: remove `shadow-md`

- [ ] **Step 7: command.tsx**

- Remove `shadow-none!` forced override (no longer needed when shadows are `none` globally)

- [ ] **Step 8: navigation-menu.tsx**

- Remove `shadow-md` from indicator div

- [ ] **Step 9: Commit**

```bash
git add packages/ui/src/dropdown-menu.tsx packages/ui/src/select.tsx packages/ui/src/context-menu.tsx packages/ui/src/popover.tsx packages/ui/src/menubar.tsx packages/ui/src/combobox.tsx packages/ui/src/command.tsx packages/ui/src/navigation-menu.tsx
git commit -m "style(ui): remove shadows, blur, borders from menu components"
```

---

### Task 10: Update Remaining UI Components

**Files:**

- Modify: `packages/ui/src/tabs.tsx`
- Modify: `packages/ui/src/card.tsx`
- Modify: `packages/ui/src/sidebar.tsx`
- Modify: `packages/ui/src/chart.tsx`
- Modify: `packages/ui/src/resizable-table.tsx`
- Modify: `packages/ui/src/sanctum-card.tsx`
- Modify: `packages/ui/src/decorations.tsx`

- [ ] **Step 1: tabs.tsx — fix rounded residuals**

- `TabsList`: change `rounded-[5px]` → `rounded-md` (6px)
- `TabsTrigger`: change `rounded-[3px]` → `rounded-sm` (4px)

- [ ] **Step 2: card.tsx — remove hover shadow**

- Remove `hover:shadow-md` from the card component

- [ ] **Step 3: sidebar.tsx — remove shadows**

- Remove `shadow-sm` from floating variant inner panel (line ~212)
- Remove `shadow-sm` from inset variant (line ~278)
- Remove `shadow-none` from `SidebarInput` (line ~295) — harmless but unnecessary
- Remove custom `shadow-[0_0_0_1px_hsl(var(--sidebar-border))]` and hover shadow from outline menu button (line ~451). Replace with a simple background hover instead.

- [ ] **Step 4: chart.tsx — remove shadow**

- Remove `shadow-xl` from chart tooltip container

- [ ] **Step 5: resizable-table.tsx — remove shadow and border from context menus**

- Remove `shadow-lg` from context menu elements (lines ~510, ~564)
- Remove `border-border/50` from context menu elements

- [ ] **Step 6: sanctum-card.tsx — remove shadow and border**

- Remove `hover:shadow-lg`, `hover:border-primary/30`, `group-hover/brand-card:border-primary/20`
- Remove `border-border/10` from inner frames (lines ~40, ~63)
- This is mainly used by the website but lives in the shared UI package

- [ ] **Step 7: decorations.tsx — neutralize gold colors**

- `DecoFrame`: change `border-[#C9A962]` → `border-border` (3 occurrences)
- `GoldDivider`: remove `shadow-[0_0_8px_rgba(212,175,55,0.4)]` gold glow
- Change any hardcoded gold hex colors to neutral zinc equivalents

- [ ] **Step 8: Commit**

```bash
git add packages/ui/src/tabs.tsx packages/ui/src/card.tsx packages/ui/src/sidebar.tsx packages/ui/src/chart.tsx packages/ui/src/resizable-table.tsx packages/ui/src/sanctum-card.tsx packages/ui/src/decorations.tsx
git commit -m "style(ui): update tabs, card, sidebar, chart, table, decorations"
```

---

## Chunk 4: App Component Migration

### Task 11: Replace GoldButton with Button

**Files:**

- Modify: `apps/electron/src/renderer/src/components/QueryEditor.tsx`
- Modify: `apps/electron/src/renderer/src/components/query-editor/QueryPane.tsx`
- Modify: `apps/electron/src/renderer/src/components/settings/sections/ProSection.tsx`
- Modify: `apps/electron/src/renderer/src/components/onboarding/WelcomeDialog.tsx`
- Modify: `apps/electron/src/renderer/src/components/EmptyView.tsx`

- [ ] **Step 1: QueryEditor.tsx — replace import and usage**

Change `import { GoldButton } from '@quarry/ui/gold-button'` → `import { Button } from '@quarry/ui/button'`.
Replace all `<GoldButton` → `<Button` and `</GoldButton>` → `</Button>`.
Keep existing variant/size props (they are compatible between BrandButton and Button).

- [ ] **Step 2: QueryPane.tsx — same replacement**

Same import swap and component rename.

- [ ] **Step 3: ProSection.tsx — same replacement**

Same import swap and component rename.

- [ ] **Step 4: WelcomeDialog.tsx — same replacement**

Same import swap and component rename. Note: uses `variant="ghost"` which exists on Button.

- [ ] **Step 5: EmptyView.tsx — replace GoldButton and remove bg-grid-dot**

- Same import swap and component rename
- Remove `bg-grid-dot` from the container className (line ~47). Replace with just the remaining classes.

- [ ] **Step 6: Commit**

```bash
git add apps/electron/src/renderer/src/components/QueryEditor.tsx \
  apps/electron/src/renderer/src/components/query-editor/QueryPane.tsx \
  apps/electron/src/renderer/src/components/settings/sections/ProSection.tsx \
  apps/electron/src/renderer/src/components/onboarding/WelcomeDialog.tsx \
  apps/electron/src/renderer/src/components/EmptyView.tsx
git commit -m "refactor: replace GoldButton with Button across app"
```

---

### Task 12: Remove Glass, Grid & Gold Variable References

**Files:**

- Modify: `apps/electron/src/renderer/src/components/agent/AIAgentSidebar.tsx`
- Modify: `apps/electron/src/renderer/src/components/agent/MessageContent.tsx`
- Modify: `apps/electron/src/renderer/src/components/ui/ai/reasoning.tsx`
- Modify: `apps/electron/src/renderer/src/components/DataGrid.tsx`
- Modify: `apps/electron/src/renderer/src/components/image-gallery/ImageGallery.tsx`

- [ ] **Step 1: AIAgentSidebar.tsx — remove glass-gold and bg-grid-dot**

Replace `glass-gold bg-grid-dot` with `bg-card` in classNames (lines ~206, ~245, ~360). The `bg-card` token now provides the subtle background step per Ink & Paper spec.

- [ ] **Step 2: MessageContent.tsx — replace --gold-\* var references**

Replace `border-[var(--gold-muted)]/30 bg-[var(--gold-subtle)]` (line ~233) with `border-border bg-muted`.
Replace `border-[var(--gold-muted)]/20` (line ~266) with `border-border`.

- [ ] **Step 3: reasoning.tsx — replace --gold-\* var references**

Replace `border-[var(--gold-muted,...)] bg-[var(--gold-subtle,...)]` with `border-border bg-muted`.
Replace `border-[var(--gold-muted,...)]` with `border-border`.

- [ ] **Step 4: DataGrid.tsx — remove bg-grid-dot**

Remove `bg-grid-dot` from className (line ~112). Keep other classes.

- [ ] **Step 5: ImageGallery.tsx — remove bg-grid-dot**

Remove `bg-grid-dot` from className (line ~712). Keep other classes.

- [ ] **Step 6: Commit**

```bash
git add apps/electron/src/renderer/src/components/agent/AIAgentSidebar.tsx \
  apps/electron/src/renderer/src/components/agent/MessageContent.tsx \
  apps/electron/src/renderer/src/components/ui/ai/reasoning.tsx \
  apps/electron/src/renderer/src/components/DataGrid.tsx \
  apps/electron/src/renderer/src/components/image-gallery/ImageGallery.tsx
git commit -m "refactor: remove glass, grid-dot, gold-var references from app components"
```

---

### Task 13: Update Settings & Card-Interactive Components

**Files:**

- Modify: `apps/electron/src/renderer/src/components/settings/SettingsNav.tsx`
- Modify: `apps/electron/src/renderer/src/components/settings/sections/AdvancedSection.tsx`
- Modify: `apps/electron/src/renderer/src/components/settings/sections/EditorSection.tsx`

- [ ] **Step 1: SettingsNav.tsx — replace gold classes**

Replace `isActive ? 'btn-gold-active font-medium' : 'hover-gold'` (line ~50) with:
`isActive ? 'bg-accent text-accent-foreground font-medium' : 'hover:bg-accent hover:text-accent-foreground'`

These use standard Ink & Paper neutral tokens.

- [ ] **Step 2: AdvancedSection.tsx — replace card-interactive**

Replace `card-interactive` (line ~48) with `bg-card rounded-lg transition-colors hover:bg-accent`.

- [ ] **Step 3: EditorSection.tsx — replace card-interactive**

Same replacement as AdvancedSection.

- [ ] **Step 4: Commit**

```bash
git add apps/electron/src/renderer/src/components/settings/SettingsNav.tsx \
  apps/electron/src/renderer/src/components/settings/sections/AdvancedSection.tsx \
  apps/electron/src/renderer/src/components/settings/sections/EditorSection.tsx
git commit -m "refactor: replace gold and card-interactive classes in settings"
```

---

## Chunk 5: Final Cleanup & Verification

### Task 14: Deprecate gold-button.tsx Exports

**Files:**

- Modify: `packages/ui/src/gold-button.tsx`

- [ ] **Step 1: Keep the file but mark exports as deprecated**

The file currently exports `BrandButton` (real) and `GoldButton` (alias). Since all consumers now import `Button` directly, the `GoldButton` alias is unused. However, `BrandButton` may still be used by the website. Leave `BrandButton` intact. Only remove the `GoldButton` re-export if no consumers remain.

Check for remaining `GoldButton` imports:

```bash
grep -r "GoldButton\|gold-button" apps/ packages/ --include="*.tsx" --include="*.ts"
```

If no consumers remain, remove the `GoldButton`, `GoldButtonProps`, `goldButtonVariants` aliases from the file.

- [ ] **Step 2: Commit**

```bash
git add packages/ui/src/gold-button.tsx
git commit -m "refactor(ui): clean up GoldButton legacy aliases"
```

---

### Task 15: Build Verification

- [ ] **Step 1: Run typecheck**

```bash
pnpm run typecheck
```

Expected: No type errors. The changes are CSS-only — no TypeScript signatures changed except import paths.

- [ ] **Step 2: Run lint**

```bash
pnpm run lint
```

Expected: No new lint errors.

- [ ] **Step 3: Run build**

```bash
pnpm run build
```

Expected: Successful build.

- [ ] **Step 4: Verify no remaining gold/glass/neo references in electron app**

```bash
grep -r "gold\|glass-gold\|glass-panel\|btn-neo\|card-neo\|bg-grid-dot\|bg-grid-line\|shadow-shadow\|card-interactive" apps/electron/src/ --include="*.tsx" --include="*.ts" --include="*.css"
```

Expected: Zero matches (or only in comments/strings unrelated to CSS classes).

- [ ] **Step 5: If all clean, create final summary commit**

```bash
git add -A
git commit -m "style: complete Ink & Paper design migration

Replaces Neobrutalism design with Ink & Paper minimalism:
- Borders transparent, shadows none
- Orange primary → black/white
- Typography-driven hierarchy
- Removed glass, gold, neo utilities
- Updated all UI components and app references"
```

Only create this commit if there are uncommitted changes from fixing issues found in steps 1-4.

---

## Implementation Notes

- **Website app (`apps/website/`)**: Uses its own `sanctum.ts` theme exports with emerald primary. The website CSS (`apps/website/src/index.css`) has its own `btn-neo-primary`, `card-neo-lift` etc. These are NOT touched by this plan — the website has an independent design.
- **Type category colors** (`--type-numeric`, `--type-date`, etc.): These are functional data-type indicators, not brand colors. They are kept as-is per the design philosophy (semantic status colors are allowed).
- **Status colors** (`--success`, `--warning`, `--info`): Kept as-is — these are functional semantic colors, not decorative.
- **`--destructive`**: Kept as red — this is a semantic safety color.
- **`focus-visible:ring-main`** references in toggle.tsx, tabs.tsx, select.tsx: The `--main` token now resolves to `#09090b` (light) / `#fafafa` (dark), but the spec says focus ring should be `--ring` (zinc-400/zinc-600). These references use `ring-main` not `ring-ring`, so they will show black/white rings instead of zinc. This is acceptable — the ring is still neutral. If a subtler ring is preferred, change `ring-main` → `ring-ring` in those three files, but this is optional.
- **`bg-main/10`, `hover:bg-main/10`** in table.tsx, toggle.tsx, dropdown items: The `--main` is now black/white, so `bg-main/10` gives a 10% black/white wash. This is exactly what Ink & Paper intends for hover/selected states.
