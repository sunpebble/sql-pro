import type { DatabaseConnection } from '@/types/database';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useConnectionStore } from '@/stores/connection-store';
import { Titlebar } from './Titlebar';

const THEME_TOOLTIP_RE = /theme.tooltip/i;
const THEME_SETTINGS_RE = /theme.settings/i;

// Mock connection
const mockConnection: DatabaseConnection = {
  id: 'conn-1',
  path: ':memory:',
  filename: 'test.db',
  isEncrypted: false,
  isReadOnly: false,
  status: 'connected',
};

describe('titlebar', () => {
  beforeEach(() => {
    // Reset store
    useConnectionStore.setState(useConnectionStore.getInitialState());
    // Set active connection for titlebar layout
    useConnectionStore.setState({ connection: mockConnection });
  });

  it('should render Theme Switcher button with accessible name', () => {
    render(<Titlebar />);
    // The mock i18n returns the key 'theme.tooltip'
    expect(
      screen.getByRole('button', { name: THEME_TOOLTIP_RE })
    ).toBeInTheDocument();
  });

  it('should render Settings button with accessible name', () => {
    render(<Titlebar />);
    // The mock i18n returns the key 'theme.settings'
    expect(
      screen.getByRole('button', { name: THEME_SETTINGS_RE })
    ).toBeInTheDocument();
  });
});
