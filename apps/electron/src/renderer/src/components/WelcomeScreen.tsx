import type {
  ConnectionProfile,
  DatabaseConnectionConfig,
  DatabaseType,
  ProfileFolder,
  RecentConnection,
} from '@shared/types';
import type { ProfileFormData } from './connection-profiles/ProfileForm';
import type { ConnectionSettings } from './ConnectionSettingsDialog';
import { Button } from '@sqlpro/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@sqlpro/ui/dropdown-menu';
import { ScrollArea } from '@sqlpro/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@sqlpro/ui/tooltip';
import {
  AlertCircle,
  BookmarkPlus,
  Box,
  Clock,
  Cloud,
  Database,
  Eye,
  FolderOpen,
  KeyRound,
  MoreVertical,
  Pencil,
  Server,
  Trash2,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { WelcomeDialog } from '@/components/onboarding/WelcomeDialog';
import { WelcomeTour } from '@/components/onboarding/WelcomeTour';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { sqlPro } from '@/lib/api';
import { cn, TOOLTIP_CONTENT_STYLE } from '@/lib/utils';
// Direct imports to avoid barrel file overhead (bundle-barrel-imports)
import { useConnectionStore } from '@/stores/connection-store';
import { useDialogStore } from '@/stores/dialog-store';
import { useOnboardingStore } from '@/stores/onboarding-store';
import { ProfileForm } from './connection-profiles/ProfileForm';
import { ProfileManager } from './connection-profiles/ProfileManager';
import { ConnectionSettingsDialog } from './ConnectionSettingsDialog';
import { DatabaseTypeSelector } from './DatabaseTypeSelector';
import { PasswordDialog } from './PasswordDialog';
import { ServerConnectionDialog } from './ServerConnectionDialog';
import { FeatureShowcase } from './welcome';

// Check if a database has a saved password - moved to top level
function HasSavedPasswordIndicator({ path }: { path: string }) {
  const [hasSaved, setHasSaved] = useState(false);
  const { t } = useTranslation('common');

  // Check on mount
  useEffect(() => {
    sqlPro.password
      .has({ dbPath: path })
      .then((result: { hasPassword: boolean }) => {
        setHasSaved(result.hasPassword);
      });
  }, [path]);

  if (!hasSaved) return null;

  return (
    <Tooltip>
      <TooltipTrigger>
        <KeyRound className="h-3 w-3 text-green-500" />
      </TooltipTrigger>
      <TooltipContent className={TOOLTIP_CONTENT_STYLE}>
        {t('welcomeScreen.passwordSaved')}
      </TooltipContent>
    </Tooltip>
  );
}

// Helper to get database type icon
function getDatabaseIcon(type?: DatabaseType) {
  switch (type) {
    case 'mysql':
      return { Icon: Server, color: 'text-orange-500', label: 'MySQL' };
    case 'postgresql':
      return { Icon: Server, color: 'text-indigo-500', label: 'PostgreSQL' };
    case 'supabase':
      return { Icon: Cloud, color: 'text-green-500', label: 'Supabase' };
    case 'qdrant':
      return { Icon: Box, color: 'text-purple-500', label: 'Qdrant' };
    case 'sqlite':
    default:
      return { Icon: Database, color: 'text-blue-500', label: 'SQLite' };
  }
}

export function WelcomeScreen() {
  const {
    recentConnections,
    isConnecting,
    isLoadingSchema,
    error,
    folders,
    connections,
    addConnection,
    removeConnection,
    setActiveConnection,
    setSchema,
    setIsConnecting,
    setIsLoadingSchema,
    setError,
    setRecentConnections,
    setFolders,
  } = useConnectionStore();
  const openConnectionSettings = useDialogStore(
    (s) => s.openConnectionSettings
  );
  const { hasSeenWelcome, setHasSeenWelcome, completeTour } =
    useOnboardingStore();

  const { t } = useTranslation('common');

  // Welcome tour state
  const [welcomeTourVisible, setWelcomeTourVisible] = useState(false);
  // Welcome dialog state - show on first visit
  const [welcomeDialogOpen, setWelcomeDialogOpen] = useState(!hasSeenWelcome);

  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  // For new connection settings only (not edit mode)
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const [pendingFilename, setPendingFilename] = useState<string>('');
  const [pendingIsEncrypted, setPendingIsEncrypted] = useState(false);
  const [pendingSettings, setPendingSettings] =
    useState<ConnectionSettings | null>(null);

  // Edit mode state for server connections only
  const [editingConnection, setEditingConnection] =
    useState<RecentConnection | null>(null);
  // For server connections edit mode
  const [editServerDialogOpen, setEditServerDialogOpen] = useState(false);

  // Profile view state
  const [showProfiles, setShowProfiles] = useState(false);
  const [saveProfileDialogOpen, setSaveProfileDialogOpen] = useState(false);
  const [profileToSave, setProfileToSave] = useState<{
    path: string;
    filename: string;
    isEncrypted: boolean;
    databaseType?: DatabaseType;
    connectionConfig?: DatabaseConnectionConfig;
  } | null>(null);

  // Database type selector state
  const [dbTypeSelectorOpen, setDbTypeSelectorOpen] = useState(false);
  const [serverConnectionOpen, setServerConnectionOpen] = useState(false);
  const [selectedDbType, setSelectedDbType] = useState<DatabaseType>('sqlite');

  // Welcome tour handlers
  const handleStartWelcomeTour = useCallback(() => {
    setWelcomeTourVisible(true);
  }, []);

  const handleCompleteWelcomeTour = useCallback(() => {
    setWelcomeTourVisible(false);
    setHasSeenWelcome(true);
    completeTour();
  }, [setHasSeenWelcome, completeTour]);

  const handleSkipWelcomeTour = useCallback(() => {
    setWelcomeTourVisible(false);
    setHasSeenWelcome(true);
  }, [setHasSeenWelcome]);

  // Load folders on mount
  useEffect(() => {
    const loadFolders = async () => {
      try {
        const result = await sqlPro.folder.getAll({});
        if (result.success && result.folders) {
          setFolders(result.folders as ProfileFolder[]);
        }
      } catch {
        // Silently fail - folders are optional
      }
    };
    loadFolders();
  }, [setFolders]);

  // Listen for global drag-and-drop events for encrypted databases
  useEffect(() => {
    const handleOpenDatabaseFile = (
      event: Event & {
        detail?: { filePath: string; filename: string; isEncrypted: boolean };
      }
    ) => {
      const { filePath, filename, isEncrypted } = event.detail || {};
      if (filePath && filename !== undefined) {
        setPendingPath(filePath);
        setPendingFilename(filename);
        setPendingIsEncrypted(isEncrypted || false);
        setSettingsDialogOpen(true);
      }
    };

    window.addEventListener(
      'open-database-file',
      handleOpenDatabaseFile as EventListener
    );
    return () => {
      window.removeEventListener(
        'open-database-file',
        handleOpenDatabaseFile as EventListener
      );
    };
  }, []);

  const connectToDatabase = useCallback(
    async (
      path: string,
      password?: string,
      readOnly?: boolean,
      settings?: ConnectionSettings
    ) => {
      setIsConnecting(true);
      setError(null);

      try {
        const result = await sqlPro.db.open({ path, password, readOnly });

        if (!result.success) {
          // Check if database needs a password (using explicit flag from backend)
          if (result.needsPassword) {
            // Try to use saved password first
            const savedPasswordResult = await sqlPro.password.get({
              dbPath: path,
            });
            if (savedPasswordResult.success && savedPasswordResult.password) {
              // Automatically try with saved password - use iteration instead of recursion
              setIsConnecting(false);
              const retryResult = await sqlPro.db.open({
                path,
                password: savedPasswordResult.password,
              });
              if (retryResult.success && retryResult.connection) {
                addConnection({
                  id: retryResult.connection.id,
                  path: retryResult.connection.path,
                  filename: retryResult.connection.filename,
                  isEncrypted: retryResult.connection.isEncrypted,
                  isReadOnly: retryResult.connection.isReadOnly,
                  status: 'connected',
                });
                // Load schema
                setIsLoadingSchema(true);
                const schemaResult = await sqlPro.db.getSchema({
                  connectionId: retryResult.connection.id,
                });
                if (schemaResult.success) {
                  setSchema(retryResult.connection.id, {
                    schemas: schemaResult.schemas || [],
                    tables: schemaResult.tables || [],
                    views: schemaResult.views || [],
                  });
                }
                setIsLoadingSchema(false);
                // Refresh recent connections
                const connectionsResult =
                  await sqlPro.app.getRecentConnections();
                if (
                  connectionsResult.success &&
                  connectionsResult.connections
                ) {
                  setRecentConnections(
                    connectionsResult.connections as RecentConnection[]
                  );
                }
                setPendingPath(null);
                setPendingSettings(null);
              }
              return;
            }

            // No saved password, show dialog
            setPendingPath(path);
            setPasswordDialogOpen(true);
            setIsConnecting(false);
            return;
          }
          // Show error message (won't trigger password dialog loop)
          setError(result.error || t('database.failedToOpen'));
          setIsConnecting(false);
          return;
        }

        if (result.connection) {
          // Save connection settings if provided (new connection flow)
          if (settings) {
            await sqlPro.connection.update({
              path: result.connection.path,
              displayName: settings.displayName,
              readOnly: settings.readOnly,
            });
          }

          addConnection({
            id: result.connection.id,
            path: result.connection.path,
            filename: result.connection.filename,
            isEncrypted: result.connection.isEncrypted,
            isReadOnly: result.connection.isReadOnly,
            status: 'connected',
          });

          // Load schema
          setIsLoadingSchema(true);
          const schemaResult = await sqlPro.db.getSchema({
            connectionId: result.connection.id,
          });

          if (schemaResult.success) {
            setSchema(result.connection.id, {
              schemas: schemaResult.schemas || [],
              tables: schemaResult.tables || [],
              views: schemaResult.views || [],
            });
          } else {
            console.error('Failed to load schema:', schemaResult.error);
          }
          setIsLoadingSchema(false);

          // Refresh recent connections list after successful connection
          const connectionsResult = await sqlPro.app.getRecentConnections();
          if (connectionsResult.success && connectionsResult.connections) {
            setRecentConnections(
              connectionsResult.connections as RecentConnection[]
            );
          }

          // Clear pending state
          setPendingPath(null);
          setPendingSettings(null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : t('common.unknownError'));
      } finally {
        setIsConnecting(false);
      }
    },
    [
      setIsConnecting,
      setError,
      addConnection,
      setSchema,
      setIsLoadingSchema,
      setRecentConnections,
      t,
    ]
  );

  // Shared function to open a database file (used by both dialog and drag-drop)
  const openDatabaseFile = useCallback(
    async (filePath: string) => {
      const filename = filePath.split('/').pop() || filePath;

      // Check if this is an encrypted database by attempting to open it
      setIsConnecting(true);
      const probeResult = await sqlPro.db.open({ path: filePath });
      setIsConnecting(false);

      const isEncrypted = probeResult.needsPassword === true;

      // Close the probe connection if it was opened successfully
      // (we'll open it again properly after user confirms settings)
      if (probeResult.success && probeResult.connection) {
        await sqlPro.db.close({ connectionId: probeResult.connection.id });
      }

      // Store pending info and show settings dialog
      setPendingPath(filePath);
      setPendingFilename(filename);
      setPendingIsEncrypted(isEncrypted);
      setSettingsDialogOpen(true);
    },
    [setIsConnecting]
  );

  const handleOpenDatabase = useCallback(async () => {
    const result = await sqlPro.dialog.openFile({
      title: t('dialog.openDatabase'),
    });
    if (result.success && !result.canceled && result.filePath) {
      await openDatabaseFile(result.filePath);
    }
  }, [openDatabaseFile, t]);

  const handleSettingsSubmit = async (settings: ConnectionSettings) => {
    setSettingsDialogOpen(false);
    setPendingSettings(settings);

    if (!pendingPath) return;

    if (pendingIsEncrypted) {
      // Check if we have a saved password
      const savedPasswordResult = await sqlPro.password.get({
        dbPath: pendingPath,
      });
      if (savedPasswordResult.success && savedPasswordResult.password) {
        // Connect with saved password and settings
        await connectToDatabase(
          pendingPath,
          savedPasswordResult.password,
          settings.readOnly,
          settings
        );
      } else {
        // Need password - show password dialog
        setPasswordDialogOpen(true);
      }
    } else {
      // Non-encrypted database - connect directly with settings
      await connectToDatabase(
        pendingPath,
        undefined,
        settings.readOnly,
        settings
      );
    }
  };

  const handlePasswordSubmit = async (
    password: string,
    rememberPassword: boolean
  ) => {
    setPasswordDialogOpen(false);
    if (pendingPath) {
      // Save password if either dialog requested it (OR logic)
      // - pendingSettings?.rememberPassword: from settings dialog (if shown)
      // - rememberPassword: from password dialog
      const shouldRemember =
        rememberPassword || pendingSettings?.rememberPassword;

      // Save password if requested
      if (shouldRemember) {
        const saveResult = await sqlPro.password.save({
          dbPath: pendingPath,
          password,
        });
        if (!saveResult.success) {
          console.error('Failed to save password:', saveResult.error);
        }
      }

      // Connect with settings if available
      await connectToDatabase(
        pendingPath,
        password,
        pendingSettings?.readOnly,
        pendingSettings ?? undefined
      );
    }
  };

  const handleRecentClick = useCallback(
    async (conn: RecentConnection) => {
      // For server databases (MySQL, PostgreSQL, Supabase), use connectionConfig
      if (
        conn.databaseType &&
        conn.databaseType !== 'sqlite' &&
        conn.connectionConfig
      ) {
        // Check if this connection is already open
        // Build the canonical server identifier from connectionConfig
        const cfg = conn.connectionConfig;
        const serverIdentifier = `${cfg.host || ''}:${cfg.port || 5432}/${cfg.database || 'postgres'}`;

        const existingConnectionEntry = Array.from(connections.entries()).find(
          ([, existingConn]) => {
            // Match by path (could be displayName or host:port/database format)
            if (existingConn.path === conn.path) return true;
            if (existingConn.filename === conn.filename) return true;
            // For server connections, also match by server identifier
            if (existingConn.path === serverIdentifier) return true;
            if (existingConn.path.includes(serverIdentifier)) return true;
            return false;
          }
        );

        if (existingConnectionEntry) {
          // Connection already exists, just switch to it instead of creating duplicate
          const [existingId] = existingConnectionEntry;
          setActiveConnection(existingId);
          return;
        }

        setIsConnecting(true);
        setError(null);

        try {
          const result = await sqlPro.db.open({
            config: conn.connectionConfig,
          });

          if (!result.success) {
            setError(result.error || t('database.failedToConnect'));
            setIsConnecting(false);
            return;
          }

          if (result.connection) {
            addConnection({
              id: result.connection.id,
              path: result.connection.path,
              filename: result.connection.filename,
              isEncrypted: result.connection.isEncrypted,
              isReadOnly: result.connection.isReadOnly,
              status: 'connected',
              databaseType:
                result.connection.databaseType || conn.connectionConfig.type,
            });

            // Load schema
            setIsLoadingSchema(true);
            const schemaResult = await sqlPro.db.getSchema({
              connectionId: result.connection.id,
            });

            if (schemaResult.success) {
              setSchema(result.connection.id, {
                schemas: schemaResult.schemas || [],
                tables: schemaResult.tables || [],
                views: schemaResult.views || [],
              });
            }
            setIsLoadingSchema(false);

            // Refresh recent connections
            const connectionsResult = await sqlPro.app.getRecentConnections();
            if (connectionsResult.success && connectionsResult.connections) {
              setRecentConnections(
                connectionsResult.connections as RecentConnection[]
              );
            }
          }
        } catch (err) {
          setError(
            err instanceof Error ? err.message : t('common.unknownError')
          );
        } finally {
          setIsConnecting(false);
        }
        return;
      }

      // For SQLite databases, use the original logic
      const { path, isEncrypted, readOnly } = conn;
      if (isEncrypted) {
        // Check if we have a saved password
        const savedPasswordResult = await sqlPro.password.get({
          dbPath: path,
        });
        if (savedPasswordResult.success && savedPasswordResult.password) {
          // Try to connect with saved password and readOnly setting
          await connectToDatabase(path, savedPasswordResult.password, readOnly);
        } else {
          // No saved password, show dialog - store readOnly for later use
          // Note: rememberPassword will be determined by PasswordDialog
          setPendingPath(path);
          setPendingSettings(
            readOnly !== undefined
              ? { displayName: '', readOnly, rememberPassword: false }
              : null
          );
          setPasswordDialogOpen(true);
        }
      } else {
        await connectToDatabase(path, undefined, readOnly);
      }
    },
    [
      connectToDatabase,
      connections,
      setActiveConnection,
      setIsConnecting,
      setError,
      addConnection,
      setSchema,
      setIsLoadingSchema,
      setRecentConnections,
      t,
    ]
  );

  // Edit connection settings (T031, T033)
  const handleEditConnection = (conn: RecentConnection) => {
    // For server databases, open the server connection dialog in edit mode
    if (
      conn.databaseType &&
      conn.databaseType !== 'sqlite' &&
      conn.connectionConfig
    ) {
      setEditingConnection(conn);
      setSelectedDbType(conn.databaseType);
      setEditServerDialogOpen(true);
    } else {
      // For SQLite, use the global connection settings dialog
      openConnectionSettings(conn);
    }
  };

  // Handle server connection edit and reconnect
  const handleEditServerConnect = useCallback(
    async (config: DatabaseConnectionConfig) => {
      if (!editingConnection) return;

      setIsConnecting(true);
      setError(null);

      try {
        // First, update the connection config in storage
        const updateResult = await sqlPro.connection.update({
          path: editingConnection.path,
          displayName: config.name,
          readOnly: config.readOnly,
          connectionConfig: config,
        });

        if (!updateResult.success) {
          setError(
            updateResult.error || t('welcomeScreen.failedToUpdateConnection')
          );
          setIsConnecting(false);
          return;
        }

        // Check if there's an existing connection with the same path and close it
        // For server connections, path is typically: displayName or host:port/database
        const editingPath = editingConnection.path;
        const editingFilename = editingConnection.filename;

        // Build the canonical server identifier from connectionConfig if available
        // This is more reliable than path/filename which can change with displayName
        let serverIdentifier: string | undefined;
        if (editingConnection.connectionConfig) {
          const cfg = editingConnection.connectionConfig;
          const host = cfg.host || '';
          const port = cfg.port || 5432;
          const database = cfg.database || 'postgres';
          serverIdentifier = `${host}:${port}/${database}`;
        }

        const existingConnectionEntry = Array.from(connections.entries()).find(
          ([, conn]) => {
            // Match by path (could be displayName or host:port/database format)
            if (conn.path === editingPath) return true;
            // Also check filename in case path format differs
            if (conn.filename === editingFilename) return true;
            // For server connections, also match by server identifier pattern in path
            if (serverIdentifier && conn.path.includes(serverIdentifier)) {
              return true;
            }
            // Check if conn.path matches the server identifier (host:port/database format)
            if (serverIdentifier && conn.path === serverIdentifier) return true;
            return false;
          }
        );

        if (existingConnectionEntry) {
          const [existingId] = existingConnectionEntry;
          // Close the existing connection before opening with new config
          await sqlPro.db.close({ connectionId: existingId });
          removeConnection(existingId);
        }

        // Then connect with the new config
        const result = await sqlPro.db.open({ config });

        if (!result.success) {
          setError(result.error || t('database.failedToConnect'));
          setIsConnecting(false);
          return;
        }

        if (result.connection) {
          addConnection({
            id: result.connection.id,
            path: result.connection.path,
            filename: result.connection.filename,
            isEncrypted: result.connection.isEncrypted,
            isReadOnly: result.connection.isReadOnly,
            status: 'connected',
            databaseType: result.connection.databaseType || config.type,
          });

          // Load schema
          setIsLoadingSchema(true);
          const schemaResult = await sqlPro.db.getSchema({
            connectionId: result.connection.id,
          });

          if (schemaResult.success) {
            setSchema(result.connection.id, {
              schemas: schemaResult.schemas || [],
              tables: schemaResult.tables || [],
              views: schemaResult.views || [],
            });
          }
          setIsLoadingSchema(false);

          // Refresh recent connections
          const connectionsResult = await sqlPro.app.getRecentConnections();
          if (connectionsResult.success && connectionsResult.connections) {
            setRecentConnections(
              connectionsResult.connections as RecentConnection[]
            );
          }

          // Close the dialog
          setEditServerDialogOpen(false);
          setEditingConnection(null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : t('common.unknownError'));
      } finally {
        setIsConnecting(false);
      }
    },
    [
      editingConnection,
      connections,
      setIsConnecting,
      setError,
      removeConnection,
      addConnection,
      setSchema,
      setIsLoadingSchema,
      setRecentConnections,
      t,
    ]
  );

  // Remove connection from list (T045-T049 - implementing here for context menu)
  const handleRemoveConnection = async (conn: RecentConnection) => {
    // Remove from recent connections list
    const result = await sqlPro.app.removeRecentConnection({
      connectionId: conn.path,
    });

    if (result.success) {
      // Also remove saved password
      try {
        await sqlPro.password.remove({ dbPath: conn.path });
      } catch {
        // Ignore password removal errors
      }

      // Refresh recent connections
      const connectionsResult = await sqlPro.app.getRecentConnections();
      if (connectionsResult.success && connectionsResult.connections) {
        setRecentConnections(
          connectionsResult.connections as RecentConnection[]
        );
      }
    }
  };

  // Handle connecting from a profile
  const handleConnectFromProfile = useCallback(
    async (profile: ConnectionProfile) => {
      // Profile has the same structure as RecentConnection for connection purposes
      await handleRecentClick(profile);
    },
    [handleRecentClick]
  );

  // Handle save as profile
  const handleSaveAsProfile = useCallback((conn: RecentConnection) => {
    setProfileToSave({
      path: conn.path,
      filename: conn.filename,
      isEncrypted: conn.isEncrypted,
      databaseType: conn.databaseType,
      connectionConfig: conn.connectionConfig,
    });
    setSaveProfileDialogOpen(true);
  }, []);

  // Handle save profile form submit
  const handleSaveProfileSubmit = useCallback(
    async (data: ProfileFormData) => {
      if (!profileToSave) return;

      try {
        const newProfile: ConnectionProfile = {
          id: crypto.randomUUID(),
          path: profileToSave.path,
          filename: profileToSave.filename,
          displayName: data.displayName,
          isEncrypted: profileToSave.isEncrypted,
          folderId: data.folderId,
          tags: data.tags,
          notes: data.notes,
          readOnly: data.readOnly,
          isSaved: true,
          lastOpened: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          databaseType: profileToSave.databaseType,
          connectionConfig: profileToSave.connectionConfig,
        };

        const result = await sqlPro.profile.save({ profile: newProfile });

        if (result.success) {
          setSaveProfileDialogOpen(false);
          setProfileToSave(null);
          // Refresh profiles by toggling the view
          setShowProfiles(false);
          setTimeout(() => setShowProfiles(true), 100);
        } else {
          setError(result.error || t('welcomeScreen.failedToSaveProfile'));
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : t('database.unknownError')
        );
      }
    },
    [profileToSave, setError, t]
  );

  // Handle database type selection
  const handleDbTypeSelect = useCallback(
    (type: DatabaseType) => {
      setSelectedDbType(type);
      setError(null); // Clear any previous errors when opening a new connection dialog
      if (type === 'sqlite') {
        // For SQLite, open the file dialog
        handleOpenDatabase();
      } else {
        // For server databases, open the connection dialog
        setServerConnectionOpen(true);
      }
    },
    [setError, handleOpenDatabase]
  );

  // Handle server database connection
  const handleServerConnect = useCallback(
    async (config: DatabaseConnectionConfig) => {
      setIsConnecting(true);
      setError(null);

      try {
        const result = await sqlPro.db.open({ config });

        if (!result.success) {
          setError(result.error || t('database.failedToConnect'));
          setIsConnecting(false);
          return;
        }

        if (result.connection) {
          addConnection({
            id: result.connection.id,
            path: result.connection.path,
            filename: result.connection.filename,
            isEncrypted: result.connection.isEncrypted,
            isReadOnly: result.connection.isReadOnly,
            status: 'connected',
            databaseType: result.connection.databaseType || config.type,
          });

          // Load schema
          setIsLoadingSchema(true);
          const schemaResult = await sqlPro.db.getSchema({
            connectionId: result.connection.id,
          });

          if (schemaResult.success) {
            setSchema(result.connection.id, {
              schemas: schemaResult.schemas || [],
              tables: schemaResult.tables || [],
              views: schemaResult.views || [],
            });
          }
          setIsLoadingSchema(false);

          // Refresh recent connections
          const connectionsResult = await sqlPro.app.getRecentConnections();
          if (connectionsResult.success && connectionsResult.connections) {
            setRecentConnections(
              connectionsResult.connections as RecentConnection[]
            );
          }

          // Close the dialog
          setServerConnectionOpen(false);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : t('common.unknownError'));
      } finally {
        setIsConnecting(false);
      }
    },
    [
      setIsConnecting,
      setError,
      addConnection,
      setSchema,
      setIsLoadingSchema,
      setRecentConnections,
      t,
    ]
  );

  return (
    <div className="bg-background relative flex h-full flex-col overflow-hidden">
      {/* Top Right Controls */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger>
            <Button
              variant={showProfiles ? 'default' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setShowProfiles(!showProfiles)}
              data-tour-target="profiles-button"
            >
              <Database className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent className={TOOLTIP_CONTENT_STYLE}>
            {showProfiles
              ? t('welcome.hideProfiles')
              : t('welcome.showProfiles')}
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Main Content - Asymmetric Layout for visual interest */}
      <div className="flex flex-1 items-center justify-center overflow-hidden">
        <div className="flex h-full max-h-[700px] w-full items-center">
          {/* Left Column - Feature Showcase (wider) */}
          <div className="border-border flex w-[55%] justify-center border-r p-10">
            <div className="w-full max-w-lg">
              <FeatureShowcase
                onStartTour={handleStartWelcomeTour}
                disabled={
                  isConnecting || isLoadingSchema || connections.size > 0
                }
              />
            </div>
          </div>

          {/* Right Column - Connection Area (focused) */}
          <div className="relative flex w-[45%] justify-center p-10">
            <div className="relative z-10 flex w-full max-w-sm flex-col space-y-8">
              {/* Logo & Title */}
              <div className="shrink-0 text-center">
                <div className="rounded-base border-border bg-main mx-auto mb-5 flex h-14 w-14 items-center justify-center border shadow-sm">
                  <Database className="text-main-foreground h-7 w-7" />
                </div>
                <h1
                  className="text-foreground font-bold tracking-tight"
                  style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 1.7)' }}
                >
                  {t('app.name')}
                </h1>
                <p
                  className="text-muted-foreground mt-1.5"
                  style={{ fontSize: 'var(--font-ui-size, 13px)' }}
                >
                  {t('welcome.subtitle', {
                    defaultValue: 'Professional Database Manager',
                  })}
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div
                  className="border-border bg-destructive/10 text-destructive rounded-base flex items-center gap-2.5 border p-3"
                  style={{ fontSize: 'var(--font-ui-size, 13px)' }}
                >
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Connection Buttons */}
              <div className="shrink-0 space-y-3">
                <Button
                  variant={isConnecting ? 'outline' : 'default'}
                  size="lg"
                  className="w-full font-medium"
                  onClick={handleOpenDatabase}
                  disabled={isConnecting}
                  data-action="open-database"
                >
                  <FolderOpen className="mr-2 h-4 w-4" />
                  {isConnecting
                    ? t('status.connecting')
                    : t('welcome.openSqlite', {
                        defaultValue: 'Open SQLite Database',
                      })}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full"
                  onClick={() => setDbTypeSelectorOpen(true)}
                  disabled={isConnecting}
                  data-action="connect-server"
                >
                  <Server className="mr-2 h-4 w-4" />
                  {t('welcome.connectServer', {
                    defaultValue: 'Connect to Server',
                  })}
                </Button>
                <p
                  className="text-muted-foreground text-center"
                  style={{
                    fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)',
                  }}
                >
                  {t('welcome.supportsDb', {
                    defaultValue:
                      'Supports MySQL, PostgreSQL, Supabase, and Turso',
                  })}
                </p>
              </div>

              {/* Recent Connections / Profile Manager */}
              <div>
                {showProfiles ? (
                  <div className="border-border bg-secondary-background rounded-base max-h-64 overflow-hidden border">
                    <ProfileManager
                      onConnect={handleConnectFromProfile}
                      compact={true}
                    />
                  </div>
                ) : (
                  recentConnections.length > 0 && (
                    <div
                      className="flex flex-col space-y-3"
                      data-tour-target="recent-connections"
                    >
                      <div className="flex shrink-0 items-center justify-between px-1">
                        <span
                          className="text-muted-foreground font-medium tracking-wide uppercase"
                          style={{
                            fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)',
                          }}
                        >
                          {t('welcome.recentConnections', {
                            defaultValue: 'Recent Connections',
                          })}
                        </span>
                        <Clock className="text-muted-foreground h-3.5 w-3.5" />
                      </div>
                      <ScrollArea className="h-48">
                        <div className="space-y-1 pr-2">
                          {recentConnections.map((conn) => (
                            <div
                              key={conn.path}
                              className="group flex items-center gap-1"
                            >
                              <Button
                                variant="ghost"
                                className="h-auto min-w-0 flex-1 justify-start px-2 py-1.5 text-left"
                                onClick={() => handleRecentClick(conn)}
                                disabled={isConnecting}
                              >
                                {(() => {
                                  const { Icon, color, label } =
                                    getDatabaseIcon(conn.databaseType);
                                  return (
                                    <Tooltip>
                                      <TooltipTrigger>
                                        <Icon
                                          className={cn(
                                            'mr-2 h-4 w-4 shrink-0',
                                            color
                                          )}
                                        />
                                      </TooltipTrigger>
                                      <TooltipContent
                                        className={TOOLTIP_CONTENT_STYLE}
                                      >
                                        {label}
                                      </TooltipContent>
                                    </Tooltip>
                                  );
                                })()}
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className="truncate font-medium"
                                      style={{
                                        fontSize: 'var(--font-ui-size, 13px)',
                                      }}
                                    >
                                      {conn.displayName || conn.filename}
                                    </span>
                                    <div className="flex shrink-0 items-center gap-1">
                                      {conn.readOnly && (
                                        <Tooltip>
                                          <TooltipTrigger>
                                            <Eye className="text-muted-foreground h-3 w-3" />
                                          </TooltipTrigger>
                                          <TooltipContent
                                            className={TOOLTIP_CONTENT_STYLE}
                                          >
                                            {t('welcome.readOnly')}
                                          </TooltipContent>
                                        </Tooltip>
                                      )}
                                      <HasSavedPasswordIndicator
                                        path={conn.path}
                                      />
                                    </div>
                                  </div>
                                  <div
                                    className="text-muted-foreground truncate font-mono"
                                    style={{
                                      fontSize:
                                        'calc(var(--font-ui-size, 13px) * 0.85)',
                                    }}
                                  >
                                    {conn.path}
                                  </div>
                                </div>
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100"
                                  >
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="end"
                                  side="bottom"
                                  className="w-auto"
                                >
                                  <DropdownMenuItem
                                    onClick={() => handleEditConnection(conn)}
                                    className="whitespace-nowrap"
                                  >
                                    <Pencil className="mr-2 h-4 w-4" />
                                    <span>{t('actions.edit')}</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleSaveAsProfile(conn)}
                                    className="whitespace-nowrap"
                                  >
                                    <BookmarkPlus className="mr-2 h-4 w-4" />
                                    <span>
                                      {t('welcome.saveAsProfile', {
                                        defaultValue: 'Save as Profile',
                                      })}
                                    </span>
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleRemoveConnection(conn)}
                                    className="text-destructive focus:text-destructive whitespace-nowrap"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    <span>{t('actions.remove')}</span>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <ConnectionSettingsDialog
        open={settingsDialogOpen}
        onOpenChange={setSettingsDialogOpen}
        onSubmit={handleSettingsSubmit}
        filename={pendingFilename}
        dbPath={pendingPath || ''}
        isEncrypted={pendingIsEncrypted}
        mode="new"
      />

      <PasswordDialog
        open={passwordDialogOpen}
        onOpenChange={setPasswordDialogOpen}
        onSubmit={handlePasswordSubmit}
        filename={pendingFilename}
        dbPath={pendingPath || ''}
      />

      {/* Save Profile Dialog */}
      <Dialog
        open={saveProfileDialogOpen}
        onOpenChange={setSaveProfileDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('welcomeScreen.saveAsProfile')}</DialogTitle>
          </DialogHeader>
          {profileToSave && (
            <ProfileForm
              mode="new"
              dbPath={profileToSave.path}
              filename={profileToSave.filename}
              isEncrypted={profileToSave.isEncrypted}
              folders={Array.from(folders.values())}
              onSubmit={handleSaveProfileSubmit}
              onCancel={() => {
                setSaveProfileDialogOpen(false);
                setProfileToSave(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Database Type Selector */}
      <DatabaseTypeSelector
        open={dbTypeSelectorOpen}
        onOpenChange={setDbTypeSelectorOpen}
        onSelect={handleDbTypeSelect}
      />

      {/* Server Connection Dialog */}
      <ServerConnectionDialog
        open={serverConnectionOpen}
        onOpenChange={(open) => {
          setServerConnectionOpen(open);
          if (!open) {
            setError(null); // Clear error when dialog is closed
          }
        }}
        databaseType={selectedDbType}
        onConnect={handleServerConnect}
        isConnecting={isConnecting}
        error={error}
      />

      {/* Server Connection Edit Dialog */}
      <ServerConnectionDialog
        open={editServerDialogOpen}
        onOpenChange={(open) => {
          setEditServerDialogOpen(open);
          if (!open) {
            setError(null);
            setEditingConnection(null);
          }
        }}
        databaseType={selectedDbType}
        onConnect={handleEditServerConnect}
        isConnecting={isConnecting}
        error={error}
        mode="edit"
        initialConfig={editingConnection?.connectionConfig}
      />

      {/* Welcome Tour */}
      <WelcomeTour
        isVisible={welcomeTourVisible}
        onComplete={handleCompleteWelcomeTour}
        onSkip={handleSkipWelcomeTour}
      />

      {/* Welcome Dialog - shown on first visit */}
      <WelcomeDialog
        open={welcomeDialogOpen}
        onOpenChange={setWelcomeDialogOpen}
        onStartTour={handleStartWelcomeTour}
      />
    </div>
  );
}
