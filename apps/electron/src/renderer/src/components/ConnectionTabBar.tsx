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
import { cn } from '@/lib/utils';
import {
  useConnectionStore,
  useDialogStore,
  useTableDataStore,
} from '@/stores';
import { useChangesStore } from '@/stores/changes-store';

// Preset colors for connection tabs
const PRESET_COLORS = [
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Green', value: '#10b981' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Lime', value: '#84cc16' },
  { name: 'Amber', value: '#f59e0b' },
];

/**
 * Validates if a string is a valid hex color code
 * Supports both 3-digit (#RGB) and 6-digit (#RRGGBB) formats
 */
const isValidHexColor = (color: string): boolean => {
  // Check for valid hex color format: #RGB or #RRGGBB
  const hexColorRegex = /^#(?:[A-F0-9]{6}|[A-F0-9]{3})$/i;
  return hexColorRegex.test(color);
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
    const connectionColor = getConnectionColor(connection.id) || '#3b82f6'; // default blue

    // Check for unsaved changes
    const hasUnsavedChanges = useChangesStore((state) =>
      state.hasChangesForConnection(connection.id)
    );

    // Dialog stores
    const openConnectionSettings = useDialogStore(
      (s) => s.openConnectionSettings
    );
    const openChangePassword = useDialogStore((s) => s.openChangePassword);

    // Refresh state
    const [isRefreshing, setIsRefreshing] = useState(false);

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
      if (isValidHexColor(color)) {
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
      <ContextMenu>
        <ContextMenuTrigger>
          <TooltipProvider delay={300}>
            <Tooltip>
              <TooltipTrigger>
                <div
                  ref={setNodeRef}
                  aria-selected={isActive}
                  className={cn(
                    'group relative flex h-full max-w-45 min-w-25 cursor-pointer items-center gap-1.5 border-r px-1.5 text-sm transition-colors',
                    isActive
                      ? 'bg-background text-foreground'
                      : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground',
                    isDragging && 'z-50 opacity-80 shadow-lg'
                  )}
                  style={{
                    transform: CSS.Transform.toString(transform),
                    transition,
                    borderBottomWidth: '2px',
                    borderBottomStyle: 'solid',
                    borderBottomColor: isActive
                      ? connectionColor
                      : 'transparent',
                  }}
                  onClick={handleClick}
                  {...attributes}
                  {...listeners}
                >
                  <StatusIcon
                    className={cn('h-3.5 w-3.5 shrink-0', statusColorClass)}
                  />
                  {hasUnsavedChanges && (
                    <Tooltip>
                      <TooltipTrigger>
                        <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="text-xs">
                        {t('connection.unsavedChanges')}
                      </TooltipContent>
                    </Tooltip>
                  )}
                  <div className="min-w-0 flex-1">
                    <span className="block truncate">
                      {connection.filename}
                    </span>
                    {/* Show parent directory for context */}
                    {connection.path &&
                      (() => {
                        const parts = connection.path.split('/');
                        const parentDir =
                          parts.length > 1 ? parts[parts.length - 2] : null;
                        return parentDir ? (
                          <span className="text-muted-foreground block truncate text-[10px] leading-tight">
                            {parentDir}
                          </span>
                        ) : null;
                      })()}
                  </div>
                  <Tooltip>
                    <TooltipTrigger>
                      <button
                        onClick={handleCloseClick}
                        className={cn(
                          'hover:bg-accent shrink-0 rounded p-0.5 opacity-0 transition-opacity group-hover:opacity-100',
                          isActive && 'opacity-60'
                        )}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs">
                      {t('connection.closeConnection')}
                    </TooltipContent>
                  </Tooltip>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-80 text-xs">
                <div className="flex flex-col gap-1">
                  <div className="font-medium">{connection.filename}</div>
                  <div className="text-muted-foreground font-mono text-[11px] break-all">
                    {connection.path}
                  </div>
                </div>
              </TooltipContent>
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
                      'group relative flex h-10 w-16 items-center justify-center rounded border-2 transition-all hover:scale-105',
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
      throw new Error(response.error || 'Failed to apply changes');
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
          className={cn('bg-muted/30 flex h-full items-center', className)}
          role="tablist"
        >
          <SortableContext
            items={connections.map((conn) => conn.id)}
            strategy={horizontalListSortingStrategy}
          >
            <div
              className="scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/40 flex h-full flex-1 items-center overflow-x-auto"
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
