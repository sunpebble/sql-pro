import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PasswordDialog } from './PasswordDialog';

// Mock translation
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'passwordDialog.title': 'Encrypted Database',
        'passwordDialog.description': 'Enter the password to open',
        'passwordDialog.placeholder': 'Enter password',
        'passwordDialog.rememberPassword': 'Remember password',
        'passwordDialog.showPassword': 'Show password',
        'passwordDialog.hidePassword': 'Hide password',
        'passwordDialog.open': 'Open',
        'actions.cancel': 'Cancel'
      };
      return translations[key] || key;
    },
  }),
}));

// Mock API
vi.mock('@/lib/api', () => ({
  sqlPro: {
    password: {
      isAvailable: vi.fn().mockResolvedValue({ available: true }),
      has: vi.fn().mockResolvedValue({ hasPassword: false }),
      save: vi.fn().mockResolvedValue({ success: true }),
      remove: vi.fn().mockResolvedValue({ success: true }),
    },
  },
}));

describe('PasswordDialog', () => {
  const mockOnOpenChange = vi.fn();
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render dialog', () => {
    render(
      <PasswordDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSubmit={mockOnSubmit}
        filename="test.db"
        dbPath="/path/to/test.db"
      />
    );

    expect(screen.getByText('Encrypted Database')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter password')).toBeInTheDocument();
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

    const input = screen.getByPlaceholderText('Enter password');
    expect(input).toHaveAttribute('type', 'password');

    // Find the toggle button by aria-label
    const toggleButton = screen.getByLabelText('Show password');
    await user.click(toggleButton);

    expect(input).toHaveAttribute('type', 'text');
    expect(screen.getByLabelText('Hide password')).toBeInTheDocument();

    // Click again to hide
    // Note: The button element is the same, so getByLabelText needs the new label
    const hideButton = screen.getByLabelText('Hide password');
    await user.click(hideButton);
    expect(input).toHaveAttribute('type', 'password');
  });

  it('should submit password', async () => {
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

    const input = screen.getByPlaceholderText('Enter password');
    await user.type(input, 'secret');

    const submitButton = screen.getByText('Open');
    await user.click(submitButton);

    expect(mockOnSubmit).toHaveBeenCalledWith('secret', expect.any(Boolean));
  });
});
