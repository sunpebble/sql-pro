import type {
  ConnectionProfile,
  ProfileFolder,
  RecentConnection,
  SchemaListInfo,
  TableInfo,
} from '@shared/types';
import type { RendererConnectionState } from '@shared/types/renderer-store';
import type {
  DatabaseConnection,
  DatabaseSchema,
  TableSchema,
} from '@/types/database';
import { create } from 'zustand';
import { sqlPro } from '@/lib/api';
import { memoryCleanup } from '@/lib/memory-cleanup';
import { schemaCache } from '@/lib/schema-cache';
import {
  persistConnectionUi,
  registerConnectionUiHydrator,
} from '@/lib/storage';
import { useChangesStore } from './changes-store';

interface ConnectionState {
  // Multiple connections support
  connections: Map<string, DatabaseConnection>;
  activeConnectionId: string | null;

  // Tab order for connection tabs UI
  connectionTabOrder: string[];

  // Connection colors for visual distinction (connectionId -> hex color)
  connectionColors: Record<string, string>;

  // Schema per connection
  schemas: Map<string, DatabaseSchema>;

  // Selected table (for the active connection)
  selectedTable: TableSchema | null;
  selectedSchemaObject: TableSchema | null;

  // Recent connections (using shared type with new fields)
  recentConnections: RecentConnection[];

  // Profile management
  profiles: Map<string, ConnectionProfile>;
  folders: Map<string, ProfileFolder>;
  selectedProfileId: string | null;
  expandedFolderIds: Set<string>;

  // Loading states
  isConnecting: boolean;
  isLoadingSchema: boolean;

  // Error state
  error: string | null;

  // Connection Actions
  addConnection: (connection: DatabaseConnection) => void;
  removeConnection: (id: string) => void;
  setActiveConnection: (id: string | null) => void;
  updateConnection: (id: string, updates: Partial<DatabaseConnection>) => void;
  reorderConnections: (fromIndex: number, toIndex: number) => void;
  setConnectionColor: (id: string, color: string) => void;

  // Schema Actions
  setSchema: (connectionId: string, schema: DatabaseSchema | null) => void;
  /**
   * Set a lazy (lightweight) schema list for a connection.
   * Only contains table/view names, not full column/index details.
   */
  setLazySchema: (connectionId: string, schemas: SchemaListInfo[]) => void;
  /**
   * Update table details in the cached schema after on-demand loading.
   */
  updateTableDetails: (
    connectionId: string,
    schemaName: string,
    table: TableInfo
  ) => void;
  /**
   * Invalidate schema cache for a connection (forces reload on next access).
   */
  invalidateSchemaCache: (connectionId: string) => void;

  // Selection Actions
  setSelectedTable: (table: TableSchema | null) => void;
  setSelectedSchemaObject: (schemaObject: TableSchema | null) => void;

  // Recent Connections Actions
  setRecentConnections: (connections: RecentConnection[]) => void;

  // Profile Actions
  addProfile: (profile: ConnectionProfile) => void;
  updateProfile: (id: string, updates: Partial<ConnectionProfile>) => void;
  deleteProfile: (id: string) => void;
  selectProfile: (id: string | null) => void;
  setProfiles: (profiles: ConnectionProfile[]) => void;

  // Folder Actions
  addFolder: (folder: ProfileFolder) => void;
  updateFolder: (id: string, updates: Partial<ProfileFolder>) => void;
  deleteFolder: (id: string) => void;
  toggleFolderExpanded: (id: string) => void;
  setFolders: (folders: ProfileFolder[]) => void;

  // Loading State Actions
  setIsConnecting: (isConnecting: boolean) => void;
  setIsLoadingSchema: (isLoading: boolean) => void;

  // Error Actions
  setError: (error: string | null) => void;

  // Reset
  reset: () => void;

  // Computed getters
  getConnection: () => DatabaseConnection | null;
  getSchema: () => DatabaseSchema | null;
  getConnectionById: (id: string) => DatabaseConnection | undefined;
  getSchemaByConnectionId: (id: string) => DatabaseSchema | undefined;
  getAllConnections: () => DatabaseConnection[];
  getConnectionColor: (id: string) => string | undefined;
  hasUnsavedChanges: (connectionId: string) => boolean;

  // Profile getters
  getProfileById: (id: string) => ConnectionProfile | undefined;
  getAllProfiles: () => ConnectionProfile[];
  getProfilesByFolder: (folderId?: string) => ConnectionProfile[];

  // Folder getters
  getFolderById: (id: string) => ProfileFolder | undefined;
  getAllFolders: () => ProfileFolder[];
  getSubfolders: (parentId?: string) => ProfileFolder[];

  // Legacy compatibility
  connection: DatabaseConnection | null;
  schema: DatabaseSchema | null;
  setConnection: (connection: DatabaseConnection | null) => void;
}

const initialState = {
  connections: new Map<string, DatabaseConnection>(),
  activeConnectionId: null,
  connectionTabOrder: [],
  connectionColors: {},
  schemas: new Map<string, DatabaseSchema>(),
  selectedTable: null,
  selectedSchemaObject: null,
  recentConnections: [],
  profiles: new Map<string, ConnectionProfile>(),
  folders: new Map<string, ProfileFolder>(),
  selectedProfileId: null,
  expandedFolderIds: new Set<string>(),
  isConnecting: false,
  isLoadingSchema: false,
  error: null,
  // Legacy compatibility - computed from active connection
  connection: null,
  schema: null,
};

export const useConnectionStore = create<ConnectionState>()((set, get) => ({
  ...initialState,

  // Connection Actions
  addConnection: (connection) => {
    // Start watching the database file for external changes
    if (connection.path && sqlPro.fileWatcher?.watch) {
      sqlPro.fileWatcher.watch(connection.id, connection.path).catch((err) => {
        console.warn('Failed to start file watcher:', err);
      });
    }

    set((state) => {
      const newConnections = new Map(state.connections);
      newConnections.set(connection.id, connection);

      // Add to tab order if not already present
      const newTabOrder = state.connectionTabOrder.includes(connection.id)
        ? state.connectionTabOrder
        : [...state.connectionTabOrder, connection.id];

      return {
        connections: newConnections,
        activeConnectionId: connection.id,
        connectionTabOrder: newTabOrder,
        // Clear selected table when switching to new connection
        selectedTable: null,
        selectedSchemaObject: null,
        // Legacy compatibility
        connection,
        schema: null,
        error: null,
      };
    });
  },

  removeConnection: (id) => {
    // Stop watching the database file
    if (sqlPro.fileWatcher?.unwatch) {
      sqlPro.fileWatcher.unwatch(id).catch((err) => {
        console.warn('Failed to stop file watcher:', err);
      });
    }

    set((state) => {
      const newConnections = new Map(state.connections);
      newConnections.delete(id);

      const newSchemas = new Map(state.schemas);
      newSchemas.delete(id);

      // Invalidate schema cache for this connection
      schemaCache.invalidateConnection(id);

      // Clean up all memory associated with this connection:
      // - Table data from table-data-store
      // - Query results from query-store
      // - Schema cache (redundant but ensures complete cleanup)
      // This ensures memory returns to baseline after closing connections
      memoryCleanup.cleanupConnection(id);

      // Remove from tab order
      const newTabOrder = state.connectionTabOrder.filter(
        (connId) => connId !== id
      );

      // Remove from connection colors
      const { [id]: _, ...newConnectionColors } = state.connectionColors;

      // If removing the active connection, switch to another one or null
      let newActiveId = state.activeConnectionId;
      let newConnection: DatabaseConnection | null = null;
      let newSchema: DatabaseSchema | null = null;

      if (state.activeConnectionId === id) {
        const remainingIds = Array.from(newConnections.keys());
        newActiveId = remainingIds.length > 0 ? remainingIds[0] : null;
        newConnection = newActiveId
          ? newConnections.get(newActiveId) || null
          : null;
        newSchema = newActiveId ? newSchemas.get(newActiveId) || null : null;
      } else {
        newConnection = state.activeConnectionId
          ? newConnections.get(state.activeConnectionId) || null
          : null;
        newSchema = state.activeConnectionId
          ? newSchemas.get(state.activeConnectionId) || null
          : null;
      }

      return {
        connections: newConnections,
        schemas: newSchemas,
        activeConnectionId: newActiveId,
        connectionTabOrder: newTabOrder,
        connectionColors: newConnectionColors,
        selectedTable:
          state.activeConnectionId === id ? null : state.selectedTable,
        selectedSchemaObject:
          state.activeConnectionId === id ? null : state.selectedSchemaObject,
        // Legacy compatibility
        connection: newConnection,
        schema: newSchema,
      };
    });
  },

  setActiveConnection: (id) =>
    set((state) => {
      if (id === null) {
        return {
          activeConnectionId: null,
          selectedTable: null,
          selectedSchemaObject: null,
          // Legacy compatibility
          connection: null,
          schema: null,
        };
      }

      const connection = state.connections.get(id);
      if (!connection) return state;

      return {
        activeConnectionId: id,
        selectedTable: null,
        selectedSchemaObject: null,
        // Legacy compatibility
        connection,
        schema: state.schemas.get(id) || null,
      };
    }),

  updateConnection: (id, updates) =>
    set((state) => {
      const existingConnection = state.connections.get(id);
      if (!existingConnection) return state;

      const updatedConnection = { ...existingConnection, ...updates };
      const newConnections = new Map(state.connections);
      newConnections.set(id, updatedConnection);

      return {
        connections: newConnections,
        // Legacy compatibility
        connection:
          state.activeConnectionId === id
            ? updatedConnection
            : state.connection,
      };
    }),

  reorderConnections: (fromIndex, toIndex) =>
    set((state) => {
      const newTabOrder = [...state.connectionTabOrder];
      const [movedId] = newTabOrder.splice(fromIndex, 1);
      newTabOrder.splice(toIndex, 0, movedId);

      return {
        connectionTabOrder: newTabOrder,
      };
    }),

  setConnectionColor: (id, color) =>
    set((state) => {
      // Validate hex color format: #RGB or #RRGGBB
      const hexColorRegex = /^#(?:[A-F0-9]{6}|[A-F0-9]{3})$/i;
      if (!hexColorRegex.test(color)) {
        // Invalid color, don't update state
        return state;
      }

      return {
        connectionColors: {
          ...state.connectionColors,
          [id]: color,
        },
      };
    }),

  // Schema Actions
  setSchema: (connectionId, schema) =>
    set((state) => {
      const newSchemas = new Map(state.schemas);
      if (schema) {
        // Ensure flat tables/views arrays are populated from nested schemas if empty
        let normalizedSchema = schema;
        if (
          schema.schemas?.length > 0 &&
          (!schema.tables?.length || !schema.views?.length)
        ) {
          const flatTables = schema.tables?.length
            ? schema.tables
            : schema.schemas.flatMap((s) => s.tables || []);
          const flatViews = schema.views?.length
            ? schema.views
            : schema.schemas.flatMap((s) => s.views || []);
          normalizedSchema = {
            ...schema,
            tables: flatTables,
            views: flatViews,
          };
        }
        newSchemas.set(connectionId, normalizedSchema);

        return {
          schemas: newSchemas,
          // Legacy compatibility
          schema:
            state.activeConnectionId === connectionId
              ? normalizedSchema
              : state.schema,
        };
      } else {
        newSchemas.delete(connectionId);
        return {
          schemas: newSchemas,
          // Legacy compatibility
          schema:
            state.activeConnectionId === connectionId ? null : state.schema,
        };
      }
    }),

  setLazySchema: (connectionId, schemas) =>
    set((state) => {
      // Convert SchemaListInfo[] to lightweight DatabaseSchema format
      // Tables/views only have basic info (name, type) without column details
      const allTables: TableSchema[] = [];
      const allViews: TableSchema[] = [];

      for (const schemaInfo of schemas) {
        for (const table of schemaInfo.tables) {
          allTables.push({
            name: table.name,
            schema: table.schema,
            type: 'table',
            // Empty arrays for lazy loading - details fetched on-demand
            columns: [],
            primaryKey: [],
            foreignKeys: [],
            indexes: [],
            triggers: [],
            rowCount: table.rowCount,
            sql: table.sql,
          });
        }
        for (const view of schemaInfo.views) {
          allViews.push({
            name: view.name,
            schema: view.schema,
            type: 'view',
            columns: [],
            primaryKey: [],
            foreignKeys: [],
            indexes: [],
            triggers: [],
            sql: view.sql,
          });
        }
      }

      const lazySchema: DatabaseSchema = {
        schemas: schemas.map((s) => ({
          name: s.name,
          tables: allTables.filter((t) => t.schema === s.name),
          views: allViews.filter((v) => v.schema === s.name),
        })),
        tables: allTables,
        views: allViews,
      };

      const newSchemas = new Map(state.schemas);
      newSchemas.set(connectionId, lazySchema);

      // Also update the schema cache
      schemaCache.setSchemaList(connectionId, schemas);

      return {
        schemas: newSchemas,
        schema:
          state.activeConnectionId === connectionId ? lazySchema : state.schema,
      };
    }),

  updateTableDetails: (connectionId, schemaName, tableDetails) =>
    set((state) => {
      const existingSchema = state.schemas.get(connectionId);
      if (!existingSchema) return state;

      // Convert TableInfo to TableSchema
      const updatedTable: TableSchema = {
        name: tableDetails.name,
        schema: tableDetails.schema,
        type: tableDetails.type,
        columns: tableDetails.columns.map((col) => ({
          name: col.name,
          type: col.type,
          nullable: col.nullable,
          defaultValue: col.defaultValue,
          isPrimaryKey: col.isPrimaryKey,
        })),
        primaryKey: tableDetails.primaryKey,
        foreignKeys: tableDetails.foreignKeys.map((fk) => ({
          column: fk.column,
          referencedTable: fk.referencedTable,
          referencedColumn: fk.referencedColumn,
          onDelete: fk.onDelete,
          onUpdate: fk.onUpdate,
        })),
        indexes: tableDetails.indexes.map((idx) => ({
          name: idx.name,
          columns: idx.columns,
          isUnique: idx.isUnique,
          sql: idx.sql || '',
        })),
        triggers: tableDetails.triggers.map((tr) => ({
          name: tr.name,
          tableName: tr.tableName,
          timing: tr.timing as 'BEFORE' | 'AFTER' | 'INSTEAD OF',
          event: tr.event as 'INSERT' | 'UPDATE' | 'DELETE',
          sql: tr.sql,
        })),
        rowCount: tableDetails.rowCount,
        sql: tableDetails.sql,
      };

      // Update the table in all relevant places
      const updatedSchemas = existingSchema.schemas.map((s) => {
        if (s.name !== schemaName) return s;

        const tableIndex = s.tables.findIndex(
          (t) => t.name === tableDetails.name
        );
        const viewIndex = s.views.findIndex(
          (v) => v.name === tableDetails.name
        );

        if (tableIndex !== -1) {
          const newTables = [...s.tables];
          newTables[tableIndex] = updatedTable;
          return { ...s, tables: newTables };
        } else if (viewIndex !== -1) {
          const newViews = [...s.views];
          newViews[viewIndex] = updatedTable;
          return { ...s, views: newViews };
        }
        return s;
      });

      // Update the flat tables/views arrays
      const allTables = existingSchema.tables.map((t) =>
        t.name === tableDetails.name && t.schema === schemaName
          ? updatedTable
          : t
      );
      const allViews = existingSchema.views.map((v) =>
        v.name === tableDetails.name && v.schema === schemaName
          ? updatedTable
          : v
      );

      const updatedSchema: DatabaseSchema = {
        schemas: updatedSchemas,
        tables: allTables,
        views: allViews,
      };

      const newSchemas = new Map(state.schemas);
      newSchemas.set(connectionId, updatedSchema);

      // Also update the schema cache
      schemaCache.setTableDetails(
        connectionId,
        schemaName,
        tableDetails.name,
        tableDetails
      );

      return {
        schemas: newSchemas,
        schema:
          state.activeConnectionId === connectionId
            ? updatedSchema
            : state.schema,
      };
    }),

  invalidateSchemaCache: (connectionId) => {
    schemaCache.invalidateConnection(connectionId);
  },

  // Selection Actions
  setSelectedTable: (selectedTable) => set({ selectedTable }),
  setSelectedSchemaObject: (selectedSchemaObject) =>
    set({ selectedSchemaObject }),

  // Recent Connections Actions
  setRecentConnections: (recentConnections) => set({ recentConnections }),

  // Profile Actions
  addProfile: (profile) =>
    set((state) => {
      const newProfiles = new Map(state.profiles);
      newProfiles.set(profile.id, profile);
      return { profiles: newProfiles };
    }),

  updateProfile: (id, updates) =>
    set((state) => {
      const existingProfile = state.profiles.get(id);
      if (!existingProfile) return state;

      const updatedProfile = { ...existingProfile, ...updates };
      const newProfiles = new Map(state.profiles);
      newProfiles.set(id, updatedProfile);

      return { profiles: newProfiles };
    }),

  deleteProfile: (id) =>
    set((state) => {
      const newProfiles = new Map(state.profiles);
      newProfiles.delete(id);

      return {
        profiles: newProfiles,
        selectedProfileId:
          state.selectedProfileId === id ? null : state.selectedProfileId,
      };
    }),

  selectProfile: (id) => set({ selectedProfileId: id }),

  setProfiles: (profiles) =>
    set(() => {
      const profileMap = new Map<string, ConnectionProfile>();
      profiles.forEach((profile) => {
        profileMap.set(profile.id, profile);
      });
      return { profiles: profileMap };
    }),

  // Folder Actions
  addFolder: (folder) =>
    set((state) => {
      const newFolders = new Map(state.folders);
      newFolders.set(folder.id, folder);
      return { folders: newFolders };
    }),

  updateFolder: (id, updates) =>
    set((state) => {
      const existingFolder = state.folders.get(id);
      if (!existingFolder) return state;

      const updatedFolder = { ...existingFolder, ...updates };
      const newFolders = new Map(state.folders);
      newFolders.set(id, updatedFolder);

      return { folders: newFolders };
    }),

  deleteFolder: (id) =>
    set((state) => {
      const newFolders = new Map(state.folders);
      newFolders.delete(id);

      const newExpandedFolderIds = new Set(state.expandedFolderIds);
      newExpandedFolderIds.delete(id);

      return {
        folders: newFolders,
        expandedFolderIds: newExpandedFolderIds,
      };
    }),

  toggleFolderExpanded: (id) =>
    set((state) => {
      const newExpandedFolderIds = new Set(state.expandedFolderIds);
      if (newExpandedFolderIds.has(id)) {
        newExpandedFolderIds.delete(id);
      } else {
        newExpandedFolderIds.add(id);
      }
      return { expandedFolderIds: newExpandedFolderIds };
    }),

  setFolders: (folders) =>
    set(() => {
      const folderMap = new Map<string, ProfileFolder>();
      folders.forEach((folder) => {
        folderMap.set(folder.id, folder);
      });
      return { folders: folderMap };
    }),

  // Loading State Actions
  setIsConnecting: (isConnecting) => set({ isConnecting }),
  setIsLoadingSchema: (isLoadingSchema) => set({ isLoadingSchema }),

  // Error Actions
  setError: (error) => set({ error }),

  // Reset - clears all state and performs memory cleanup
  reset: () => {
    // Clean up all memory caches
    memoryCleanup.performCleanup('manual');

    return set({
      connections: new Map(),
      activeConnectionId: null,
      connectionTabOrder: [],
      connectionColors: {},
      schemas: new Map(),
      selectedTable: null,
      selectedSchemaObject: null,
      recentConnections: [],
      profiles: get().profiles, // Keep profiles
      folders: get().folders, // Keep folders
      selectedProfileId: null,
      expandedFolderIds: get().expandedFolderIds, // Keep folder expansion state
      isConnecting: false,
      isLoadingSchema: false,
      error: null,
      // Legacy compatibility
      connection: null,
      schema: null,
    });
  },

  // Computed getters
  getConnection: () => {
    const state = get();
    if (!state.activeConnectionId) return null;
    return state.connections.get(state.activeConnectionId) || null;
  },

  getSchema: () => {
    const state = get();
    if (!state.activeConnectionId) return null;
    return state.schemas.get(state.activeConnectionId) || null;
  },

  getConnectionById: (id) => {
    return get().connections.get(id);
  },

  getSchemaByConnectionId: (id) => {
    return get().schemas.get(id);
  },

  getAllConnections: () => {
    return Array.from(get().connections.values());
  },

  getConnectionColor: (id) => {
    return get().connectionColors[id];
  },

  hasUnsavedChanges: (connectionId) => {
    const changesStore = useChangesStore.getState();
    return changesStore.hasChangesForConnection(connectionId);
  },

  // Profile getters
  getProfileById: (id) => {
    return get().profiles.get(id);
  },

  getAllProfiles: () => {
    return Array.from(get().profiles.values());
  },

  getProfilesByFolder: (folderId) => {
    return Array.from(get().profiles.values()).filter(
      (profile) => profile.folderId === folderId
    );
  },

  // Folder getters
  getFolderById: (id) => {
    return get().folders.get(id);
  },

  getAllFolders: () => {
    return Array.from(get().folders.values());
  },

  getSubfolders: (parentId) => {
    return Array.from(get().folders.values()).filter(
      (folder) => folder.parentId === parentId
    );
  },

  // Legacy compatibility
  setConnection: (connection) =>
    set({
      connection,
    }),
}));

// Register hydrator for loading persisted connection UI state
registerConnectionUiHydrator((data: RendererConnectionState) => {
  useConnectionStore.setState({
    activeConnectionId: data.activeConnectionId,
    expandedFolderIds: new Set(data.expandedFolderIds),
    connectionTabOrder: data.connectionTabOrder,
    connectionColors: data.connectionColors,
  });
});

// Subscribe to state changes and persist connection UI state to electron-store
useConnectionStore.subscribe((state) => {
  const persistedState: RendererConnectionState = {
    activeConnectionId: state.activeConnectionId,
    expandedFolderIds: Array.from(state.expandedFolderIds),
    connectionTabOrder: state.connectionTabOrder,
    connectionColors: state.connectionColors,
  };
  persistConnectionUi(persistedState);
});
