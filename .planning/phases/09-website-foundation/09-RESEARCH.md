# Phase 9: Website Foundation - Research

**Researched:** 2026-01-27
**Domain:** CSS Design System Unification / Design Token Architecture
**Confidence:** HIGH

## Summary

This phase aligns the website's color system and typography with the app's refreshed design system. Both codebases already implement the core decisions (dark-first, OKLCH colors, orange accent, three-level text hierarchy), but use different token naming conventions and structures.

The website (`apps/website/src/index.css`) has evolved independently and uses a mix of older custom tokens (`--bg-dark`, `--text-primary`) alongside some app-compatible aliases. The app (`apps/electron/src/renderer/src/styles/globals.css`) uses a cleaner shadcn/ui-compatible token structure with explicit primitive palette scales.

The primary work involves:

1. Adopting the app's primitive palette tokens (Slate/Orange scales)
2. Migrating to shadcn/ui-compatible semantic token names
3. Evaluating typography alignment
4. Removing duplicate/legacy token definitions

**Primary recommendation:** Refactor website CSS to use the app's token structure as the source of truth, migrating from legacy tokens to shadcn/ui-compatible semantic tokens while preserving the website-specific components and styles.

## Standard Stack

The established libraries/tools for this domain:

### Core

| Library           | Version | Purpose                           | Why Standard                             |
| ----------------- | ------- | --------------------------------- | ---------------------------------------- |
| Tailwind CSS      | 4.1.18  | Utility-first CSS framework       | Already in use, v4 with CSS-first config |
| @tailwindcss/vite | 4.1.18  | Vite integration for Tailwind     | Native Vite plugin, no PostCSS needed    |
| OKLCH color space | N/A     | Perceptually uniform color system | Already adopted in both codebases        |

### Supporting

| Library        | Version | Purpose                 | When to Use                             |
| -------------- | ------- | ----------------------- | --------------------------------------- |
| clsx           | 2.1.1   | Conditional class names | Dynamic class composition               |
| tailwind-merge | 3.4.0   | Merge Tailwind classes  | Resolving class conflicts in components |

### Alternatives Considered

| Instead of           | Could Use | Tradeoff                                                             |
| -------------------- | --------- | -------------------------------------------------------------------- |
| Custom CSS variables | CSS-in-JS | CSS variables are simpler, work with Tailwind, no runtime cost       |
| OKLCH                | HSL/RGB   | OKLCH provides perceptual uniformity, better for systematic palettes |

**No installation required** - all dependencies already present.

## Architecture Patterns

### Token Structure (Source of Truth: App)

The app's `globals.css` follows this hierarchy:

```
:root
├── Primitive Palette Tokens (raw OKLCH values)
│   ├── --slate-50 through --slate-950
│   └── --orange-300 through --orange-700
├── Semantic UI Colors (Dark Mode Default)
│   ├── --primary, --primary-foreground
│   ├── --background, --foreground
│   ├── --card, --card-foreground
│   ├── --secondary, --secondary-foreground
│   ├── --muted, --muted-foreground
│   └── --border, --border-subtle, --border-strong
└── @theme inline (Tailwind v4 integration)

.light
└── Override all semantic tokens for light mode
```

### Current Website vs Target Structure

**Current Website Token Naming:**

```css
/* Old approach - mixed/duplicate tokens */
--bg-dark: oklch(0.13 0.02 255);
--bg-darker: oklch(0.08 0.015 255);
--text-primary: oklch(0.968 0.007 247.896);
--text-secondary: oklch(0.869 0.022 252.894);

/* App-compatible aliases (already added) */
--foreground: var(--text-primary);
--secondary-foreground: var(--text-secondary);
```

**Target Website Token Naming:**

```css
/* Primitive palette (from app) */
--slate-50: oklch(0.984 0.003 247.858);
--slate-100: oklch(0.968 0.007 247.896);
/* ... etc */

/* Semantic tokens (matching app) */
--background: var(--slate-900);
--foreground: var(--slate-100);
--card: var(--slate-800);
--secondary-foreground: var(--slate-300);
--muted-foreground: var(--slate-400);
```

### Recommended Migration Structure

```
apps/website/src/index.css
├── @import statements (fonts, tailwindcss)
├── :root
│   ├── /* PRIMITIVE PALETTE TOKENS (copy from app) */
│   │   ├── Slate scale (--slate-50 to --slate-950)
│   │   └── Orange scale (--orange-300 to --orange-700)
│   ├── /* SEMANTIC UI COLORS - Dark Mode (Default) */
│   │   └── (match app token names exactly)
│   └── /* WEBSITE-SPECIFIC TOKENS */
│       └── (section gaps, container widths, etc.)
├── .light
│   └── /* Light mode overrides (match app) */
├── @theme inline
│   └── /* Tailwind v4 color integration */
├── /* BASE STYLES */
├── /* TYPOGRAPHY */
├── /* COMPONENT STYLES */
│   └── (website-specific: hero, features, etc.)
└── /* ANIMATIONS */
```

### Anti-Patterns to Avoid

- **Duplicate token definitions:** Don't define `--text-primary` AND `--foreground` for the same value. Pick one (prefer shadcn/ui-compatible names).
- **Inline OKLCH in component CSS:** Use token references, not raw `oklch(...)` values. This makes theme changes easier.
- **Mixed naming conventions:** Don't mix `--bg-dark` with `--background`. Standardize on one system.
- **Breaking existing styles:** Some component CSS files reference old tokens. Migrate gradually or use aliases temporarily.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem                   | Don't Build              | Use Instead                                     | Why                               |
| ------------------------- | ------------------------ | ----------------------------------------------- | --------------------------------- |
| Color scale generation    | Manual OKLCH calculation | Copy from app's Tailwind v4 Slate/Orange scales | Consistency, already tested       |
| Dark/light mode switching | Custom CSS class logic   | Tailwind's `@custom-variant` pattern            | Already implemented in app        |
| Semantic token aliasing   | Direct OKLCH values      | Reference primitive tokens via `var()`          | Single source of truth for colors |

**Key insight:** The app's design system has already solved these problems. The website should adopt, not reinvent.

## Common Pitfalls

### Pitfall 1: Breaking Component-Level CSS

**What goes wrong:** Changing token names in `index.css` breaks references in component CSS files like `Hero.css`, `Features.css`.
**Why it happens:** Component files use tokens like `--text-primary`, `--border-subtle`, `--bg-card`.
**How to avoid:**

1. Audit all component CSS files for token usage before migrating
2. Either update all references simultaneously, or keep backward-compatible aliases temporarily
3. Use find-and-replace across all CSS files in the website package
   **Warning signs:** CSS compilation succeeds but colors appear wrong or fallback to browser defaults

### Pitfall 2: Typography Font Mismatch

**What goes wrong:** Changing fonts without updating font weights or line-heights causes visual regressions.
**Why it happens:** Different fonts have different metrics. "Plus Jakarta Sans 600" is not the same visual weight as "Noto Sans Variable 600".
**How to avoid:**

1. If keeping current website fonts (Plus Jakarta Sans, Inter), document the intentional difference
2. If switching to app fonts (Noto Sans Variable), test all heading sizes and weights
3. Preserve the font variable names (`--font-display`, `--font-body`, `--font-mono`)
   **Warning signs:** Text appears too bold/thin, line-heights feel cramped/loose

### Pitfall 3: Shadow Values Not Matching

**What goes wrong:** Website and app have different shadow systems, causing inconsistent depth perception.
**Why it happens:** Shadows evolved separately. Website uses `--shadow-card`, `--shadow-2xl` etc., app has similar but different values.
**How to avoid:** Copy shadow definitions from app's `globals.css` exactly, including dark/light mode variations.
**Warning signs:** Cards look "floatier" or "flatter" on website vs app

### Pitfall 4: Border Opacity Assumptions

**What goes wrong:** Borders appear wrong after migration because opacity approach differs.
**Why it happens:** App uses `oklch(1 0 0 / 8%)` (white with opacity) for dark mode borders, website uses similar but may have different percentages.
**How to avoid:** Copy border token definitions exactly from app.
**Warning signs:** Borders too visible or invisible in certain theme modes

## Code Examples

Verified patterns from the app design system:

### Primitive Palette Tokens (Copy Exactly)

```css
/* Source: apps/electron/src/renderer/src/styles/globals.css lines 24-41 */
:root {
  /* Slate Neutral Scale */
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

  /* Orange Accent Scale */
  --orange-300: oklch(0.837 0.128 66.29);
  --orange-400: oklch(0.75 0.183 55.934);
  --orange-500: oklch(0.705 0.213 47.604);
  --orange-600: oklch(0.646 0.222 41.116);
  --orange-700: oklch(0.553 0.195 38.402);
}
```

### Semantic Token Pattern (Dark Mode Default)

```css
/* Source: apps/electron/src/renderer/src/styles/globals.css lines 43-83 */
:root {
  color-scheme: dark;

  --primary: var(--orange-400);
  --primary-foreground: oklch(0.266 0.079 36.259);

  --background: var(--slate-900);
  --foreground: var(--slate-100);
  --card: var(--slate-800);
  --card-foreground: var(--slate-100);

  /* Text hierarchy via semantic tokens */
  --secondary-foreground: var(--slate-300); /* Descriptions/labels */
  --muted-foreground: var(--slate-400); /* Metadata/subtle */

  /* Borders - white with opacity for dark mode */
  --border: oklch(1 0 0 / 8%);
  --border-subtle: oklch(1 0 0 / 6%);
  --border-strong: oklch(1 0 0 / 12%);
}
```

### Light Mode Override Pattern

```css
/* Source: apps/electron/src/renderer/src/styles/globals.css lines 133-183 */
.light {
  color-scheme: light;

  --primary: var(--orange-600);
  --primary-foreground: oklch(0.98 0.016 73.684);

  --background: var(--slate-50);
  --foreground: var(--slate-900);
  --card: white;
  --card-foreground: var(--slate-900);

  --secondary-foreground: var(--slate-600);
  --muted-foreground: var(--slate-500);

  /* Borders - black with opacity for light mode */
  --border: oklch(0 0 0 / 8%);
  --border-subtle: oklch(0 0 0 / 6%);
  --border-strong: oklch(0 0 0 / 12%);
}
```

### Tailwind v4 Theme Integration

```css
/* Source: apps/electron/src/renderer/src/styles/globals.css lines 220-256 */
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-border: var(--border);
  /* ... etc */
}
```

## State of the Art

| Old Approach         | Current Approach                | When Changed      | Impact                                      |
| -------------------- | ------------------------------- | ----------------- | ------------------------------------------- |
| HSL colors           | OKLCH colors                    | Tailwind v4       | Perceptually uniform, better gradients      |
| `tailwind.config.js` | CSS-first config (`@theme`)     | Tailwind v4       | No build step for theme changes             |
| `dark:` variant      | `:root` dark, `.light` override | App design system | Simpler, no class toggling on every element |
| Separate token names | shadcn/ui-compatible tokens     | App design system | Component library compatibility             |

**Deprecated/outdated:**

- `--text-primary`, `--text-secondary`, `--text-muted`: Use `--foreground`, `--secondary-foreground`, `--muted-foreground` instead
- `--bg-dark`, `--bg-darker`: Use `--background`, `--card` instead
- Hex colors: Use OKLCH for all new definitions

## Open Questions

Things that couldn't be fully resolved:

1. **Typography fonts: Keep separate or unify?**
   - What we know: Website uses Plus Jakarta Sans + Inter, app uses Noto Sans Variable
   - What's unclear: Whether brand consistency requires same fonts, or marketing/app can differ
   - Recommendation: Keep website fonts (Plus Jakarta Sans is more distinctive for marketing), but ensure font variable names match (`--font-display`, `--font-body`, `--font-mono`)

2. **Legacy token aliases: Remove or keep?**
   - What we know: Some component CSS files reference old tokens like `--text-primary`
   - What's unclear: Whether to update all component files simultaneously or phase out gradually
   - Recommendation: Add `/* @deprecated */` comment to legacy tokens, update component files in same phase, then remove legacy tokens

3. **Border token naming: Three-level or four-level?**
   - What we know: App uses `--border`, `--border-subtle`, `--border-strong`. Website also has `--border-light`, `--border-medium`.
   - What's unclear: Whether website needs more granular border options
   - Recommendation: Adopt app's three-level system (`--border-subtle`, `--border`, `--border-strong`), map old tokens to closest match

## Sources

### Primary (HIGH confidence)

- `apps/electron/src/renderer/src/styles/globals.css` - App design tokens (source of truth)
- `apps/website/src/index.css` - Current website design system
- `apps/website/src/components/*.css` - Component-level CSS (Hero, Features, TopBar, etc.)

### Secondary (MEDIUM confidence)

- Tailwind CSS v4 documentation for `@theme inline` and CSS-first configuration
- CLAUDE.md project instructions for design system documentation

### Tertiary (LOW confidence)

- None - this is a codebase-specific unification task

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - Both codebases already use Tailwind v4, OKLCH, same dependencies
- Architecture: HIGH - App's token structure is well-documented and working
- Pitfalls: HIGH - Based on direct analysis of both codebases, identified real differences

**Research date:** 2026-01-27
**Valid until:** Indefinite (internal codebase analysis, not dependent on external changes)
