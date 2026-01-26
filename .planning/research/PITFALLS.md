# Domain Pitfalls: Linear/Raycast Style Migration

**Domain:** Design system migration from "Warm Modern" to Linear/Raycast dark-first minimal style
**Project:** SQL Pro - Database Management Application
**Researched:** 2026-01-26
**Confidence:** MEDIUM (based on design system analysis and industry patterns)

---

## Executive Summary

Migrating SQL Pro from its current "Warm Modern" design (orange/green primary, warm backgrounds, large rounded corners) to a Linear/Raycast style (dark-first, minimal, refined) presents several specific risks. This document catalogs pitfalls based on:

1. Analysis of SQL Pro's current design system (`globals.css`, `index.css`)
2. Characteristics of Linear/Raycast design patterns
3. Unique challenges of data-heavy database management interfaces

---

## Critical Pitfalls

Mistakes that cause rewrites, accessibility failures, or major user experience issues.

### Pitfall 1: Contrast Collapse in Data Tables

**What goes wrong:** When transitioning to dark mode with reduced visual weight, data tables become unreadable. Row boundaries blur together, cell values become indistinguishable, and users lose their place when scanning large result sets.

**Why it happens:** Linear/Raycast use minimal borders and subtle separators. This works for lists and cards but fails catastrophically for dense tabular data with hundreds of rows and many columns.

**Consequences:**

- Users cannot quickly scan SQL results
- Cell selection becomes ambiguous
- CSV export previews are unusable
- Accessibility failures (WCAG AA requires 4.5:1 for text)

**Warning signs:**

- Designers say "it looks cleaner without borders"
- Contrast ratio testing is skipped for table cells
- Table styling is treated as an afterthought
- Testing only with sample data (5-10 rows) instead of real queries (500+ rows)

**Prevention:**

```
1. Define explicit contrast requirements for tables:
   - Row hover: minimum 5% difference from base
   - Zebra striping: minimum 3% difference between alternating rows
   - Cell borders: visible at 8px or smaller grid lines
   - Selected row: strong visual indicator (color + border, not just color)

2. Create table-specific dark mode tokens:
   --table-row-odd: oklch(0.16 0.02 255)
   --table-row-even: oklch(0.14 0.02 255)
   --table-border: oklch(1 0 0 / 8%)
   --table-header-bg: oklch(0.18 0.02 255)
   --table-cell-selected: oklch(0.25 0.08 145)

3. Test with real-world data:
   - 1000+ row result sets
   - Wide tables (20+ columns)
   - Mixed data types (numbers, long text, NULLs)
```

**Phase to address:** Phase 1 (Foundation) - Must be solved before any component migration.

---

### Pitfall 2: SQL Editor Syntax Highlighting Breakage

**What goes wrong:** Monaco editor syntax highlighting colors clash with new dark theme or become unreadable. Keywords blend into background, strings are too bright, comments are invisible.

**Why it happens:** Monaco has its own theming system that must be coordinated with the app theme. Teams often forget to create matching Monaco themes or use generic "dark" themes that don't match brand colors.

**Consequences:**

- SQL editing becomes error-prone
- Professional appearance is undermined
- Inconsistent experience between editor and rest of app
- Cognitive load increases when reading complex queries

**Warning signs:**

- Monaco theme is left as default
- Editor area looks "disconnected" from surrounding UI
- Syntax colors chosen without considering the new background
- Only testing with simple `SELECT * FROM table` queries

**Prevention:**

```
1. Create custom Monaco theme that matches design system:
   - Background must match --card or --bg-card exactly
   - Keywords use --primary or a designated syntax color
   - Strings, numbers, comments use coordinated palette

2. Test with complex SQL:
   - Multi-table JOINs
   - Subqueries and CTEs
   - Long strings and comments
   - Error states and squiggly underlines

3. Coordinate focus/selection colors:
   - Line highlight must be visible but not overpowering
   - Selection color must work with syntax highlighting
```

**Phase to address:** Phase 2 (Component Migration) - Alongside SQL editor component updates.

---

### Pitfall 3: Warm Accent Color Identity Crisis

**What goes wrong:** The current green primary (`#22C55E`) either clashes with dark backgrounds (too bright, appears "gamery") or becomes muted to the point of losing brand identity.

**Why it happens:** Colors that work on light/warm backgrounds need significant adjustment for dark environments. Simply darkening or desaturating loses the original character.

**Consequences:**

- Brand identity becomes inconsistent
- Primary actions don't stand out
- The app looks like a generic dark theme
- Marketing consistency breaks between website and app

**Warning signs:**

- CTAs and primary buttons feel "off"
- Green appears neon or washed out depending on context
- Multiple green variants are added ad-hoc to "fix" different situations
- Designers keep adjusting the primary color without a systematic approach

**Prevention:**

```
1. Define explicit light/dark variants from the start:
   Light mode: oklch(0.723 0.191 142.5)  // Current green
   Dark mode:  oklch(0.792 0.209 151.7)  // Brighter for dark bg

2. Create opacity-based utility classes:
   --primary-10: oklch(var(--primary) / 10%)
   --primary-20: oklch(var(--primary) / 20%)
   (Consistent across modes, not hardcoded)

3. Test primary color in context:
   - On pure dark background
   - On elevated surfaces (cards)
   - As text, as background, as border
   - Next to destructive/warning colors
```

**Phase to address:** Phase 1 (Foundation) - Core color system must be resolved first.

---

### Pitfall 4: Minimalism vs. Information Density Conflict

**What goes wrong:** Adopting Linear's spacious, minimal aesthetic while keeping SQL Pro's feature density results in either: (a) a cramped, inconsistent interface, or (b) hiding essential database features behind too many clicks.

**Why it happens:** Linear is a task/project tracker with relatively simple data models. SQL Pro manages complex database operations with many simultaneous concerns (query results, schema browser, execution stats, error messages). Directly copying Linear's spacing and hiding patterns fails.

**Consequences:**

- Power users revolt (features hidden/removed)
- Interface feels neither minimal nor functional
- Constant UI compromises undermine design coherence
- Higher cognitive load from context-switching

**Warning signs:**

- Designers want to "hide" the schema sidebar by default
- Debate about whether to show execution time/row counts
- Adding hamburger menus or "..." buttons to hide toolbars
- Comparing unfavorably to Linear/Raycast without considering use case differences

**Prevention:**

```
1. Acknowledge the difference explicitly:
   - Linear: project management, relatively sparse data
   - SQL Pro: database IDE, extremely dense data
   - Goal: Linear's polish + appropriate density for data tools

2. Define information density tiers:
   - Chrome/navigation: Minimal (Linear-like)
   - Work areas (editor, results): Dense (VSCode-like)
   - Settings/dialogs: Comfortable (Linear-like)

3. Audit all hidden features:
   - Every feature hidden requires a discovery path
   - Power user shortcuts must remain accessible
   - "Minimal by default, discoverable depth" principle
```

**Phase to address:** Phase 2 (Component Migration) - Must guide all component decisions.

---

## Moderate Pitfalls

Mistakes that cause delays, technical debt, or user friction.

### Pitfall 5: Border Radius Regression

**What goes wrong:** Current "Warm Modern" uses large rounded corners (16-24px). Linear/Raycast use smaller, more refined radii (6-12px). During migration, radius values become inconsistent across components.

**Why it happens:** Developers update some components but not others. New values are added without removing old ones. Tailwind utilities and CSS variables drift apart.

**Prevention:**

```
1. Audit all radius usage BEFORE migration:
   - Document every place radius is applied
   - Create a radius token migration map

2. Reduce radius tokens to exactly 4 values:
   --radius-sm: 6px   (buttons, inputs)
   --radius-md: 8px   (cards, panels)
   --radius-lg: 12px  (modals, large cards)
   --radius-xl: 16px  (special emphasis only)

3. Use find-and-replace, not gradual migration:
   - Change all radii in one phase
   - Avoid "half old, half new" states
```

**Phase to address:** Phase 1 (Foundation) - Part of design token updates.

---

### Pitfall 6: Shadow System Mismatch

**What goes wrong:** Warm Modern uses orange-tinted, soft shadows. Linear/Raycast use neutral, subtle shadows or border-based elevation. Mixing both creates visual confusion.

**Why it happens:** Shadows are often overlooked during design migration. Old shadow utilities persist in codebase.

**Prevention:**

```
1. Remove all warm-tinted shadows:
   - Search for oklch(...142.5...) in shadow definitions
   - Search for orange/amber in rgba shadows

2. Define new shadow hierarchy:
   --shadow-xs: 0 1px 2px rgba(0,0,0,0.05)
   --shadow-sm: 0 1px 3px rgba(0,0,0,0.1)
   --shadow-md: 0 4px 6px rgba(0,0,0,0.1)
   --shadow-lg: 0 10px 15px rgba(0,0,0,0.1)

3. Consider border-based elevation:
   - Linear often uses subtle borders instead of shadows
   - Borders are more consistent across displays
```

**Phase to address:** Phase 1 (Foundation) - Part of design token updates.

---

### Pitfall 7: Animation Timing Mismatch

**What goes wrong:** Warm Modern uses slower, more playful animations (300-600ms, spring easings). Linear/Raycast use snappy, professional transitions (150-250ms, ease-out). Mixing timing creates a jarring experience.

**Prevention:**

```
1. Reduce all animation durations:
   --duration-fast: 100ms (micro-interactions)
   --duration-normal: 150ms (standard transitions)
   --duration-slow: 250ms (complex animations)

2. Simplify easings:
   --ease-out: cubic-bezier(0.33, 1, 0.68, 1)
   (Remove spring easings for professional feel)

3. Remove decorative animations:
   - Floating elements
   - Pulse effects on non-interactive elements
   - Shimmer on static content
```

**Phase to address:** Phase 3 (Polish) - After core components are migrated.

---

### Pitfall 8: Losing Accessibility During "Cleanup"

**What goes wrong:** In pursuit of minimalism, accessibility features are accidentally removed: visible focus rings, high-contrast alternatives, screen reader labels, keyboard navigation hints.

**Why it happens:** Accessibility features often look "busy" and are removed in the name of aesthetics.

**Prevention:**

```
1. Create accessibility checklist for each component:
   - Focus ring visible (not just :focus, use :focus-visible)
   - ARIA labels present
   - Color not sole indicator of state
   - Keyboard navigable

2. Test with accessibility tools at each phase:
   - axe DevTools
   - VoiceOver/NVDA
   - Keyboard-only navigation

3. Define minimum contrast requirements:
   - Text on background: 4.5:1
   - Large text: 3:1
   - UI components: 3:1
   - Focus indicators: 3:1
```

**Phase to address:** Every phase - Continuous requirement.

---

## Minor Pitfalls

Mistakes that cause annoyance but are fixable without major refactoring.

### Pitfall 9: Inconsistent Icon Styling

**What goes wrong:** Some icons remain from the warm design (filled, rounded) while new icons follow Linear style (outlined, crisp). Interface looks patchy.

**Prevention:**

```
1. Choose one icon style for the entire app:
   - Lucide icons are already used
   - Ensure all icons use same stroke width (typically 1.5-2px)
   - Avoid mixing filled and outlined

2. Audit icon colors:
   - Most icons should use --muted-foreground
   - Primary actions use --primary
   - Avoid icon color overload
```

**Phase to address:** Phase 2 (Component Migration).

---

### Pitfall 10: Typography Weight Confusion

**What goes wrong:** Linear uses precise font weights (400/500/600). Warm Modern may have used bolder weights (500/600/700). During migration, some text becomes too light or too heavy.

**Prevention:**

```
1. Define explicit weight tokens:
   --font-normal: 400
   --font-medium: 500
   --font-semibold: 600
   (Avoid using 700/800 except for hero text)

2. Audit all bold/semibold usage:
   - Most body text: 400
   - Labels, buttons: 500
   - Headings: 600
```

**Phase to address:** Phase 1 (Foundation) - Part of typography token updates.

---

### Pitfall 11: Form Input Inconsistency

**What goes wrong:** Connection dialogs, query filters, and search inputs have inconsistent styling. Some have visible borders, some are borderless. Heights and padding vary.

**Prevention:**

```
1. Create single input component with variants:
   - Default: subtle border, dark background
   - Ghost: borderless, transparent
   - Filled: solid background

2. Standardize dimensions:
   - Height: 36px (compact), 40px (normal), 48px (large)
   - Padding: 12px horizontal
   - Border radius: --radius-sm
```

**Phase to address:** Phase 2 (Component Migration).

---

## Phase-Specific Warnings

| Phase                         | Likely Pitfall                                                               | Mitigation                                                                          |
| ----------------------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Phase 1 (Foundation)          | Contrast Collapse, Accent Color Identity, Border Radius/Shadow inconsistency | Define all tokens before component work. Test colors in context, not isolation.     |
| Phase 2 (Component Migration) | Data Table readability, Monaco theme breakage, Minimalism vs Density         | Create component-specific guidelines. Test with real data. Document density tiers.  |
| Phase 3 (Polish)              | Animation timing, Icon inconsistency, Typography weight                      | Systematic audit, not spot fixes. Apply changes globally, not per-component.        |
| Every Phase                   | Accessibility regression                                                     | Integrate a11y testing into each PR. No visual change without accessibility review. |

---

## SQL Pro Specific Risks

These pitfalls are unique to SQL Pro's use case and current state:

### Legacy Gold/Orange References

**What exists:** The current codebase has "gold" class names (`text-gradient-gold`, `glow-gold`, `hover-gold`) that map to green. During migration, these should be removed to avoid confusion.

**Action:** Search for "gold" in CSS and remove/rename after migration.

### Multiple Design System Entry Points

**What exists:** Both `apps/electron/src/renderer/src/styles/globals.css` (Electron app) and `apps/website/src/index.css` (marketing site) define design tokens. They are already partially synced (green primary) but have different structures.

**Risk:** Migrating one without the other creates brand inconsistency.

**Action:** Migrate both simultaneously or define a shared token source.

### Heavy Custom CSS

**What exists:** Extensive custom CSS classes (`.floating-dock`, `.command-bar`, `.glass-primary`, `.spotlight`). These are tightly coupled to current design.

**Risk:** These may need complete rewrites, not just token updates.

**Action:** Audit and classify: keep, modify, or remove.

---

## Quality Checklist

Before considering the migration complete:

- [ ] All table views tested with 500+ rows
- [ ] Monaco editor theme matches app theme
- [ ] Primary color works in all contexts (text, bg, border, hover)
- [ ] Focus rings visible on all interactive elements
- [ ] Animations feel snappy, not sluggish
- [ ] No mixed radius values (old large + new small)
- [ ] No warm-tinted shadows remaining
- [ ] Consistent icon style throughout
- [ ] Both Electron app and website use same tokens

---

## Sources

**HIGH Confidence:**

- Analysis of SQL Pro source code (`globals.css`, `index.css`)
- shadcn/ui design patterns
- WCAG 2.1 accessibility guidelines

**MEDIUM Confidence:**

- Linear/Raycast design pattern observations (no official documentation accessed)
- General dark mode best practices from multiple sources

**LOW Confidence (needs validation):**

- Specific contrast ratios for data tables may need adjustment based on user testing
- Animation timing preferences may vary by user demographic
