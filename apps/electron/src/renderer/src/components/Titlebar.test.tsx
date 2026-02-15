import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Titlebar } from './Titlebar';

// Mock dependencies
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => options?.defaultValue || key,
  }),
}));

vi.mock('@/stores/theme-store', () => ({
  useThemeStore: () => ({
    theme: 'light',
    setTheme: vi.fn(),
  }),
}));

vi.mock('@/stores/connection-store', () => ({
  useConnectionStore: () => ({
    connection: null,
  }),
}));

vi.mock('@/stores/dialog-store', () => ({
  useDialogStore: () => ({
    openSettings: vi.fn(),
  }),
}));

vi.mock('./ConnectionTabBar', () => ({
  ConnectionTabBar: () => <div data-testid="connection-tab-bar" />,
}));

vi.mock('./Toolbar', () => ({
  Toolbar: () => <div data-testid="toolbar" />,
}));

describe('Titlebar', () => {
  it('should render theme switcher with aria-label', () => {
    render(<Titlebar />);
    // The default value in code is "Theme: {{theme}}" -> "Theme: Light" (mocked theme is light)
    const themeButton = screen.getByLabelText(/^Theme:/i);
    expect(themeButton).toBeInTheDocument();
  });

  it('should render settings button with aria-label', () => {
    render(<Titlebar />);
    const settingsButton = screen.getByLabelText('Settings');
    expect(settingsButton).toBeInTheDocument();
  });
});
