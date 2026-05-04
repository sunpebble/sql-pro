import type { DragCancelEvent, DragEndEvent } from '@dnd-kit/core';
import type { PendingChangeInfo } from '@shared/types';
import type { DatabaseConnection } from '@/types/database';
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { restrictToHorizontalAxis } from '@dnd-kit/modifiers';
import {
  horizontalListSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '@sqlpro/ui/context-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@sqlpro/ui/tooltip';
import {
  AlertCircle,
  Archive,
  BarChart3,
  CheckCircle,
  Circle,
  KeyRound,
  Lock,
  Palette,
  RefreshCw,
  Settings,
  X,
} from 'lucide-react';
import { memo, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { UnsavedChangesDialog } from '@/components/UnsavedChangesDialog';
import { sqlPro } from '@/lib/api';
import { queryClient } from '@/lib/query-client';
import { cn, TOOLTIP_CONTENT_STYLE } from '@/lib/utils';
import { useChangesStore } from '@/stores/changes-store';
// Direct imports to avoid barrel file overhead (bundle-barrel-imports)
import { useConnectionStore } from '@/stores/connection-store';
import { useDialogStore } from '@/stores/dialog-store';
import { useTableDataStore } from '@/stores/table-data-store';

// Preset colors for connection tabs (using OKLch for consistency)
const PRESET_COLORS = [
  { name: 'Blue', value: 'oklch(0.59 0.20 255)' },
  { name: 'Green', value: 'oklch(0.70 0.17 160)' },
  { name: 'Red', value: 'oklch(0.63 0.24 25)' },
  { name: 'Yellow', value: 'oklch(0.80 0.16 95)' },
  { name: 'Purple', value: 'oklch(0.65 0.22 300)' },
  { name: 'Pink', value: 'oklch(0.70 0.22 350)' },
  { name: 'Orange', value: 'oklch(0.70 0.20 50)' },
  { name: 'Teal', value: 'oklch(0.70 0.14 180)' },
  { name: 'Indigo', value: 'oklch(0.55 0.22 270)' },
  { name: 'Cyan', value: 'oklch(0.75 0.14 200)' },
  { name: 'Lime', value: 'oklch(0.80 0.18 125)' },
  { name: 'Amber', value: 'oklch(0.75 0.18 75)' },
];

/**
 * Validates if a string is a valid color code
 * Supports hex (#RGB, #RRGGBB) and OKLch formats
 */
const isValidColor = (color: string): boolean => {
  // Check for valid hex color format: #RGB or #RRGGBB
  const hexColorRegex = /^#(?:[A-F0-9]{6}|[A-F0-9]{3})$/i;
  // Check for OKLch format: oklch(L C H) or oklch(L C H / A)
  const oklchRegex =
    /^oklch\(\s*[\d.]+\s+[\d.]+\s+[\d.]+\s*(?:\/\s*[\d.]+%?\s*)?\)$/i;
  return hexColorRegex.test(color) || oklchRegex.test(color);
};

interface ConnectionTabBarProps {
  className?: string;
}

interface ConnectionTabProps {
  connection: DatabaseConnection;
  isActive: boolean;
  onSelect: () => void;
  onClose: () => void;
}

const ConnectionTab = memo(
  ({ connection, isActive, onSelect, onClose }: ConnectionTabProps) => {
    const { t } = useTranslation('common');
    const { getConnectionColor, setConnectionColor, setSchema } =
      useConnectionStore();
    const connectionColor =
      getConnectionColor(connection.id) || 'oklch(0.59 0.20 255)'; // default blue

    // Check for unsaved changes
    const hasUnsavedChanges = useChangesStore((state) =>
      state.hasChangesForConnection(connection.id)
    );

    // Dialog stores
    const openConnectionSettings = useDialogStore(
      (s) => s.openConnectionSettings
    );
    const openChangePassword = useDialogStore((s) => s.openChangePassword);
    const openBackupDialog = useDialogStore((s) => s.openBackupDialog);

    // Refresh state
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Context menu state - used to disable tooltip when context menu is open
    const [contextMenuOpen, setContextMenuOpen] = useState(false);
    // Key to force tooltip remount when context menu closes
    const [tooltipKey, setTooltipKey] = useState(0);

    const handleContextMenuChange = useCallback((open: boolean) => {
      setContextMenuOpen(open);
      // Force tooltip to remount when context menu closes to reset its state
      if (!open) {
        setTooltipKey((k) => k + 1);
      }
    }, []);

    // Handle refresh schema
    const handleRefreshSchema = useCallback(async () => {
      if (isRefreshing) return;

      setIsRefreshing(true);
      const toastId = toast.loading(t('connection.refreshing'));

      try {
        const result = await sqlPro.db.getSchema({
          connectionId: connection.id,
        });

        if (result.success) {
          setSchema(connection.id, {
            schemas: result.schemas || [],
            tables: result.tables || [],
            views: result.views || [],
          });
        }

        // Invalidate and refetch table data queries for this connection
        await queryClient.invalidateQueries({
          predicate: (query) => {
            const queryKey = query.queryKey;
            return (
              Array.isArray(queryKey) &&
              queryKey[0] === 'tableData' &&
              queryKey[1] === connection.id
            );
          },
        });

        toast.success(t('connection.refreshed'), { id: toastId });
      } catch {
        toast.error(t('connection.refreshFailed'), { id: toastId });
      } finally {
        setIsRefreshing(false);
      }
    }, [connection.id, isRefreshing, setSchema, t]);

    // Handle connection settings
    const handleConnectionSettings = useCallback(() => {
      openConnectionSettings({
        path: connection.path,
        filename: connection.filename,
        displayName: connection.filename,
        lastOpened: new Date().toISOString(),
        isEncrypted: connection.isEncrypted,
        readOnly: connection.isReadOnly,
      });
    }, [connection, openConnectionSettings]);

    // Handle change password
    const handleChangePassword = useCallback(() => {
      openChangePassword({
        connectionId: connection.id,
        filename: connection.filename,
        dbPath: connection.path,
        isEncrypted: connection.isEncrypted,
      });
    }, [connection, openChangePassword]);

    // Handle backup
    const handleBackup = useCallback(() => {
      openBackupDialog();
    }, [openBackupDialog]);

    // Handle dashboard - navigate to dashboard view
    const handleDashboard = useCallback(() => {
      document
        .querySelector<HTMLButtonElement>('[data-tab="dashboard"]')
        ?.click();
    }, []);

    // Set up drag and drop for this tab with activation constraint
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({
      id: connection.id,
    });

    // Status icon based on connection status
    const StatusIcon =
      connection.status === 'connected'
        ? CheckCircle
        : connection.status === 'error'
          ? AlertCircle
          : Circle;

    const statusColorClass =
      connection.status === 'connected'
        ? 'text-green-500'
        : connection.status === 'error'
          ? 'text-red-500'
          : 'text-muted-foreground';

    const handleCloseClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      onClose();
    };

    const handleColorSelect = (color: string) => {
      // Validate color before setting it
      if (isValidColor(color)) {
        setConnectionColor(connection.id, color);
      }
    };

    // Prevent click from triggering when dragging
    const handleClick = () => {
      if (!isDragging) {
        onSelect();
      }
    };

    return (
      <ContextMenu onOpenChange={handleContextMenuChange}>
        <ContextMenuTrigger>
          <TooltipProvider delay={300}>
            <Tooltip key={tooltipKey}>
              <TooltipTrigger>
                <div
                  ref={setNodeRef}
                  aria-selected={isActive}
                  className={cn(
                    'group relative mx-0.5 flex h-7 max-w-44 min-w-26 cursor-pointer items-center gap-1.5 px-2 transition-all',
                    isActive
                      ? 'bg-card/90 text-foreground border-border/80 rounded-md border shadow-sm'
                      : 'text-muted-foreground hover:bg-card/[0.55] hover:text-foreground rounded-md border border-transparent bg-transparent',
                    isDragging &&
                      'ring-primary/50 z-50 scale-105 cursor-grabbing opacity-90 shadow-lg ring-2'
                  )}
                  style={{
                    transform: CSS.Transform.toString(transform),
                    transition,
                    fontSize: 'var(--font-ui-size, 13px)',
                  }}
                  onClick={handleClick}
                  {...attributes}
                  {...listeners}
                >
                  {/* Connection color indicator */}
                  {isActive && (
                    <span
                      className="absolute top-1/2 left-0.5 h-3.5 w-px -translate-y-1/2 rounded-full"
                      style={{ backgroundColor: connectionColor }}
                    />
                  )}
                  <StatusIcon
                    className={cn('h-3 w-3 shrink-0', statusColorClass)}
                  />
                  {hasUnsavedChanges && (
                    <Tooltip>
                      <TooltipTrigger>
                        <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                      </TooltipTrigger>
                      <TooltipContent
                        side="bottom"
                        className={cn(TOOLTIP_CONTENT_STYLE)}
                        style={{
                          fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)',
                        }}
                      >
                        {t('connection.unsavedChanges')}
                      </TooltipContent>
                    </Tooltip>
                  )}
                  <div className="min-w-0 flex-1">
                    <span className="block truncate">
                      {connection.filename}
                    </span>
                  </div>
                  <Tooltip>
                    <TooltipTrigger>
                      <button
                        onClick={handleCloseClick}
                        className={cn(
                          'hover:bg-accent shrink-0 rounded p-0.5 opacity-0 transition-opacity group-hover:opacity-100',
                          isActive && 'opacity-70'
                        )}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent
                      side="bottom"
                      className={cn(TOOLTIP_CONTENT_STYLE)}
                      style={{
                        fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)',
                      }}
                    >
                      {t('connection.closeConnection')}
                    </TooltipContent>
                  </Tooltip>
                </div>
              </TooltipTrigger>
              {!contextMenuOpen && (
                <TooltipContent
                  side="bottom"
                  className={cn('max-w-80', TOOLTIP_CONTENT_STYLE)}
                  style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
                >
                  <div className="flex flex-col gap-1">
                    <div className="font-medium">{connection.filename}</div>
                    <div
                      className="text-muted-foreground font-mono break-all"
                      style={{
                        fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)',
                      }}
                    >
                      {connection.path}
                    </div>
                  </div>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={handleConnectionSettings}>
            <Settings className="mr-2 h-4 w-4" />
            {t('connection.settings')}
          </ContextMenuItem>
          {connection.isEncrypted ? (
            <ContextMenuItem
              onClick={handleChangePassword}
              disabled={connection.isReadOnly}
            >
              <Lock className="mr-2 h-4 w-4" />
              {t('connection.changePassword')}
            </ContextMenuItem>
          ) : (
            <ContextMenuItem
              onClick={handleChangePassword}
              disabled={connection.isReadOnly}
            >
              <KeyRound className="mr-2 h-4 w-4" />
              {t('connection.encryptDatabase')}
            </ContextMenuItem>
          )}
          <ContextMenuItem
            onClick={handleRefreshSchema}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={cn('mr-2 h-4 w-4', isRefreshing && 'animate-spin')}
            />
            {t('connection.refreshSchema')}
          </ContextMenuItem>
          <ContextMenuItem onClick={handleBackup}>
            <Archive className="mr-2 h-4 w-4" />
            {t('backup.title', 'Backup & Restore')}
          </ContextMenuItem>
          <ContextMenuItem onClick={handleDashboard}>
            <BarChart3 className="mr-2 h-4 w-4" />
            {t('dashboard.title', 'Database Dashboard')}
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuSub>
            <ContextMenuSubTrigger nativeButton={false}>
              <Palette className="mr-2 h-4 w-4" />
              {t('connection.setColor')}
            </ContextMenuSubTrigger>
            <ContextMenuSubContent>
              <div className="grid grid-cols-3 gap-1 p-1">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => handleColorSelect(color.value)}
                    className={cn(
                      'group rounded-base relative flex h-10 w-16 items-center justify-center border transition-all active:scale-95',
                      connectionColor === color.value
                        ? 'border-foreground ring-foreground/20 ring-2'
                        : 'border-border hover:border-foreground/50'
                    )}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  >
                    {connectionColor === color.value && (
                      <CheckCircle className="h-4 w-4 text-white drop-shadow-md" />
                    )}
                  </button>
                ))}
              </div>
            </ContextMenuSubContent>
          </ContextMenuSub>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={onClose}>
            {t('connection.close')}
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    );
  }
);

ConnectionTab.displayName = 'ConnectionTab';

export const ConnectionTabBar = memo(({ className }: ConnectionTabBarProps) => {
  const { t } = useTranslation('common');
  const {
    activeConnectionId,
    connectionTabOrder,
    getAllConnections,
    setActiveConnection,
    removeConnection,
    reorderConnections,
    setSelectedTable,
  } = useConnectionStore();
  const {
    hasChangesForConnection,
    getChangesForConnection,
    clearChangesForConnection,
  } = useChangesStore();
  const { resetConnection } = useTableDataStore();

  // Unsaved changes dialog state
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [pendingCloseConnectionId, setPendingCloseConnectionId] = useState<
    string | null
  >(null);

  const allConnections = getAllConnections();

  // Sort connections by tab order
  const orderedConnections = connectionTabOrder
    .map((id) => allConnections.find((conn) => conn.id === id))
    .filter((conn): conn is DatabaseConnection => conn !== undefined);

  // Add any connections not in the tab order (shouldn't happen normally)
  const unorderedConnections = allConnections.filter(
    (conn) => !connectionTabOrder.includes(conn.id)
  );
  const connections = [...orderedConnections, ...unorderedConnections];

  // Perform the actual disconnect
  const performDisconnect = useCallback(
    async (connectionId: string) => {
      const conn = allConnections.find((c) => c.id === connectionId);
      if (conn) {
        await sqlPro.db.close({ connectionId: conn.id });
        removeConnection(connectionId);
        setSelectedTable(null);
        clearChangesForConnection(connectionId);
        resetConnection(connectionId);
      }
    },
    [
      allConnections,
      removeConnection,
      setSelectedTable,
      clearChangesForConnection,
      resetConnection,
    ]
  );

  // Handle close with unsaved changes check
  const handleClose = useCallback(
    (connectionId: string) => {
      if (hasChangesForConnection(connectionId)) {
        setPendingCloseConnectionId(connectionId);
        setShowUnsavedDialog(true);
      } else {
        performDisconnect(connectionId);
      }
    },
    [hasChangesForConnection, performDisconnect]
  );

  // Handle save and disconnect
  const handleSaveAndDisconnect = useCallback(async () => {
    if (!pendingCloseConnectionId) return;

    const conn = allConnections.find((c) => c.id === pendingCloseConnectionId);
    if (!conn) return;

    const pendingChanges = getChangesForConnection(pendingCloseConnectionId);

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
      connectionId: conn.id,
      changes: changeInfos,
    });

    if (!response.success) {
      throw new Error(response.error || t('connection.failedToApplyChanges'));
    }

    // Clear changes and disconnect
    await performDisconnect(pendingCloseConnectionId);
    setShowUnsavedDialog(false);
    setPendingCloseConnectionId(null);
  }, [
    pendingCloseConnectionId,
    allConnections,
    getChangesForConnection,
    performDisconnect,
    t,
  ]);

  // Handle discard and disconnect
  const handleDiscardAndDisconnect = useCallback(() => {
    if (!pendingCloseConnectionId) return;
    performDisconnect(pendingCloseConnectionId);
    setShowUnsavedDialog(false);
    setPendingCloseConnectionId(null);
  }, [pendingCloseConnectionId, performDisconnect]);

  // Handle cancel
  const handleCancelDisconnect = useCallback(() => {
    setShowUnsavedDialog(false);
    setPendingCloseConnectionId(null);
  }, []);

  // Set up sensors for drag and drop with activation constraint
  // Require at least 8px movement before starting drag to allow clicks
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end to update tab order in store
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      // Find indices in connectionTabOrder (not in connections array)
      const oldIndex = connectionTabOrder.indexOf(active.id as string);
      const newIndex = connectionTabOrder.indexOf(over.id as string);

      if (oldIndex !== -1 && newIndex !== -1) {
        reorderConnections(oldIndex, newIndex);
      }
    }
  };

  // Handle drag cancel - called when drag is cancelled (e.g., dragged outside droppable area)
  const handleDragCancel = (_event: DragCancelEvent) => {
    // No action needed - tab will return to original position automatically
    // This handler ensures the drag operation is properly cancelled
  };

  // Get pending changes for dialog
  const pendingChangesForDialog = pendingCloseConnectionId
    ? getChangesForConnection(pendingCloseConnectionId)
    : [];

  if (connections.length === 0) {
    return null;
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToHorizontalAxis]}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div
          className={cn(
            'bg-secondary-background/50 flex h-full items-center',
            className
          )}
          role="tablist"
        >
          <SortableContext
            items={connections.map((conn) => conn.id)}
            strategy={horizontalListSortingStrategy}
          >
            <div
              className="scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/40 flex h-full flex-1 items-center overflow-x-auto px-1"
              data-tauri-drag-region
            >
              {connections.map((connection) => (
                <ConnectionTab
                  key={connection.id}
                  connection={connection}
                  isActive={connection.id === activeConnectionId}
                  onSelect={() => setActiveConnection(connection.id)}
                  onClose={() => handleClose(connection.id)}
                />
              ))}
            </div>
          </SortableContext>
        </div>
      </DndContext>

      {/* Unsaved Changes Dialog */}
      {pendingCloseConnectionId && (
        <UnsavedChangesDialog
          open={showUnsavedDialog}
          onOpenChange={setShowUnsavedDialog}
          changes={pendingChangesForDialog}
          connectionId={pendingCloseConnectionId}
          onSave={handleSaveAndDisconnect}
          onDiscard={handleDiscardAndDisconnect}
          onCancel={handleCancelDisconnect}
        />
      )}
    </>
  );
});

ConnectionTabBar.displayName = 'ConnectionTabBar';
