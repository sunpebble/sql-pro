import type { ViewType } from './ActivityBar';
import { Code, GitCompare, GitFork, Search, Table } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AIAgentSidebar } from '@/components/agent';
import { Tour } from '@/components/onboarding';
// Direct imports to avoid barrel file overhead (bundle-barrel-imports)
import { useChangesStore } from '@/stores/changes-store';
import { useConnectionStore } from '@/stores/connection-store';
import { useDataTabsStore } from '@/stores/data-tabs-store';
import { useDialogStore } from '@/stores/dialog-store';
import { useSettingsStore } from '@/stores/settings-store';
import { ActivityBar } from './ActivityBar';
import { CompareView } from './CompareView';
import { ContentHeader } from './ContentHeader';
import { DataTabBar } from './data-table';
import { DiffPreview } from './DiffPreview';
import { EmptyView } from './EmptyView';
import { ERDiagram } from './er-diagram';
import { QueryView } from './QueryView';
import { ResizablePanel } from './ResizablePanel';
import { SchemaDetailsPanel } from './SchemaDetailsPanel';
import { Sidebar } from './Sidebar';
import { TableView } from './TableView';
import { VectorSearchPanel } from './vector-search';

// View configuration for consistent titles and icons
const VIEW_CONFIG: Record<
  ViewType,
  { titleKey: string; icon: React.ElementType }
> = {
  data: { titleKey: 'navigation.dataBrowser', icon: Table },
  query: { titleKey: 'navigation.query', icon: Code },
  diagram: { titleKey: 'navigation.erDiagram', icon: GitFork },
  compare: { titleKey: 'navigation.compare', icon: GitCompare },
  vectorSearch: { titleKey: 'navigation.vectorSearch', icon: Search },
};

export function DatabaseView() {
  const { selectedTable, activeConnectionId, setSelectedTable, getConnection } =
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
  const {
    changesPanelOpen: showChangesPanel,
    closeChangesPanel,
    agentSidebarOpen,
    agentConnectionId,
    closeAgentSidebar,
  } = useDialogStore();

  const [activeView, setActiveView] = useState<ViewType>('data');
  const [queryMode, setQueryMode] = useState<'editor' | 'builder'>('editor');
  const { t } = useTranslation('common');

  // Get the current connection to check database type
  const connection = getConnection();
  const isQdrant = connection?.databaseType === 'qdrant';

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

  // Badge counts for activity bar
  const badges: Partial<Record<ViewType, number>> = {};
  if (dataTabs.length > 0) {
    badges.data = dataTabs.length;
  }

  // Compute visible views for activity bar (conditional items)
  const visibleViews = useMemo(() => {
    const views = new Set<ViewType>();
    // Show vector search only for Qdrant connections
    if (isQdrant) {
      views.add('vectorSearch');
    }
    return views;
  }, [isQdrant]);

  // Get current view title
  const viewConfig = VIEW_CONFIG[activeView];
  const viewTitle = t(viewConfig.titleKey);
  const viewSubtitle =
    activeView === 'data' && displayTable
      ? `${displayTable.schema ? `${displayTable.schema}.` : ''}${displayTable.name}`
      : undefined;

  return (
    <div className="flex h-full flex-col">
      {/* Hidden button for keyboard shortcut to toggle sidebar */}
      <button
        data-action="toggle-sidebar"
        onClick={toggleSidebar}
        className="sr-only"
        aria-label={t('sidebar.toggleSidebar')}
      />

      {/* Main Content with Activity Bar */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Activity Bar - Glass gold style */}
        <ActivityBar
          activeView={activeView}
          onViewChange={setActiveView}
          badges={badges}
          visibleViews={visibleViews}
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
            <Sidebar
              onSwitchToQuery={() => setActiveView('query')}
              onSwitchToData={() => setActiveView('data')}
            />
          </ResizablePanel>
        )}

        {/* Content Area with unified header */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          {/* Unified Content Header */}
          <ContentHeader
            activeView={activeView}
            title={viewTitle}
            subtitle={viewSubtitle}
            sidebarCollapsed={sidebarCollapsed}
            onToggleSidebar={toggleSidebar}
            schemaDetailsOpen={showSchemaDetails}
            onToggleSchemaDetails={() =>
              setShowSchemaDetails(!showSchemaDetails)
            }
            showSchemaDetailsToggle={activeView === 'data' && !!displayTable}
            queryMode={activeView === 'query' ? queryMode : undefined}
            onQueryModeChange={
              activeView === 'query' ? setQueryMode : undefined
            }
          />

          {/* Data Browser View */}
          {activeView === 'data' && (
            <div className="flex h-full min-h-0 flex-1 flex-col">
              {/* Data Browser Tab Bar - shows opened table tabs */}
              {dataTabs.length > 0 && <DataTabBar />}

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
                    <EmptyView
                      icon={Table}
                      title={t('database.noTableSelected', {
                        defaultValue: 'No Table Selected',
                      })}
                      description={t('database.selectTable', {
                        defaultValue:
                          'Select a table from the sidebar to view its data',
                      })}
                      action={
                        sidebarCollapsed
                          ? {
                              label: t('sidebar.show', {
                                defaultValue: 'Show Sidebar',
                              }),
                              onClick: toggleSidebar,
                            }
                          : undefined
                      }
                    />
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

          {/* SQL Query View (includes Query Builder) */}
          {activeView === 'query' && <QueryView mode={queryMode} />}

          {/* ER Diagram View */}
          {activeView === 'diagram' && <ERDiagram />}

          {/* Schema Compare View */}
          {activeView === 'compare' && <CompareView />}

          {/* Vector Search View (Qdrant only) */}
          {activeView === 'vectorSearch' && isQdrant && (
            <VectorSearchPanel
              collection={displayTable?.name || ''}
              connectionId={activeConnectionId || undefined}
            />
          )}
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

        {/* AI Agent Sidebar - Resizable */}
        {agentSidebarOpen && agentConnectionId && (
          <ResizablePanel
            side="right"
            defaultWidth={380}
            minWidth={320}
            maxWidth={520}
            storageKey="agent-sidebar"
          >
            <AIAgentSidebar
              connectionId={agentConnectionId}
              onClose={closeAgentSidebar}
            />
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
          };
          setActiveView(viewMap[tab] || 'data');
        }}
      />
    </div>
  );
}
