# Phase 4: Core Components - Research

**Researched:** 2026-01-27
**Domain:** Button/Input/Form Component Simplification, Dark Mode Styling
**Confidence:** HIGH

## Summary

This research covers the simplification of buttons, inputs, and form controls in SQL Pro to achieve a minimal, Linear/Raycast-style aesthetic. The current implementation uses shadcn/ui components built on Base UI primitives with class-variance-authority (CVA) for variants. The components are functional but carry visual "baggage" from the original "Warm Modern" design (shadow-xs decorations, gradient effects on BrandButton, and extra visual weight).

Phase 4 focuses on two requirements:

- **VISL-02**: Simplified button design (less decoration)
- **VISL-03**: Refined input/form styling for dark mode

The key insight is that the components are already well-structured with Tailwind/CVA - the changes are primarily about removing/reducing decorative classes rather than restructuring. The `shadow-xs` class appears on inputs, checkboxes, selects, switches, and outline buttons - removing it will immediately reduce visual weight. The BrandButton (formerly GoldButton) uses heavier shadows and gradients that should be simplified.

**Primary recommendation:** Reduce decorative shadows and gradients on form controls while preserving functional styling (borders, focus rings, error states). Update BrandButton to use flat styling with subtle hover effects instead of shadows/gradients.

## Component Inventory

| Component   | File                              | Current Decorations                           | Needs Simplification |
| ----------- | --------------------------------- | --------------------------------------------- | -------------------- |
| Button      | `packages/ui/src/button.tsx`      | `shadow-xs` on outline variant                | Yes - remove shadow  |
| BrandButton | `packages/ui/src/gold-button.tsx` | `shadow-md`, `shadow-lg`, `shadow-primary/25` | Yes - flatten design |
| Input       | `packages/ui/src/input.tsx`       | `shadow-xs`                                   | Yes - remove shadow  |
| Textarea    | `packages/ui/src/textarea.tsx`    | `shadow-xs`                                   | Yes - remove shadow  |
| Select      | `packages/ui/src/select.tsx`      | `shadow-xs` on trigger                        | Yes - remove shadow  |
| Checkbox    | `packages/ui/src/checkbox.tsx`    | `shadow-xs`                                   | Yes - remove shadow  |
| Switch      | `packages/ui/src/switch.tsx`      | `shadow-xs`                                   | Yes - remove shadow  |
| RadioGroup  | `packages/ui/src/radio-group.tsx` | `shadow-xs`                                   | Yes - remove shadow  |
| Combobox    | `packages/ui/src/combobox.tsx`    | `shadow-xs`                                   | Yes - remove shadow  |
| Toggle      | `packages/ui/src/toggle.tsx`      | `shadow-xs` on outline                        | Yes - remove shadow  |

## Recommended Implementation Order

### Wave 1: All Plans (Parallel - No File Overlaps)

**Plan 01:** Button Components (button.tsx, gold-button.tsx)
**Plan 02:** Input Components (input.tsx, textarea.tsx, select.tsx)
**Plan 03:** Form Controls (checkbox.tsx, switch.tsx, radio-group.tsx)
**Plan 04:** Secondary Components (toggle.tsx, combobox.tsx, input-otp.tsx, input-group.tsx, button-group.tsx)

## Success Criteria Verification

| Criterion                                          | How to Verify                                                   |
| -------------------------------------------------- | --------------------------------------------------------------- |
| Buttons appear simpler with less decoration        | Visual comparison before/after screenshots - no shadows visible |
| Input fields look refined against dark backgrounds | Forms visible, borders subtle but distinguishable               |
| Primary actions use orange accent appropriately    | Primary buttons solid orange, not glowing or gradient           |

---

_Research date: 2026-01-27_
_Valid until: 2026-02-27 (30 days - stable patterns)_
