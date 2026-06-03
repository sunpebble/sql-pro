import type { Command } from '@/stores/command-palette-store';
import {
  BarChart3,
  Bot,
  Code,
  FileDown,
  GitCompare,
  GitFork,
  Keyboard,
  Monitor,
  PanelLeft,
  PanelLeftClose,
  Plus,
  RefreshCw,
  Save,
  Search,
  Settings,
  SkipBack,
  SkipForward,
  Sun,
  Table,
  Trash2,
  Undo2,
  X,
} from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { sqlPro } from '@/lib/api';
import { invalidateTableData, refreshSchema } from '@/lib/query-refresh';
// Direct imports to avoid barrel file overhead (bundle-barrel-imports)
import { useChangesStore } from '@/stores/changes-store';
import { useCommandPaletteStore } from '@/stores/command-palette-store';
import { useCompareViewStore } from '@/stores/compare-view-store';
import { useConnectionStore } from '@/stores/connection-store';
import { useConnectionSwitcherStore } from '@/stores/connection-switcher-store';
import { useDataTabsStore } from '@/stores/data-tabs-store';
import { useDialogStore } from '@/stores/dialog-store';
import {
  formatShortcutBinding,
  matchesBinding,
  useKeyboardShortcutsStore,
} from '@/stores/keyboard-shortcuts-store';
import { useOnboardingStore } from '@/stores/onboarding-store';
import { useSettingsStore } from '@/stores/settings-store';
import { useTableDataStore } from '@/stores/table-data-store';
import { useThemeStore } from '@/stores/theme-store';

/**
 * Hook that registers all application commands and sets up the global keyboard shortcut.
 * Should be called once at the app root level.
 */
export function useCommands() {
  const toggle = useCommandPaletteStore((s) => s.toggle);
  const registerCommands = useCommandPaletteStore((s) => s.registerCommands);
  const unregisterCommand = useCommandPaletteStore((s) => s.unregisterCommand);
  const openConnectionSwitcher = useConnectionSwitcherStore((s) => s.open);
  const { t } = useTranslation('common');

  // Use refs to store latest values for use in command actions
  // This prevents re-registering commands when these values change
  // Initialize refs as null and populate them in useEffect to avoid calling
  // getState() during render, which can trigger React's "getSnapshot should be cached" warning
  const themeStoreRef = useRef<ReturnType<
    typeof useThemeStore.getState
  > | null>(null);
  const connectionStoreRef = useRef<ReturnType<
    typeof useConnectionStore.getState
  > | null>(null);
  const changesStoreRef = useRef<ReturnType<
    typeof useChangesStore.getState
  > | null>(null);
  const tableDataStoreRef = useRef<ReturnType<
    typeof useTableDataStore.getState
  > | null>(null);
  const settingsStoreRef = useRef<ReturnType<
    typeof useSettingsStore.getState
  > | null>(null);
  const shortcutsStoreRef = useRef<ReturnType<
    typeof useKeyboardShortcutsStore.getState
  > | null>(null);
  const onboardingStoreRef = useRef<ReturnType<
    typeof useOnboardingStore.getState
  > | null>(null);
  const dataTabsStoreRef = useRef<ReturnType<
    typeof useDataTabsStore.getState
  > | null>(null);
  const dialogStoreRef = useRef<ReturnType<
    typeof useDialogStore.getState
  > | null>(null);

  // Keep refs up to date - initialize on mount and subscribe to updates
  useEffect(() => {
    // Initialize refs with current state (called outside of render, in useEffect)
    themeStoreRef.current = useThemeStore.getState();
    connectionStoreRef.current = useConnectionStore.getState();
    changesStoreRef.current = useChangesStore.getState();
    tableDataStoreRef.current = useTableDataStore.getState();
    settingsStoreRef.current = useSettingsStore.getState();
    shortcutsStoreRef.current = useKeyboardShortcutsStore.getState();
    onboardingStoreRef.current = useOnboardingStore.getState();
    dataTabsStoreRef.current = useDataTabsStore.getState();
    dialogStoreRef.current = useDialogStore.getState();

    // Subscribe to future updates
    const unsubTheme = useThemeStore.subscribe((s) => {
      themeStoreRef.current = s;
    });
    const unsubConnection = useConnectionStore.subscribe((s) => {
      connectionStoreRef.current = s;
    });
    const unsubChanges = useChangesStore.subscribe((s) => {
      changesStoreRef.current = s;
    });
    const unsubTableData = useTableDataStore.subscribe((s) => {
      tableDataStoreRef.current = s;
    });
    const unsubSettings = useSettingsStore.subscribe((s) => {
      settingsStoreRef.current = s;
    });
    const unsubShortcuts = useKeyboardShortcutsStore.subscribe((s) => {
      shortcutsStoreRef.current = s;
    });
    const unsubOnboarding = useOnboardingStore.subscribe((s) => {
      onboardingStoreRef.current = s;
    });
    const unsubDataTabs = useDataTabsStore.subscribe((s) => {
      dataTabsStoreRef.current = s;
    });
    const unsubDialog = useDialogStore.subscribe((s) => {
      dialogStoreRef.current = s;
    });

    return () => {
      unsubTheme();
      unsubConnection();
      unsubChanges();
      unsubTableData();
      unsubSettings();
      unsubShortcuts();
      unsubOnboarding();
      unsubDataTabs();
      unsubDialog();
    };
  }, []);

  // Global keyboard shortcuts - now using customizable shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Safety check: ensure refs are initialized
      if (
        !shortcutsStoreRef.current ||
        !connectionStoreRef.current ||
        !settingsStoreRef.current
      ) {
        return;
      }
      const { getShortcut } = shortcutsStoreRef.current;
      const { activeConnectionId } = connectionStoreRef.current;

      // Skip shortcuts when typing in inputs (except for specific shortcuts)
      const target = e.target as HTMLElement;
      const isInputField =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      // When the Compare view is active, it owns Cmd+R / Cmd+F via its own
      // panel-level listeners (reset filters / focus diff search). Let the
      // global capture-phase handlers bail without acting or preventing the
      // default so those bubble-phase panel listeners win. Detected via the
      // same [data-tab][data-active] mechanism used by view-scoped commands.
      const isCompareViewActive = !!document.querySelector(
        '[data-tab="compare"][data-active]'
      );

      // Command palette shortcut - works everywhere
      const commandPaletteBinding = getShortcut('action.command-palette');
      if (matchesBinding(e, commandPaletteBinding)) {
        e.preventDefault();
        toggle();
        return;
      }

      // Focus search shortcut - works everywhere except the Compare view,
      // where the panel's own focus-diff-search handler owns this binding.
      const focusSearchBinding = getShortcut('action.focus-search');
      if (matchesBinding(e, focusSearchBinding) && !isCompareViewActive) {
        e.preventDefault();
        const searchInput = document.querySelector<HTMLInputElement>(
          'input[placeholder*="Search"]'
        );
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
        return;
      }

      // Open AI Agent shortcut (Cmd+L) - works everywhere
      const openAgentBinding = getShortcut('action.open-agent');
      if (matchesBinding(e, openAgentBinding)) {
        e.preventDefault();
        const { activeConnectionId } = connectionStoreRef.current!;
        if (activeConnectionId && dialogStoreRef.current) {
          dialogStoreRef.current.toggleAgentSidebar(activeConnectionId);
        }
        return;
      }

      // Toggle SQL Log shortcut (Cmd+J) - works everywhere
      const toggleSqlLogBinding = getShortcut('action.toggle-sql-log');
      if (matchesBinding(e, toggleSqlLogBinding)) {
        e.preventDefault();
        import('@/stores/sql-log-store').then(({ useSqlLogStore }) => {
          useSqlLogStore.getState().toggleVisible();
        });
        return;
      }

      // New connection shortcut (Cmd+T) - works everywhere
      // Opens the connection switcher to select a connection for a new tab
      const newConnectionBinding = getShortcut('conn.new-connection');
      if (matchesBinding(e, newConnectionBinding)) {
        e.preventDefault();
        e.stopPropagation();
        // Open connection switcher to select a connection
        openConnectionSwitcher();
        return;
      }

      // View navigation shortcuts - work everywhere including in Monaco editor
      // These use Cmd+Ctrl+1-5 which don't conflict with editor shortcuts
      const dataBrowserBinding = getShortcut('nav.data-browser');
      if (matchesBinding(e, dataBrowserBinding)) {
        e.preventDefault();
        document.querySelector<HTMLButtonElement>('[data-tab="data"]')?.click();
        return;
      }

      const queryEditorBinding = getShortcut('nav.query-editor');
      if (matchesBinding(e, queryEditorBinding)) {
        e.preventDefault();
        document
          .querySelector<HTMLButtonElement>('[data-tab="query"]')
          ?.click();
        return;
      }

      // ER Diagram shortcut
      const erDiagramBinding = getShortcut('nav.er-diagram');
      if (matchesBinding(e, erDiagramBinding)) {
        e.preventDefault();
        document
          .querySelector<HTMLButtonElement>('[data-tab="diagram"]')
          ?.click();
        return;
      }

      // Schema Compare shortcut - opens the Compare view on its 'schema' tab.
      const schemaCompareBinding = getShortcut('nav.schema-compare');
      if (matchesBinding(e, schemaCompareBinding)) {
        e.preventDefault();
        useCompareViewStore.getState().setActiveTab('schema');
        document
          .querySelector<HTMLButtonElement>('[data-tab="compare"]')
          ?.click();
        return;
      }

      // Data Diff shortcut - Data Diff lives as the 'data' inner tab of the
      // Compare view, so request that tab then open the Compare view.
      const dataDiffBinding = getShortcut('nav.data-diff');
      if (matchesBinding(e, dataDiffBinding)) {
        e.preventDefault();
        useCompareViewStore.getState().setActiveTab('data');
        document
          .querySelector<HTMLButtonElement>('[data-tab="compare"]')
          ?.click();
        return;
      }

      // Dashboard shortcut
      const dashboardBinding = getShortcut('nav.dashboard');
      if (matchesBinding(e, dashboardBinding)) {
        e.preventDefault();
        document
          .querySelector<HTMLButtonElement>('[data-tab="dashboard"]')
          ?.click();
        return;
      }

      // Toggle sidebar shortcut - works everywhere
      const toggleSidebarBinding = getShortcut('nav.toggle-sidebar');
      if (matchesBinding(e, toggleSidebarBinding)) {
        e.preventDefault();
        const sidebarToggle = document.querySelector<HTMLButtonElement>(
          'button[data-action="toggle-sidebar"]'
        );
        sidebarToggle?.click();
        return;
      }

      // Refresh table shortcut - works everywhere (prevent browser refresh)
      // except the Compare view, where the panel's own reset-filters handler
      // owns this binding.
      const refreshTableBinding = getShortcut('action.refresh-table');
      if (matchesBinding(e, refreshTableBinding) && !isCompareViewActive) {
        e.preventDefault();
        if (activeConnectionId) {
          invalidateTableData(activeConnectionId);
        }
        return;
      }

      // Refresh Schema shortcut - needs to work everywhere (prevent browser hard refresh)
      const refreshSchemaBinding = getShortcut('action.refresh-schema');
      if (matchesBinding(e, refreshSchemaBinding)) {
        e.preventDefault();
        e.stopPropagation();
        const { activeConnectionId } = connectionStoreRef.current!;
        if (activeConnectionId) {
          refreshSchema(activeConnectionId, t);
        }
        return;
      }

      // Skip other shortcuts if typing in input
      if (isInputField) return;

      // Toggle schema details panel shortcut (only works in Data Browser view)
      const toggleSchemaDetailsBinding = getShortcut(
        'view.toggle-schema-details'
      );
      // Check if we're in the Data Browser tab (base-ui uses data-active attribute)
      // or data-state="active" attribute
      const dataTab = document.querySelector<HTMLButtonElement>(
        '[data-tab="data"][data-active]'
      );
      const dataTabStateActive = document.querySelector<HTMLButtonElement>(
        '[data-tab="data"][data-state="active"]'
      );
      if (
        matchesBinding(e, toggleSchemaDetailsBinding) &&
        (dataTab || dataTabStateActive)
      ) {
        e.preventDefault();
        settingsStoreRef.current.toggleSchemaDetails();
        return;
      }

      // Data view shortcut (only works in Data Browser view)
      const dataViewBinding = getShortcut('view.data-view');
      if (
        matchesBinding(e, dataViewBinding) &&
        (dataTab || dataTabStateActive)
      ) {
        e.preventDefault();
        const dataViewButton = document.querySelector<HTMLButtonElement>(
          'button[data-action="view-data"]'
        );
        dataViewButton?.click();
        return;
      }

      // Gallery view shortcut (only works in Data Browser view)
      const galleryViewBinding = getShortcut('view.gallery-view');
      if (
        matchesBinding(e, galleryViewBinding) &&
        (dataTab || dataTabStateActive)
      ) {
        e.preventDefault();
        const galleryViewButton = document.querySelector<HTMLButtonElement>(
          'button[data-action="view-gallery"]'
        );
        galleryViewButton?.click();
        return;
      }

      // Focus sidebar shortcut (Cmd+0)
      const focusSidebarBinding = getShortcut('view.focus-sidebar');
      if (matchesBinding(e, focusSidebarBinding)) {
        e.preventDefault();
        const sidebar = document.querySelector<HTMLElement>(
          '[data-tour-target="sidebar"]'
        );
        sidebar?.focus();
        return;
      }

      // Focus data table shortcut (Escape - when sidebar is focused)
      const focusDataTableBinding = getShortcut('view.focus-data-table');
      if (matchesBinding(e, focusDataTableBinding)) {
        // Only handle if sidebar is currently focused
        const sidebar = document.querySelector<HTMLElement>(
          '[data-tour-target="sidebar"]'
        );
        if (
          document.activeElement === sidebar ||
          sidebar?.contains(document.activeElement)
        ) {
          e.preventDefault();
          // Find and focus the data table viewport
          const dataTableViewport = document.querySelector<HTMLElement>(
            '[data-component="data-table"] [data-slot="scroll-area-viewport"]'
          );
          dataTableViewport?.focus();
          return;
        }
      }

      // Save changes shortcut
      const saveChangesBinding = getShortcut('action.save-changes');
      if (matchesBinding(e, saveChangesBinding)) {
        e.preventDefault();
        const saveButton = document.querySelector<HTMLButtonElement>(
          'button[data-action="save-changes"]'
        );
        saveButton?.click();
        return;
      }

      // Discard changes shortcut
      const discardChangesBinding = getShortcut('action.discard-changes');
      if (matchesBinding(e, discardChangesBinding)) {
        e.preventDefault();
        const discardButton = document.querySelector<HTMLButtonElement>(
          'button[data-action="discard-changes"]'
        );
        discardButton?.click();
        return;
      }

      // Add row shortcut (Cmd+N)
      // When no connection exists, create a new window instead
      const addRowBinding = getShortcut('action.add-row');
      if (matchesBinding(e, addRowBinding)) {
        e.preventDefault();
        const connectionStore = connectionStoreRef.current;
        if (!connectionStore?.activeConnectionId) {
          // No connection, create new window
          sqlPro.window.create().catch(console.error);
          return;
        }
        const addRowButton = document.querySelector<HTMLButtonElement>(
          'button[data-action="add-row"]'
        );
        addRowButton?.click();
        return;
      }

      // Delete row shortcut
      const deleteRowBinding = getShortcut('action.delete-row');
      if (matchesBinding(e, deleteRowBinding)) {
        e.preventDefault();
        const deleteRowButton = document.querySelector<HTMLButtonElement>(
          'button[data-action="delete-row"]'
        );
        deleteRowButton?.click();
        return;
      }

      // Export data shortcut
      const exportDataBinding = getShortcut('action.export-data');
      if (matchesBinding(e, exportDataBinding)) {
        e.preventDefault();
        const exportButton = document.querySelector<HTMLButtonElement>(
          'button[data-action="export-data"]'
        );
        exportButton?.click();
        return;
      }

      // Next connection shortcut (Cmd+Tab)
      const nextConnectionBinding = getShortcut('conn.next-connection');
      if (matchesBinding(e, nextConnectionBinding)) {
        e.preventDefault();
        const { connectionTabOrder, activeConnectionId, setActiveConnection } =
          connectionStoreRef.current;
        if (connectionTabOrder.length > 1 && activeConnectionId) {
          const currentIndex = connectionTabOrder.indexOf(activeConnectionId);
          const nextIndex = (currentIndex + 1) % connectionTabOrder.length;
          setActiveConnection(connectionTabOrder[nextIndex]);
        }
        return;
      }

      // Previous connection shortcut (Cmd+Shift+Tab)
      const prevConnectionBinding = getShortcut('conn.prev-connection');
      if (matchesBinding(e, prevConnectionBinding)) {
        e.preventDefault();
        const { connectionTabOrder, activeConnectionId, setActiveConnection } =
          connectionStoreRef.current;
        if (connectionTabOrder.length > 1 && activeConnectionId) {
          const currentIndex = connectionTabOrder.indexOf(activeConnectionId);
          const prevIndex =
            (currentIndex - 1 + connectionTabOrder.length) %
            connectionTabOrder.length;
          setActiveConnection(connectionTabOrder[prevIndex]);
        }
      }

      // Onboarding shortcut - skip if not in onboarding tour
      const onboardingSkipBinding = getShortcut('onboarding.skip');
      if (
        matchesBinding(e, onboardingSkipBinding) &&
        onboardingStoreRef.current?.currentStep !== null
      ) {
        e.preventDefault();
        onboardingStoreRef.current!.skip();
        return;
      }

      // Onboarding shortcut - skip if not in onboarding tour
      const onboardingNextBinding = getShortcut('onboarding.next');
      if (
        matchesBinding(e, onboardingNextBinding) &&
        onboardingStoreRef.current?.currentStep !== null
      ) {
        e.preventDefault();
        onboardingStoreRef.current!.next();
        return;
      }

      // Open Settings shortcut (Cmd+,)
      const openSettingsBinding = getShortcut('settings.open');
      if (matchesBinding(e, openSettingsBinding)) {
        e.preventDefault();
        const settingsButton = document.querySelector<HTMLButtonElement>(
          'button[data-action="open-settings"]'
        );
        settingsButton?.click();
        return;
      }

      // Toggle History shortcut
      const toggleHistoryBinding = getShortcut('view.toggle-history');
      if (matchesBinding(e, toggleHistoryBinding)) {
        e.preventDefault();
        const historyButton = document.querySelector<HTMLButtonElement>(
          'button[data-action="toggle-history"]'
        );
        historyButton?.click();
        return;
      }

      // Open Database shortcut
      const openDatabaseBinding = getShortcut('action.open-database');
      if (matchesBinding(e, openDatabaseBinding)) {
        e.preventDefault();
        const openDbButton = document.querySelector<HTMLButtonElement>(
          'button[data-action="open-database"]'
        );
        openDbButton?.click();
        return;
      }

      // Close Database shortcut (Cmd+W)
      // Priority: close active data tab first, then close connection if no tabs
      const closeDatabaseBinding = getShortcut('action.close-database');
      if (matchesBinding(e, closeDatabaseBinding)) {
        e.preventDefault();

        const connectionStore = connectionStoreRef.current;
        const dataTabsStore = dataTabsStoreRef.current;

        if (!connectionStore || !dataTabsStore) return;

        const { activeConnectionId, connection } = connectionStore;
        if (!activeConnectionId || !connection) return;

        // Get tabs for current connection
        const tabs = dataTabsStore.getTabsForConnection(activeConnectionId);
        const activeTab = dataTabsStore.getActiveTab(activeConnectionId);

        if (tabs.length > 0 && activeTab) {
          // Close the active tab
          dataTabsStore.closeTab(activeConnectionId, activeTab.id);
        } else {
          // No tabs left, close the connection through the shared guarded
          // close so pending row edits are not silently discarded.
          useDialogStore.getState().requestCloseConnection(activeConnectionId);
        }
        return;
      }

      // View Changes shortcut
      const viewChangesBinding = getShortcut('action.view-changes');
      if (matchesBinding(e, viewChangesBinding)) {
        e.preventDefault();
        const viewChangesButton = document.querySelector<HTMLButtonElement>(
          'button[data-action="view-changes"]'
        );
        viewChangesButton?.click();
        return;
      }

      // Execute Query shortcut
      const executeQueryBinding = getShortcut('action.execute-query');
      if (matchesBinding(e, executeQueryBinding)) {
        e.preventDefault();
        const executeButton = document.querySelector<HTMLButtonElement>(
          'button[data-action="execute-query"]'
        );
        executeButton?.click();
        return;
      }

      // New Window shortcut
      const newWindowBinding = getShortcut('action.new-window');
      if (matchesBinding(e, newWindowBinding)) {
        e.preventDefault();
        sqlPro.window.create().catch(console.error);
      }
    };

    // Use capture phase to handle shortcuts before Monaco editor intercepts them
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [toggle, openConnectionSwitcher, t]);

  // Register commands only once on mount
  useEffect(() => {
    // Helper to get formatted shortcut from store
    // Note: shortcutsStoreRef.current is guaranteed to be initialized by the previous useEffect
    const getShortcutDisplay = (actionId: string): string | undefined => {
      const binding = shortcutsStoreRef.current!.getShortcut(
        actionId as Parameters<
          NonNullable<typeof shortcutsStoreRef.current>['getShortcut']
        >[0]
      );
      return binding ? formatShortcutBinding(binding) : undefined;
    };

    const commands: Command[] = [
      // Navigation commands
      {
        id: 'nav.data-browser',
        label: t('commands.openDataBrowser', {
          defaultValue: 'Open Data Browser',
        }),
        shortcut: getShortcutDisplay('nav.data-browser'),
        icon: Table,
        category: 'navigation',
        keywords: ['data', 'browser', 'table'],
        action: () => {
          document
            .querySelector<HTMLButtonElement>('[data-tab="data"]')
            ?.click();
        },
      },
      {
        id: 'nav.query-editor',
        label: t('commands.openSqlQuery', { defaultValue: 'Open SQL Query' }),
        shortcut: getShortcutDisplay('nav.query-editor'),
        icon: Code,
        category: 'navigation',
        keywords: ['sql', 'query', 'editor'],
        action: () => {
          document
            .querySelector<HTMLButtonElement>('[data-tab="query"]')
            ?.click();
        },
      },
      {
        id: 'nav.search-tables',
        label: t('commands.searchTables', { defaultValue: 'Search Tables' }),
        shortcut: getShortcutDisplay('nav.search-tables'),
        icon: Search,
        category: 'navigation',
        keywords: ['search', 'tables', 'find', 'filter'],
        action: () => {
          document
            .querySelector<HTMLInputElement>('input[placeholder*="Search"]')
            ?.focus();
        },
      },
      {
        id: 'nav.schema-compare',
        label: t('commands.openSchemaCompare', {
          defaultValue: 'Open Schema Compare',
        }),
        shortcut: getShortcutDisplay('nav.schema-compare'),
        icon: GitCompare,
        category: 'navigation',
        keywords: ['schema', 'compare', 'comparison', 'diff', 'migration'],
        action: () => {
          useCompareViewStore.getState().setActiveTab('schema');
          document
            .querySelector<HTMLButtonElement>('[data-tab="compare"]')
            ?.click();
        },
      },
      {
        id: 'nav.er-diagram',
        label: t('commands.openErDiagram', { defaultValue: 'Open ER Diagram' }),
        shortcut: getShortcutDisplay('nav.er-diagram'),
        icon: GitFork,
        category: 'navigation',
        keywords: ['er', 'diagram', 'entity', 'relationship', 'schema'],
        action: () => {
          document
            .querySelector<HTMLButtonElement>('[data-tab="diagram"]')
            ?.click();
        },
      },
      {
        id: 'nav.dashboard',
        label: t('commands.openDashboard', { defaultValue: 'Open Dashboard' }),
        shortcut: getShortcutDisplay('nav.dashboard'),
        icon: BarChart3,
        category: 'navigation',
        keywords: ['dashboard', 'statistics', 'stats', 'overview', 'metrics'],
        action: () => {
          document
            .querySelector<HTMLButtonElement>('[data-tab="dashboard"]')
            ?.click();
        },
      },
      {
        id: 'nav.toggle-sidebar',
        label: t('commands.toggleSidebar', { defaultValue: 'Toggle Sidebar' }),
        shortcut: getShortcutDisplay('nav.toggle-sidebar'),
        icon: PanelLeftClose,
        category: 'navigation',
        keywords: ['sidebar', 'toggle', 'hide', 'show', 'panel'],
        action: () => {
          const sidebarToggle = document.querySelector<HTMLButtonElement>(
            'button[data-action="toggle-sidebar"]'
          );
          sidebarToggle?.click();
        },
      },

      // Connection commands
      {
        id: 'conn.new-connection',
        label: t('commands.newConnectionTab', {
          defaultValue: 'New Connection Tab',
        }),
        shortcut: getShortcutDisplay('conn.new-connection'),
        icon: Plus,
        category: 'navigation',
        keywords: ['new', 'connection', 'tab', 'database', 'switch', 'select'],
        action: () => {
          // Open connection switcher to select a connection for a new tab
          useConnectionSwitcherStore.getState().open();
        },
      },

      {
        id: 'conn.next-connection',
        label: t('commands.nextConnection', {
          defaultValue: 'Next Connection',
        }),
        shortcut: getShortcutDisplay('conn.next-connection'),
        icon: SkipForward,
        category: 'navigation',
        keywords: ['next', 'connection', 'switch', 'tab'],
        action: () => {
          const {
            connectionTabOrder,
            activeConnectionId,
            setActiveConnection,
          } = connectionStoreRef.current!;
          if (connectionTabOrder.length > 1 && activeConnectionId) {
            const currentIndex = connectionTabOrder.indexOf(activeConnectionId);
            const nextIndex = (currentIndex + 1) % connectionTabOrder.length;
            setActiveConnection(connectionTabOrder[nextIndex]);
          }
        },
        disabled: () =>
          connectionStoreRef.current!.connectionTabOrder.length <= 1,
      },
      {
        id: 'conn.prev-connection',
        label: t('commands.previousConnection', {
          defaultValue: 'Previous Connection',
        }),
        shortcut: getShortcutDisplay('conn.prev-connection'),
        icon: SkipBack,
        category: 'navigation',
        keywords: ['previous', 'connection', 'switch', 'tab'],
        action: () => {
          const {
            connectionTabOrder,
            activeConnectionId,
            setActiveConnection,
          } = connectionStoreRef.current!;
          if (connectionTabOrder.length > 1 && activeConnectionId) {
            const currentIndex = connectionTabOrder.indexOf(activeConnectionId);
            const prevIndex =
              (currentIndex - 1 + connectionTabOrder.length) %
              connectionTabOrder.length;
            setActiveConnection(connectionTabOrder[prevIndex]);
          }
        },
        disabled: () =>
          connectionStoreRef.current!.connectionTabOrder.length <= 1,
      },

      // Table commands (data view specific)
      {
        id: 'action.refresh-table',
        label: t('commands.refreshTable', { defaultValue: 'Refresh Table' }),
        shortcut: getShortcutDisplay('action.refresh-table'),
        icon: RefreshCw,
        category: 'table',
        keywords: ['refresh', 'table', 'data', 'reload', 'invalidate'],
        visibleInViews: ['data'],
        action: () => {
          const { activeConnectionId } = connectionStoreRef.current!;
          if (activeConnectionId) {
            invalidateTableData(activeConnectionId);
          }
        },
      },
      {
        id: 'action.save-changes',
        label: t('commands.saveChanges', { defaultValue: 'Save Changes' }),
        shortcut: getShortcutDisplay('action.save-changes'),
        icon: Save,
        category: 'table',
        keywords: ['save', 'changes', 'commit', 'apply', 'database'],
        visibleInViews: ['data'],
        action: () => {
          const saveButton = document.querySelector<HTMLButtonElement>(
            'button[data-action="save-changes"]'
          );
          saveButton?.click();
        },
        disabled: () => !useChangesStore.getState().hasChanges,
      },
      {
        id: 'action.discard-changes',
        label: t('commands.discardChanges', {
          defaultValue: 'Discard Changes',
        }),
        shortcut: getShortcutDisplay('action.discard-changes'),
        icon: Undo2,
        category: 'table',
        keywords: ['discard', 'changes', 'cancel', 'revert', 'database'],
        visibleInViews: ['data'],
        action: () => {
          const discardButton = document.querySelector<HTMLButtonElement>(
            'button[data-action="discard-changes"]'
          );
          discardButton?.click();
        },
        disabled: () => !useChangesStore.getState().hasChanges,
      },
      {
        id: 'action.add-row',
        label: t('commands.addRow', { defaultValue: 'Add Row' }),
        shortcut: getShortcutDisplay('action.add-row'),
        icon: Plus,
        category: 'table',
        keywords: ['add', 'row', 'insert', 'new', 'table'],
        visibleInViews: ['data'],
        action: () => {
          const addRowButton = document.querySelector<HTMLButtonElement>(
            'button[data-action="add-row"]'
          );
          addRowButton?.click();
        },
      },
      {
        id: 'action.delete-row',
        label: t('commands.deleteRow', { defaultValue: 'Delete Row' }),
        shortcut: getShortcutDisplay('action.delete-row'),
        icon: Trash2,
        category: 'table',
        keywords: ['delete', 'row', 'remove', 'table'],
        visibleInViews: ['data'],
        action: () => {
          const deleteRowButton = document.querySelector<HTMLButtonElement>(
            'button[data-action="delete-row"]'
          );
          deleteRowButton?.click();
        },
      },
      {
        id: 'action.export-data',
        label: t('commands.exportData', { defaultValue: 'Export Data' }),
        shortcut: getShortcutDisplay('action.export-data'),
        icon: FileDown,
        category: 'table',
        keywords: ['export', 'data', 'download', 'csv', 'table'],
        visibleInViews: ['data'],
        action: () => {
          const exportButton = document.querySelector<HTMLButtonElement>(
            'button[data-action="export-data"]'
          );
          exportButton?.click();
        },
      },

      // View commands (data view specific)
      {
        id: 'view.toggle-schema-details',
        label: t('commands.toggleSchemaDetails', {
          defaultValue: 'Toggle Schema Details',
        }),
        shortcut: getShortcutDisplay('view.toggle-schema-details'),
        icon: Monitor,
        category: 'view',
        keywords: ['toggle', 'schema', 'details', 'columns', 'info'],
        visibleInViews: ['data'],
        action: () => {
          settingsStoreRef.current!.toggleSchemaDetails();
        },
      },
      {
        id: 'view.full-screen',
        label: t('commands.toggleFullScreen', {
          defaultValue: 'Toggle Full Screen',
        }),
        shortcut: getShortcutDisplay('view.full-screen'),
        icon: PanelLeft,
        category: 'view',
        keywords: ['toggle', 'full', 'screen', 'maximize', 'editor'],
        action: () => {
          const fullScreenButton = document.querySelector<HTMLButtonElement>(
            'button[data-action="toggle-fullscreen"]'
          );
          fullScreenButton?.click();
        },
      },

      // Theme commands
      {
        id: 'theme.toggle',
        label: t('commands.toggleTheme', { defaultValue: 'Toggle Theme' }),
        shortcut: getShortcutDisplay('theme.toggle'),
        icon: Sun,
        category: 'theme',
        keywords: ['toggle', 'theme', 'dark', 'light', 'mode', 'sun', 'moon'],
        action: () => {
          themeStoreRef.current!.toggleTheme();
        },
      },

      // History commands (query view specific)
      {
        id: 'history.clear',
        label: t('commands.clearHistory', { defaultValue: 'Clear History' }),
        shortcut: getShortcutDisplay('history.clear'),
        icon: Trash2,
        category: 'history',
        keywords: ['clear', 'history', 'delete', 'remove', 'sql', 'query'],
        visibleInViews: ['query'],
        action: () => {
          const clearHistoryButton = document.querySelector<HTMLButtonElement>(
            'button[data-action="clear-history"]'
          );
          clearHistoryButton?.click();
        },
      },

      // Settings commands
      {
        id: 'settings.open',
        label: t('commands.openSettings', { defaultValue: 'Open Settings' }),
        shortcut: getShortcutDisplay('settings.open'),
        icon: Settings,
        category: 'settings',
        keywords: ['open', 'settings', 'preferences', 'config'],
        action: () => {
          const settingsButton = document.querySelector<HTMLButtonElement>(
            'button[data-action="open-settings"]'
          );
          settingsButton?.click();
        },
      },

      // Command Palette
      {
        id: 'action.command-palette',
        label: t('commands.commandPalette', {
          defaultValue: 'Command Palette',
        }),
        shortcut: getShortcutDisplay('action.command-palette'),
        icon: Keyboard,
        category: 'command-palette',
        keywords: ['command', 'palette', 'search', 'go', 'shortcuts'],
        action: toggle,
      },
      {
        id: 'action.focus-search',
        label: t('commands.focusSearch', { defaultValue: 'Focus Search' }),
        shortcut: getShortcutDisplay('action.focus-search'),
        icon: Search,
        category: 'command-palette',
        keywords: ['focus', 'search', 'input', 'tables'],
        action: () => {
          const searchInput = document.querySelector<HTMLInputElement>(
            'input[placeholder*="Search"]'
          );
          searchInput?.focus();
          searchInput?.select();
        },
      },
      {
        id: 'action.open-agent',
        label: t('commands.openAgent', { defaultValue: 'Open AI Agent' }),
        shortcut: getShortcutDisplay('action.open-agent'),
        icon: Bot,
        category: 'actions',
        keywords: ['ai', 'agent', 'chat', 'assistant', 'sql', 'query'],
        action: () => {
          const { activeConnectionId } = connectionStoreRef.current!;
          if (activeConnectionId && dialogStoreRef.current) {
            dialogStoreRef.current.toggleAgentSidebar(activeConnectionId);
          }
        },
        disabled: () => !connectionStoreRef.current?.activeConnectionId,
      },

      // Onboarding commands
      {
        id: 'onboarding.skip',
        label: t('commands.skipTour', { defaultValue: 'Skip Tour' }),
        shortcut: getShortcutDisplay('onboarding.skip'),
        icon: X,
        category: 'onboarding',
        keywords: ['skip', 'tour', 'onboarding', 'exit'],
        action: () => {
          onboardingStoreRef.current!.skip();
        },
        // Only show if onboarding is active
        disabled: () => onboardingStoreRef.current?.currentStep === null,
      },
      {
        id: 'onboarding.next',
        label: t('commands.nextStep', { defaultValue: 'Next Step' }),
        shortcut: getShortcutDisplay('onboarding.next'),
        icon: SkipForward,
        category: 'onboarding',
        keywords: ['next', 'step', 'tour', 'onboarding'],
        action: () => {
          onboardingStoreRef.current!.next();
        },
        // Only show if onboarding is active
        disabled: () => onboardingStoreRef.current?.currentStep === null,
      },
    ];

    registerCommands(commands);

    // Unregister commands on unmount
    return () => {
      commands.forEach(({ id }) => unregisterCommand(id));
    };
    // Note: We include `t` in dependencies because command labels are translated
  }, [registerCommands, unregisterCommand, toggle, t]);
}
