---
phase: 12-table-tags
plan: 01
subsystem: data-layer
tags: [zustand, typescript, tags, store, persistence]

dependency-graph:
  requires: []
  provides: [TagDefinition-type, tag-store-api, persistence-schema]
  affects: [12-02, 12-03, 12-04]

tech-stack:
  added: []
  patterns: [zustand-store, type-first-design, backward-compatibility]

key-files:
  created:
    - apps/electron/src/shared/types/tag.ts
  modified:
    - apps/electron/src/renderer/src/stores/table-organization-store.ts
    - apps/electron/src/shared/types/renderer-store.ts
    - apps/electron/src/main/services/renderer-store.ts
    - apps/electron/src/renderer/src/components/Sidebar.tsx
    - apps/electron/src/renderer/src/hooks/useTableNavigation.ts

decisions:
  - id: tag-id-format
    decision: Use crypto.randomUUID() for tag IDs
    rationale: Provides stable references that survive renames, no external dependencies

metrics:
  duration: 23m
  completed: 2026-01-29
---

# Phase 12 Plan 01: TagDefinition Type and Store Upgrade Summary

Upgraded table organization store from string-based tags to structured TagDefinition objects with id, name, color, and createdAt properties.

## What Was Built

### 1. TagDefinition Type System (`apps/electron/src/shared/types/tag.ts`)

Created comprehensive type definitions for colored tags:

- **TagDefinition interface**: `id`, `name`, `color`, `createdAt` fields
- **TableMetadata interface**: Updated to use `tagIds: string[]` instead of `tags: string[]`
- **PRESET_TAG_COLORS**: 8 curated colors (Red, Orange, Amber, Green, Teal, Blue, Purple, Pink)
- **Helper functions**: `getContrastColor()` for text accessibility, `getRandomTagColor()` for color selection

### 2. Store Upgrade (`apps/electron/src/renderer/src/stores/table-organization-store.ts`)

Refactored the zustand store with new ID-based API:

**New API:**

- `createTag(name, color?)` - Returns new tag ID
- `updateTag(id, {name?, color?})` - Update tag properties
- `deleteTag(id)` - Remove tag and clean up references
- `setTableTagIds(tableKey, tagIds)` - Assign tags by ID
- `addTableTagId(tableKey, tagId)` - Add single tag
- `removeTableTagId(tableKey, tagId)` - Remove single tag
- `getTagById(id)` - Get tag definition
- `getTagsByIds(ids)` - Get multiple tag definitions
- `getTagByName(name)` - Find tag by name
- `migrateFromLegacy(state)` - Convert old string-based tags

**Backward Compatibility:**

- Deprecated `addTag`, `removeTag`, `renameTag` still work (delegate to new API)
- Deprecated `setTableTags`, `addTableTag`, `removeTableTag` still work
- `useAvailableTags()` hook returns tag names for compatibility

**New Selector Hooks:**

- `useTags()` - Returns `TagDefinition[]`
- `useTagById(id)` - Returns single tag definition

### 3. Persistence Schema (`apps/electron/src/shared/types/renderer-store.ts`)

Added table organization to persistence schema:

```typescript
export interface RendererTableOrganizationState {
  tags: TagDefinition[];
  tableMetadata: Record<string, TableMetadata>;
}

export interface RendererStoreSchema {
  // ... existing fields
  tableOrganization: RendererTableOrganizationState;
}
```

### 4. Component Updates (Blocking Fix)

Updated Sidebar.tsx and useTableNavigation.ts to use new API:

- Changed `metadata.tags` to `metadata.tagIds`
- Changed `availableTags` (string[]) to `tags` (TagDefinition[])
- Updated FilterTagsPopover to work with TagDefinition objects
- Updated TableItem to display colored tag badges
- Added color styling to tag display with `style={{ color: tag.color }}`

## Commits

| Hash     | Description                                                        |
| -------- | ------------------------------------------------------------------ |
| 8b666b43 | feat(12-01): create TagDefinition type with color support          |
| 9a71746c | feat(12-01): upgrade table-organization-store to use TagDefinition |
| a3a505e3 | feat(12-01): add tableOrganization to RendererStoreSchema          |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Updated Sidebar.tsx to use new API**

- **Found during:** Task 2
- **Issue:** Sidebar.tsx used old string-based tag API (`metadata.tags`, `availableTags`)
- **Fix:** Updated to use `metadata.tagIds`, `tags: TagDefinition[]`, and added color styling
- **Files modified:** `Sidebar.tsx`, `useTableNavigation.ts`
- **Commit:** 9a71746c

**2. [Rule 3 - Blocking] Added tableOrganization to renderer-store service**

- **Found during:** Task 3
- **Issue:** TypeScript compilation failed - `tableOrganization` missing from defaults
- **Fix:** Added `DEFAULT_TABLE_ORGANIZATION` constant and included in all default objects
- **Files modified:** `renderer-store.ts` (main process service)
- **Commit:** a3a505e3

## Verification

- [x] TypeScript compiles without errors across the electron app
- [x] TagDefinition type is properly exported and importable
- [x] Store has createTag, updateTag, deleteTag, getTagById methods
- [x] PRESET_TAG_COLORS constant is available
- [x] RendererStoreSchema includes tableOrganization key

## Next Phase Readiness

Plan 01 establishes the data layer foundation. Ready for:

- **Plan 02**: Color picker UI component for tag color selection
- **Plan 03**: Persistence integration using the new RendererTableOrganizationState schema
- **Plan 04**: Tag management dialog using the new CRUD API

---

_Summary generated: 2026-01-29_
