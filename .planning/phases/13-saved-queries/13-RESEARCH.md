# Phase 13: Saved Queries - Research

**Researched:** 2026-01-30
**Domain:** Saved query management with folder organization, parameterized variables, and command palette integration
**Confidence:** HIGH

## Summary

Phase 13 implements a complete saved queries system that allows users to save, organize, and quickly execute frequently-used SQL queries. The feature has significant overlap with the existing `query-templates-store.ts` which provides built-in SQL templates - this phase extends the concept with user persistence, folder organization, and parameterized query support.

Key findings from codebase analysis:

- `query-templates-store.ts` already has `QueryTemplate` interface with id, name, description, query, category, timestamps
- Phase 12 established patterns for persistence (`renderer-store` IPC), command palette integration (`useTagCommands` hook), and ID-based entities
- The existing `QueryTemplatesPicker.tsx` component provides a reusable pattern for query browsing UI
- Command palette already supports dynamic command registration via `registerCommands`/`unregisterCommand`

**Primary recommendation:** Create a new `saved-queries-store.ts` separate from templates (templates are built-in, saved queries are user-owned). Use the Phase 12 patterns for persistence and command integration. Implement folder organization as a flat structure with `folderId` references. Parse `{{variable}}` syntax with regex and show a parameter input dialog before execution.

## Standard Stack

### Core (Already in Project)

| Library        | Version | Purpose          | Why Standard                                     |
| -------------- | ------- | ---------------- | ------------------------------------------------ |
| Zustand        | Current | State management | Used throughout app, established patterns        |
| electron-store | Current | Persistence      | renderer-store IPC pattern from Phase 12         |
| shadcn/ui      | Current | UI components    | Dialog, Input, ScrollArea, Badge already exist   |
| lucide-react   | Current | Icons            | Save, FolderOpen, Play, Variable icons available |

### Supporting (No New Dependencies)

| Library    | Version | Purpose              | When to Use                          |
| ---------- | ------- | -------------------- | ------------------------------------ |
| Monaco     | Current | Query editing        | Already integrated for SQL editing   |
| react-i18n | Current | Internationalization | Follow existing translation patterns |

### Alternatives Considered

| Instead of                   | Could Use                    | Tradeoff                                                |
| ---------------------------- | ---------------------------- | ------------------------------------------------------- |
| Separate saved-queries store | Extend query-templates-store | Keep separation: templates=built-in, saved=user-owned   |
| Nested folder structure      | Flat with folderId           | Flat is simpler, supports one level which is sufficient |
| Custom variable parser       | Handlebars/Mustache lib      | Simple regex sufficient for `{{var}}` syntax            |

**Installation:**

```bash
# No new dependencies required
```

## Architecture Patterns

### Recommended Data Structure

```typescript
// Saved query definition
interface SavedQuery {
  id: string; // UUID for stable references
  name: string; // Display name
  description?: string; // Optional description
  query: string; // SQL query text (may contain {{variables}})
  folderId: string | null; // null = root level, otherwise folder ID
  connectionId?: string; // Optional: scope to specific connection
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
  lastExecutedAt?: string; // Track usage
  executionCount: number; // Track popularity
}

// Folder for organizing queries
interface QueryFolder {
  id: string; // UUID
  name: string; // Folder name
  color?: string; // Optional color (use tag colors)
  createdAt: string; // ISO timestamp
  sortOrder: number; // For custom ordering
}

// Parameter extracted from query
interface QueryParameter {
  name: string; // Variable name (without braces)
  defaultValue?: string; // Optional default
  type?: 'string' | 'number' | 'date'; // Optional type hint
}

// Store state
interface SavedQueriesState {
  queries: SavedQuery[];
  folders: QueryFolder[];
  searchQuery: string;
  activeFolderId: string | null; // Filter by folder

  // Query CRUD
  saveQuery: (
    query: Omit<SavedQuery, 'id' | 'createdAt' | 'updatedAt' | 'executionCount'>
  ) => string;
  updateQuery: (id: string, updates: Partial<SavedQuery>) => void;
  deleteQuery: (id: string) => void;
  duplicateQuery: (id: string) => string;

  // Folder CRUD
  createFolder: (name: string, color?: string) => string;
  updateFolder: (id: string, updates: Partial<QueryFolder>) => void;
  deleteFolder: (id: string, deleteQueries?: boolean) => void;

  // Execution
  recordExecution: (id: string) => void;

  // Helpers
  getQueriesInFolder: (folderId: string | null) => SavedQuery[];
  getFilteredQueries: () => SavedQuery[];
  parseParameters: (query: string) => QueryParameter[];
}
```

### Pattern 1: Separate Store from Templates

**What:** Create `saved-queries-store.ts` distinct from `query-templates-store.ts`
**When to use:** Always - maintains separation of concerns

```typescript
// Source: Following existing store patterns
import { create } from 'zustand';
import { sqlPro } from '@/lib/api';
import { isElectronEnvironment } from '@/lib/storage';

export const useSavedQueriesStore = create<SavedQueriesState>()((set, get) => ({
  queries: [],
  folders: [],
  searchQuery: '',
  activeFolderId: null,

  saveQuery: (queryData) => {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const newQuery: SavedQuery = {
      ...queryData,
      id,
      createdAt: now,
      updatedAt: now,
      executionCount: 0,
    };

    set((state) => ({
      queries: [...state.queries, newQuery],
    }));

    return id;
  },

  updateQuery: (id, updates) => {
    set((state) => ({
      queries: state.queries.map((q) =>
        q.id === id
          ? { ...q, ...updates, updatedAt: new Date().toISOString() }
          : q
      ),
    }));
  },

  deleteQuery: (id) => {
    set((state) => ({
      queries: state.queries.filter((q) => q.id !== id),
    }));
  },

  // ... more actions
}));
```

### Pattern 2: Persistence via Renderer Store (Phase 12 Pattern)

**What:** Use debounced persistence via IPC to electron-store
**When to use:** For persisting saved queries across app restarts

```typescript
// Source: Following table-organization-store.ts pattern from Phase 12

// Add to RendererStoreSchema in @shared/types/renderer-store.ts
export interface RendererSavedQueriesState {
  queries: SavedQuery[];
  folders: QueryFolder[];
}

export interface RendererStoreSchema {
  // ... existing keys
  savedQueries: RendererSavedQueriesState; // NEW
}

// In saved-queries-store.ts
const persistState = debounce(
  (state: { queries: SavedQuery[]; folders: QueryFolder[] }) => {
    if (!isElectronEnvironment()) return;
    sqlPro.rendererStore
      .set({
        key: 'savedQueries',
        value: { queries: state.queries, folders: state.folders },
      })
      .catch((error: unknown) => {
        console.error('Failed to persist saved queries state:', error);
      });
  },
  500 // 500ms debounce as established in Phase 12
);

// Subscribe to state changes
useSavedQueriesStore.subscribe((state) => {
  persistState({ queries: state.queries, folders: state.folders });
});

// Initialize from persisted state
export async function initializeSavedQueriesStore(): Promise<void> {
  if (!isElectronEnvironment()) return;

  try {
    const result = await sqlPro.rendererStore.get({ key: 'savedQueries' });
    if (result.success && result.data) {
      const { queries, folders } = result.data as RendererSavedQueriesState;
      useSavedQueriesStore.setState({
        queries: queries || [],
        folders: folders || [],
      });
    }
  } catch (error) {
    console.error('Failed to initialize saved queries store:', error);
  }
}
```

### Pattern 3: Parameter Parsing with Regex

**What:** Extract `{{variable}}` placeholders from query text
**When to use:** Before executing a parameterized query

```typescript
// Source: Standard template literal parsing pattern

const PARAMETER_REGEX = /\{\{([^}]+)\}\}/g;

function parseParameters(query: string): QueryParameter[] {
  const params: QueryParameter[] = [];
  const seen = new Set<string>();

  let match;
  while ((match = PARAMETER_REGEX.exec(query)) !== null) {
    const rawName = match[1].trim();

    // Support optional type hints: {{name:type}} or {{name:type=default}}
    const [nameWithType, defaultValue] = rawName.split('=');
    const [name, type] = nameWithType.split(':');

    if (name && !seen.has(name)) {
      seen.add(name);
      params.push({
        name: name.trim(),
        type: (type?.trim() as QueryParameter['type']) || 'string',
        defaultValue: defaultValue?.trim(),
      });
    }
  }

  return params;
}

function substituteParameters(
  query: string,
  values: Record<string, string>
): string {
  return query.replace(PARAMETER_REGEX, (match, rawName) => {
    const name = rawName.split(':')[0].split('=')[0].trim();
    return values[name] ?? match;
  });
}

// Usage example:
// Query: "SELECT * FROM users WHERE status = '{{status}}' AND age > {{minAge:number=18}}"
// parseParameters returns: [
//   { name: 'status', type: 'string' },
//   { name: 'minAge', type: 'number', defaultValue: '18' }
// ]
```

### Pattern 4: Parameter Input Dialog

**What:** Modal dialog to collect parameter values before execution
**When to use:** When running a query that contains `{{variables}}`

```typescript
// Source: Following existing Dialog patterns

interface ParameterInputDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parameters: QueryParameter[];
  onSubmit: (values: Record<string, string>) => void;
  queryName: string;
}

function ParameterInputDialog({
  open,
  onOpenChange,
  parameters,
  onSubmit,
  queryName,
}: ParameterInputDialogProps) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      parameters.map((p) => [p.name, p.defaultValue || ''])
    )
  );

  const handleSubmit = () => {
    onSubmit(values);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enter Parameters</DialogTitle>
          <DialogDescription>
            Provide values for "{queryName}"
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {parameters.map((param) => (
            <div key={param.name} className="grid gap-2">
              <Label htmlFor={param.name}>
                {param.name}
                {param.type !== 'string' && (
                  <span className="text-muted-foreground ml-1 text-xs">
                    ({param.type})
                  </span>
                )}
              </Label>
              <Input
                id={param.name}
                type={param.type === 'number' ? 'number' : 'text'}
                value={values[param.name]}
                onChange={(e) =>
                  setValues((v) => ({ ...v, [param.name]: e.target.value }))
                }
                placeholder={param.defaultValue || `Enter ${param.name}`}
              />
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            Run Query
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### Pattern 5: Command Palette Integration (Phase 12 Pattern)

**What:** Register saved queries as commands in Cmd+K palette
**When to use:** For QUERY-08 requirement

```typescript
// Source: Following useTagCommands.ts pattern from Phase 12

import type { Command } from '@/stores/command-palette-store';
import { FileText, Play } from 'lucide-react';
import { useEffect } from 'react';
import { useCommandPaletteStore } from '@/stores/command-palette-store';
import { useSavedQueriesStore } from '@/stores/saved-queries-store';

export function useSavedQueryCommands(onRunQuery: (query: SavedQuery) => void) {
  const queries = useSavedQueriesStore((s) => s.queries);
  const folders = useSavedQueriesStore((s) => s.folders);
  const { registerCommands, unregisterCommand } =
    useCommandPaletteStore.getState();

  useEffect(() => {
    const commandIds: string[] = [];

    // Create commands for each saved query
    const queryCommands: Command[] = queries.map((query) => {
      const commandId = `run-saved-query-${query.id}`;
      commandIds.push(commandId);

      const folder = folders.find((f) => f.id === query.folderId);
      const folderPrefix = folder ? `${folder.name}/` : '';

      return {
        id: commandId,
        label: `Run: ${folderPrefix}${query.name}`,
        icon: Play,
        category: 'actions',
        keywords: [
          'run',
          'saved',
          'query',
          query.name.toLowerCase(),
          query.description?.toLowerCase() || '',
          folder?.name.toLowerCase() || '',
        ].filter(Boolean),
        action: () => onRunQuery(query),
      };
    });

    registerCommands(queryCommands);

    return () => {
      commandIds.forEach((id) => unregisterCommand(id));
    };
  }, [queries, folders, onRunQuery, registerCommands, unregisterCommand]);
}
```

### Anti-Patterns to Avoid

- **Don't merge with query-templates-store:** Keep separation - templates are built-in, saved queries are user-owned
- **Don't persist in localStorage:** Use electron-store via IPC for consistency with Phase 12
- **Don't use query text as identifier:** Use UUIDs for stable references when editing
- **Don't nest folders deeply:** Single-level folders are sufficient and simpler to implement
- **Don't execute parameterized queries directly:** Always show parameter dialog first

## Don't Hand-Roll

| Problem           | Don't Build         | Use Instead                       | Why                                             |
| ----------------- | ------------------- | --------------------------------- | ----------------------------------------------- |
| UUID generation   | Custom ID generator | crypto.randomUUID()               | Already used throughout codebase                |
| Persistence       | Custom file storage | renderer-store IPC pattern        | Consistent with Phase 12 architecture           |
| Query browsing UI | Custom list/grid    | QueryTemplatesPicker pattern      | Reuse existing card/grid patterns               |
| Parameter parsing | Complex parser      | Simple regex                      | `{{var}}` syntax is simple enough for regex     |
| Debouncing        | Custom debounce     | Use debounce helper from Phase 12 | Already implemented in table-organization-store |

**Key insight:** This phase closely mirrors Phase 12 (Table Tags) in architecture. Follow the same patterns for store structure, persistence, and command palette integration.

## Common Pitfalls

### Pitfall 1: Query Text Size Limits

**What goes wrong:** Very large queries cause performance issues or storage limits
**Why it happens:** Users paste massive SQL scripts as "saved queries"
**How to avoid:** Implement a reasonable size limit (e.g., 50KB per query)
**Warning signs:** Slow persistence, electron-store errors

```typescript
const MAX_QUERY_SIZE = 50 * 1024; // 50KB

function validateQuery(query: string): boolean {
  if (query.length > MAX_QUERY_SIZE) {
    toast.error('Query too large. Maximum size is 50KB.');
    return false;
  }
  return true;
}
```

### Pitfall 2: Command Palette Memory Leak

**What goes wrong:** Commands accumulate when queries change
**Why it happens:** Not unregistering old commands before registering new ones
**How to avoid:** Always unregister in useEffect cleanup (Phase 12 pattern)
**Warning signs:** Duplicate commands, stale query names in palette

### Pitfall 3: Parameter Injection

**What goes wrong:** User-provided parameter values break SQL or cause injection
**Why it happens:** Direct string substitution without escaping
**How to avoid:** Use parameterized queries at the database level, or clearly document that this is for trusted input only
**Warning signs:** SQL errors, unexpected query behavior

```typescript
// Note: For user-facing tool, document that parameters are substituted
// as plain text. For production databases, recommend using prepared
// statements instead.
```

### Pitfall 4: Folder Deletion with Queries

**What goes wrong:** Deleting a folder orphans queries or silently deletes them
**Why it happens:** No clear UX for handling folder contents
**How to avoid:** Show confirmation dialog with options: "Move to root" or "Delete all"
**Warning signs:** User confusion, data loss complaints

```typescript
deleteFolder: (id: string, deleteQueries: boolean = false) => {
  set((state) => {
    const updatedQueries = deleteQueries
      ? state.queries.filter((q) => q.folderId !== id)
      : state.queries.map((q) =>
          q.folderId === id ? { ...q, folderId: null } : q
        );

    return {
      folders: state.folders.filter((f) => f.id !== id),
      queries: updatedQueries,
      activeFolderId: state.activeFolderId === id ? null : state.activeFolderId,
    };
  });
};
```

### Pitfall 5: Sync with Active Query Editor

**What goes wrong:** Saving current query doesn't reflect editor state
**Why it happens:** Editor content not synced with store
**How to avoid:** Pass current editor content explicitly to save function
**Warning signs:** Saved query differs from what user sees in editor

## Code Examples

### Save Current Query Dialog

```typescript
// Source: Following NewTemplateDialog pattern from QueryTemplatesPicker.tsx

interface SaveQueryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialQuery: string;
}

export function SaveQueryDialog({
  open,
  onOpenChange,
  initialQuery,
}: SaveQueryDialogProps) {
  const { t } = useTranslation('common');
  const { saveQuery, folders } = useSavedQueriesStore();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [folderId, setFolderId] = useState<string | null>(null);

  // Detect parameters in query
  const parameters = useMemo(
    () => parseParameters(initialQuery),
    [initialQuery]
  );

  const handleSave = () => {
    if (!name.trim()) return;

    saveQuery({
      name: name.trim(),
      description: description.trim() || undefined,
      query: initialQuery,
      folderId,
    });

    toast.success(t('savedQueries.saved', { name: name.trim() }));
    setName('');
    setDescription('');
    setFolderId(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('savedQueries.saveTitle')}</DialogTitle>
          <DialogDescription>
            {t('savedQueries.saveDescription')}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="name">{t('savedQueries.name')}</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('savedQueries.namePlaceholder')}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">{t('savedQueries.description')}</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('savedQueries.descriptionPlaceholder')}
            />
          </div>
          {folders.length > 0 && (
            <div className="grid gap-2">
              <Label>{t('savedQueries.folder')}</Label>
              <Select
                value={folderId || 'root'}
                onValueChange={(v) => setFolderId(v === 'root' ? null : v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="root">
                    {t('savedQueries.noFolder')}
                  </SelectItem>
                  {folders.map((folder) => (
                    <SelectItem key={folder.id} value={folder.id}>
                      {folder.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {parameters.length > 0 && (
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-sm font-medium">
                {t('savedQueries.parametersDetected')}
              </p>
              <div className="mt-2 flex flex-wrap gap-1">
                {parameters.map((p) => (
                  <Badge key={p.name} variant="secondary">
                    {`{{${p.name}}}`}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSave} disabled={!name.trim()}>
            {t('savedQueries.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### Saved Queries Browser

```typescript
// Source: Following QueryTemplatesPicker pattern

interface SavedQueriesBrowserProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (query: SavedQuery) => void;
  onRun: (query: SavedQuery) => void;
}

export function SavedQueriesBrowser({
  open,
  onOpenChange,
  onSelect,
  onRun,
}: SavedQueriesBrowserProps) {
  const {
    queries,
    folders,
    searchQuery,
    activeFolderId,
    setSearchQuery,
    setActiveFolderId,
    getFilteredQueries,
    deleteQuery,
  } = useSavedQueriesStore();

  const filteredQueries = useMemo(
    () => getFilteredQueries(),
    [getFilteredQueries, searchQuery, activeFolderId]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Saved Queries
          </DialogTitle>
        </DialogHeader>

        {/* Sidebar with folders + main content */}
        <div className="flex h-[60vh]">
          {/* Folder sidebar */}
          <div className="w-48 border-r p-4">
            <button
              className={cn(
                "w-full rounded-lg px-3 py-2 text-left text-sm",
                activeFolderId === null && "bg-accent"
              )}
              onClick={() => setActiveFolderId(null)}
            >
              All Queries
            </button>
            {folders.map((folder) => (
              <button
                key={folder.id}
                className={cn(
                  "w-full rounded-lg px-3 py-2 text-left text-sm",
                  activeFolderId === folder.id && "bg-accent"
                )}
                onClick={() => setActiveFolderId(folder.id)}
              >
                <FolderOpen className="mr-2 inline h-4 w-4" />
                {folder.name}
              </button>
            ))}
          </div>

          {/* Query list */}
          <div className="flex-1">
            <div className="border-b p-4">
              <Input
                placeholder="Search queries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <ScrollArea className="h-full">
              <div className="grid grid-cols-2 gap-4 p-4">
                {filteredQueries.map((query) => (
                  <QueryCard
                    key={query.id}
                    query={query}
                    onSelect={() => onSelect(query)}
                    onRun={() => onRun(query)}
                    onDelete={() => deleteQuery(query.id)}
                  />
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

## State of the Art

| Old Approach           | Current Approach       | When Changed     | Impact                      |
| ---------------------- | ---------------------- | ---------------- | --------------------------- |
| localStorage           | electron-store via IPC | Project standard | Cross-platform persistence  |
| String-based IDs       | UUID-based IDs         | Phase 12         | Stable references on rename |
| Manual command updates | useEffect with cleanup | Phase 12         | Automatic command sync      |

**Deprecated/outdated:**

- Using `query-templates-store` for user-saved queries - use separate `saved-queries-store`

## Open Questions

1. **Connection-scoped queries**
   - What we know: Queries can optionally be scoped to a specific connection
   - What's unclear: Should this be required or optional?
   - Recommendation: Make it optional; show queries globally by default, with option to filter by connection

2. **Import/Export**
   - What we know: Users may want to share saved queries
   - What's unclear: What format? JSON, SQL file with comments?
   - Recommendation: Defer to future phase; focus on core CRUD first

3. **Query Versioning**
   - What we know: Users might want to see query history/versions
   - What's unclear: How much history to keep?
   - Recommendation: Defer to future phase; only track `updatedAt` for now

## Sources

### Primary (HIGH confidence)

- `/apps/electron/src/renderer/src/stores/table-organization-store.ts` - Phase 12 persistence pattern
- `/apps/electron/src/renderer/src/stores/query-templates-store.ts` - Template data structure
- `/apps/electron/src/renderer/src/stores/command-palette-store.ts` - Command registration API
- `/apps/electron/src/renderer/src/hooks/useTagCommands.ts` - Dynamic command pattern
- `/apps/electron/src/renderer/src/components/query-editor/QueryTemplatesPicker.tsx` - UI patterns
- `/apps/electron/src/shared/types/renderer-store.ts` - Persistence schema

### Secondary (MEDIUM confidence)

- `/apps/electron/src/shared/types/tag.ts` - TagDefinition pattern for folder structure
- `/apps/electron/src/renderer/src/stores/query-store.ts` - Query execution context

### Tertiary (LOW confidence)

- General Mustache/Handlebars documentation for `{{variable}}` syntax validation

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - All libraries already in project
- Architecture: HIGH - Following established Phase 12 patterns exactly
- Pitfalls: HIGH - Derived from codebase analysis and similar features

**Research date:** 2026-01-30
**Valid until:** 2026-03-01 (30 days - stable patterns)
