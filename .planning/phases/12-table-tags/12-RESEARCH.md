# Phase 12: Table Tags - Research

**Researched:** 2026-01-29
**Domain:** Tag system implementation with color customization, filtering, and persistence
**Confidence:** HIGH

## Summary

Phase 12 extends the existing `table-organization-store.ts` to add colored tags for organizing database tables. The current codebase already has a functional tag system with basic string-based tags - this phase enhances it with customizable colors, proper CRUD operations, command palette integration, and electron-store persistence.

The existing implementation provides a strong foundation:

- `useTableOrganizationStore` already has `availableTags: string[]`, `addTag`, `removeTag`, `renameTag`
- Tags can be assigned to tables via `addTableTag`, `removeTableTag`, `setTableTags`
- Sidebar already filters by `activeTagFilter` and displays tag badges
- `FilterTagsPopover` component exists with filter/manage tabs

**Primary recommendation:** Extend the existing tag structure from `string[]` to `TagDefinition[]` with id, name, and color properties. Add persistence via the established renderer-store IPC pattern. Integrate with command palette using the existing `registerCommand` API.

## Standard Stack

### Core (Already in Project)

| Library        | Version | Purpose          | Why Standard                                |
| -------------- | ------- | ---------------- | ------------------------------------------- |
| Zustand        | Current | State management | Already used throughout the app             |
| electron-store | Current | Persistence      | Already used for renderer-store persistence |
| shadcn/ui      | Current | UI components    | Badge, Popover, Dialog already exist        |

### Supporting (New)

| Library        | Version | Purpose      | When to Use                                                  |
| -------------- | ------- | ------------ | ------------------------------------------------------------ |
| react-colorful | ^5.6.x  | Color picker | For tag color customization - 2.8KB gzipped, no dependencies |

### Alternatives Considered

| Instead of          | Could Use            | Tradeoff                                                     |
| ------------------- | -------------------- | ------------------------------------------------------------ |
| react-colorful      | @radix-ui/colors     | react-colorful is lighter, more focused on picker UI         |
| Custom color picker | Preset color palette | Preset is simpler, less flexible - recommend hybrid approach |

**Installation:**

```bash
pnpm add react-colorful
```

## Architecture Patterns

### Recommended Data Structure

```typescript
// Enhanced tag definition with color
interface TagDefinition {
  id: string; // UUID for stable references
  name: string; // Display name
  color: string; // Hex color (e.g., "#F97316")
  createdAt: string; // ISO timestamp
}

// Updated store state
interface TableOrganizationState {
  sortOption: TableSortOption;
  tags: TagDefinition[]; // Changed from availableTags: string[]
  tableMetadata: Record<TableKey, TableMetadata>;
  activeTagFilter: string | null; // Now stores tag ID instead of name
  // ... actions
}

// Table metadata now references tag IDs
interface TableMetadata {
  tagIds: string[]; // Changed from tags: string[]
  sortOrder?: number;
  pinned?: boolean;
  color?: string;
}
```

### Pattern 1: Extend Existing Store

**What:** Modify `table-organization-store.ts` to use `TagDefinition[]` instead of `string[]`
**When to use:** Always - don't create a separate store

```typescript
// Source: Existing project pattern
export const useTableOrganizationStore = create<TableOrganizationState>()(
  (set, get) => ({
    tags: [],
    tableMetadata: {},
    activeTagFilter: null,

    // Tag CRUD
    createTag: (name: string, color: string) => {
      const id = crypto.randomUUID();
      set((state) => ({
        tags: [
          ...state.tags,
          {
            id,
            name: name.trim(),
            color,
            createdAt: new Date().toISOString(),
          },
        ],
      }));
      return id;
    },

    updateTag: (
      id: string,
      updates: Partial<Omit<TagDefinition, 'id' | 'createdAt'>>
    ) => {
      set((state) => ({
        tags: state.tags.map((t) => (t.id === id ? { ...t, ...updates } : t)),
      }));
    },

    deleteTag: (id: string) => {
      set((state) => ({
        tags: state.tags.filter((t) => t.id !== id),
        // Also remove from all table metadata
        tableMetadata: Object.fromEntries(
          Object.entries(state.tableMetadata).map(([key, meta]) => [
            key,
            { ...meta, tagIds: meta.tagIds.filter((tid) => tid !== id) },
          ])
        ),
        activeTagFilter:
          state.activeTagFilter === id ? null : state.activeTagFilter,
      }));
    },
    // ...
  })
);
```

### Pattern 2: Persistence via Renderer Store

**What:** Use existing IPC pattern for electron-store persistence
**When to use:** For persisting tags across app restarts

```typescript
// Add to RendererStoreSchema in @shared/types/renderer-store.ts
export interface RendererTableOrganizationState {
  tags: TagDefinition[];
  tableMetadata: Record<string, TableMetadata>;
}

export interface RendererStoreSchema {
  settings: RendererSettingsState;
  diagram: RendererDiagramState;
  panelWidths: RendererPanelWidths;
  connectionUi: RendererConnectionState;
  onboarding: RendererOnboardingState;
  tableOrganization: RendererTableOrganizationState; // NEW
}
```

### Pattern 3: Command Palette Integration

**What:** Register tag commands using existing `registerCommands` API
**When to use:** For TAG-07 requirement

```typescript
// Source: Existing command-palette-store.ts pattern
import { Tag } from 'lucide-react';

// Register dynamic commands for each tag
useEffect(() => {
  const { registerCommands, unregisterCommand } =
    useCommandPaletteStore.getState();

  const tagCommands: Command[] = tags.map((tag) => ({
    id: `filter-tag-${tag.id}`,
    label: `Filter by tag: ${tag.name}`,
    icon: Tag,
    category: 'navigation',
    keywords: ['tag', 'filter', tag.name],
    action: () => setActiveTagFilter(tag.id),
  }));

  registerCommands(tagCommands);

  return () => {
    tagCommands.forEach((cmd) => unregisterCommand(cmd.id));
  };
}, [tags]);
```

### Pattern 4: Color Picker Component

**What:** Create reusable ColorPicker using react-colorful + preset palette
**When to use:** For tag color selection UI

```typescript
// Hybrid approach: presets + custom picker
import { HexColorPicker, HexColorInput } from 'react-colorful';

const PRESET_COLORS = [
  '#EF4444', '#F97316', '#F59E0B', '#22C55E',
  '#14B8A6', '#3B82F6', '#8B5CF6', '#EC4899',
];

function TagColorPicker({ color, onChange }: Props) {
  const [showCustom, setShowCustom] = useState(false);

  return (
    <Popover>
      <PopoverTrigger>
        <div
          className="h-6 w-6 rounded-md border"
          style={{ backgroundColor: color }}
        />
      </PopoverTrigger>
      <PopoverContent>
        <div className="grid grid-cols-4 gap-2">
          {PRESET_COLORS.map((preset) => (
            <button
              key={preset}
              className={cn("h-6 w-6 rounded-md", color === preset && "ring-2")}
              style={{ backgroundColor: preset }}
              onClick={() => onChange(preset)}
            />
          ))}
        </div>
        {showCustom && (
          <HexColorPicker color={color} onChange={onChange} />
        )}
        <Button variant="ghost" onClick={() => setShowCustom(!showCustom)}>
          {showCustom ? 'Hide' : 'Custom color...'}
        </Button>
      </PopoverContent>
    </Popover>
  );
}
```

### Anti-Patterns to Avoid

- **Don't create a separate tags store:** Extend existing `table-organization-store`
- **Don't persist tags in localStorage:** Use electron-store via IPC like other renderer state
- **Don't use tag names as identifiers:** Use UUIDs for stable references when renaming
- **Don't inline color picker logic:** Create reusable component for consistency

## Don't Hand-Roll

| Problem         | Don't Build            | Use Instead                | Why                                         |
| --------------- | ---------------------- | -------------------------- | ------------------------------------------- |
| Color picker UI | Custom color selection | react-colorful             | Edge cases with color spaces, accessibility |
| UUID generation | Custom ID generator    | crypto.randomUUID()        | Already used throughout codebase            |
| Persistence     | Custom file storage    | renderer-store IPC pattern | Consistent with existing architecture       |
| Tag badges      | Custom styled spans    | existing Badge component   | Already has variants and styling            |

**Key insight:** The codebase already has 80% of the tag system implemented. This phase is primarily about adding colors, proper IDs, and persistence - not building from scratch.

## Common Pitfalls

### Pitfall 1: Breaking Migration for Existing Tags

**What goes wrong:** Users lose existing tag assignments when upgrading
**Why it happens:** Changing from `string[]` to `TagDefinition[]` without migration
**How to avoid:** Add migration logic that converts old string tags to new format
**Warning signs:** Tests fail when loading old state format

```typescript
// Migration helper
function migrateOldTags(oldTags: string[]): TagDefinition[] {
  return oldTags.map((name, index) => ({
    id: crypto.randomUUID(),
    name,
    color: PRESET_COLORS[index % PRESET_COLORS.length],
    createdAt: new Date().toISOString(),
  }));
}
```

### Pitfall 2: Command Palette Memory Leak

**What goes wrong:** Commands accumulate when tags change
**Why it happens:** Not unregistering old tag commands before registering new ones
**How to avoid:** Always unregister in useEffect cleanup
**Warning signs:** Duplicate commands in palette, stale tag names

### Pitfall 3: Color Contrast Issues

**What goes wrong:** Tag text becomes unreadable on certain background colors
**Why it happens:** Not calculating contrast for text color
**How to avoid:** Use white/black text based on luminance calculation
**Warning signs:** Light text on light background, dark text on dark background

```typescript
function getContrastColor(hexColor: string): 'white' | 'black' {
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? 'black' : 'white';
}
```

### Pitfall 4: Sidebar Performance with Many Tags

**What goes wrong:** Sidebar becomes sluggish with many tagged tables
**Why it happens:** Re-computing filtered tables on every render
**How to avoid:** Use `useMemo` for filtered lists (already done in Sidebar.tsx)
**Warning signs:** Lag when switching filters, profiler shows expensive re-renders

## Code Examples

### Tag Creation Dialog

```typescript
// Source: Following existing Dialog patterns in the project
function CreateTagDialog({ open, onOpenChange }: Props) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#F97316'); // Default orange
  const createTag = useTableOrganizationStore((s) => s.createTag);

  const handleCreate = () => {
    if (name.trim()) {
      createTag(name.trim(), color);
      setName('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Tag</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Important, Archive, WIP"
            />
          </div>
          <div>
            <Label>Color</Label>
            <TagColorPicker color={color} onChange={setColor} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!name.trim()}>
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### Colored Tag Badge

```typescript
// Source: Extending existing Badge component pattern
interface ColoredTagBadgeProps {
  tag: TagDefinition;
  onRemove?: () => void;
  size?: 'sm' | 'md';
}

function ColoredTagBadge({ tag, onRemove, size = 'sm' }: ColoredTagBadgeProps) {
  const textColor = getContrastColor(tag.color);

  return (
    <Badge
      className={cn(
        "gap-1",
        size === 'sm' ? "h-4 px-1 text-2xs" : "h-5 px-2 text-xs"
      )}
      style={{
        backgroundColor: tag.color,
        color: textColor,
        borderColor: tag.color,
      }}
    >
      {tag.name}
      {onRemove && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="hover:opacity-70"
        >
          <X className="h-2.5 w-2.5" />
        </button>
      )}
    </Badge>
  );
}
```

### Persistence Hook

```typescript
// Source: Following existing settings-store.ts pattern
import { sqlPro } from '@/lib/api';

// Load on mount
useEffect(() => {
  const loadState = async () => {
    const result = await sqlPro.rendererStore.get({ key: 'tableOrganization' });
    if (result.success && result.data) {
      set(result.data);
    }
  };
  loadState();
}, []);

// Persist on change (debounced)
const debouncedPersist = useMemo(
  () =>
    debounce((state: TableOrganizationState) => {
      sqlPro.rendererStore.set({
        key: 'tableOrganization',
        value: { tags: state.tags, tableMetadata: state.tableMetadata },
      });
    }, 500),
  []
);

// Subscribe to changes
useEffect(() => {
  return useTableOrganizationStore.subscribe((state) => {
    debouncedPersist(state);
  });
}, []);
```

## State of the Art

| Old Approach             | Current Approach       | When Changed     | Impact                      |
| ------------------------ | ---------------------- | ---------------- | --------------------------- |
| localStorage persistence | electron-store via IPC | Project standard | Consistent data location    |
| String-based tag IDs     | UUID-based IDs         | This phase       | Stable references on rename |
| No color support         | Hex color per tag      | This phase       | Visual organization         |

**Deprecated/outdated:**

- Using `availableTags: string[]` - upgrade to `tags: TagDefinition[]`
- Persisting tags in component state - use store + electron-store

## Open Questions

1. **Tag Ordering**
   - What we know: Tags can be reordered for display preference
   - What's unclear: Should drag-drop reordering be supported?
   - Recommendation: Defer to future phase, keep alphabetical for now

2. **Multi-select Filter**
   - What we know: Current filter is single-tag (OR logic)
   - What's unclear: Should multiple tags be selectable (AND/OR)?
   - Recommendation: Start with single-tag filter, matches current implementation

## Sources

### Primary (HIGH confidence)

- `/apps/electron/src/renderer/src/stores/table-organization-store.ts` - Existing tag implementation
- `/apps/electron/src/renderer/src/components/Sidebar.tsx` - Tag UI patterns
- `/apps/electron/src/main/services/renderer-store.ts` - Persistence pattern
- `/apps/electron/src/renderer/src/stores/command-palette-store.ts` - Command integration

### Secondary (MEDIUM confidence)

- [react-colorful npm](https://www.npmjs.com/package/react-colorful) - Color picker library docs
- [Shadcn UI Color Picker patterns](https://allshadcn.com) - Community implementations

### Tertiary (LOW confidence)

- [Zustand persist middleware docs](https://pmnd.rs) - Alternative persistence pattern (not recommended for Electron)

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - All libraries already in project or well-established
- Architecture: HIGH - Following existing project patterns exactly
- Pitfalls: HIGH - Derived from codebase analysis and common React patterns

**Research date:** 2026-01-29
**Valid until:** 2026-02-28 (30 days - stable patterns)
