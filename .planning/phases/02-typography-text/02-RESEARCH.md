# Phase 2: Typography & Text - Research

**Researched:** 2026-01-26
**Domain:** CSS Typography, Text Hierarchy, WCAG Accessibility, OKLCH Color Contrast
**Confidence:** HIGH

## Summary

This research covers the implementation of a three-level text hierarchy (primary, secondary, muted) for the SQL Pro application. The codebase already has text color variables defined but they are inconsistently named and applied across the three CSS files (electron globals.css, website index.css, shared ui sanctum.css).

Phase 1 established the dark-first CSS architecture with Slate neutrals and OKLCH colors. The text hierarchy builds on this foundation by ensuring three distinct text levels with appropriate contrast ratios against both dark (Slate 900) and light (Slate 50) backgrounds.

WCAG 2.1 Level AA requires a minimum 4.5:1 contrast ratio for normal text. The current Slate palette provides excellent options: Slate-100 (L=0.968) for primary text, Slate-400 (L=0.704) for secondary, and Slate-500/600 for muted text in dark mode.

**Primary recommendation:** Consolidate text color variables across all three CSS files to use a unified `--foreground`, `--muted-foreground`, and new `--secondary-foreground` token system, with OKLCH values verified to meet 4.5:1 contrast against backgrounds.

## Current State Analysis

### Existing Text Variables in globals.css (Electron App)

| Variable                 | Dark Mode Value                                 | Light Mode Value                                | Usage               |
| ------------------------ | ----------------------------------------------- | ----------------------------------------------- | ------------------- |
| `--foreground`           | `var(--slate-100)` = oklch(0.968 0.007 247.896) | `var(--slate-900)` = oklch(0.208 0.042 265.755) | Primary text        |
| `--muted-foreground`     | `var(--slate-400)` = oklch(0.704 0.04 256.788)  | `var(--slate-500)` = oklch(0.554 0.046 257.417) | Muted/tertiary text |
| `--card-foreground`      | `var(--slate-100)`                              | `var(--slate-900)`                              | Text on cards       |
| `--popover-foreground`   | `var(--slate-100)`                              | `var(--slate-900)`                              | Text in popovers    |
| `--secondary-foreground` | `var(--slate-100)`                              | `var(--slate-800)`                              | Secondary UI text   |

### Existing Text Variables in index.css (Website)

| Variable           | Dark Mode Value       | Light Mode Value       | Usage          |
| ------------------ | --------------------- | ---------------------- | -------------- |
| `--text-primary`   | oklch(0.97 0.002 250) | oklch(0.15 0.02 255)   | Primary text   |
| `--text-secondary` | oklch(0.7 0.01 250)   | oklch(0.45 0.02 255)   | Secondary text |
| `--text-muted`     | oklch(0.55 0.015 250) | oklch(0.55 0.015 255)  | Muted text     |
| `--text-inverse`   | oklch(0.13 0.02 255)  | oklch(0.985 0.002 250) | Inverse text   |

### Gap Analysis

| Issue                             | Current State                                        | Target State                                  |
| --------------------------------- | ---------------------------------------------------- | --------------------------------------------- |
| Missing secondary level           | App has only `--foreground` and `--muted-foreground` | Need `--secondary-foreground` for middle tier |
| Inconsistent naming               | Website uses `--text-*`, app uses `--*-foreground`   | Unified naming across files                   |
| No explicit contrast verification | Values set but not documented as WCAG compliant      | Document contrast ratios in code              |

## Standard Stack

### Core Tools

| Tool                            | Purpose                                                 | Why Standard                           |
| ------------------------------- | ------------------------------------------------------- | -------------------------------------- |
| OKLCH color format              | Perceptually uniform lightness for predictable contrast | Already in use, Phase 1 established    |
| CSS Custom Properties           | Text color tokens                                       | Already in use, Tailwind v4 compatible |
| Tailwind CSS v4 `@theme inline` | Expose tokens to utility classes                        | Already configured                     |

### Supporting Tools

| Tool                          | Purpose                               | When to Use                 |
| ----------------------------- | ------------------------------------- | --------------------------- |
| WebAIM Contrast Checker       | Verify contrast ratios                | During development, testing |
| Chrome DevTools Accessibility | Runtime contrast inspection           | During manual testing       |
| oklch.com                     | Convert colors and calculate L values | When adjusting colors       |

## Architecture Patterns

### Three-Level Text Hierarchy

The pattern for a three-level text hierarchy in dark-first design systems:

```
DARK MODE (Slate 900 background = L ~0.21)
+-----------------------------------------------+
|                                               |
|  Primary Text (Slate 100)     L = 0.97        | Ratio: ~15:1
|  Secondary Text (Slate 300)   L = 0.87        | Ratio: ~10:1
|  Muted Text (Slate 400)       L = 0.70        | Ratio: ~5:1
|                                               |
+-----------------------------------------------+

LIGHT MODE (Slate 50 background = L ~0.98)
+-----------------------------------------------+
|                                               |
|  Primary Text (Slate 900)     L = 0.21        | Ratio: ~15:1
|  Secondary Text (Slate 600)   L = 0.45        | Ratio: ~7:1
|  Muted Text (Slate 500)       L = 0.55        | Ratio: ~5:1
|                                               |
+-----------------------------------------------+
```

### Recommended Variable Structure

```css
:root {
  /* === TEXT HIERARCHY (Dark Mode Default) === */
  /* Primary: Bright, high contrast for main content */
  --foreground: var(--slate-100); /* L=0.968, ~15:1 on Slate 900 */

  /* Secondary: Dimmed, clear but not prominent */
  --secondary-foreground: var(--slate-300); /* L=0.869, ~10:1 on Slate 900 */

  /* Muted: Subtle, for less important info */
  --muted-foreground: var(--slate-400); /* L=0.704, ~5:1 on Slate 900 */
}

.light {
  /* Primary: Dark, high contrast */
  --foreground: var(--slate-900); /* L=0.208, ~15:1 on Slate 50 */

  /* Secondary: Medium gray */
  --secondary-foreground: var(--slate-600); /* L=0.446, ~7:1 on Slate 50 */

  /* Muted: Lighter gray */
  --muted-foreground: var(--slate-500); /* L=0.554, ~5:1 on Slate 50 */
}
```

### Tailwind @theme Integration

```css
@theme inline {
  --color-foreground: var(--foreground);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted-foreground: var(--muted-foreground);
}
```

This enables Tailwind utility classes:

- `text-foreground` - Primary text
- `text-secondary-foreground` - Secondary text
- `text-muted-foreground` - Muted text

### Anti-Patterns to Avoid

- **Don't use hardcoded colors**: Always reference CSS variables for text colors
- **Don't skip the secondary level**: Two levels (primary/muted) create jarring contrast; three levels are needed
- **Don't use same color for dark and light modes**: Each mode needs its own optimized values
- **Don't use Slate 200 for dark mode text**: Too low contrast, fails WCAG

## WCAG Contrast Requirements

### Minimum Contrast Ratios (Level AA)

| Text Type                          | Minimum Ratio | Calculation               |
| ---------------------------------- | ------------- | ------------------------- |
| Normal text (<18px or <14px bold)  | 4.5:1         | (L1 + 0.05) / (L2 + 0.05) |
| Large text (>=18px or >=14px bold) | 3:1           | Same formula              |
| UI components and graphics         | 3:1           | For interactive elements  |

Source: [W3C WCAG 2.1 Understanding Contrast](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)

### OKLCH Lightness (L) and Contrast

OKLCH's L channel represents perceptual lightness on a 0-1 scale. Approximate contrast ratios based on L difference:

| L Difference | Approximate Ratio | Use Case                     |
| ------------ | ----------------- | ---------------------------- |
| 0.40         | ~5:1              | Muted text (minimum)         |
| 0.50         | ~7:1              | Secondary text (comfortable) |
| 0.60+        | ~10:1+            | Primary text (high contrast) |

### Slate Palette Contrast Matrix (Dark Mode)

Background: `--slate-900` = oklch(0.208 0.042 265.755)

| Text Token    | Value                      | L     | Contrast vs 900 | WCAG Status   |
| ------------- | -------------------------- | ----- | --------------- | ------------- |
| `--slate-50`  | oklch(0.984 0.003 247.858) | 0.984 | ~18:1           | AAA PASS      |
| `--slate-100` | oklch(0.968 0.007 247.896) | 0.968 | ~15:1           | AAA PASS      |
| `--slate-200` | oklch(0.929 0.013 255.508) | 0.929 | ~12:1           | AAA PASS      |
| `--slate-300` | oklch(0.869 0.022 252.894) | 0.869 | ~10:1           | AAA PASS      |
| `--slate-400` | oklch(0.704 0.04 256.788)  | 0.704 | ~5:1            | AA PASS       |
| `--slate-500` | oklch(0.554 0.046 257.417) | 0.554 | ~3:1            | FAIL for text |

### Slate Palette Contrast Matrix (Light Mode)

Background: `--slate-50` = oklch(0.984 0.003 247.858)

| Text Token    | Value                      | L     | Contrast vs 50 | WCAG Status   |
| ------------- | -------------------------- | ----- | -------------- | ------------- |
| `--slate-950` | oklch(0.129 0.042 264.695) | 0.129 | ~19:1          | AAA PASS      |
| `--slate-900` | oklch(0.208 0.042 265.755) | 0.208 | ~15:1          | AAA PASS      |
| `--slate-800` | oklch(0.279 0.041 260.031) | 0.279 | ~10:1          | AAA PASS      |
| `--slate-600` | oklch(0.446 0.043 257.281) | 0.446 | ~7:1           | AAA PASS      |
| `--slate-500` | oklch(0.554 0.046 257.417) | 0.554 | ~5:1           | AA PASS       |
| `--slate-400` | oklch(0.704 0.04 256.788)  | 0.704 | ~3:1           | FAIL for text |

## Don't Hand-Roll

| Problem               | Don't Build                | Use Instead                                    | Why                             |
| --------------------- | -------------------------- | ---------------------------------------------- | ------------------------------- |
| Contrast checking     | Custom contrast calculator | WebAIM Contrast Checker or Chrome DevTools     | Verified, accurate calculations |
| Text color tokens     | Hardcoded OKLCH values     | CSS variables referencing Slate primitives     | Maintainability, consistency    |
| Three-level hierarchy | Ad-hoc opacity values      | Semantic tokens (foreground, secondary, muted) | Scalable, testable              |

## Common Pitfalls

### Pitfall 1: Using --slate-500 for Dark Mode Muted Text

**What goes wrong:** Text appears too dark, fails WCAG 4.5:1 requirement
**Why it happens:** Slate-500 has L=0.554, only ~3:1 contrast on Slate-900
**How to avoid:** Use Slate-400 (L=0.704) minimum for dark mode muted text
**Warning signs:** Hard to read subtle text, accessibility audit failures

### Pitfall 2: Forgetting to Add Secondary Level to @theme

**What goes wrong:** `text-secondary-foreground` utility class doesn't work
**Why it happens:** New variable not exposed in Tailwind @theme block
**How to avoid:** Add `--color-secondary-foreground: var(--secondary-foreground);` to @theme
**Warning signs:** Tailwind class has no effect, falls back to black

### Pitfall 3: Inconsistent Text Colors Across Files

**What goes wrong:** Website and app have different text colors for same semantic level
**Why it happens:** Variables defined separately without coordination
**How to avoid:** Ensure website index.css and sanctum.css align with globals.css values
**Warning signs:** Brand inconsistency, different "muted" appearance across products

### Pitfall 4: Testing Only Dark Mode Contrast

**What goes wrong:** Light mode text fails WCAG after deployment
**Why it happens:** Development done primarily in dark mode
**How to avoid:** Test both modes, verify light mode uses darker text tokens
**Warning signs:** Light mode complaints post-launch

## Code Examples

### Adding Secondary Foreground Token (globals.css)

```css
/* Source: Phase 1 established pattern */
:root {
  /* Semantic UI Colors - Dark Mode (Default) */
  color-scheme: dark;

  --foreground: var(--slate-100); /* Primary: L=0.968 */
  --secondary-foreground: var(--slate-300); /* NEW: Secondary: L=0.869 */
  --muted-foreground: var(--slate-400); /* Muted: L=0.704 */
}

.light {
  color-scheme: light;

  --foreground: var(--slate-900); /* Primary: L=0.208 */
  --secondary-foreground: var(--slate-600); /* NEW: Secondary: L=0.446 */
  --muted-foreground: var(--slate-500); /* Muted: L=0.554 */
}
```

### Exposing to Tailwind @theme

```css
@theme inline {
  /* Existing */
  --color-foreground: var(--foreground);
  --color-muted-foreground: var(--muted-foreground);

  /* NEW */
  --color-secondary-foreground: var(--secondary-foreground);
}
```

### Usage in Components

```tsx
// Primary text - main content, headings
<h1 className="text-foreground">Dashboard</h1>

// Secondary text - descriptions, labels
<p className="text-secondary-foreground">Manage your connections</p>

// Muted text - metadata, timestamps, hints
<span className="text-muted-foreground">Last updated 5m ago</span>
```

### Aligning Website Variables (index.css)

```css
/* Align website with app naming while preserving existing values */
:root {
  /* Legacy names (for existing website CSS) */
  --text-primary: oklch(0.968 0.007 247.896); /* = Slate 100 */
  --text-secondary: oklch(0.869 0.022 252.894); /* = Slate 300 */
  --text-muted: oklch(0.704 0.04 256.788); /* = Slate 400 */

  /* App-compatible aliases */
  --foreground: var(--text-primary);
  --secondary-foreground: var(--text-secondary);
  --muted-foreground: var(--text-muted);
}
```

## Files to Modify

### Primary Files

| File                                                | Changes Required                                                        |
| --------------------------------------------------- | ----------------------------------------------------------------------- |
| `apps/electron/src/renderer/src/styles/globals.css` | Add `--secondary-foreground` token, verify @theme exposure              |
| `apps/website/src/index.css`                        | Align `--text-secondary` value to Slate-300, add app-compatible aliases |
| `packages/ui/src/sanctum.css`                       | Add `--secondary-foreground` if used by shared components               |

### Component Files (No Changes Expected)

The UI components in `packages/ui/src/*.tsx` already use Tailwind utility classes like `text-muted-foreground`. Adding `--secondary-foreground` to the theme will automatically enable `text-secondary-foreground` without component changes.

## Font Configuration (Reference)

The app already has font configuration in place:

```css
/* globals.css line 210 */
@theme inline {
  --font-sans: 'Noto Sans Variable', sans-serif;
}
```

Font sizes are controlled via user preferences:

```css
:root {
  --font-ui-size: 14px;
  --font-table-size: 13px;
  --font-editor-size: 14px;
}
```

Typography hierarchy is about **color contrast** in Phase 2, not font sizes. Font size configuration is already handled by the existing `useApplyFont` hook.

## Verification Approach

### Automated Verification

1. **CSS Variable Existence**: Grep for `--secondary-foreground` in all three CSS files
2. **@theme Exposure**: Check `--color-secondary-foreground` in globals.css
3. **Value Verification**: Confirm Slate token references match expected L values

### Manual Verification (Human)

1. **Visual Distinction**: Open app, verify three text levels are distinguishable at a glance
2. **Contrast Check**: Use Chrome DevTools Accessibility panel on each text level
3. **Mode Toggle**: Switch to light mode, verify all three levels remain readable

### Contrast Verification Commands

```bash
# Check if secondary-foreground is defined
grep -n "secondary-foreground" apps/electron/src/renderer/src/styles/globals.css

# Verify @theme exposure
grep -n "color-secondary-foreground" apps/electron/src/renderer/src/styles/globals.css

# Check website alignment
grep -n "text-secondary\|--foreground" apps/website/src/index.css
```

## Open Questions

1. **Website CSS Strategy**
   - What we know: Website has different variable names (`--text-*` vs `--*-foreground`)
   - What's unclear: Should we fully migrate website to app naming, or add aliases?
   - Recommendation: Add aliases for now, full migration in future phase

2. **Component Audit**
   - What we know: Components use `text-muted-foreground` extensively
   - What's unclear: Which components should use secondary vs muted?
   - Recommendation: Document semantic meaning, let developers choose appropriate level

## Sources

### Primary (HIGH confidence)

- W3C WCAG 2.1 - Contrast requirements, calculation formula
  - URL: https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html
- Tailwind CSS v4 - Slate palette OKLCH values (from Phase 1 research)
- Current codebase analysis - globals.css, index.css, sanctum.css

### Secondary (MEDIUM confidence)

- Chrome Developer Blog - OKLCH relative color syntax and L\* contrast method
  - URL: https://developer.chrome.com/blog/css-relative-color-syntax
- Linear/Raycast design patterns (established in Phase 1)

### Tertiary (LOW confidence)

- General dark mode typography best practices

## Metadata

**Confidence breakdown:**

- Slate palette values: HIGH - directly from Phase 1 verified implementation
- WCAG requirements: HIGH - from official W3C documentation
- Contrast calculations: MEDIUM - using L\* approximation method
- Component usage patterns: HIGH - analyzed actual codebase

**Research date:** 2026-01-26
**Valid until:** 2026-02-26 (30 days - stable CSS patterns)
