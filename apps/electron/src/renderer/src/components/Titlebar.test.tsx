import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Titlebar } from './Titlebar';

// Mock dependencies
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      if (key === 'theme.tooltip') return `Theme: ${options.theme}`;
      if (key === 'theme.light') return 'Light';
      if (key === 'theme.settings') return 'Settings';
      return key;
    },
  }),
}));

vi.mock('@/stores/theme-store', () => ({
  useThemeStore: () => ({
    theme: 'light',
    setTheme: vi.fn(),
  }),
}));

vi.mock('@/stores/dialog-store', () => ({
  useDialogStore: (selector: any) => selector({ openSettings: vi.fn() }),
}));

vi.mock('@/stores/connection-store', () => ({
  useConnectionStore: () => ({ connection: { id: 'test' } }),
}));

vi.mock('./ConnectionTabBar', () => ({
  ConnectionTabBar: () => <div data-testid="connection-tab-bar">Tabs</div>,
}));

vi.mock('./Toolbar', () => ({
  Toolbar: () => <div data-testid="toolbar">Toolbar</div>,
}));

describe('Titlebar', () => {
  it('renders theme switcher with accessible label', () => {
    render(<Titlebar />);
    const themeButton = screen.getByLabelText('Theme: Light');
    expect(themeButton).toBeInTheDocument();
  });

  it('renders settings button with accessible label', () => {
    render(<Titlebar />);
    const settingsButton = screen.getByLabelText('Settings');
    expect(settingsButton).toBeInTheDocument();
  });
});
