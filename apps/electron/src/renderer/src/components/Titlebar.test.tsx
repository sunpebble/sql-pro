import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Titlebar } from './Titlebar';

// Mock stores
vi.mock('@/stores/theme-store', () => ({
  useThemeStore: () => ({
    theme: 'light',
    setTheme: vi.fn(),
  }),
}));

vi.mock('@/stores/dialog-store', () => ({
  useDialogStore: (selector: (state: any) => any) => {
    const state = {
      openSettings: vi.fn(),
    };
    return selector ? selector(state) : state;
  },
}));

vi.mock('@/stores/connection-store', () => ({
  useConnectionStore: () => ({
    connection: { id: 'test-conn' },
  }),
}));

// Mock child components
vi.mock('./Toolbar', () => ({
  Toolbar: () => <div data-testid="toolbar">Toolbar</div>,
}));

vi.mock('./ConnectionTabBar', () => ({
  ConnectionTabBar: () => <div data-testid="connection-tab-bar">Tabs</div>,
}));

// Mock react-i18next specific to this test
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) => {
      if (key === 'commands.toggleTheme') return 'Toggle Theme';
      if (key === 'commands.openSettings') return 'Open Settings';
      if (key === 'theme.tooltip') return 'Theme: Light';
      if (key === 'theme.light') return 'Light';
      return options?.defaultValue || key;
    },
  }),
}));

describe('titlebar', () => {
  it('renders theme switcher with accessible label', () => {
    render(<Titlebar />);
    // This expects aria-label="Toggle Theme" on the button
    const themeButton = screen.getByRole('button', { name: 'Toggle Theme' });
    expect(themeButton).toBeInTheDocument();
  });

  it('renders settings button with accessible label', () => {
    render(<Titlebar />);
    // This expects aria-label="Open Settings" on the button
    const settingsButton = screen.getByRole('button', { name: 'Open Settings' });
    expect(settingsButton).toBeInTheDocument();
  });
});
