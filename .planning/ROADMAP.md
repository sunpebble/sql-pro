# Roadmap: SQL Pro Design Refresh

## Overview

This project transforms SQL Pro from a "Warm Modern" design (orange/warm white, large corners) to a Linear/Raycast-style interface (dark-first, minimal chrome, refined micro-interactions). The journey begins with establishing the design token foundation (OKLCH colors, dark-first CSS), progresses through app shell and component updates, coordinates with Monaco editor theming, and concludes with the marketing website refresh. All 27 v1 requirements map to 11 phases with clear dependencies.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Design Foundation** - OKLCH color system, dark-first CSS variables, spacing and radius tokens
- [x] **Phase 2: Typography & Text** - Text hierarchy system with primary/secondary/muted levels
- [x] **Phase 3: Navigation Shell** - Activity Bar, Sidebar, and Tab Bars visual refresh (4/4 verified)
- [x] **Phase 4: Core Components** - Buttons, inputs, and form controls refinement
- [x] **Phase 5: Interaction System** - Command palette, transitions, keyboard focus (5/5 verified)
- [ ] **Phase 6: Dialog & Overlay Polish** - Glassmorphism, hover states, loading states
- [ ] **Phase 7: Data Views** - Table view contrast and density optimization
- [ ] **Phase 8: Monaco Editor** - SQL editor theme coordination with design system
- [ ] **Phase 9: Website Foundation** - Color system and typography alignment with app
- [ ] **Phase 10: Website Content** - Hero, features, pricing, download sections
- [ ] **Phase 11: Website Polish** - Scroll animations and product demos

## Phase Details

### Phase 1: Design Foundation

**Goal**: Establish the complete design token system that all other phases depend on
**Depends on**: Nothing (first phase)
**Requirements**: FOUND-01, FOUND-02, FOUND-03, FOUND-04, FOUND-05, FOUND-06
**Success Criteria** (what must be TRUE):

1. Dark mode is the default when opening the app (no flash of light mode)
2. All colors use OKLCH format in CSS variables with Slate neutral palette
3. Orange accent color appears vibrant against dark backgrounds without being neon
4. Border radius throughout app measures 8-12px (not 20px+)
5. Borders appear subtle (6-10% opacity) rather than solid lines

**Plans**: 4 plans in 2 waves

Plans:

- [ ] 01-01-PLAN.md — Core CSS variable structure (dark-first inversion, orange primary)
- [ ] 01-02-PLAN.md — Border, radius, and shadow token system
- [ ] 01-03-PLAN.md — Website CSS alignment with app design tokens
- [ ] 01-04-PLAN.md — Shared UI package dark-first update

### Phase 2: Typography & Text

**Goal**: Create clear visual hierarchy through text styling
**Depends on**: Phase 1
**Requirements**: VISL-01
**Success Criteria** (what must be TRUE):

1. User can distinguish three text levels at a glance: primary (bright), secondary (dimmed), muted (subtle)
2. Text contrast meets WCAG 4.5:1 ratio against dark backgrounds

**Plans**: 1 plan

Plans:

- [x] 02-01-PLAN.md — Three-level text hierarchy tokens (primary/secondary/muted)

### Phase 3: Navigation Shell

**Goal**: Transform the app's navigation chrome to minimal, flat Linear-style
**Depends on**: Phase 1, Phase 2
**Requirements**: NAVI-01, NAVI-02, NAVI-03
**Success Criteria** (what must be TRUE):

1. Activity Bar displays icon-only minimal style (no labels, no heavy chrome)
2. Sidebar appears visually flattened with reduced nesting decoration
3. Tab bar uses pill/background highlight for active state (not underlines)
4. Navigation elements feel cohesive with the new dark color system
   **Plans**: TBD

Plans:

- [x] 03-01-PLAN.md — Pill-style tab bars (ConnectionTabBar, DataTabBar, QueryTabBar)
- [x] 03-02-PLAN.md — Minimal Activity Bar (flat styling, no gradients/glow)
- [x] 03-03-PLAN.md — Flattened Sidebar (removed border-left lines, simplified headers)
- [x] 03-04-PLAN.md — Gap closure: Sidebar tabs pill style

### Phase 4: Core Components

**Goal**: Refine buttons, inputs, and form controls to minimal aesthetic
**Depends on**: Phase 1, Phase 2
**Requirements**: VISL-02, VISL-03
**Success Criteria** (what must be TRUE):

1. Buttons appear simpler with less decoration (no heavy shadows or gradients)
2. Input fields and forms look refined against dark backgrounds
3. Primary actions use orange accent appropriately without overwhelming

**Plans**: 4 plans in 1 wave (all parallel)

Plans:

- [x] 04-01-PLAN.md — Button components simplification (button.tsx, gold-button.tsx)
- [x] 04-02-PLAN.md — Input components shadow removal (input.tsx, textarea.tsx, select.tsx)
- [x] 04-03-PLAN.md — Form controls cleanup (checkbox.tsx, switch.tsx, radio-group.tsx)
- [x] 04-04-PLAN.md — Secondary components verification (toggle, combobox, input-otp, groups)

### Phase 5: Interaction System

**Goal**: Elevate command palette and keyboard interactions to Linear-level polish
**Depends on**: Phase 1, Phase 4
**Requirements**: INTR-01, INTR-02, INTR-03, INTR-04, INTR-05
**Success Criteria** (what must be TRUE):

1. Command palette (Cmd+K) displays with Linear-style item states and transitions
2. Command palette shows contextual commands based on current view
3. Menu items and actions display their keyboard shortcuts inline
4. Transitions throughout app complete in 100-200ms with ease-out timing
5. Focus rings only appear during keyboard navigation (not mouse clicks)

**Plans**: 4 plans in 2 waves

Plans:

- [x] 05-01-PLAN.md — Focus rings audit and transition standardization (INTR-04, INTR-05)
- [x] 05-02-PLAN.md — Command palette visual polish with height animation (INTR-01)
- [x] 05-03-PLAN.md — Inline keyboard shortcuts in dropdown menus (INTR-03)
- [x] 05-04-PLAN.md — Contextual commands based on current view (INTR-02)

### Phase 6: Dialog & Overlay Polish

**Goal**: Apply premium polish to dialogs, popovers, and state feedback
**Depends on**: Phase 1, Phase 4
**Requirements**: VISL-04, VISL-05, VISL-06
**Success Criteria** (what must be TRUE):

1. Dialogs and popovers display subtle glassmorphism (backdrop blur)
2. Hover states show gentle background changes (no lift/scale effects)
3. Loading and skeleton states appear minimal and refined

**Plans**: 3 plans in 1 wave (all parallel)

Plans:

- [ ] 06-01-PLAN.md — Glassmorphism on dialogs (alert-dialog, sheet)
- [ ] 06-02-PLAN.md — Glassmorphism on popovers (popover, dropdown-menu, context-menu, tooltip, hover-card)
- [ ] 06-03-PLAN.md — Card hover cleanup and loading state verification

### Phase 7: Data Views

**Goal**: Optimize table view for data density while maintaining dark mode contrast
**Depends on**: Phase 1, Phase 2
**Requirements**: VISL-07
**Success Criteria** (what must be TRUE):

1. Table rows remain distinguishable at 500+ row result sets
2. Row hover states provide clear visual feedback
3. Data remains readable with proper contrast against dark backgrounds
   **Plans**: TBD

Plans:

- [ ] 07-01: TBD

### Phase 8: Monaco Editor

**Goal**: Coordinate SQL editor theming with the new design system
**Depends on**: Phase 1
**Requirements**: EDIT-01, EDIT-02
**Success Criteria** (what must be TRUE):

1. SQL syntax highlighting colors harmonize with dark theme (no jarring contrasts)
2. Editor cursor and selection use orange accent appropriately
3. Complex SQL (JOINs, CTEs, subqueries) remains readable
   **Plans**: TBD

Plans:

- [ ] 08-01: TBD

### Phase 9: Website Foundation

**Goal**: Align website color system and typography with refreshed app design
**Depends on**: Phase 1
**Requirements**: WEB-08
**Success Criteria** (what must be TRUE):

1. Website uses the same dark color palette as the app
2. Typography and text hierarchy match app styling
3. Brand feels consistent when switching between app and website
   **Plans**: TBD

Plans:

- [ ] 09-01: TBD

### Phase 10: Website Content

**Goal**: Rebuild website sections with minimal, product-focused content
**Depends on**: Phase 9
**Requirements**: WEB-01, WEB-02, WEB-03, WEB-04, WEB-06, WEB-07
**Success Criteria** (what must be TRUE):

1. Hero section prominently displays product screenshot/demo
2. Marketing copy is concise, focusing on core value proposition
3. Features section uses bento grid layout
4. Product demo (video or animation) is embedded and plays smoothly
5. Download section is streamlined and clear
6. Footer contains only essential links
   **Plans**: TBD

Plans:

- [ ] 10-01: TBD

### Phase 11: Website Polish

**Goal**: Add refined animations and ensure cohesive user experience
**Depends on**: Phase 10
**Requirements**: WEB-05
**Success Criteria** (what must be TRUE):

1. Sections animate in with fade-up effect on scroll
2. Animations respect reduced-motion preferences
3. Overall website feels polished and premium
   **Plans**: TBD

Plans:

- [ ] 11-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8 -> 9 -> 10 -> 11

| Phase                      | Plans Complete | Status      | Completed  |
| -------------------------- | -------------- | ----------- | ---------- |
| 1. Design Foundation       | 4/4            | Complete    | 2026-01-26 |
| 2. Typography & Text       | 1/1            | Complete    | 2026-01-26 |
| 3. Navigation Shell        | 4/4            | Complete    | 2026-01-27 |
| 4. Core Components         | 4/4            | Complete    | 2026-01-27 |
| 5. Interaction System      | 4/4            | Complete    | 2026-01-27 |
| 6. Dialog & Overlay Polish | 0/3            | Planned     | -          |
| 7. Data Views              | 0/TBD          | Not started | -          |
| 8. Monaco Editor           | 0/TBD          | Not started | -          |
| 9. Website Foundation      | 0/TBD          | Not started | -          |
| 10. Website Content        | 0/TBD          | Not started | -          |
| 11. Website Polish         | 0/TBD          | Not started | -          |

---

_Roadmap created: 2026-01-26_
_Derived from 27 v1 requirements with 100% coverage_
