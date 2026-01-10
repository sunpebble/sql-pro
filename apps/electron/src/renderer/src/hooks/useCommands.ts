import type { Command } from '@/stores';
import {
  Code,
  FileDown,
  GitCompare,
  GitFork,
  Keyboard,
  Link,
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
import { sqlPro } from '@/lib/api';
import { queryClient } from '@/lib/query-client';
import {
  formatShortcutBinding,
  matchesBinding,
  useChangesStore,
  useCommandPaletteStore,
  useConnectionStore,
  useConnectionSwitcherStore,
  useKeyboardShortcutsStore,
  useOnboardingStore,
  useSettingsStore,
  useTableDataStore,
  useThemeStore,
} from '@/stores';

/**
 * Hook that registers all application commands and sets up the global keyboard shortcut.
 * Should be called once at the app root level.
 */
export function useCommands() {
  const toggle = useCommandPaletteStore((s) => s.toggle);
  const registerCommands = useCommandPaletteStore((s) => s.registerCommands);
  const unregisterCommand = useCommandPaletteStore((s) => s.unregisterCommand);
  const openConnectionSwitcher = useConnectionSwitcherStore((s) => s.open);

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

    return () => {
      unsubTheme();
      unsubConnection();
      unsubChanges();
      unsubTableData();
      unsubSettings();
      unsubShortcuts();
      unsubOnboarding();
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

      // Command palette shortcut - works everywhere
      const commandPaletteBinding = getShortcut('action.command-palette');
      if (matchesBinding(e, commandPaletteBinding)) {
        e.preventDefault();
        toggle();
        return;
      }

      // Focus search shortcut - works everywhere
      const focusSearchBinding = getShortcut('action.focus-search');
      if (matchesBinding(e, focusSearchBinding)) {
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

      // Recent connections shortcut (Ctrl+R) - works everywhere
      const recentConnectionsBinding = getShortcut('conn.recent-connections');
      if (matchesBinding(e, recentConnectionsBinding)) {
        e.preventDefault();
        // Open connection switcher dialog
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

      // Schema Compare shortcut
      const schemaCompareBinding = getShortcut('nav.schema-compare');
      if (matchesBinding(e, schemaCompareBinding)) {
        e.preventDefault();
        document
          .querySelector<HTMLButtonElement>('[data-tab="compare"]')
          ?.click();
        return;
      }

      // Data Diff shortcut
      const dataDiffBinding = getShortcut('nav.data-diff');
      if (matchesBinding(e, dataDiffBinding)) {
        e.preventDefault();
        document
          .querySelector<HTMLButtonElement>('[data-tab="dataDiff"]')
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
      const refreshTableBinding = getShortcut('action.refresh-table');
      if (matchesBinding(e, refreshTableBinding)) {
        e.preventDefault();

        if (activeConnectionId) {
          queryClient.invalidateQueries({
            queryKey: ['tableData', activeConnectionId],
          });
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

      // Add row shortcut
      const addRowBinding = getShortcut('action.add-row');
      if (matchesBinding(e, addRowBinding)) {
        e.preventDefault();
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

      // Refresh Schema shortcut
      const refreshSchemaBinding = getShortcut('action.refresh-schema');
      if (matchesBinding(e, refreshSchemaBinding)) {
        e.preventDefault();
        const refreshSchemaButton = document.querySelector<HTMLButtonElement>(
          'button[data-action="refresh-schema"]'
        );
        refreshSchemaButton?.click();
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

      // Close Database shortcut
      const closeDatabaseBinding = getShortcut('action.close-database');
      if (matchesBinding(e, closeDatabaseBinding)) {
        e.preventDefault();
        const closeDbButton = document.querySelector<HTMLButtonElement>(
          'button[data-action="close-database"]'
        );
        closeDbButton?.click();
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
  }, [toggle, openConnectionSwitcher]);

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
        label: 'Open Data Browser',
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
        label: 'Open SQL Query',
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
        label: 'Search Tables',
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
        label: 'Open Schema Compare',
        shortcut: getShortcutDisplay('nav.schema-compare'),
        icon: GitCompare,
        category: 'navigation',
        keywords: ['schema', 'compare', 'comparison', 'diff', 'migration'],
        action: () => {
          document
            .querySelector<HTMLButtonElement>('[data-tab="compare"]')
            ?.click();
        },
      },
      {
        id: 'nav.er-diagram',
        label: 'Open ER Diagram',
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
        id: 'nav.toggle-sidebar',
        label: 'Toggle Sidebar',
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
        id: 'conn.recent-connections',
        label: 'Recent Connections',
        shortcut: getShortcutDisplay('conn.recent-connections'),
        icon: Link,
        category: 'navigation',
        keywords: ['recent', 'connection', 'database', 'switch'],
        action: () => {
          // Open connection switcher dialog
          useConnectionSwitcherStore.getState().open();
        },
      },
      {
        id: 'conn.next-connection',
        label: 'Next Connection',
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
        label: 'Previous Connection',
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

      // Table commands
      {
        id: 'action.refresh-table',
        label: 'Refresh Table',
        shortcut: getShortcutDisplay('action.refresh-table'),
        icon: RefreshCw,
        category: 'table',
        keywords: ['refresh', 'table', 'data', 'reload', 'invalidate'],
        action: () => {
          const { activeConnectionId } = connectionStoreRef.current!;
          if (activeConnectionId) {
            queryClient.invalidateQueries({
              queryKey: ['tableData', activeConnectionId],
            });
          }
        },
      },
      {
        id: 'action.save-changes',
        label: 'Save Changes',
        shortcut: getShortcutDisplay('action.save-changes'),
        icon: Save,
        category: 'table',
        keywords: ['save', 'changes', 'commit', 'apply', 'database'],
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
        label: 'Discard Changes',
        shortcut: getShortcutDisplay('action.discard-changes'),
        icon: Undo2,
        category: 'table',
        keywords: ['discard', 'changes', 'cancel', 'revert', 'database'],
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
        label: 'Add Row',
        shortcut: getShortcutDisplay('action.add-row'),
        icon: Plus,
        category: 'table',
        keywords: ['add', 'row', 'insert', 'new', 'table'],
        action: () => {
          const addRowButton = document.querySelector<HTMLButtonElement>(
            'button[data-action="add-row"]'
          );
          addRowButton?.click();
        },
      },
      {
        id: 'action.delete-row',
        label: 'Delete Row',
        shortcut: getShortcutDisplay('action.delete-row'),
        icon: Trash2,
        category: 'table',
        keywords: ['delete', 'row', 'remove', 'table'],
        action: () => {
          const deleteRowButton = document.querySelector<HTMLButtonElement>(
            'button[data-action="delete-row"]'
          );
          deleteRowButton?.click();
        },
      },
      {
        id: 'action.export-data',
        label: 'Export Data',
        shortcut: getShortcutDisplay('action.export-data'),
        icon: FileDown,
        category: 'table',
        keywords: ['export', 'data', 'download', 'csv', 'table'],
        action: () => {
          const exportButton = document.querySelector<HTMLButtonElement>(
            'button[data-action="export-data"]'
          );
          exportButton?.click();
        },
      },

      // View commands
      {
        id: 'view.toggle-schema-details',
        label: 'Toggle Schema Details',
        shortcut: getShortcutDisplay('view.toggle-schema-details'),
        icon: Monitor,
        category: 'view',
        keywords: ['toggle', 'schema', 'details', 'columns', 'info'],
        action: () => {
          settingsStoreRef.current!.toggleSchemaDetails();
        },
      },
      {
        id: 'view.full-screen',
        label: 'Toggle Full Screen',
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
        label: 'Toggle Theme',
        shortcut: getShortcutDisplay('theme.toggle'),
        icon: Sun,
        category: 'theme',
        keywords: ['toggle', 'theme', 'dark', 'light', 'mode', 'sun', 'moon'],
        action: () => {
          themeStoreRef.current!.toggleTheme();
        },
      },

      // History commands
      {
        id: 'history.clear',
        label: 'Clear History',
        shortcut: getShortcutDisplay('history.clear'),
        icon: Trash2,
        category: 'history',
        keywords: ['clear', 'history', 'delete', 'remove', 'sql', 'query'],
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
        label: 'Open Settings',
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
        label: 'Command Palette',
        shortcut: getShortcutDisplay('action.command-palette'),
        icon: Keyboard,
        category: 'command-palette',
        keywords: ['command', 'palette', 'search', 'go', 'shortcuts'],
        action: toggle,
      },
      {
        id: 'action.focus-search',
        label: 'Focus Search',
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

      // Onboarding commands
      {
        id: 'onboarding.skip',
        label: 'Skip Tour',
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
        label: 'Next Step',
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
  }, [registerCommands, unregisterCommand, toggle]);
}
