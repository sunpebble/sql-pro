import type { TableMetadata, TagDefinition } from '@shared/types/tag';
import { DEFAULT_TAG_COLOR, PRESET_TAG_COLORS } from '@shared/types/tag';

import { create } from 'zustand';

// Re-export types for consumers
export type { TableMetadata, TagDefinition } from '@shared/types/tag';

/**
 * Sort options for tables in the sidebar
 */
export type TableSortOption =
  | 'name-asc'
  | 'name-desc'
  | 'row-count-asc'
  | 'row-count-desc'
  | 'custom';

/**
 * Key format: "connectionPath:schemaName:tableName"
 */
type TableKey = string;

/**
 * Legacy table metadata format (for migration)
 */
interface LegacyTableMetadata {
  tags: string[];
  sortOrder?: number;
  pinned?: boolean;
  color?: string;
}

/**
 * Legacy state format (for migration)
 */
interface LegacyState {
  availableTags?: string[];
  tableMetadata?: Record<TableKey, LegacyTableMetadata>;
}

interface TableOrganizationState {
  /** Sort option for tables */
  sortOption: TableSortOption;

  /** All available tags (user-defined) with color support */
  tags: TagDefinition[];

  /** Metadata for each table, keyed by "connectionPath:schemaName:tableName" */
  tableMetadata: Record<TableKey, TableMetadata>;

  /** Filter tables by tag ID (null means show all) */
  activeTagFilter: string | null;

  // Actions
  setSortOption: (option: TableSortOption) => void;

  // Tag management (new API)
  createTag: (name: string, color?: string) => string;
  updateTag: (id: string, updates: { name?: string; color?: string }) => void;
  deleteTag: (id: string) => void;

  // Legacy tag management (deprecated, for backward compatibility)
  /** @deprecated Use createTag instead */
  addTag: (tag: string) => void;
  /** @deprecated Use deleteTag instead */
  removeTag: (tag: string) => void;
  /** @deprecated Use updateTag instead */
  renameTag: (oldTag: string, newTag: string) => void;

  // Table metadata actions (updated to use tag IDs)
  setTableTagIds: (tableKey: TableKey, tagIds: string[]) => void;
  addTableTagId: (tableKey: TableKey, tagId: string) => void;
  removeTableTagId: (tableKey: TableKey, tagId: string) => void;
  setTablePinned: (tableKey: TableKey, pinned: boolean) => void;
  setTableColor: (tableKey: TableKey, color: string | undefined) => void;
  setTableSortOrder: (tableKey: TableKey, order: number) => void;

  // Legacy table tag actions (deprecated)
  /** @deprecated Use setTableTagIds instead */
  setTableTags: (tableKey: TableKey, tags: string[]) => void;
  /** @deprecated Use addTableTagId instead */
  addTableTag: (tableKey: TableKey, tag: string) => void;
  /** @deprecated Use removeTableTagId instead */
  removeTableTag: (tableKey: TableKey, tag: string) => void;

  // Filter
  setActiveTagFilter: (tagId: string | null) => void;

  // Helpers
  getTableMetadata: (tableKey: TableKey) => TableMetadata;
  getTableKey: (
    connectionPath: string,
    schemaName: string,
    tableName: string
  ) => TableKey;
  getTagById: (id: string) => TagDefinition | undefined;
  getTagsByIds: (ids: string[]) => TagDefinition[];
  getTagByName: (name: string) => TagDefinition | undefined;

  // Migration
  migrateFromLegacy: (legacyState: LegacyState) => void;
}

const DEFAULT_METADATA: TableMetadata = {
  tagIds: [],
  pinned: false,
};

/**
 * Migrate old string-based tags to TagDefinition objects
 */
function migrateOldTags(oldTags: string[]): TagDefinition[] {
  return oldTags.map((name, index) => ({
    id: crypto.randomUUID(),
    name,
    color: PRESET_TAG_COLORS[index % PRESET_TAG_COLORS.length],
    createdAt: new Date().toISOString(),
  }));
}

export const useTableOrganizationStore = create<TableOrganizationState>()(
  (set, get) => ({
    sortOption: 'name-asc',
    tags: [],
    tableMetadata: {},
    activeTagFilter: null,

    setSortOption: (option) => set({ sortOption: option }),

    // New tag management API
    createTag: (name, color) => {
      const trimmedName = name.trim();
      if (!trimmedName) return '';

      // Check if tag with same name exists
      const existing = get().tags.find(
        (t) => t.name.toLowerCase() === trimmedName.toLowerCase()
      );
      if (existing) return existing.id;

      const newTag: TagDefinition = {
        id: crypto.randomUUID(),
        name: trimmedName,
        color: color || DEFAULT_TAG_COLOR,
        createdAt: new Date().toISOString(),
      };

      set((state) => ({
        tags: [...state.tags, newTag],
      }));

      return newTag.id;
    },

    updateTag: (id, updates) => {
      set((state) => ({
        tags: state.tags.map((tag) =>
          tag.id === id
            ? {
                ...tag,
                ...(updates.name !== undefined
                  ? { name: updates.name.trim() }
                  : {}),
                ...(updates.color !== undefined
                  ? { color: updates.color }
                  : {}),
              }
            : tag
        ),
        // Update activeTagFilter if the tag name changed (for display purposes)
        activeTagFilter: state.activeTagFilter,
      }));
    },

    deleteTag: (id) => {
      set((state) => {
        // Remove tag from tags array
        const newTags = state.tags.filter((t) => t.id !== id);

        // Remove tag ID from all tables that have it
        const newTableMetadata = { ...state.tableMetadata };
        for (const key of Object.keys(newTableMetadata)) {
          if (newTableMetadata[key].tagIds.includes(id)) {
            newTableMetadata[key] = {
              ...newTableMetadata[key],
              tagIds: newTableMetadata[key].tagIds.filter((tid) => tid !== id),
            };
          }
        }

        return {
          tags: newTags,
          tableMetadata: newTableMetadata,
          activeTagFilter:
            state.activeTagFilter === id ? null : state.activeTagFilter,
        };
      });
    },

    // Legacy API (deprecated, but functional for backward compatibility)
    addTag: (tag) => {
      get().createTag(tag);
    },

    removeTag: (tagName) => {
      const tag = get().tags.find((t) => t.name === tagName);
      if (tag) {
        get().deleteTag(tag.id);
      }
    },

    renameTag: (oldTag, newTag) => {
      const tag = get().tags.find((t) => t.name === oldTag);
      if (tag) {
        get().updateTag(tag.id, { name: newTag });
      }
    },

    // Table metadata actions (new ID-based API)
    setTableTagIds: (tableKey, tagIds) => {
      set((state) => {
        const existing = state.tableMetadata[tableKey] || DEFAULT_METADATA;
        return {
          tableMetadata: {
            ...state.tableMetadata,
            [tableKey]: { ...existing, tagIds },
          },
        };
      });
    },

    addTableTagId: (tableKey, tagId) => {
      if (!tagId) return;

      set((state) => {
        const existing = state.tableMetadata[tableKey] || DEFAULT_METADATA;
        if (existing.tagIds.includes(tagId)) return state;

        return {
          tableMetadata: {
            ...state.tableMetadata,
            [tableKey]: { ...existing, tagIds: [...existing.tagIds, tagId] },
          },
        };
      });
    },

    removeTableTagId: (tableKey, tagId) => {
      set((state) => {
        const existing = state.tableMetadata[tableKey];
        if (!existing) return state;

        return {
          tableMetadata: {
            ...state.tableMetadata,
            [tableKey]: {
              ...existing,
              tagIds: existing.tagIds.filter((tid) => tid !== tagId),
            },
          },
        };
      });
    },

    // Legacy table tag actions (deprecated)
    setTableTags: (tableKey, tagNames) => {
      const tagIds = tagNames
        .map((name) => {
          const tag = get().tags.find((t) => t.name === name);
          return tag?.id;
        })
        .filter((id): id is string => id !== undefined);
      get().setTableTagIds(tableKey, tagIds);
    },

    addTableTag: (tableKey, tagName) => {
      const trimmedTag = tagName.trim();
      if (!trimmedTag) return;

      // Create tag if it doesn't exist
      let tagId = get().createTag(trimmedTag);
      if (!tagId) {
        const existing = get().tags.find((t) => t.name === trimmedTag);
        tagId = existing?.id || '';
      }

      if (tagId) {
        get().addTableTagId(tableKey, tagId);
      }
    },

    removeTableTag: (tableKey, tagName) => {
      const tag = get().tags.find((t) => t.name === tagName);
      if (tag) {
        get().removeTableTagId(tableKey, tag.id);
      }
    },

    setTablePinned: (tableKey, pinned) => {
      set((state) => {
        const existing = state.tableMetadata[tableKey] || DEFAULT_METADATA;
        return {
          tableMetadata: {
            ...state.tableMetadata,
            [tableKey]: { ...existing, pinned },
          },
        };
      });
    },

    setTableColor: (tableKey, color) => {
      set((state) => {
        const existing = state.tableMetadata[tableKey] || DEFAULT_METADATA;
        return {
          tableMetadata: {
            ...state.tableMetadata,
            [tableKey]: { ...existing, color },
          },
        };
      });
    },

    setTableSortOrder: (tableKey, order) => {
      set((state) => {
        const existing = state.tableMetadata[tableKey] || DEFAULT_METADATA;
        return {
          tableMetadata: {
            ...state.tableMetadata,
            [tableKey]: { ...existing, sortOrder: order },
          },
        };
      });
    },

    setActiveTagFilter: (tagId) => set({ activeTagFilter: tagId }),

    getTableMetadata: (tableKey) => {
      return get().tableMetadata[tableKey] || DEFAULT_METADATA;
    },

    getTableKey: (connectionPath, schemaName, tableName) => {
      return `${connectionPath}:${schemaName}:${tableName}`;
    },

    getTagById: (id) => {
      return get().tags.find((t) => t.id === id);
    },

    getTagsByIds: (ids) => {
      const { tags } = get();
      return ids
        .map((id) => tags.find((t) => t.id === id))
        .filter((t): t is TagDefinition => t !== undefined);
    },

    getTagByName: (name) => {
      return get().tags.find(
        (t) => t.name.toLowerCase() === name.toLowerCase()
      );
    },

    migrateFromLegacy: (legacyState) => {
      const { availableTags, tableMetadata } = legacyState;

      if (!availableTags || availableTags.length === 0) return;

      // Migrate tags
      const newTags = migrateOldTags(availableTags);

      // Create name -> id mapping
      const nameToId = new Map(newTags.map((t) => [t.name, t.id]));

      // Migrate table metadata
      const newTableMetadata: Record<TableKey, TableMetadata> = {};
      if (tableMetadata) {
        for (const [key, meta] of Object.entries(tableMetadata)) {
          newTableMetadata[key] = {
            tagIds: meta.tags
              .map((name) => nameToId.get(name))
              .filter((id): id is string => id !== undefined),
            sortOrder: meta.sortOrder,
            pinned: meta.pinned,
            color: meta.color,
          };
        }
      }

      set({
        tags: newTags,
        tableMetadata: newTableMetadata,
      });
    },
  })
);

// Selector hooks
export const useSortOption = () =>
  useTableOrganizationStore((s) => s.sortOption);

/** @deprecated Use useTags instead */
export const useAvailableTags = () =>
  useTableOrganizationStore((s) => s.tags.map((t) => t.name));

export const useTags = () => useTableOrganizationStore((s) => s.tags);

export const useTagById = (id: string) =>
  useTableOrganizationStore((s) => s.tags.find((t) => t.id === id));

export const useActiveTagFilter = () =>
  useTableOrganizationStore((s) => s.activeTagFilter);
