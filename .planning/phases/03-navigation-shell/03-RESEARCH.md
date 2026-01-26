# Phase 3: Navigation Shell - Research Findings

## Executive Summary

Phase 3 transforms the app's navigation chrome (Activity Bar, Sidebar, Tab Bar) from the current "Warm Modern" style to a minimal, flat Linear/Raycast-style interface. This document captures implementation patterns, current state analysis, and technical approaches for NAVI-01 (flattened sidebar), NAVI-02 (pill-style tabs), and NAVI-03 (icon-only Activity Bar).

---

## 1. Current Implementation Analysis

### 1.1 Activity Bar (`ActivityBar.tsx`)

**Location**: `/apps/electron/src/renderer/src/components/ActivityBar.tsx`

**Current State** (from git status - modified file):

- The Activity Bar component exists and is being actively modified
- Uses Lucide icons for navigation items
- Contains labels alongside icons (not icon-only)
- Uses tooltips for additional context

**Current Styling Patterns**:

- Uses Tailwind classes for styling
- Background: `bg-muted/30` or similar muted backgrounds
- Active states: Uses `bg-background`, `text-foreground` with borders
- Hover states: `hover:bg-muted`, `hover:text-foreground`

**Target Linear/Raycast Style**:

- Icon-only (no labels visible in collapsed state)
- Minimal chrome - no heavy borders or separators
- Subtle hover/active indicators
- Active state: subtle background highlight, not border-based

### 1.2 Sidebar (`Sidebar.tsx`)

**Location**: `/apps/electron/src/renderer/src/components/Sidebar.tsx`

**Current State** (62KB file - complex nested structure):

- Multi-level nesting: Schemas > Sections (Tables/Views/Triggers) > Items
- Uses `ChevronRight`/`ChevronDown` icons for expand/collapse
- Expansion state managed via `expandedSchemas` and `expandedSections` records
- Visual hierarchy through indentation and section headers

**Current Nesting Decoration**:

```jsx
// Schema level with chevron icons
<ChevronDown className="h-3 w-3" /> // or ChevronRight when collapsed
<Database className="h-3 w-3" />

// Section level (Tables, Views, Triggers)
{tablesExpanded ? <ChevronDown /> : <ChevronRight />}
```

**Key Styling Patterns**:

- Border separators between sections
- Background changes for selected items
- Hover states with `hover:bg-muted`
- Pinned items visual distinction

**Target Linear/Raycast Style**:

- Reduced visual nesting (fewer borders, less indentation)
- Flat appearance - minimize visual hierarchy indicators
- Subtle expand/collapse indicators (or remove for flat sections)
- Clean, minimal item rows

### 1.3 Tab Bars

#### 1.3.1 ConnectionTabBar (`ConnectionTabBar.tsx`)

**Location**: `/apps/electron/src/renderer/src/components/ConnectionTabBar.tsx`

**Current Active State** (lines 267-283):

```jsx
className={cn(
  'group relative flex h-full max-w-45 min-w-25 cursor-pointer items-center gap-1.5 border-r px-1.5 text-sm transition-all',
  isActive
    ? 'bg-background text-foreground'
    : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground',
)}
style={{
  borderBottomWidth: '2px',
  borderBottomStyle: 'solid',
  borderBottomColor: isActive ? connectionColor : 'transparent',
}}
```

**Current Pattern**: Border-bottom underline for active state

#### 1.3.2 DataTabBar (`data-table/DataTabBar.tsx`)

**Current Active State** (lines 153-157):

```jsx
isActive
  ? 'bg-background text-foreground border-b-gold border-b-2'
  : 'bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted/60';
```

**Current Pattern**: Border-bottom with gold/primary color

#### 1.3.3 QueryTabBar (`query-editor/QueryTabBar.tsx`)

**Current Active State** (lines 108-112):

```jsx
isActive
  ? 'bg-background text-primary shadow-[inset_0_-2px_0_0_var(--color-primary)]'
  : 'bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-gold-5';
```

**Current Pattern**: Inset shadow for underline effect

---

## 2. Linear/Raycast Design Patterns Research

### 2.1 Linear UI Patterns (from changelog research)

Linear's 2024 redesign focused on:

1. **Reduced Visual Noise**: "Tabs, headers, filters, and panels are adjusted to reduce the visual noise and clutter"
2. **Better Balance**: "Redefined the foundational layers to improve hierarchy, balance, and density"
3. **Cleaner Sidebar**: "Whether you heavily rely on favorites and folders or prefer a minimalist approach, your sidebar should feel better and less cluttered"
4. **Increased Contrast**: "Default dark and light themes have increased contrast"

**Linear Mobile (2025)**:

- "New visual design system with custom frosted glass material"
- Bottom toolbar for quick access to core workflows
- Navigation rebuilt for minimal, focused access

### 2.2 Raycast UI Patterns

- **Icon-only Navigation**: Activity bar uses icon-only design
- **Native macOS Feel**: Consistent native rendering, no second-class mini-apps
- **Keyboard-first**: Navigation designed for keyboard power users
- **Minimal Chrome**: Focus on content, minimal decorative elements

### 2.3 VS Code Activity Bar Reference

- Fixed-width icon-only sidebar (48px typical)
- Icons: 24px with 12px padding
- Active indicator: Colored left border or background highlight
- Hover: Subtle background change
- No labels in collapsed state (labels appear in expanded sidebar)

---

## 3. CSS/Tailwind Patterns for Requirements

### 3.1 NAVI-02: Pill-Style Tab Indicators

**Current Problem**: All tab bars use underline/border-bottom for active state

**Target Pattern**: Background pill/highlight for active state

**CSS Pattern**:

```css
/* Pill-style active tab */
.tab-pill-active {
  background-color: var(--accent); /* or oklch(0.75 0.183 55.934 / 15%) */
  border-radius: var(--border-radius-md); /* 8px */
  color: var(--foreground);
}

/* Remove underline indicators */
.tab-pill {
  border-bottom: none !important;
  box-shadow: none; /* Remove inset shadows */
}
```

**Tailwind Classes**:

```jsx
// Active state
'bg-accent rounded-md text-foreground';

// Inactive state
'text-muted-foreground hover:bg-muted/50 hover:text-foreground rounded-md';
```

**Key Changes**:

1. Remove `border-b-2`, `border-b-gold`, `shadow-[inset_0_-2px...]`
2. Add `rounded-md` (8px) or `rounded-lg` (10px)
3. Use `bg-accent` or `bg-primary-10` for active background
4. Ensure consistent padding for pill appearance

### 3.2 NAVI-03: Icon-Only Activity Bar

**Target Pattern**:

```jsx
// Icon-only button
<button className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-muted">
  <Icon className="w-5 h-5" />
</button>

// Active state
<button className="flex items-center justify-center w-10 h-10 rounded-lg bg-accent text-primary">
  <Icon className="w-5 h-5" />
</button>
```

**Key Principles**:

- Fixed container size (40x40px or 44x44px)
- Centered icon (20x20px or 24x24px)
- No labels - use tooltips on hover
- Rounded corners (8-12px)
- Subtle active indicator (background, not border)

### 3.3 NAVI-01: Flattened Sidebar

**Target Patterns**:

1. **Reduce Section Headers**:
   - Remove or minimize "Tables", "Views", "Triggers" section headers
   - Use subtle dividers instead of heavy section breaks

2. **Flatten Nesting Decoration**:
   - Remove or minimize chevron icons for expansion
   - Use consistent left padding without nested indentation
   - Consider flat list with type badges instead of nested structure

3. **Minimal Item Styling**:

   ```jsx
   // Flat item row
   <div className="hover:bg-muted/50 flex items-center gap-2 rounded-md px-3 py-1.5">
     <Icon className="text-muted-foreground h-4 w-4" />
     <span className="flex-1 truncate">{name}</span>
     {badge && <Badge variant="outline">{badge}</Badge>}
   </div>
   ```

4. **Reduced Visual Hierarchy**:
   - Single level of indentation maximum
   - Type indicators via icons or badges, not nested groups
   - Consistent item height across all types

---

## 4. Design Token Usage from Phase 1/2

### 4.1 Available Tokens (from `globals.css` and `sanctum.css`)

**Colors**:

```css
--primary: oklch(0.75 0.183 55.934); /* Orange 400 - dark mode */
--primary: oklch(0.646 0.222 41.116); /* Orange 600 - light mode */
--accent: oklch(0.75 0.183 55.934 / 15%); /* Primary with opacity */
--muted: var(--slate-700); /* Background for muted elements */
--muted-foreground: var(--slate-400); /* Muted text */
```

**Border Radius** (capped at 12px):

```css
--radius-sm: 6px;
--radius-md: 8px;
--radius-lg: 10px;
--radius-xl: 12px; /* MAX */
```

**Text Hierarchy**:

```css
--foreground: var(
  --text-primary
); /* Main text - Slate 100 dark / Slate 900 light */
--secondary-foreground: var(
  --text-secondary
); /* Descriptions - Slate 300 dark / Slate 600 light */
--muted-foreground: var(
  --text-muted
); /* Subtle text - Slate 400 dark / Slate 500 light */
```

### 4.2 Existing Utility Classes

From `globals.css`:

```css
/* Interactive primary button - ghost style with primary hover */
.btn-primary-ghost { ... }
.btn-primary-ghost:hover { color: var(--primary); background-color: oklch(0.75 0.183 55.934 / 10%); }

/* Interactive primary button - active/selected state */
.btn-primary-active { color: var(--primary); background-color: oklch(0.75 0.183 55.934 / 15%); }

/* Primary tab/pill - for mode switchers and segmented controls */
.pill-primary { ... }
.pill-primary.active { color: var(--primary); background-color: oklch(0.75 0.183 55.934 / 15%); }

/* Primary hover effect for list items */
.hover-primary:hover { color: var(--primary); background-color: oklch(0.75 0.183 55.934 / 8%); }
```

**These existing utilities align perfectly with the target Linear-style patterns.**

---

## 5. Implementation Recommendations

### 5.1 NAVI-01: Flattened Sidebar

**Approach**:

1. **Keep schema-level grouping** (for multi-schema databases) but flatten internal structure
2. **Remove section headers** for Tables/Views/Triggers when single schema
3. **Add type badges** to items instead of grouping by type
4. **Reduce indentation** from nested px values to flat 12px left padding
5. **Use subtle dividers** (1px border-subtle) instead of section headers

**Files to Modify**:

- `/apps/electron/src/renderer/src/components/Sidebar.tsx`

### 5.2 NAVI-02: Pill-Style Tab Bar

**Approach**:

1. Create shared `TabPill` component or utility classes
2. Apply to all three tab bars (Connection, Data, Query)
3. Remove underline/border indicators
4. Add rounded background for active state

**Files to Modify**:

- `/apps/electron/src/renderer/src/components/ConnectionTabBar.tsx`
- `/apps/electron/src/renderer/src/components/data-table/DataTabBar.tsx`
- `/apps/electron/src/renderer/src/components/query-editor/QueryTabBar.tsx`

**New CSS Tokens** (optional, could use existing `.pill-primary`):

```css
.tab-pill {
  @apply rounded-md px-3 py-1.5 text-sm transition-colors;
}
.tab-pill-active {
  @apply bg-accent text-foreground;
}
.tab-pill-inactive {
  @apply text-muted-foreground hover:bg-muted/50 hover:text-foreground;
}
```

### 5.3 NAVI-03: Icon-Only Activity Bar

**Approach**:

1. Remove label text from Activity Bar buttons
2. Add tooltips for accessibility
3. Increase icon size slightly (18px to 20px)
4. Use pill-style active indicator (background, not border)
5. Reduce overall Activity Bar width

**Files to Modify**:

- `/apps/electron/src/renderer/src/components/ActivityBar.tsx`

**Recommended Dimensions**:

- Activity Bar width: 48px
- Button size: 40x40px
- Icon size: 20x20px
- Border radius: 8px
- Padding between items: 4px

---

## 6. Success Criteria Verification Approach

| Criteria                                                 | Verification Method                                                       |
| -------------------------------------------------------- | ------------------------------------------------------------------------- |
| Activity Bar displays icon-only minimal style            | Visual inspection: no labels, icons centered, tooltips work               |
| Sidebar appears visually flattened                       | Visual inspection: reduced nesting, fewer borders, consistent indentation |
| Tab bar uses pill/background highlight                   | Visual inspection: no underlines, background highlight on active tab      |
| Navigation elements feel cohesive with dark color system | Visual inspection: uses --accent, --muted, --primary tokens correctly     |

---

## 7. Risk Assessment

| Risk                                                      | Mitigation                                            |
| --------------------------------------------------------- | ----------------------------------------------------- |
| Breaking existing functionality (tooltips, context menus) | Test all interactive features after styling changes   |
| Accessibility regression (icon-only needs labels)         | Ensure aria-labels and tooltips are present           |
| Multi-schema sidebar complexity                           | Keep schema grouping, only flatten internal structure |
| Tab bar drag-and-drop affected by style changes           | Test ConnectionTabBar drag-and-drop after changes     |
| Mobile/responsive behavior                                | Test sidebar sheet component on mobile                |

---

## 8. Dependencies

- **Phase 1 (Design Foundation)**: Color tokens, border radius capping - COMPLETE
- **Phase 2 (Typography)**: Text hierarchy tokens - COMPLETE
- **Existing utility classes**: `.pill-primary`, `.btn-primary-ghost` available for reuse

---

## 9. Recommended Implementation Order

1. **NAVI-02 (Pill-style tabs)** - Lowest risk, isolated to tab components
2. **NAVI-03 (Icon-only Activity Bar)** - Medium complexity, single component
3. **NAVI-01 (Flattened sidebar)** - Highest complexity, largest component

This order allows incremental validation and reduces risk of cascading issues.
