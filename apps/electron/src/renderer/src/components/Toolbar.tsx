import type { PendingChangeInfo } from '@shared/types';
import { Button } from '@sqlpro/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@sqlpro/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@sqlpro/ui/tooltip';
import {
  ChevronDown,
  Compass,
  Database,
  FileText,
  FolderOpen,
  HelpCircle,
  KeyRound,
  Lock,
  Monitor,
  Moon,
  RefreshCw,
  Settings,
  Sun,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { LayoutButtons } from '@/components/LayoutButtons';
import { ShortcutKbd } from '@/components/ui/kbd';
import { UnsavedChangesDialog } from '@/components/UnsavedChangesDialog';
import { sqlPro } from '@/lib/api';
import {
  useChangesStore,
  useConnectionStore,
  useConnectionSwitcherStore,
  useDialogStore,
  useOnboardingStore,
  useTableDataStore,
  useThemeStore,
} from '@/stores';

interface ToolbarProps {
  onOpenChanges?: () => void;
}

export function Toolbar({ onOpenChanges }: ToolbarProps) {
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
  const { theme, setTheme } = useThemeStore();

  // Global stores for dialogs
  const openConnectionSettings = useDialogStore(
    (s) => s.openConnectionSettings
  );
  const openChangePassword = useDialogStore((s) => s.openChangePassword);
  const openConnectionSwitcher = useConnectionSwitcherStore((s) => s.open);
  const { startTour } = useOnboardingStore();

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

  // Open file dialog for new database
  const handleOpenDatabase = async () => {
    const result = await sqlPro.dialog.openFile();
    if (result.success && !result.canceled && result.filePath) {
      window.dispatchEvent(
        new CustomEvent('open-database-file', {
          detail: {
            filePath: result.filePath,
            filename: result.filePath.split('/').pop() || result.filePath,
            isEncrypted: false,
          },
        })
      );
    }
  };

  // Handle edit connection settings
  const handleEditConnection = () => {
    if (!connection) return;
    openConnectionSettings({
      path: connection.path,
      filename: connection.filename,
      displayName: connection.filename,
      lastOpened: new Date().toISOString(),
      isEncrypted: connection.isEncrypted,
      readOnly: connection.isReadOnly,
    });
  };

  // Handle change/set password
  const handleChangePassword = () => {
    if (!connection || !activeConnectionId) return;
    openChangePassword({
      connectionId: activeConnectionId,
      filename: connection.filename,
      dbPath: connection.path,
      isEncrypted: connection.isEncrypted,
    });
  };

  const cycleTheme = () => {
    const themes: Array<'light' | 'dark' | 'system'> = [
      'light',
      'dark',
      'system',
    ];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="h-4 w-4" />;
      case 'dark':
        return <Moon className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  const getThemeLabel = () => {
    switch (theme) {
      case 'light':
        return 'Light mode';
      case 'dark':
        return 'Dark mode';
      default:
        return 'System theme';
    }
  };

  if (!connection) return null;

  const currentConnectionChanges = activeConnectionId
    ? getChangesForConnection(activeConnectionId)
    : [];

  return (
    <>
      <div
        className="flex h-12 min-w-0 items-center gap-2 overflow-hidden border-b px-3"
        data-tour-target="toolbar"
      >
        {/* Database Menu with Info and Actions */}
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
            <DropdownMenuItem onClick={handleOpenDatabase}>
              <FolderOpen className="mr-2 h-4 w-4" />
              Open Database...
            </DropdownMenuItem>
            <DropdownMenuItem onClick={openConnectionSwitcher}>
              <Database className="mr-2 h-4 w-4" />
              Switch Connection
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleEditConnection}>
              <Settings className="mr-2 h-4 w-4" />
              Connection Settings
            </DropdownMenuItem>
            {connection.isEncrypted ? (
              <DropdownMenuItem
                onClick={handleChangePassword}
                disabled={connection.isReadOnly}
              >
                <Lock className="mr-2 h-4 w-4" />
                Change Password
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                onClick={handleChangePassword}
                disabled={connection.isReadOnly}
              >
                <KeyRound className="mr-2 h-4 w-4" />
                Encrypt Database
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleRefreshSchema}
              disabled={isLoadingSchema}
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${isLoadingSchema ? 'animate-spin' : ''}`}
              />
              Refresh Schema
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="min-w-0 flex-1" />

        {/* Right side actions - won't shrink */}
        <div className="flex shrink-0 items-center gap-2">
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

          {/* Theme Toggle */}
          <Tooltip>
            <TooltipTrigger>
              <Button variant="ghost" size="icon" onClick={cycleTheme}>
                {getThemeIcon()}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{getThemeLabel()}</TooltipContent>
          </Tooltip>

          {/* Layout Buttons - VSCode style panel toggles */}
          <LayoutButtons />

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

          {/* Help Menu */}
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger>
                <DropdownMenuTrigger>
                  <Button variant="ghost" size="icon">
                    <HelpCircle className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>Help</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={startTour}>
                <Compass className="h-4 w-4" />
                Take a Tour
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

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
