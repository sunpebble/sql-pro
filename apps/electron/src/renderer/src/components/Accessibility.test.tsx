import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Sidebar } from './Sidebar';
import { Titlebar } from './Titlebar';
import { Toolbar } from './Toolbar';

// Mock the stores
vi.mock('@/stores/connection-store', () => ({
  useConnectionStore: () => ({
    connection: { id: 'test-id' },
    schema: { schemas: [], tables: [], views: [] },
    activeConnectionId: 'test-id',
  }),
}));

vi.mock('@/stores/changes-store', () => ({
  useChangesStore: () => ({
    hasChanges: () => false,
    changes: [],
  }),
}));

vi.mock('@/stores/onboarding-store', () => ({
  useOnboardingStore: () => ({
    startTour: vi.fn(),
  }),
}));

vi.mock('@/stores/dialog-store', () => ({
  useDialogStore: () => ({
    openChangesPanel: vi.fn(),
    agentSidebarOpen: false,
    toggleAgentSidebar: vi.fn(),
    openSettings: vi.fn(),
  }),
}));

vi.mock('@/stores/theme-store', () => ({
  useThemeStore: () => ({
    theme: 'light',
    setTheme: vi.fn(),
  }),
}));

vi.mock('@/stores/table-organization-store', () => ({
  useTableOrganizationStore: () => ({
    sortOption: 'name-asc',
    tags: [],
    getTagsByIds: () => [],
    getTableMetadata: () => ({}),
    getTableKey: () => '',
  }),
}));

vi.mock('@/stores/data-tabs-store', () => ({
  useDataTabsStore: () => ({
    openTable: vi.fn(),
  }),
}));

vi.mock('@/stores/query-tabs-store', () => ({
  useQueryTabsStore: () => ({
    createTab: vi.fn(),
  }),
}));

vi.mock('@/stores/settings-store', () => ({
  useSettingsStore: () => ({
    appVimMode: false,
  }),
  useTableFont: () => ({ family: 'sans-serif', size: 13 }),
  useUIFont: () => ({ family: 'sans-serif', size: 13 }),
}));

vi.mock('@/hooks/useCopyToClipboard', () => ({
  useCopyToClipboard: () => ({ copy: vi.fn() }),
}));

vi.mock('@/hooks/useVimKeyHandler', () => ({
  useVimKeyHandler: () => ({ handleKey: vi.fn(), resetSequence: vi.fn() }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      let text = options?.defaultValue || key;
      if (options && typeof text === 'string') {
        Object.keys(options).forEach((k) => {
          if (k !== 'defaultValue') {
            text = text.replace(`{{${k}}}`, options[k]);
          }
        });
      }
      return text;
    },
  }),
}));

// Mock the UI components that might cause issues in rendering
vi.mock('@sqlpro/ui/button', () => ({
  Button: (props: any) => <button {...props} />,
}));

vi.mock('@sqlpro/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: any) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: any) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: any) => <div>{children}</div>,
  DropdownMenuItem: ({ children }: any) => <div>{children}</div>,
  DropdownMenuSeparator: () => <div />,
}));

vi.mock('@sqlpro/ui/tooltip', () => ({
  Tooltip: ({ children }: any) => <div>{children}</div>,
  TooltipTrigger: ({ children }: any) => <div>{children}</div>,
  TooltipContent: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('@/components/ui/kbd', () => ({
  ShortcutKbd: () => <span />,
}));

// Mock Lucide icons
vi.mock('lucide-react', () => {
  const icons = [
    'Bot', 'Compass', 'FileText', 'HelpCircle', 'Database', 'Monitor', 'Moon', 'Settings', 'Sun',
    'ArrowDownAZ', 'ArrowUpAZ', 'Check', 'ChevronDown', 'ChevronRight', 'ChevronsDownUp', 'ChevronsUpDown',
    'Code', 'Copy', 'Dices', 'Edit2', 'Eye', 'FileDown', 'FileSearch', 'Filter', 'Pin', 'PinOff', 'Plus',
    'Search', 'SortAsc', 'Table', 'Tag', 'Trash2', 'X', 'Zap', 'XIcon', 'Sparkles', 'Play', 'RefreshCw', 'Settings2'
  ];
  const mocks: any = {};
  icons.forEach(icon => {
    mocks[icon] = (props: any) => <svg data-testid={`icon-${icon}`} {...props} />;
  });
  return mocks;
});

// Mock Titlebar children
vi.mock('./ConnectionTabBar', () => ({
  ConnectionTabBar: () => <div data-testid="connection-tab-bar" />,
}));

describe('accessibility checks', () => {
  it('toolbar buttons should have aria-labels', () => {
    render(<Toolbar />);

    // AI Agent button
    expect(screen.getByRole('button', { name: /AI Agent/i })).toBeInTheDocument();

    // Help button
    expect(screen.getByRole('button', { name: /Help/i })).toBeInTheDocument();
  });

  it('titlebar buttons should have aria-labels', () => {
    render(<Titlebar />);

    // Theme Switcher (using defaultValue from code)
    // "Theme: Light" is in Tooltip, but button should have label too?
    // Actually the button itself should have a label like "Switch theme" or just the current theme state.
    // The code currently has no label.
    // We will add `aria-label={t('theme.tooltip', { theme: getThemeLabel() })}` or similar.
    expect(screen.getByRole('button', { name: /Theme: Light/i })).toBeInTheDocument();

    // Settings button
    expect(screen.getByRole('button', { name: /Settings/i })).toBeInTheDocument();
  });

  it('sidebar buttons should have aria-labels', () => {
    render(<Sidebar />);

    // Expand/Collapse All button
    expect(screen.getByRole('button', { name: /Collapse all/i })).toBeInTheDocument();
  });
});
