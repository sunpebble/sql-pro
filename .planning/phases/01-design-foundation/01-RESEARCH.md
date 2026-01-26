# Phase 1: Design Foundation - Research

**Researched:** 2026-01-26
**Domain:** CSS Design System, OKLCH Color Space, Dark-First Architecture
**Confidence:** HIGH

## Summary

This research covers the migration of SQL Pro's design system to a dark-first CSS architecture with OKLCH colors, Slate neutrals, and refined spacing/radius tokens. The current codebase already uses OKLCH colors extensively (GREEN accent at ~142 hue, CYAN accent at ~195 hue) and has a well-structured CSS variable system.

The key insight is that the Electron app's globals.css is already CLOSE to the target state (using OKLCH, Slate palette, green primary). The CLAUDE.md describes an outdated "Warm Modern" orange theme that no longer matches the actual implementation. The website CSS is dark-first but uses inconsistent variable naming.

**Primary recommendation:** Consolidate the three CSS files (electron globals.css, website index.css, shared ui sanctum.css) to use identical OKLCH Slate tokens with dark-first structure (`:root` = dark, `.light` = override), reduce border-radius values to 8-12px max, and update borders to 6-10% opacity transparent style.

## Current State Analysis

### File Locations and Responsibilities

| File                                                | Purpose                      | Lines | State                                          |
| --------------------------------------------------- | ---------------------------- | ----- | ---------------------------------------------- |
| `apps/electron/src/renderer/src/styles/globals.css` | Electron app theme           | ~1565 | Already OKLCH + Slate, light-first             |
| `apps/website/src/index.css`                        | Website theme                | ~1197 | Already OKLCH, dark-first, different var names |
| `packages/ui/src/sanctum.css`                       | Shared UI animations/effects | ~386  | OKLCH, light-first, green accent               |

### Current CSS Variable Structure

**Electron App (globals.css) - Light-First:**

```css
:root {
  /* Light mode values */
  --primary: oklch(0.723 0.191 142.5); /* Green 500 */
  --background: oklch(0.984 0.003 247); /* Slate 50 */
  --foreground: oklch(0.129 0.042 264.7); /* Slate 900 */
  --border: oklch(0.929 0.007 247.9); /* Slate 200 */
  --radius: 0.625rem; /* 10px base */
}
.dark {
  /* Dark mode overrides */
  --background: oklch(0.129 0.042 264.7); /* Slate 900 */
  --border: oklch(1 0 0 / 8%); /* White 8% opacity */
}
```

**Website (index.css) - Dark-First (TARGET PATTERN):**

```css
:root {
  /* Dark mode values by default */
  --bg-dark: oklch(0.13 0.02 255); /* Slate 900 */
  --text-primary: oklch(0.97 0.002 250); /* Slate 50 */
  --border-subtle: oklch(1 0 0 / 6%);
  --border-light: oklch(1 0 0 / 10%);
}
.light {
  /* Light mode override */
  --bg-dark: oklch(0.985 0.002 250);
  --text-primary: oklch(0.15 0.02 255);
}
```

### Current Border Radius Values

| Location                       | Current Value                      | Context           |
| ------------------------------ | ---------------------------------- | ----------------- |
| Electron `--radius`            | `0.625rem` (10px)                  | Base radius token |
| Electron `--radius-xl`         | `calc(var(--radius) + 4px)` = 14px | Larger elements   |
| Website `--border-radius-lg`   | `16px`                             | Cards, modals     |
| Website `--border-radius-xl`   | `20px`                             | Large cards       |
| Website `--border-radius-2xl`  | `24px`                             | Hero elements     |
| Shared UI `--border-radius-lg` | `12px`                             | Component default |

### Current Border Styles

| Mode           | Current Approach                            | Opacity     |
| -------------- | ------------------------------------------- | ----------- |
| Electron Dark  | `oklch(1 0 0 / 8%)`                         | 8% white    |
| Website Dark   | `oklch(1 0 0 / 6%)` to `oklch(1 0 0 / 15%)` | 6-15% white |
| Electron Light | Solid Slate colors                          | N/A (solid) |

## Target State Specification

### 1. Dark-First CSS Variable Structure

**REQUIREMENT FOUND-01:** Dark mode as `:root` default, `.light` class for light mode override.

```css
/* TARGET: Dark mode is the base */
:root {
  color-scheme: dark;

  /* Slate neutral palette - Dark mode values */
  --slate-50: oklch(0.984 0.003 247.858);
  --slate-100: oklch(0.968 0.007 247.896);
  --slate-200: oklch(0.929 0.013 255.508);
  --slate-300: oklch(0.869 0.022 252.894);
  --slate-400: oklch(0.704 0.04 256.788);
  --slate-500: oklch(0.554 0.046 257.417);
  --slate-600: oklch(0.446 0.043 257.281);
  --slate-700: oklch(0.372 0.044 257.287);
  --slate-800: oklch(0.279 0.041 260.031);
  --slate-900: oklch(0.208 0.042 265.755);
  --slate-950: oklch(0.129 0.042 264.695);

  /* Semantic tokens mapped for dark mode */
  --background: var(--slate-900);
  --foreground: var(--slate-100);
  --card: var(--slate-800);
  --muted: var(--slate-700);
  --muted-foreground: var(--slate-400);
  --border: oklch(1 0 0 / 8%);
}

/* Light mode override */
.light {
  color-scheme: light;
  --background: var(--slate-50);
  --foreground: var(--slate-900);
  --card: white;
  --muted: var(--slate-100);
  --muted-foreground: var(--slate-500);
  --border: oklch(0 0 0 / 8%);
}
```

### 2. OKLCH Slate Neutral Palette (FOUND-02)

**Exact OKLCH values from Tailwind CSS v4:**

| Token         | OKLCH Value                  | Usage                     |
| ------------- | ---------------------------- | ------------------------- |
| `--slate-50`  | `oklch(0.984 0.003 247.858)` | Light mode background     |
| `--slate-100` | `oklch(0.968 0.007 247.896)` | Light mode cards          |
| `--slate-200` | `oklch(0.929 0.013 255.508)` | Light mode borders        |
| `--slate-300` | `oklch(0.869 0.022 252.894)` | Light mode muted text     |
| `--slate-400` | `oklch(0.704 0.04 256.788)`  | Dark mode muted text      |
| `--slate-500` | `oklch(0.554 0.046 257.417)` | Mid-range text            |
| `--slate-600` | `oklch(0.446 0.043 257.281)` | Light mode secondary text |
| `--slate-700` | `oklch(0.372 0.044 257.287)` | Dark mode muted bg        |
| `--slate-800` | `oklch(0.279 0.041 260.031)` | Dark mode cards           |
| `--slate-900` | `oklch(0.208 0.042 265.755)` | Dark mode background      |
| `--slate-950` | `oklch(0.129 0.042 264.695)` | Deepest dark              |

### 3. Orange Accent for Dark Mode (FOUND-03)

**OKLCH Orange Palette from Tailwind CSS v4:**

| Shade      | OKLCH Value                 | Recommendation                                       |
| ---------- | --------------------------- | ---------------------------------------------------- |
| orange-400 | `oklch(0.75 0.183 55.934)`  | **Primary dark mode** - bright enough for visibility |
| orange-500 | `oklch(0.705 0.213 47.604)` | Secondary accent                                     |
| orange-600 | `oklch(0.646 0.222 41.116)` | Light mode primary                                   |

**Dark mode accent recommendation:**

- Use `orange-400` (`oklch(0.75 0.183 55.934)`) for dark backgrounds - higher lightness (0.75) ensures readability
- The current green accent uses `oklch(0.792 0.209 151.7)` for dark mode - same L=0.79 principle

**Note:** The current codebase uses GREEN as primary, not orange. If switching to orange:

```css
:root {
  /* Dark mode orange */
  --primary: oklch(0.75 0.183 55.934); /* orange-400 */
  --primary-foreground: oklch(0.15 0.02 40); /* Dark text on orange */
}
.light {
  /* Light mode orange */
  --primary: oklch(0.646 0.222 41.116); /* orange-600 */
}
```

### 4. Border Radius System (FOUND-04)

**Target: 8-12px maximum (down from 20px+)**

```css
:root {
  --radius: 0.5rem; /* 8px base */
  --radius-sm: calc(var(--radius) - 2px); /* 6px */
  --radius-md: var(--radius); /* 8px */
  --radius-lg: calc(var(--radius) + 2px); /* 10px */
  --radius-xl: calc(var(--radius) + 4px); /* 12px - MAX */
  --radius-2xl: calc(var(--radius) + 4px); /* 12px - same as xl, cap */
  --radius-full: 9999px; /* Pills only */
}
```

**Components to update with explicit radius:**

- Cards: `rounded-xl` (12px) instead of `rounded-2xl` (16px+)
- Dialogs: `rounded-lg` (10px) instead of `rounded-xl`
- Buttons: `rounded-md` (8px) - already correct
- Inputs: `rounded-md` (8px) - already correct
- Tooltips: `rounded-md` (8px)
- Popovers: `rounded-lg` (10px)

### 5. Transparent Border System (FOUND-05)

**Target: 6-10% opacity borders**

```css
:root {
  /* Dark mode - white with opacity */
  --border: oklch(1 0 0 / 8%);
  --border-subtle: oklch(1 0 0 / 6%);
  --border-strong: oklch(1 0 0 / 12%);
  --input: oklch(1 0 0 / 10%);
}
.light {
  /* Light mode - black with opacity */
  --border: oklch(0 0 0 / 8%);
  --border-subtle: oklch(0 0 0 / 6%);
  --border-strong: oklch(0 0 0 / 12%);
  --input: oklch(0 0 0 / 10%);
}
```

### 6. Shadow System for Dark Mode (FOUND-06)

**Target: Subtle shadows that work on dark backgrounds**

```css
:root {
  /* Dark mode shadows - more pronounced blacks */
  --shadow-xs: 0 1px 2px 0 oklch(0 0 0 / 20%);
  --shadow-sm:
    0 1px 3px 0 oklch(0 0 0 / 30%), 0 1px 2px -1px oklch(0 0 0 / 20%);
  --shadow-md:
    0 4px 6px -1px oklch(0 0 0 / 35%), 0 2px 4px -2px oklch(0 0 0 / 25%);
  --shadow-lg:
    0 10px 15px -3px oklch(0 0 0 / 40%), 0 4px 6px -4px oklch(0 0 0 / 30%);
  --shadow-card: 0 4px 24px oklch(0 0 0 / 40%);

  /* Primary glow */
  --shadow-glow: 0 0 40px oklch(var(--primary) / 20%);
}
.light {
  /* Light mode shadows - lighter */
  --shadow-xs: 0 1px 2px 0 oklch(0 0 0 / 5%);
  --shadow-sm:
    0 1px 3px 0 oklch(0 0 0 / 10%), 0 1px 2px -1px oklch(0 0 0 / 10%);
  --shadow-md:
    0 4px 6px -1px oklch(0 0 0 / 10%), 0 2px 4px -2px oklch(0 0 0 / 10%);
  --shadow-lg:
    0 10px 15px -3px oklch(0 0 0 / 12%), 0 4px 6px -4px oklch(0 0 0 / 10%);
  --shadow-card: 0 4px 24px oklch(0 0 0 / 10%);
}
```

## Files to Modify

### Primary Files (Must Change)

1. **`apps/electron/src/renderer/src/styles/globals.css`**
   - Invert `:root` and `.dark` (make `:root` dark, add `.light`)
   - Update all hardcoded OKLCH values to use Slate tokens
   - Reduce `--radius` from 0.625rem to 0.5rem
   - Update border variables to opacity-based
   - Update shadow variables for dark mode

2. **`apps/website/src/index.css`**
   - Already dark-first - align variable names with electron app
   - Consolidate radius variables to match electron
   - Ensure border opacity values are consistent

3. **`packages/ui/src/sanctum.css`**
   - Invert `:root` and `.dark` sections
   - Update color values to match new system
   - Remove legacy "gold" aliases (or update to new accent)

### Secondary Files (May Need Updates)

4. **`packages/ui/src/*.tsx`** - 55 component files
   - Components use Tailwind classes (`rounded-xl`, `ring-foreground/10`)
   - These automatically pick up CSS variable changes
   - May need explicit radius class updates where hardcoded

5. **`CLAUDE.md`**
   - Update to reflect actual design system (dark-first, Slate, current accent)
   - Remove outdated "Warm Modern" orange references if keeping green

## Architecture Patterns

### Recommended CSS Variable Organization

```css
/* ═══════════════════════════════════════
   1. PRIMITIVE PALETTE TOKENS
   Raw color values, never used directly
   ═══════════════════════════════════════ */
:root {
  /* Slate scale */
  --slate-50: oklch(0.984 0.003 247.858);
  /* ... all 11 shades ... */
  --slate-950: oklch(0.129 0.042 264.695);

  /* Orange scale (for primary) */
  --orange-400: oklch(0.75 0.183 55.934);
  --orange-500: oklch(0.705 0.213 47.604);
  --orange-600: oklch(0.646 0.222 41.116);
}

/* ═══════════════════════════════════════
   2. SEMANTIC TOKENS
   Mapped from primitives, mode-aware
   ═══════════════════════════════════════ */
:root {
  /* Dark mode semantic mappings */
  --background: var(--slate-900);
  --foreground: var(--slate-100);
  --primary: var(--orange-400);
  --border: oklch(1 0 0 / 8%);
}
.light {
  --background: var(--slate-50);
  --foreground: var(--slate-900);
  --primary: var(--orange-600);
  --border: oklch(0 0 0 / 8%);
}

/* ═══════════════════════════════════════
   3. COMPONENT TOKENS
   Derived from semantic, component-specific
   ═══════════════════════════════════════ */
:root {
  --card: var(--slate-800);
  --card-foreground: var(--foreground);
  --popover: var(--card);
  --popover-foreground: var(--foreground);
}
```

### Anti-Patterns to Avoid

1. **Don't mix hex and OKLCH** - Use OKLCH exclusively for consistency
2. **Don't use solid colors for borders in dark mode** - Use opacity-based
3. **Don't have radius values > 12px** - Caps at 12px for professional look
4. **Don't duplicate tokens across files** - Single source of truth

## Don't Hand-Roll

| Problem             | Don't Build         | Use Instead                           | Why                        |
| ------------------- | ------------------- | ------------------------------------- | -------------------------- |
| Color conversion    | Manual hex-to-oklch | Tailwind's documented values          | Precision, consistency     |
| Dark mode detection | Custom JS           | `prefers-color-scheme` + class toggle | Standard, performant       |
| Opacity borders     | Hardcoded rgba      | OKLCH with `/` opacity syntax         | OKLCH color space benefits |

## Common Pitfalls

### Pitfall 1: Forgetting the Tailwind @theme Layer

**What goes wrong:** CSS variables defined but Tailwind utilities don't pick them up
**Why it happens:** Tailwind v4 needs `@theme` block for runtime variable mapping
**How to avoid:** Ensure all color/radius variables are also in `@theme inline {}` block
**Warning signs:** `bg-primary` works but actual color doesn't match `--primary`

### Pitfall 2: Inverted Focus Ring Visibility

**What goes wrong:** Focus rings invisible on dark backgrounds
**Why it happens:** Ring color designed for light mode
**How to avoid:** Use primary color for focus ring, ensure 3:1 contrast ratio
**Warning signs:** Can't see focus state when tabbing in dark mode

### Pitfall 3: Border Opacity on Overlapping Elements

**What goes wrong:** Borders appear darker where elements overlap
**Why it happens:** Multiple semi-transparent borders stacking
**How to avoid:** Use `border-collapse` or single border side, not all sides
**Warning signs:** Grid/table borders look uneven

### Pitfall 4: Shadow Glow Color Mismatch

**What goes wrong:** Glow effects look wrong after accent color change
**Why it happens:** Hardcoded glow colors don't reference `--primary`
**How to avoid:** Define glow colors using primary variable with opacity
**Warning signs:** Green glow on orange buttons

## Code Examples

### Dark-First Variable Structure (Official Pattern)

```css
/* Source: Tailwind CSS v4 + shadcn/ui conventions */
:root {
  color-scheme: dark;
  --background: oklch(0.208 0.042 265.755);
  --foreground: oklch(0.968 0.007 247.896);
  --primary: oklch(0.75 0.183 55.934);
  --primary-foreground: oklch(0.266 0.079 36.259);
  --border: oklch(1 0 0 / 8%);
  --radius: 0.5rem;
}

.light {
  color-scheme: light;
  --background: oklch(0.984 0.003 247.858);
  --foreground: oklch(0.208 0.042 265.755);
  --primary: oklch(0.646 0.222 41.116);
  --primary-foreground: oklch(0.98 0.016 73.684);
  --border: oklch(0 0 0 / 8%);
}
```

### Opacity Border Pattern

```css
/* Source: Linear/Raycast design pattern */
:root {
  --border: oklch(1 0 0 / 8%);
  --border-subtle: oklch(1 0 0 / 6%);
  --border-strong: oklch(1 0 0 / 12%);
  --ring: oklch(var(--primary) / 50%);
}
```

### Reduced Radius System

```css
/* Source: Professional UI guidelines */
:root {
  --radius: 0.5rem; /* 8px */
}

@theme inline {
  --radius-sm: calc(var(--radius) - 2px);
  --radius-md: var(--radius);
  --radius-lg: calc(var(--radius) + 2px);
  --radius-xl: calc(var(--radius) + 4px); /* 12px max */
}
```

## Dependencies and Order of Changes

### Phase 1.1: Core Variable Structure

1. Update `globals.css` `:root` to dark mode values
2. Create `.light` class with light mode overrides
3. Add Slate primitive tokens at top
4. Map semantic tokens to primitives

### Phase 1.2: Border and Radius Tokens

1. Update `--radius` to 0.5rem (8px base)
2. Update border variables to opacity format
3. Verify Tailwind `@theme` block includes all tokens

### Phase 1.3: Shadow System

1. Update shadow variables for dark mode visibility
2. Update glow effects to use primary variable

### Phase 1.4: Website Alignment

1. Align website variable names with electron
2. Update website radius variables
3. Test light/dark mode toggle

### Phase 1.5: Shared UI Package

1. Update sanctum.css to dark-first
2. Verify component styles inherit correctly

## Open Questions

1. **Accent Color Decision**
   - What we know: Current codebase uses GREEN, CLAUDE.md describes ORANGE
   - What's unclear: Which is the intended brand direction?
   - Recommendation: Keep GREEN (already implemented) or explicitly decide on ORANGE migration

2. **Typography Changes**
   - What we know: Phase mentions only colors/radius/borders
   - What's unclear: Are font changes included in this phase?
   - Recommendation: Exclude typography from Phase 1, handle separately if needed

## Sources

### Primary (HIGH confidence)

- Tailwind CSS v4 documentation - Slate and Orange OKLCH palettes
- Current codebase analysis - globals.css, index.css, sanctum.css

### Secondary (MEDIUM confidence)

- shadcn/ui conventions for CSS variable naming
- Linear/Raycast design pattern references (dark-first, opacity borders)

### Tertiary (LOW confidence)

- General web search for dark-mode-first CSS patterns

## Metadata

**Confidence breakdown:**

- Slate palette values: HIGH - directly from Tailwind v4 docs
- Dark-first pattern: HIGH - already implemented in website CSS
- Border radius values: HIGH - explicit requirements provided
- Orange accent values: HIGH - from Tailwind v4 docs
- Implementation order: MEDIUM - inferred from dependencies

**Research date:** 2026-01-26
**Valid until:** 2026-02-26 (30 days - stable CSS patterns)
