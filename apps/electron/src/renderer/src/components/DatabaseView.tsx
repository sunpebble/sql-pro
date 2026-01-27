import type { ViewType } from './ActivityBar';
import { Table } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AIAgentSidebar } from '@/components/agent';
import { Tour } from '@/components/onboarding';
import { cn } from '@/lib/utils';
import { useChangesStore } from '@/stores/changes-store';
import { useConnectionStore } from '@/stores/connection-store';
import { useDataTabsStore } from '@/stores/data-tabs-store';
import { useDialogStore } from '@/stores/dialog-store';
import { useSettingsStore } from '@/stores/settings-store';
import { setActiveView as setGlobalActiveView } from '@/stores/view-context-store';
import { ActivityBar } from './ActivityBar';
import { CompareView } from './CompareView';
import { DashboardView } from './DashboardView';
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
  const { t } = useTranslation('common');

  const connection = getConnection();
  const isQdrant = connection?.databaseType === 'qdrant';

  const activeDataTab = activeConnectionId
    ? getActiveTab(activeConnectionId)
    : undefined;
  const dataTabs = activeConnectionId
    ? tabsByConnection[activeConnectionId]?.tabs || []
    : [];

  useEffect(() => {
    if (activeConnectionId) {
      setDataTabsActiveConnection(activeConnectionId);
    }
  }, [activeConnectionId, setDataTabsActiveConnection]);

  // Sync activeView to global view context store for command palette filtering
  useEffect(() => {
    setGlobalActiveView(activeView);
    return () => setGlobalActiveView(null);
  }, [activeView]);

  const prevActiveDataTabIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!activeDataTab && prevActiveDataTabIdRef.current !== null) {
      prevActiveDataTabIdRef.current = null;
      setSelectedTable(null);
      return;
    }

    if (activeDataTab && activeDataTab.id !== prevActiveDataTabIdRef.current) {
      prevActiveDataTabIdRef.current = activeDataTab.id;
      const activeTableKey = `${activeDataTab.table.schema || 'main'}.${activeDataTab.table.name}`;
      const selectedTableKey = selectedTable
        ? `${selectedTable.schema || 'main'}.${selectedTable.name}`
        : null;

      if (activeTableKey !== selectedTableKey) {
        setSelectedTable(activeDataTab.table);
      }
    }
  }, [activeDataTab, selectedTable, setSelectedTable]);

  const displayTable = activeDataTab?.table || selectedTable;

  const badges: Partial<Record<ViewType, number>> = {};
  if (dataTabs.length > 0) {
    badges.data = dataTabs.length;
  }

  const visibleViews = useMemo(() => {
    const views = new Set<ViewType>();
    if (isQdrant) {
      views.add('vectorSearch');
    }
    return views;
  }, [isQdrant]);

  return (
    <div className="flex h-full flex-col">
      <button
        type="button"
        data-action="toggle-sidebar"
        onClick={toggleSidebar}
        className="sr-only"
        aria-label={t('sidebar.toggleSidebar')}
      />

      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        <ActivityBar
          activeView={activeView}
          onViewChange={setActiveView}
          badges={badges}
          visibleViews={visibleViews}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={toggleSidebar}
        />

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

        <div
          className={cn(
            'relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden',
            'from-background via-background to-muted/30 bg-gradient-to-br'
          )}
        >
          <div className="bg-grid-subtle pointer-events-none absolute inset-0 opacity-20 dark:opacity-15" />
          <div className="noise-overlay pointer-events-none absolute inset-0 opacity-[0.012] dark:opacity-[0.02]" />
          <div className="from-primary/5 pointer-events-none absolute inset-0 bg-gradient-to-br via-transparent to-transparent" />

          {activeView === 'data' && (
            <div className="flex h-full min-h-0 flex-1 flex-col">
              {dataTabs.length > 0 && (
                <DataTabBar
                  schemaDetailsOpen={showSchemaDetails}
                  onToggleSchemaDetails={() =>
                    setShowSchemaDetails(!showSchemaDetails)
                  }
                />
              )}

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

          {activeView === 'query' && <QueryView />}

          {activeView === 'diagram' && <ERDiagram />}

          {activeView === 'compare' && <CompareView />}

          {activeView === 'vectorSearch' && isQdrant && (
            <VectorSearchPanel
              collection={displayTable?.name || ''}
              connectionId={activeConnectionId || undefined}
            />
          )}

          {activeView === 'dashboard' && <DashboardView />}
        </div>

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

      <Tour
        onSwitchTab={(tab) => {
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
