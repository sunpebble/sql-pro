---
phase: 10-website-content
plan: 01
subsystem: website
tags: [hero, screenshot, marketing, i18n, react]

# Dependency graph
requires:
  - phase: 09-website-foundation
    provides: Token system and component CSS alignment
provides:
  - Screenshot-first hero with actual product image
  - Simplified marketing copy (tagline vs paragraph)
  - Page structure without Pricing section
affects: [10-02, 10-03, website-polish]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Screenshot-first hero design (Linear/Raycast style)
    - Translation key for tagline copy

key-files:
  created: []
  modified:
    - apps/website/src/components/Hero.tsx
    - apps/website/src/components/Hero.css
    - apps/website/src/App.tsx
    - apps/website/src/locales/en.json
    - apps/website/src/locales/zh.json

key-decisions:
  - 'Used query-dark.png as hero screenshot (best showcases query editor)'
  - 'Removed simulated preview card entirely (replaced with real screenshot)'
  - 'Simplified hero description to single tagline in both languages'

patterns-established:
  - 'Screenshot-first hero: Product image as visual anchor, minimal copy'
  - 'Translation-based tagline: hero.description key for concise copy'

# Metrics
duration: 4min
completed: 2026-01-27
---

# Phase 10 Plan 01: Hero Simplification Summary

**Screenshot-first hero with actual product screenshot, simplified tagline copy, and Pricing section removed from page**

## Performance

- **Duration:** 4 min
- **Started:** 2026-01-27T13:29:05Z
- **Completed:** 2026-01-27T13:33:00Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Replaced simulated preview card with actual product screenshot (query-dark.png)
- Simplified hero title to single-line "SQL Pro" using translation key
- Removed feature tags section (redundant with Features section)
- Removed Pricing section from App.tsx page structure
- Updated hero description to concise tagline in both English and Chinese

## Task Commits

Each task was committed atomically:

1. **Task 1: Simplify Hero.tsx to screenshot-first design** - `718aafcf` (feat)
2. **Task 2: Remove Pricing section and update translations** - `8755b3e1` (feat)

## Files Created/Modified

- `apps/website/src/components/Hero.tsx` - Screenshot-first design with actual product image
- `apps/website/src/components/Hero.css` - Removed preview card styles, added screenshot container
- `apps/website/src/App.tsx` - Removed Pricing import and component
- `apps/website/src/locales/en.json` - Simplified hero.description to tagline
- `apps/website/src/locales/zh.json` - Simplified hero.description to Chinese tagline

## Decisions Made

- Used query-dark.png as hero screenshot - best showcases the query editor interface with syntax highlighting
- Kept translation key structure for tagline - allows easy localization
- Kept pricing translation keys in JSON files - prevents build errors if Pricing is re-added later

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Hero section complete with product-focused design
- Ready for 10-02 (Features bento grid) and 10-03 (Download/Footer cleanup)
- No blockers

---

_Phase: 10-website-content_
_Completed: 2026-01-27_
