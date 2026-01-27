# Phase 5: Interaction System - Research Findings

## Executive Summary

This research document covers what's needed to elevate the command palette and keyboard interactions to Linear-level polish. The phase focuses on five requirements: INTR-01 (command palette visual treatment), INTR-02 (contextual commands), INTR-03 (inline keyboard shortcuts), INTR-04 (standardized transitions), and INTR-05 (keyboard-only focus rings).

---

## Current State Analysis

### Command Palette (cmdk)

**Location**: `/apps/electron/src/renderer/src/components/CommandPalette.tsx`

**Current Implementation**:

- Uses `cmdk` v1.1.1 library
- Wrapped in a Dialog component from base-ui
- Commands are registered via `useCommandPaletteStore` with Zustand
- Commands are grouped by category (actions, navigation, view, settings, help)
- Keyboard shortcuts displayed with `CommandShortcut` component
- Footer shows navigation hints (arrows for select, Enter to run)

**Current Visual Issues**:

- No transitions or animations on list items
- Basic styling without Linear-style polish
- No item hover/selected state transitions
- Missing smooth height animation when filtering
- No contextual awareness of current view

### Keyboard Shortcuts System

**Location**: `/apps/electron/src/renderer/src/stores/keyboard-shortcuts-store.ts`

**Current Implementation**:

- Comprehensive shortcut store with preset support
- `ShortcutKbd` component for displaying shortcuts from store
- Global keydown handler in `useCommands.ts`
- Shortcuts are formatted for Mac (⌘⇧⌥) and Windows (Ctrl+Shift+Alt)
- Some shortcuts are view-specific (e.g., toggle-schema-details only in Data Browser)

### Focus Ring Patterns

**Location**: `/apps/electron/src/renderer/src/styles/globals.css`

**Current Implementation** (lines 427-436):

```css
/* Remove outline focus ring on click (use :focus-visible for keyboard only) */
:focus:not(:focus-visible) {
  outline: none;
}

/* Subtle focus ring for keyboard navigation only */
:focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
}
```

**Status**: Already partially implemented. The base pattern is correct, but individual components may override this inconsistently.

### Current Transitions

**Location**: `/apps/electron/src/renderer/src/styles/globals.css` (lines 324-334)

**Design Tokens Already Defined**:

```css
/* Transition durations */
--duration-fast: 100ms;
--duration-normal: 150ms;
--duration-slow: 200ms;
--duration-slower: 300ms;

/* Transition easings */
--ease-default: cubic-bezier(0.4, 0, 0.2, 1);
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
```

**Gap**: Tokens exist but are not consistently used across components.

---

## Research Findings

### INTR-01: Command Palette Visual Treatment

#### Linear's Command Palette Design Patterns

Based on research from cmdk documentation and Linear's design:

1. **Smooth List Height Animation**

   ```css
   [cmdk-list] {
     height: var(--cmdk-list-height);
     transition: height 100ms ease;
   }
   ```

2. **Item States with Subtle Transitions**
   - Hover: `bg-muted/50` with 100ms transition
   - Selected: `bg-accent` with orange accent highlight
   - Active/executing: Subtle scale effect

3. **Visual Hierarchy**
   - Icon (muted) + Label (foreground) + Shortcut (muted, right-aligned)
   - Group headings in `text-muted-foreground` uppercase/small

4. **Animation on Open/Close**
   - Dialog slides in from slight zoom (95% to 100%)
   - Fade in overlay (already implemented)
   - List items could stagger-animate on open

5. **Scroll Padding**
   ```css
   [cmdk-list] {
     scroll-padding-block-start: 8px;
     scroll-padding-block-end: 8px;
   }
   ```

#### Implementation Approach

1. **Update Command component** in `/packages/ui/src/command.tsx`:
   - Add transition classes to `CommandItem`
   - Add height animation CSS variable support
   - Add scroll padding for better UX

2. **Enhance CommandPalette.tsx**:
   - Add item transition animations
   - Polish the footer design
   - Consider adding recent commands section

### INTR-02: Contextual Commands

#### Current View Detection

The app uses `activeView` state in `DatabaseView.tsx`:

```typescript
export type ViewType =
  | 'data'
  | 'query'
  | 'diagram'
  | 'compare'
  | 'vectorSearch'
  | 'dashboard';
```

#### Implementation Strategy

1. **Add View Context to Command Store**:

   ```typescript
   interface Command {
     // ...existing fields
     visibleInViews?: ViewType[]; // Only show when in these views
   }
   ```

2. **Create View Context Provider**:
   - Track current active view globally
   - Filter commands based on active view in `getFilteredCommands()`

3. **Add View-Specific Commands**:
   - Data Browser: Row operations, column visibility, filters
   - Query Editor: Execute, format, history
   - ER Diagram: Zoom controls, layout options
   - Compare: Switch sources, apply migration

4. **Dynamic Command Registration**:
   - Views could register their own commands on mount
   - Unregister on unmount

### INTR-03: Inline Keyboard Shortcuts in Menus

#### Current State

- `DropdownMenuShortcut` exists in `/packages/ui/src/dropdown-menu.tsx`
- `ShortcutKbd` component reads from keyboard shortcuts store
- Not consistently used across all menus

#### Files Needing Updates

1. **Toolbar.tsx** - Action menus
2. **Sidebar.tsx** - Context menus
3. **ConnectionSelector.tsx** - Connection actions
4. **QueryTabBar.tsx** - Query actions
5. **DataTabBar.tsx** - Tab actions
6. **ERControls.tsx** - Diagram controls

#### Implementation Pattern

```tsx
<DropdownMenuItem>
  <Icon className="mr-2" />
  Action Label
  <ShortcutKbd action="action.id" className="ml-auto" />
</DropdownMenuItem>
```

### INTR-04: Standardized Transitions (100-200ms + ease-out)

#### Current Usage Audit

Many components use inline transition values. Need to standardize to:

- **Fast (100ms)**: Button states, icon swaps
- **Normal (150ms)**: Menu items, hover states
- **Slow (200ms)**: Panel opens, significant state changes

#### Tailwind Integration

Create utility classes in `globals.css`:

```css
.transition-fast {
  transition: all var(--duration-fast) var(--ease-out);
}
.transition-normal {
  transition: all var(--duration-normal) var(--ease-out);
}
.transition-slow {
  transition: all var(--duration-slow) var(--ease-out);
}
```

Or use Tailwind's built-in classes consistently:

- `transition-colors duration-100 ease-out`
- `transition-all duration-150 ease-out`
- `transition-transform duration-200 ease-out`

#### Components Needing Review

1. **Button** (`/packages/ui/src/button.tsx`):
   - Currently: `transition-all` (no duration specified)
   - Need: Explicit `duration-100` for states

2. **DropdownMenuItem**:
   - Currently: No transitions
   - Need: `transition-colors duration-100`

3. **CommandItem**:
   - Currently: No transitions
   - Need: `transition-colors duration-100`

4. **Dialog/Popover**:
   - Currently: `duration-100` on animations
   - Status: OK

5. **Tabs/Pills**:
   - Currently: `transition-colors` (varies)
   - Need: Standardize to `duration-150`

### INTR-05: Focus Rings Only on Keyboard Navigation

#### Current Implementation

Already in `globals.css`:

```css
:focus:not(:focus-visible) {
  outline: none;
}

:focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
}
```

#### Audit Required

Check these component files for conflicting styles:

1. `button.tsx` - Uses `focus-visible:ring-[3px]` ✅
2. `input.tsx` - Check for any `:focus` rules
3. `command.tsx` - CommandItem selected states
4. All form controls

#### Potential Issues

1. Some Radix/base-ui primitives may add their own focus styles
2. Monaco editor has its own focus handling
3. Data table cells have custom focus for editing

---

## Dependencies

### Phase 1 (Prerequisites)

- Dark mode first approach ✅ Already implemented
- Orange accent color ✅ Already implemented

### Phase 4 (Prerequisites)

- Flat form controls (no shadow-xs) ✅ Already implemented
- Border radius capped at 12px ✅ Already implemented

---

## Technical Approach

### Files to Modify

| File                                          | Changes                                |
| --------------------------------------------- | -------------------------------------- |
| `/packages/ui/src/command.tsx`                | Add transitions, height animation      |
| `/apps/electron/.../CommandPalette.tsx`       | Contextual filtering, enhanced styling |
| `/apps/electron/.../command-palette-store.ts` | Add view context filtering             |
| `/apps/electron/.../stores/`                  | Create view-context-store.ts           |
| `/packages/ui/src/dropdown-menu.tsx`          | Add transition utilities               |
| `/packages/ui/src/button.tsx`                 | Standardize transition timing          |
| Multiple menu implementations                 | Add inline shortcuts                   |
| `/apps/electron/.../styles/globals.css`       | Add transition utility classes         |

### New Files (if any)

1. **view-context-store.ts**: Track active view for contextual commands
2. Potentially a utility hook `useActiveView()` for easy access

### CSS Changes Summary

1. **Command palette list height animation**
2. **Transition timing standardization** across all interactive elements
3. **Focus ring enforcement** - audit and fix any overrides
4. **Scroll padding** for command list

---

## Implementation Order Recommendation

1. **INTR-05**: Focus rings (quick win, foundation)
   - Audit existing styles
   - Fix any `:focus` that should be `:focus-visible`

2. **INTR-04**: Transition standardization
   - Create utility classes
   - Update button, dropdown, command components
   - ~2-3 hour task

3. **INTR-01**: Command palette visual polish
   - Add animations and transitions
   - Polish item states
   - ~3-4 hour task

4. **INTR-03**: Inline keyboard shortcuts
   - Update all dropdown menus systematically
   - ~2-3 hour task

5. **INTR-02**: Contextual commands
   - Create view context store
   - Add view awareness to command filtering
   - Register view-specific commands
   - ~4-6 hour task (most complex)

---

## Risk Assessment

| Risk                                     | Impact | Mitigation                                              |
| ---------------------------------------- | ------ | ------------------------------------------------------- |
| Transition performance on older hardware | Medium | Use `will-change` sparingly, prefer `opacity/transform` |
| Keyboard shortcuts conflicts             | Low    | Already handled by existing store                       |
| Breaking existing focus behavior         | Medium | Thorough testing with keyboard navigation               |
| Command palette height jank              | Low    | Use CSS `height: var(--cmdk-list-height)` correctly     |

---

## Success Criteria Validation

| Criteria                                 | Validation Method                                    |
| ---------------------------------------- | ---------------------------------------------------- |
| Command palette with Linear-style states | Visual inspection, 100ms transitions on hover/select |
| Contextual commands by view              | Open palette in each view, verify correct commands   |
| Shortcuts inline in menus                | Check all dropdown menus for `ShortcutKbd`           |
| Transitions 100-200ms ease-out           | DevTools timing inspection                           |
| Focus rings only on keyboard             | Click element = no ring, Tab to element = ring       |

---

## References

- [cmdk documentation](https://github.com/pacocoursey/cmdk)
- [MDN :focus-visible](https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-visible)
- [Linear Design System](https://linear.app) (reference app)
- [web.dev - Choosing the right easing](https://web.dev/articles/choosing-the-right-easing)
- [Superhuman - How to build a remarkable command palette](https://blog.superhuman.com/how-to-build-a-remarkable-command-palette/)

---

## Appendix: Existing Design Tokens

### Colors (for reference)

```css
--primary: var(--orange-400); /* Dark mode */
--primary: var(--orange-600); /* Light mode */
--accent: oklch(0.75 0.183 55.934 / 15%); /* Active state bg */
--ring: var(--orange-400/600);
```

### Border Radius

```css
--radius: 0.5rem; /* 8px base */
--radius-sm: 6px;
--radius-md: 8px;
--radius-lg: 10px;
--radius-xl: 12px; /* MAX - capped */
```

### Shadows (for command palette)

```css
--shadow-md:
  0 4px 6px -1px oklch(0 0 0 / 35%), 0 2px 4px -2px oklch(0 0 0 / 25%);
--shadow-lg:
  0 10px 15px -3px oklch(0 0 0 / 40%), 0 4px 6px -4px oklch(0 0 0 / 30%);
```
