import type { DatabaseConnection } from '@/types/database';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useConnectionStore } from '@/stores/connection-store';
import { Toolbar } from './Toolbar';

// Mock connection
const mockConnection: DatabaseConnection = {
  id: 'conn-1',
  path: ':memory:',
  filename: 'test.db',
  isEncrypted: false,
  isReadOnly: false,
  status: 'connected',
};

describe('toolbar', () => {
  beforeEach(() => {
    // Reset store
    useConnectionStore.setState(useConnectionStore.getInitialState());
    // Set active connection
    useConnectionStore.setState({ connection: mockConnection });
  });

  it('should render AI Agent button with accessible name', () => {
    render(<Toolbar />);
    // The mock i18n returns the key 'toolbar.aiAgent'
    expect(screen.getByRole('button', { name: /toolbar.aiAgent/i })).toBeInTheDocument();
  });

  it('should render Help button with accessible name', () => {
    render(<Toolbar />);
    // The mock i18n returns the key 'toolbar.help'
    expect(screen.getByRole('button', { name: /toolbar.help/i })).toBeInTheDocument();
  });
});
