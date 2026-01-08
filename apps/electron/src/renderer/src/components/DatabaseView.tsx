import type { ViewType } from './ActivityBar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Tour } from '@/components/onboarding';
import {
  useChangesStore,
  useConnectionStore,
  useDataTabsStore,
  useDialogStore,
  useSettingsStore,
} from '@/stores';
import { ActivityBar } from './ActivityBar';
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

export function DatabaseView() {
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
  const { changesPanelOpen: showChangesPanel, closeChangesPanel } =
    useDialogStore();

  const [activeView, setActiveView] = useState<ViewType>('data');

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
    // Focus the sidebar search or just ensure data view is active
    setActiveView('data');
    // Also ensure sidebar is visible
    if (sidebarCollapsed) {
      toggleSidebar();
    }
  }, [sidebarCollapsed, toggleSidebar]);

  // Badge counts for activity bar
  const badges: Partial<Record<ViewType, number>> = {};
  if (dataTabs.length > 0) {
    badges.data = dataTabs.length;
  }

  return (
    <div className="flex h-full flex-col">
      {/* Hidden button for keyboard shortcut to toggle sidebar */}
      <button
        data-action="toggle-sidebar"
        onClick={toggleSidebar}
        className="sr-only"
        aria-label="Toggle Sidebar"
      />

      {/* Main Content with Activity Bar */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Activity Bar - VSCode style */}
        <ActivityBar
          activeView={activeView}
          onViewChange={setActiveView}
          badges={badges}
        />

        {/* Sidebar - Resizable */}
        {!sidebarCollapsed && (
          <ResizablePanel
            side="left"
            defaultWidth={320}
            minWidth={240}
            maxWidth={480}
            storageKey="sidebar"
          >
            <Sidebar onSwitchToQuery={() => setActiveView('query')} />
          </ResizablePanel>
        )}

        {/* Content Area - Flat conditional rendering */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          {/* Data Browser View */}
          {activeView === 'data' && (
            <div className="flex h-full min-h-0 flex-1 flex-col">
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

                {/* Schema Details Panel - inside Data view */}
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
            </div>
          )}

          {/* SQL Query View */}
          {activeView === 'query' && <QueryEditor />}

          {/* ER Diagram View */}
          {activeView === 'diagram' && <ERDiagram />}

          {/* Schema Compare View */}
          {activeView === 'compare' && <SchemaComparisonPanel />}

          {/* Data Diff View */}
          {activeView === 'dataDiff' && <DataDiffPanel />}
        </div>

        {/* Changes Panel - Resizable */}
        {showChangesPanel && hasChanges() && (
          <ResizablePanel
            side="right"
            defaultWidth={384}
            minWidth={280}
            maxWidth={600}
            storageKey="changes-panel"
          >
            <DiffPreview onClose={closeChangesPanel} />
          </ResizablePanel>
        )}
      </div>

      {/* Onboarding Tour */}
      <Tour
        onSwitchTab={(tab) => {
          // Map tour tab names to DatabaseView view values
          const viewMap: Record<string, ViewType> = {
            browser: 'data',
            query: 'query',
            diagram: 'diagram',
            compare: 'compare',
            dataDiff: 'dataDiff',
          };
          setActiveView(viewMap[tab] || 'data');
        }}
      />
    </div>
  );
}
