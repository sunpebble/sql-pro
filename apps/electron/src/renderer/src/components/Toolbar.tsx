import type { PendingChangeInfo, SavedQuery } from '@shared/types';
import { Button } from '@sqlpro/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@sqlpro/ui/dropdown-menu';
import { Separator } from '@sqlpro/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@sqlpro/ui/tooltip';
import {
  ChevronDown,
  Database,
  FileText,
  KeyRound,
  Lock,
  RefreshCw,
  ScrollText,
  Settings,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { FavoritesQuickPanel } from '@/components/query/FavoritesQuickPanel';
import { ShortcutKbd } from '@/components/ui/kbd';
import { UnsavedChangesDialog } from '@/components/UnsavedChangesDialog';
import { sqlPro } from '@/lib/api';
import {
  useChangesStore,
  useConnectionStore,
  useDialogStore,
  useTableDataStore,
} from '@/stores';
import { useSqlLogStore } from '@/stores/sql-log-store';

interface ToolbarProps {
  onOpenChanges?: () => void;
  onLoadFavoriteQuery?: (query: SavedQuery) => void;
}

export function Toolbar({ onOpenChanges, onLoadFavoriteQuery }: ToolbarProps) {
  const {
    connection,
    activeConnectionId,
    removeConnection,
    setSchema,
    setSelectedTable,
    isLoadingSchema,
    setIsLoadingSchema,
  } = useConnectionStore();
  const {
    hasChanges,
    hasChangesForConnection,
    getChangesForConnection,
    clearChangesForConnection,
    changes,
  } = useChangesStore();
  const { resetConnection } = useTableDataStore();
  const { toggleVisible: toggleSqlLog } = useSqlLogStore();

  // Global dialog store for connection settings - must be before any conditional returns
  const openConnectionSettings = useDialogStore(
    (s) => s.openConnectionSettings
  );
  const openChangePassword = useDialogStore((s) => s.openChangePassword);

  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);

  const performDisconnect = async () => {
    if (connection && activeConnectionId) {
      await sqlPro.db.close({ connectionId: connection.id });
      removeConnection(activeConnectionId);
      setSelectedTable(null);
      clearChangesForConnection(activeConnectionId);
      resetConnection(activeConnectionId);
    }
  };

  const handleDisconnect = async () => {
    if (!connection || !activeConnectionId) return;

    // Guard: prevent showing multiple dialogs on rapid clicks
    if (showUnsavedDialog) return;

    // Check for unsaved changes before disconnecting
    if (hasChangesForConnection(activeConnectionId)) {
      setShowUnsavedDialog(true);
      return;
    }

    // No unsaved changes, proceed with disconnect
    await performDisconnect();
  };

  const handleSaveAndDisconnect = async () => {
    if (!connection || !activeConnectionId) return;

    const pendingChanges = getChangesForConnection(activeConnectionId);

    // Convert PendingChange[] to PendingChangeInfo[] for IPC
    const changeInfos: PendingChangeInfo[] = pendingChanges.map((c) => ({
      id: c.id,
      table: c.table,
      schema: c.schema,
      rowId: c.rowId,
      type: c.type,
      oldValues: c.oldValues,
      newValues: c.newValues,
      primaryKeyColumn: c.primaryKeyColumn,
    }));

    // Apply changes via IPC
    const response = await sqlPro.db.applyChanges({
      connectionId: connection.id,
      changes: changeInfos,
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to apply changes');
    }

    // Clear changes and disconnect
    clearChangesForConnection(activeConnectionId);
    await performDisconnect();
  };

  const handleDiscardAndDisconnect = () => {
    if (!activeConnectionId) return;

    clearChangesForConnection(activeConnectionId);
    performDisconnect();
  };

  const handleCancelDisconnect = () => {
    // Just close the dialog, do not disconnect
  };

  const handleRefreshSchema = async () => {
    if (!connection) return;

    setIsLoadingSchema(true);
    const result = await sqlPro.db.getSchema({
      connectionId: connection.id,
    });

    if (result.success && activeConnectionId) {
      setSchema(activeConnectionId, {
        schemas: result.schemas || [],
        tables: result.tables || [],
        views: result.views || [],
      });
    }
    setIsLoadingSchema(false);
  };

  if (!connection) return null;

  const currentConnectionChanges = activeConnectionId
    ? getChangesForConnection(activeConnectionId)
    : [];

  // Helper functions for connection menu actions
  const handleEditConnection = () => {
    // Get current connection as RecentConnection format
    openConnectionSettings({
      path: connection.path,
      filename: connection.filename,
      displayName: connection.filename,
      lastOpened: new Date().toISOString(),
      isEncrypted: connection.isEncrypted,
      readOnly: connection.isReadOnly,
    });
  };

  const handleChangePassword = () => {
    if (!activeConnectionId) return;
    openChangePassword({
      connectionId: activeConnectionId,
      filename: connection.filename,
      dbPath: connection.path,
      isEncrypted: connection.isEncrypted,
    });
  };

  return (
    <>
      <div className="flex h-12 min-w-0 items-center gap-2 overflow-hidden border-b px-3">
        {/* Database Info with Quick Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button
              variant="ghost"
              className="flex min-w-0 items-center gap-2 px-2"
            >
              <Database className="text-muted-foreground h-4 w-4 shrink-0" />
              <span className="min-w-0 truncate font-medium">
                {connection.filename}
              </span>
              {connection.isEncrypted && (
                <Lock className="text-muted-foreground h-3 w-3 shrink-0" />
              )}
              {connection.isReadOnly && (
                <span className="bg-secondary text-muted-foreground shrink-0 rounded px-1.5 py-0.5 text-xs">
                  RO
                </span>
              )}
              <ChevronDown className="text-muted-foreground h-3 w-3 shrink-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <div className="px-2 py-1.5">
              <p className="text-muted-foreground truncate text-xs">
                {connection.path}
              </p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleEditConnection}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Connection Settings</span>
            </DropdownMenuItem>
            {connection.isEncrypted ? (
              <DropdownMenuItem
                onClick={handleChangePassword}
                disabled={connection.isReadOnly}
              >
                <Lock className="mr-2 h-4 w-4" />
                <span>Change Password</span>
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                onClick={handleChangePassword}
                disabled={connection.isReadOnly}
              >
                <KeyRound className="mr-2 h-4 w-4" />
                <span>Encrypt Database</span>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleRefreshSchema}>
              <RefreshCw className="mr-2 h-4 w-4" />
              <span>Refresh Schema</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Separator orientation="vertical" className="h-auto! self-stretch" />

        {/* Actions */}
        <Tooltip>
          <TooltipTrigger>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefreshSchema}
              disabled={isLoadingSchema}
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoadingSchema ? 'animate-spin' : ''}`}
              />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <span>Refresh Schema</span>
            <ShortcutKbd action="action.refresh-schema" className="ml-2" />
          </TooltipContent>
        </Tooltip>

        <div className="min-w-0 flex-1" />

        {/* Right side actions - won't shrink */}
        <div className="flex shrink-0 items-center gap-2">
          {/* Favorites Quick Access */}
          <FavoritesQuickPanel onLoadQuery={onLoadFavoriteQuery} />

          {/* Pending Changes Indicator - Clickable */}
          {hasChanges() && (
            <button
              onClick={onOpenChanges}
              className="flex shrink-0 items-center gap-2 rounded-md bg-amber-500/10 px-3 py-1 text-sm text-amber-600 transition-colors hover:bg-amber-500/20 dark:text-amber-400"
            >
              <FileText className="h-4 w-4" />
              <span>
                {changes.length} unsaved change{changes.length !== 1 ? 's' : ''}
              </span>
            </button>
          )}

          {/* SQL Log Toggle */}
          <Tooltip>
            <TooltipTrigger>
              <Button variant="ghost" size="icon" onClick={toggleSqlLog}>
                <ScrollText className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>SQL Log</TooltipContent>
          </Tooltip>

          {/* Command Palette Hint */}
          <Tooltip>
            <TooltipTrigger>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  // Trigger command palette via keyboard event
                  window.dispatchEvent(
                    new KeyboardEvent('keydown', {
                      key: 'k',
                      metaKey: true,
                      bubbles: true,
                    })
                  );
                }}
                className="text-muted-foreground gap-1.5 text-xs"
              >
                <span>Commands</span>
                <ShortcutKbd action="action.command-palette" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Open command palette</TooltipContent>
          </Tooltip>

          {/* Disconnect */}
          <Tooltip>
            <TooltipTrigger>
              <Button variant="ghost" size="icon" onClick={handleDisconnect}>
                <X className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Close Database</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Unsaved Changes Dialog */}
      {activeConnectionId && (
        <UnsavedChangesDialog
          open={showUnsavedDialog}
          onOpenChange={setShowUnsavedDialog}
          changes={currentConnectionChanges}
          connectionId={activeConnectionId}
          onSave={handleSaveAndDisconnect}
          onDiscard={handleDiscardAndDisconnect}
          onCancel={handleCancelDisconnect}
        />
      )}
    </>
  );
}
