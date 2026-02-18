import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { sqlPro } from '@/lib/api';
import { PasswordDialog } from './PasswordDialog';

// Mock sqlPro
vi.mock('@/lib/api', () => ({
  sqlPro: {
    password: {
      isAvailable: vi.fn(),
      has: vi.fn(),
      remove: vi.fn(),
      save: vi.fn(),
    },
  },
}));

// Mock translation
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Mock ResizeObserver
globalThis.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe('passwordDialog', () => {
  const mockOnSubmit = vi.fn();
  const mockOnOpenChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (sqlPro.password.isAvailable as any).mockResolvedValue({ available: true });
    (sqlPro.password.has as any).mockResolvedValue({ hasPassword: false });
  });

  it('should render correctly', () => {
    render(
      <PasswordDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSubmit={mockOnSubmit}
        filename="test.db"
        dbPath="/path/to/test.db"
      />
    );
    expect(screen.getByText('passwordDialog.title')).toBeInTheDocument();
  });

  it('should toggle password visibility', async () => {
    const user = userEvent.setup();
    render(
      <PasswordDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSubmit={mockOnSubmit}
        filename="test.db"
        dbPath="/path/to/test.db"
      />
    );

    const input = screen.getByPlaceholderText('passwordDialog.placeholder');
    expect(input).toHaveAttribute('type', 'password');

    const toggleButton = screen.getByLabelText('passwordDialog.showPassword');
    await user.click(toggleButton);

    expect(input).toHaveAttribute('type', 'text');
    expect(toggleButton).toHaveAttribute('aria-label', 'passwordDialog.hidePassword');

    await user.click(toggleButton);
    expect(input).toHaveAttribute('type', 'password');
    expect(toggleButton).toHaveAttribute('aria-label', 'passwordDialog.showPassword');
  });
});
