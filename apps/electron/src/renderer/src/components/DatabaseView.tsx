import type { RecentConnection } from '@shared/types';
import { ScrollArea, ScrollBar } from '@sqlpro/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@sqlpro/ui/tabs';
import { ArrowLeftRight, Code, GitCompare, GitFork, Table } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Tour } from '@/components/onboarding';
import { ShortcutKbd } from '@/components/ui/kbd';
import { cn } from '@/lib/utils';
import {
  useChangesStore,
  useConnectionStore,
  useDataTabsStore,
  useSettingsStore,
} from '@/stores';
import { ConnectionTabBar } from './ConnectionTabBar';
import { DataDiffPanel } from './data-diff/DataDiffPanel';
import { DataTabBar } from './data-table';
import { DiffPreview } from './DiffPreview';
import { ERDiagram } from './er-diagram';
import { QueryEditor } from './QueryEditor';
import { ResizablePanel } from './ResizablePanel';
import { SchemaComparisonPanel } from './schema-comparison';
import { SchemaDetailsPanel } from './SchemaDetailsPanel';
import { Sidebar } from './Sidebar';
import { TableView } from './TableView';
import { Toolbar } from './Toolbar';

type TabValue = 'data' | 'query' | 'diagram' | 'compare' | 'dataDiff';

interface DatabaseViewProps {
  onOpenDatabase?: () => void;
  onOpenRecentConnection?: (conn: RecentConnection) => void;
}

export function DatabaseView({
  onOpenDatabase,
  onOpenRecentConnection,
}: DatabaseViewProps) {
  const { selectedTable, activeConnectionId, setSelectedTable } =
    useConnectionStore();
  const { hasChanges } = useChangesStore();
  const {
    getActiveTab,
    tabsByConnection,
    setActiveConnectionId: setDataTabsActiveConnection,
  } = useDataTabsStore();
  const {
    sidebarCollapsed,
    toggleSidebar,
    showSchemaDetails,
    setShowSchemaDetails,
  } = useSettingsStore();

  const [activeTab, setActiveTab] = useState<TabValue>('data');
  const [showChangesPanel, setShowChangesPanel] = useState(false);

  // Get the active data tab for current connection
  const activeDataTab = activeConnectionId
    ? getActiveTab(activeConnectionId)
    : undefined;
  const dataTabs = activeConnectionId
    ? tabsByConnection[activeConnectionId]?.tabs || []
    : [];

  // Sync data tabs store with connection
  useEffect(() => {
    if (activeConnectionId) {
      setDataTabsActiveConnection(activeConnectionId);
    }
  }, [activeConnectionId, setDataTabsActiveConnection]);

  // When active data tab changes (user clicks a tab), sync the selected table for schema details panel
  const prevActiveDataTabIdRef = useRef<string | null>(null);
  useEffect(() => {
    // When the last tab is closed, clear selectedTable
    if (!activeDataTab && prevActiveDataTabIdRef.current !== null) {
      prevActiveDataTabIdRef.current = null;
      setSelectedTable(null);
      return;
    }

    if (activeDataTab && activeDataTab.id !== prevActiveDataTabIdRef.current) {
      prevActiveDataTabIdRef.current = activeDataTab.id;
      // Update selectedTable to match the active tab (for schema panel)
      const activeTableKey = `${activeDataTab.table.schema || 'main'}.${activeDataTab.table.name}`;
      const selectedTableKey = selectedTable
        ? `${selectedTable.schema || 'main'}.${selectedTable.name}`
        : null;

      if (activeTableKey !== selectedTableKey) {
        setSelectedTable(activeDataTab.table);
      }
    }
  }, [activeDataTab, selectedTable, setSelectedTable]);

  // The table to display - from active data tab or selected table
  const displayTable = activeDataTab?.table || selectedTable;

  // Handler to scroll sidebar into view (used by DataTabBar's + button)
  const handleOpenSidebar = useCallback(() => {
    // Focus the sidebar search or just ensure data tab is active
    setActiveTab('data');
    // Also ensure sidebar is visible
    if (sidebarCollapsed) {
      toggleSidebar();
    }
  }, [sidebarCollapsed, toggleSidebar]);

  return (
    <div className="flex h-full flex-col">
      {/* Hidden button for keyboard shortcut to toggle sidebar */}
      <button
        data-action="toggle-sidebar"
        onClick={toggleSidebar}
        className="sr-only"
        aria-label="Toggle Sidebar"
      />

      {/* Connection Tab Bar */}
      <ConnectionTabBar />

      {/* Toolbar */}
      <Toolbar onOpenChanges={() => setShowChangesPanel(true)} />

      {/* Main Content */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Sidebar - Resizable */}
        {!sidebarCollapsed && (
          <ResizablePanel
            side="left"
            defaultWidth={320}
            minWidth={240}
            maxWidth={480}
            storageKey="sidebar"
          >
            <Sidebar
              onOpenDatabase={onOpenDatabase}
              onOpenRecentConnection={onOpenRecentConnection}
              onSwitchToQuery={() => setActiveTab('query')}
            />
          </ResizablePanel>
        )}

        {/* Content Area with Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(v) => v && setActiveTab(v as TabValue)}
          className="flex min-w-0 flex-1 flex-col overflow-hidden"
        >
          {/* Tab List */}
          <ScrollArea orientation="horizontal" className="h-10 w-full shrink-0">
            <TabsList variant="line" className="flex h-10 border-b px-2">
              <TabsTrigger
                value="data"
                data-tab="data"
                data-tour-target="data-browser-tab"
                className={cn(
                  'flex h-10 items-center gap-2 border-b-2 px-4 text-sm font-medium transition-colors',
                  activeTab === 'data'
                    ? 'border-primary text-foreground'
                    : 'text-muted-foreground hover:text-foreground border-transparent'
                )}
              >
                <Table className="h-4 w-4" />
                Data Browser
                {dataTabs.length > 0 && (
                  <span className="bg-muted text-muted-foreground rounded-full px-1.5 py-0.5 text-[10px] font-normal">
                    {dataTabs.length}
                  </span>
                )}
                <ShortcutKbd
                  action="nav.data-browser"
                  className="ml-1 hidden sm:inline-flex"
                />
              </TabsTrigger>
              <TabsTrigger
                value="query"
                data-tab="query"
                data-tour-target="query-editor-tab"
                className={cn(
                  'flex h-10 items-center gap-2 border-b-2 px-4 text-sm font-medium transition-colors',
                  activeTab === 'query'
                    ? 'border-primary text-foreground'
                    : 'text-muted-foreground hover:text-foreground border-transparent'
                )}
              >
                <Code className="h-4 w-4" />
                SQL Query
                <ShortcutKbd
                  action="nav.query-editor"
                  className="ml-1 hidden sm:inline-flex"
                />
              </TabsTrigger>
              <TabsTrigger
                value="diagram"
                data-tab="diagram"
                data-tour-target="diagram-tab"
                className={cn(
                  'flex h-10 items-center gap-2 border-b-2 px-4 text-sm font-medium transition-colors',
                  activeTab === 'diagram'
                    ? 'border-primary text-foreground'
                    : 'text-muted-foreground hover:text-foreground border-transparent'
                )}
              >
                <GitFork className="h-4 w-4" />
                ER Diagram
                <ShortcutKbd
                  action="nav.er-diagram"
                  className="ml-1 hidden sm:inline-flex"
                />
              </TabsTrigger>
              <TabsTrigger
                value="compare"
                data-tab="compare"
                data-tour-target="schema-compare-tab"
                className={cn(
                  'flex h-10 items-center gap-2 border-b-2 px-4 text-sm font-medium transition-colors',
                  activeTab === 'compare'
                    ? 'border-primary text-foreground'
                    : 'text-muted-foreground hover:text-foreground border-transparent'
                )}
              >
                <GitCompare className="h-4 w-4" />
                Schema Compare
                <ShortcutKbd
                  action="nav.schema-compare"
                  className="ml-1 hidden sm:inline-flex"
                />
              </TabsTrigger>
              <TabsTrigger
                value="dataDiff"
                data-tab="dataDiff"
                data-tour-target="data-diff-tab"
                className={cn(
                  'flex h-10 items-center gap-2 border-b-2 px-4 text-sm font-medium transition-colors',
                  activeTab === 'dataDiff'
                    ? 'border-primary text-foreground'
                    : 'text-muted-foreground hover:text-foreground border-transparent'
                )}
              >
                <ArrowLeftRight className="h-4 w-4" />
                Data Diff
                <ShortcutKbd
                  action="nav.data-diff"
                  className="ml-1 hidden sm:inline-flex"
                />
              </TabsTrigger>
            </TabsList>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          {/* Tab Content */}
          <TabsContent
            value="data"
            className="flex h-full min-h-0 flex-1 flex-col data-[state=inactive]:hidden"
          >
            {/* Data Browser Tab Bar - shows opened table tabs */}
            {dataTabs.length > 0 && (
              <DataTabBar onOpenSidebar={handleOpenSidebar} />
            )}

            {/* Table View with optional Schema Details Panel */}
            <div className="flex min-h-0 flex-1 overflow-hidden">
              <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
                {activeDataTab ? (
                  <TableView
                    key={activeDataTab.id}
                    tableOverride={activeDataTab.table}
                  />
                ) : displayTable ? (
                  <TableView />
                ) : (
                  <div className="bg-grid-dot text-muted-foreground flex h-full flex-1 items-center justify-center">
                    <p>Select a table from the sidebar to view its data</p>
                  </div>
                )}
              </div>

              {/* Schema Details Panel - inside Data tab */}
              {showSchemaDetails && (
                <ResizablePanel
                  side="right"
                  defaultWidth={400}
                  minWidth={320}
                  maxWidth={600}
                  storageKey="schema-details-panel"
                >
                  <SchemaDetailsPanel
                    table={displayTable}
                    onClose={() => setShowSchemaDetails(false)}
                  />
                </ResizablePanel>
              )}
            </div>
          </TabsContent>

          <TabsContent
            value="query"
            className="h-full min-h-0 flex-1 data-[state=inactive]:hidden"
          >
            <QueryEditor />
          </TabsContent>

          <TabsContent
            value="diagram"
            className="h-full min-h-0 flex-1 data-[state=inactive]:hidden"
          >
            <ERDiagram />
          </TabsContent>

          <TabsContent
            value="compare"
            className="h-full min-h-0 flex-1 data-[state=inactive]:hidden"
          >
            <SchemaComparisonPanel />
          </TabsContent>

          <TabsContent
            value="dataDiff"
            className="h-full min-h-0 flex-1 data-[state=inactive]:hidden"
          >
            <DataDiffPanel />
          </TabsContent>
        </Tabs>

        {/* Changes Panel - Resizable */}
        {showChangesPanel && hasChanges() && (
          <ResizablePanel
            side="right"
            defaultWidth={384}
            minWidth={280}
            maxWidth={600}
            storageKey="changes-panel"
          >
            <DiffPreview onClose={() => setShowChangesPanel(false)} />
          </ResizablePanel>
        )}
      </div>

      {/* Onboarding Tour */}
      <Tour
        onSwitchTab={(tab) => {
          // Map tour tab names to DatabaseView tab values
          const tabMap: Record<string, TabValue> = {
            browser: 'data',
            query: 'query',
            diagram: 'diagram',
            compare: 'compare',
            dataDiff: 'dataDiff',
          };
          setActiveTab(tabMap[tab] || 'data');
        }}
      />
    </div>
  );
}
