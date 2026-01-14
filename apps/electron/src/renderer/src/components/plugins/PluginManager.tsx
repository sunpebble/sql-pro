import type { PluginInfo } from './PluginCard';
import { Button } from '@sqlpro/ui/button';
import { Input } from '@sqlpro/ui/input';
import { Label } from '@sqlpro/ui/label';
import { ScrollArea } from '@sqlpro/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@sqlpro/ui/tabs';
import {
  AlertCircle,
  Grid3X3,
  LayoutList,
  Loader2,
  Package,
  RefreshCw,
  Search,
} from 'lucide-react';
import * as React from 'react';
import { useAsyncOperation } from '@/hooks/useAsyncOperation';
import { cn } from '@/lib/utils';
import { PluginCard } from './PluginCard';
import { PluginDetailView } from './PluginDetailView';

// ============ Types ============

export interface PluginManagerProps {
  /** Additional class names */
  className?: string;
  /** Callback when plugins list changes (for parent components to sync) */
  onPluginsChange?: (plugins: PluginInfo[]) => void;
}

type ViewMode = 'grid' | 'list';
type FilterState = 'all' | 'enabled' | 'disabled' | 'error';

interface OperationState {
  pluginId: string;
  operation: 'enable' | 'disable' | 'uninstall' | 'update';
}

// ============ Helper Functions ============

/**
 * Filter plugins by search query and state
 */
function filterPlugins(
  plugins: PluginInfo[],
  searchQuery: string,
  filterState: FilterState
): PluginInfo[] {
  let filtered = plugins;

  // Filter by state
  if (filterState !== 'all') {
    filtered = filtered.filter((plugin) => {
      switch (filterState) {
        case 'enabled':
          return plugin.enabled && plugin.state === 'enabled';
        case 'disabled':
          return !plugin.enabled || plugin.state === 'disabled';
        case 'error':
          return plugin.state === 'error';
        default:
          return true;
      }
    });
  }

  // Filter by search query
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase().trim();
    filtered = filtered.filter(
      (plugin) =>
        plugin.manifest.name.toLowerCase().includes(query) ||
        plugin.manifest.description.toLowerCase().includes(query) ||
        plugin.manifest.author.toLowerCase().includes(query) ||
        plugin.manifest.id.toLowerCase().includes(query) ||
        plugin.manifest.keywords?.some((kw) => kw.toLowerCase().includes(query))
    );
  }

  return filtered;
}

/**
 * Get counts for each filter state
 */
function getStateCounts(plugins: PluginInfo[]): Record<FilterState, number> {
  return {
    all: plugins.length,
    enabled: plugins.filter((p) => p.enabled && p.state === 'enabled').length,
    disabled: plugins.filter((p) => !p.enabled || p.state === 'disabled')
      .length,
    error: plugins.filter((p) => p.state === 'error').length,
  };
}

// ============ PluginManager Component ============

/**
 * PluginManager displays and manages installed plugins.
 * Allows users to view, enable/disable, and uninstall plugins.
 */
export function PluginManager({
  className,
  onPluginsChange,
}: PluginManagerProps) {
  // Use useAsyncOperation for fetching plugins
  const {
    data: plugins,
    loading: isLoading,
    error,
    execute: fetchPlugins,
    reset: resetPlugins,
  } = useAsyncOperation(
    async () => {
      const response = await window.sqlPro.plugin.list();
      if (response.success && response.plugins) {
        return response.plugins as PluginInfo[];
      }
      throw new Error(response.error || 'Failed to fetch plugins');
    },
    { retries: 2, retryDelay: 500, initialData: [] }
  );

  // UI state
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filterState, setFilterState] = React.useState<FilterState>('all');
  const [viewMode, setViewMode] = React.useState<ViewMode>('list');

  // Operation state (for loading indicators)
  const [currentOperation, setCurrentOperation] =
    React.useState<OperationState | null>(null);

  // Detail view state
  const [selectedPlugin, setSelectedPlugin] = React.useState<PluginInfo | null>(
    null
  );
  const [detailViewOpen, setDetailViewOpen] = React.useState(false);

  // Fetch plugins on mount
  React.useEffect(() => {
    fetchPlugins();
  }, [fetchPlugins]);

  // Subscribe to plugin events for real-time updates
  React.useEffect(() => {
    const unsubscribe = window.sqlPro.plugin.onEvent((event: unknown) => {
      // Refresh plugins list on relevant events
      const pluginEvent = event as { type: string };
      if (
        pluginEvent.type === 'plugin:installed' ||
        pluginEvent.type === 'plugin:uninstalled' ||
        pluginEvent.type === 'plugin:enabled' ||
        pluginEvent.type === 'plugin:disabled' ||
        pluginEvent.type === 'plugin:updated' ||
        pluginEvent.type === 'plugin:error'
      ) {
        fetchPlugins();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [fetchPlugins]);

  // Notify parent when plugins change
  React.useEffect(() => {
    if (plugins) {
      onPluginsChange?.(plugins);
    }
  }, [plugins, onPluginsChange]);

  /**
   * Handle enabling/disabling a plugin
   */
  const handleToggleEnabled = React.useCallback(
    async (pluginId: string, enabled: boolean) => {
      setCurrentOperation({
        pluginId,
        operation: enabled ? 'enable' : 'disable',
      });

      try {
        const response = enabled
          ? await window.sqlPro.plugin.enable({ pluginId })
          : await window.sqlPro.plugin.disable({ pluginId });

        if (!response.success) {
          console.error(
            `Failed to ${enabled ? 'enable' : 'disable'} plugin:`,
            response.error
          );
        }
        // Plugin events will trigger a refresh
      } catch (err) {
        console.error(
          `Failed to ${enabled ? 'enable' : 'disable'} plugin:`,
          err
        );
      } finally {
        setCurrentOperation(null);
      }
    },
    []
  );

  /**
   * Handle uninstalling a plugin
   */
  const handleUninstall = React.useCallback(
    async (pluginId: string) => {
      setCurrentOperation({ pluginId, operation: 'uninstall' });

      try {
        const response = await window.sqlPro.plugin.uninstall({ pluginId });

        if (response.success) {
          // Close detail view if this plugin was selected
          if (selectedPlugin?.manifest.id === pluginId) {
            setDetailViewOpen(false);
            setSelectedPlugin(null);
          }
        } else {
          console.error('Failed to uninstall plugin:', response.error);
        }
        // Plugin events will trigger a refresh
      } catch (err) {
        console.error('Failed to uninstall plugin:', err);
      } finally {
        setCurrentOperation(null);
      }
    },
    [selectedPlugin]
  );

  /**
   * Handle viewing plugin details
   */
  const handleViewDetails = React.useCallback(
    (pluginId: string) => {
      const plugin = (plugins || []).find((p) => p.manifest.id === pluginId);
      if (plugin) {
        setSelectedPlugin(plugin);
        setDetailViewOpen(true);
      }
    },
    [plugins]
  );

  /**
   * Handle search input changes
   */
  const handleSearchChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
    },
    []
  );

  /**
   * Clear error message
   */
  const handleClearError = React.useCallback(() => {
    resetPlugins();
  }, [resetPlugins]);

  // Get filtered plugins and counts
  const filteredPlugins = React.useMemo(
    () => filterPlugins(plugins || [], searchQuery, filterState),
    [plugins, searchQuery, filterState]
  );

  const stateCounts = React.useMemo(
    () => getStateCounts(plugins || []),
    [plugins]
  );

  /**
   * Check if a plugin has an operation in progress
   */
  const isPluginLoading = (pluginId: string): boolean => {
    return currentOperation?.pluginId === pluginId;
  };

  return (
    <div className={cn('flex h-full flex-col', className)}>
      {/* Header */}
      <div className="flex flex-col gap-4 border-b p-4">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-lg font-semibold">Installed Plugins</Label>
            <p className="text-muted-foreground text-sm">
              Manage your installed plugins
            </p>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => fetchPlugins()}
            disabled={isLoading}
            aria-label="Refresh plugins"
          >
            <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
          </Button>
        </div>

        {/* Search and Controls */}
        <div className="flex items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              data-slot="plugin-search"
              placeholder="Search plugins..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-9"
            />
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 rounded-md border p-1">
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon-sm"
              onClick={() => setViewMode('list')}
              aria-label="List view"
            >
              <LayoutList className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon-sm"
              onClick={() => setViewMode('grid')}
              aria-label="Grid view"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Filter Tabs */}
        <Tabs
          value={filterState}
          onValueChange={(value) => setFilterState(value as FilterState)}
        >
          <TabsList className="w-full justify-start">
            <TabsTrigger value="all">All ({stateCounts.all})</TabsTrigger>
            <TabsTrigger value="enabled">
              Enabled ({stateCounts.enabled})
            </TabsTrigger>
            <TabsTrigger value="disabled">
              Disabled ({stateCounts.disabled})
            </TabsTrigger>
            {stateCounts.error > 0 && (
              <TabsTrigger value="error" className="text-destructive">
                Errors ({stateCounts.error})
              </TabsTrigger>
            )}
          </TabsList>
        </Tabs>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-destructive/10 border-destructive/50 mx-4 mt-4 flex items-start gap-3 rounded-lg border p-3">
          <AlertCircle className="text-destructive mt-0.5 h-5 w-5 shrink-0" />
          <div className="flex-1">
            <p className="text-destructive text-sm font-medium">Error</p>
            <p className="text-destructive/80 text-xs">{error.message}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={handleClearError}
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* Content Area */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {/* Loading State */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center gap-3 py-16">
              <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
              <p className="text-muted-foreground text-sm">
                Loading plugins...
              </p>
            </div>
          )}

          {/* Empty State - No Plugins Installed */}
          {!isLoading && (plugins || []).length === 0 && (
            <div className="flex flex-col items-center justify-center gap-4 py-16">
              <Package className="text-muted-foreground h-12 w-12" />
              <div className="text-center">
                <p className="text-sm font-medium">No plugins installed</p>
                <p className="text-muted-foreground mt-1 text-sm">
                  Browse the marketplace to discover and install plugins
                </p>
              </div>
            </div>
          )}

          {/* Empty State - No Matching Plugins */}
          {!isLoading &&
            (plugins || []).length > 0 &&
            filteredPlugins.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-3 py-16">
                <Search className="text-muted-foreground h-12 w-12" />
                <div className="text-center">
                  <p className="text-sm font-medium">No plugins found</p>
                  <p className="text-muted-foreground mt-1 text-sm">
                    Try adjusting your search or filter criteria
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    setFilterState('all');
                  }}
                >
                  Clear filters
                </Button>
              </div>
            )}

          {/* Plugin List/Grid */}
          {!isLoading && filteredPlugins.length > 0 && (
            <div
              className={cn(
                viewMode === 'grid'
                  ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'
                  : 'flex flex-col gap-2'
              )}
            >
              {filteredPlugins.map((plugin) => (
                <PluginCard
                  key={plugin.manifest.id}
                  plugin={plugin}
                  variant="installed"
                  layout={viewMode}
                  isLoading={isPluginLoading(plugin.manifest.id)}
                  onViewDetails={handleViewDetails}
                  onToggleEnabled={handleToggleEnabled}
                  onUninstall={handleUninstall}
                />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Status Bar */}
      {!isLoading && (plugins || []).length > 0 && (
        <div className="text-muted-foreground flex items-center justify-between border-t px-4 py-2 text-xs">
          <span>
            {filteredPlugins.length} of {(plugins || []).length} plugins
            {searchQuery && ` matching "${searchQuery}"`}
            {filterState !== 'all' && ` • ${filterState}`}
          </span>
          <span>
            {stateCounts.enabled} enabled, {stateCounts.disabled} disabled
          </span>
        </div>
      )}

      {/* Plugin Detail View */}
      <PluginDetailView
        open={detailViewOpen}
        onOpenChange={setDetailViewOpen}
        plugin={selectedPlugin}
        variant="installed"
        isLoading={
          selectedPlugin ? isPluginLoading(selectedPlugin.manifest.id) : false
        }
        onToggleEnabled={handleToggleEnabled}
        onUninstall={handleUninstall}
      />
    </div>
  );
}

export default PluginManager;
