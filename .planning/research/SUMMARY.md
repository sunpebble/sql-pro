# Project Research Summary

**Project:** SQL Pro Design System Migration
**Domain:** Design system transformation (Warm Modern to Linear/Raycast style)
**Researched:** 2026-01-26
**Confidence:** HIGH

## Executive Summary

SQL Pro is migrating from a "Warm Modern" design system (orange/green accents, warm white backgrounds, large rounded corners) to a Linear/Raycast-style interface (dark-first, minimal chrome, refined micro-interactions). The research confirms this migration is well-suited to the existing technology stack (React 19, Tailwind CSS 4, shadcn/ui, Framer Motion, cmdk) with no new major dependencies required.

The recommended approach is a phased migration prioritizing foundation work (CSS variables, color system, dark-first approach) before component updates. The most critical finding is that Linear/Raycast patterns must be adapted for data-dense database interfaces rather than copied directly. Tables, SQL editors, and query results require higher information density than Linear's task management UI, necessitating a hybrid approach: "Linear's polish + VSCode's density."

Key risks include contrast collapse in data tables when applying minimalist borders, Monaco editor syntax highlighting conflicts with dark themes, and losing brand identity when translating the green accent color to dark backgrounds. These are mitigatable through upfront design token definition, table-specific contrast requirements, and coordinated Monaco theming.

## Key Findings

### Recommended Stack

The existing stack is production-ready for this migration. No new dependencies are required.

**Core technologies:**

- **OKLCH Color Space:** Already adopted by shadcn/ui; provides perceptually uniform colors for superior dark mode handling
- **Tailwind CSS 4:** Dark mode utilities, CSS variable integration, responsive design
- **Framer Motion:** Spring-based micro-interactions with reduced motion support built-in
- **cmdk Library:** Command palette foundation already in use; needs styling updates only
- **shadcn/ui:** Component base with OKLCH theming; requires token overrides for Linear aesthetic

**Key technique:** Dark-first CSS variable definition (`:root` IS dark mode, `.light` is the override) eliminates duplication and ensures dark mode feels native, not afterthought.

### Expected Features

**Must have (table stakes):**

- Dark mode as default (the defining characteristic)
- Command palette (Cmd+K) with keyboard shortcuts visible
- Minimal chrome/decoration with content-first hierarchy
- Subtle borders (5-10% opacity, not solid lines)
- High-contrast text hierarchy (primary/secondary/muted)
- Smooth 150-200ms transitions with ease-out curves
- Focus rings on keyboard navigation (`:focus-visible`)
- Reduced motion support for accessibility

**Should have (differentiators):**

- Gradient text for headlines (subtle, premium feel)
- Glass/blur effects on overlays and popovers
- Animated list heights in command palette
- Contextual commands based on current view
- Real-time search highlighting
- Custom minimal scrollbars (macOS-style)

**Defer (v2+):**

- Light mode refinement (focus on dark first)
- Theme variants (glass, etc.)
- Vim-style navigation (j/k movement)
- Performance-aware animation enhancement
- Command history/recents

### Architecture Approach

The migration follows a five-phase approach based on component dependencies. Foundation work (CSS variables, color system) must complete before component updates. Navigation elements (Activity Rail, Sidebar, Tab Bars) have highest visual impact and should follow foundation. Content areas (Table View, Query View) require special attention due to data density requirements unique to database tools.

**Major components:**

1. **Design Tokens / CSS Variables** — Define dark-first color system, spacing scale, radius tokens, shadow hierarchy
2. **Navigation Shell** — Activity Rail (44px), Sidebar (280px), Tab Bars — all need flattening and decoration removal
3. **Content Views** — Table View, Query View, Command Palette — require density-aware styling distinct from Linear
4. **Dialogs/Overlays** — Modals, popovers, panels — apply glass effects and refined animations
5. **Website** — Parallel track; shares tokens but has different layout needs

### Critical Pitfalls

1. **Contrast Collapse in Data Tables** — Minimal borders fail for 500+ row result sets. Prevention: Define table-specific tokens with zebra striping at minimum 3% contrast difference, row hover at 5% difference, and test with real query data.

2. **Monaco Editor Theme Breakage** — SQL syntax highlighting colors clash with dark theme. Prevention: Create custom Monaco theme coordinated with design tokens; test with complex multi-table JOINs, CTEs, and error states.

3. **Warm Accent Color Identity Crisis** — Green primary either appears neon or washed out on dark backgrounds. Prevention: Define explicit light/dark variants from start; green needs to shift brighter (higher L in OKLCH) for dark mode.

4. **Minimalism vs. Information Density Conflict** — Linear's spacious aesthetic fails for data-dense database operations. Prevention: Define density tiers (chrome=minimal, work areas=dense, dialogs=comfortable); resist hiding essential features.

5. **Accessibility Regression** — Removing "busy" accessibility features in pursuit of minimalism. Prevention: Focus ring visible via `:focus-visible`, ARIA labels preserved, color never sole state indicator, keyboard navigation tested each phase.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Foundation

**Rationale:** All component work depends on design tokens being correct. Changing tokens mid-migration causes rework.
**Delivers:** Complete CSS variable system (colors, spacing, radius, shadows, typography), dark-first approach implemented, table-specific contrast tokens defined.
**Addresses:** Table stakes features (dark mode default, text hierarchy, spacing system)
**Avoids:** Contrast collapse, accent color identity crisis, border radius/shadow mismatch

### Phase 2: Navigation Shell

**Rationale:** Highest visual impact; users interact with navigation constantly. Sets the tone for entire app feel.
**Delivers:** Refactored Activity Bar (44px, flat, icon-only), Sidebar (280px, no glass, flattened tree), Tab Bars (background highlight, not underlines)
**Uses:** OKLCH color tokens, reduced radius values, simplified shadows
**Implements:** Three-panel layout pattern from architecture research

### Phase 3: Content Views

**Rationale:** Core functionality areas; must balance Linear polish with data density requirements.
**Delivers:** Updated Table View (with table-specific contrast), Query View (coordinated Monaco theme), Command Palette (Linear-style item states)
**Addresses:** Differentiator features (glass effects on command palette, search highlighting)
**Avoids:** Minimalism vs density conflict (apply density tiers)

### Phase 4: Dialogs and Panels

**Rationale:** Lower frequency of use; can be polished after core experience is solid.
**Delivers:** Updated Settings, Connection dialogs, AI Agent sidebar, all modals
**Uses:** Glass/blur effects, scale-in animations, refined focus states
**Implements:** Raycast dialog architecture (44px header, max-height body, 56px footer)

### Phase 5: Website

**Rationale:** Marketing site can run in parallel but shares design tokens. Coordinate final polish.
**Delivers:** Dark hero sections, minimal navigation, bento grid features, updated CTAs
**Addresses:** Website-specific table stakes (fade-up animations, product screenshots)
**Avoids:** Brand inconsistency between app and website

### Phase Ordering Rationale

- **Foundation first:** Color tokens, spacing, and radius must be locked before any component work to avoid mid-migration rework
- **Navigation before content:** Navigation provides the visual context; content views reference navigation styling
- **Tables in Phase 3 (not Phase 2):** Data tables require custom treatment that builds on Phase 1 tokens but differs from navigation patterns
- **Website parallel:** Website development can start after Phase 1 tokens are defined; does not block app phases

### Research Flags

Phases likely needing deeper research during planning:

- **Phase 3 (Content Views):** Monaco editor theming has specific API requirements; may need Context7 lookup for exact integration pattern
- **Phase 3 (Content Views):** Data table accessibility for large datasets; may need additional screen reader testing research

Phases with standard patterns (skip research-phase):

- **Phase 1 (Foundation):** CSS variable patterns well-documented; STACK.md provides complete token definitions
- **Phase 2 (Navigation):** Component patterns fully documented in ARCHITECTURE.md
- **Phase 4 (Dialogs):** Standard shadcn/ui dialog patterns apply
- **Phase 5 (Website):** Marketing site patterns are conventional

## Confidence Assessment

| Area         | Confidence | Notes                                                                                                                              |
| ------------ | ---------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Stack        | HIGH       | Verified via Context7 for Framer Motion, Tailwind, shadcn/ui. Existing stack requires no changes.                                  |
| Features     | HIGH       | Based on direct analysis of Linear.app and Raycast.com patterns. Clear table stakes vs differentiators.                            |
| Architecture | HIGH       | Detailed layout diagrams, component hierarchy, and build order with file paths provided.                                           |
| Pitfalls     | MEDIUM     | Based on codebase analysis and design system migration patterns; table contrast thresholds need validation with real user testing. |

**Overall confidence:** HIGH

### Gaps to Address

- **Exact contrast ratios for tables:** Suggested 3%/5% thresholds are industry estimates; validate with user testing during Phase 3
- **Monaco theme API specifics:** May need additional research for exact theme registration method if current integration differs
- **Animation performance on Electron:** Profile before/after to verify backdrop-filter performance; may need to reduce blur radius
- **Electron vibrancy vs CSS backdrop-filter:** Runtime testing needed to determine optimal balance for macOS

## Sources

### Primary (HIGH confidence)

- Motion/Framer Motion documentation (Context7) — spring presets, reduced motion, layout animations
- shadcn/ui theming documentation (Context7) — OKLCH adoption, dark mode patterns
- Tailwind CSS dark mode documentation — class-based vs media-based dark mode
- cmdk library documentation (Context7) — command palette structure, styling hooks

### Secondary (MEDIUM confidence)

- Linear.app — visual analysis of color system, spacing, component patterns
- Raycast.com — visual analysis of command palette, dark mode, typography
- WCAG 2.1 guidelines — contrast ratio requirements (4.5:1 text, 3:1 UI components)

### Tertiary (LOW confidence)

- Exact Linear/Raycast color values — approximated from visual inspection (proprietary)
- Animation timing preferences — based on industry patterns, may vary by user demographic

---

_Research completed: 2026-01-26_
_Ready for roadmap: yes_
