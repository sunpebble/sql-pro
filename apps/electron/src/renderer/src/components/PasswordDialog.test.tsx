import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PasswordDialog } from './PasswordDialog';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => options?.defaultValue || key,
  }),
}));

// Mock @/lib/api
vi.mock('@/lib/api', () => ({
  sqlPro: {
    password: {
      isAvailable: vi.fn().mockResolvedValue({ available: true }),
      has: vi.fn().mockResolvedValue({ hasPassword: false }),
      remove: vi.fn().mockResolvedValue({ success: true }),
    },
  },
}));

describe('passwordDialog', () => {
  const mockOnOpenChange = vi.fn();
  const mockOnSubmit = vi.fn();
  const defaultProps = {
    open: true,
    onOpenChange: mockOnOpenChange,
    onSubmit: mockOnSubmit,
    filename: 'test.db',
    dbPath: '/path/to/test.db',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render password input with type "password" initially', async () => {
    render(<PasswordDialog {...defaultProps} />);

    // We expect the input to have a placeholder as defined in the component
    // Since we mocked t to return key or defaultValue, and component uses t('passwordDialog.placeholder')
    // We should look for the key if no defaultValue is provided in component,
    // or look for input by type/role.

    // The component uses placeholder={t('passwordDialog.placeholder')}
    // So our mock will return 'passwordDialog.placeholder'
    const input = screen.getByPlaceholderText('passwordDialog.placeholder');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'password');
    // Check that aria-label is set correctly
    expect(input).toHaveAttribute('aria-label', 'Password');
  });

  it('should toggle password visibility when toggle button is clicked', async () => {
    const user = userEvent.setup();
    render(<PasswordDialog {...defaultProps} />);

    const input = screen.getByPlaceholderText('passwordDialog.placeholder');

    // Find toggle button - initially it should be 'Show password'
    // Note: This test expects the button to be present, which it isn't yet.
    // So this test is expected to fail initially.
    const toggleButton = screen.getByRole('button', { name: /Show password/i });
    expect(toggleButton).toBeInTheDocument();

    // Click to show password
    await user.click(toggleButton);
    expect(input).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: /Hide password/i })).toBeInTheDocument();

    // Click to hide password
    await user.click(toggleButton);
    expect(input).toHaveAttribute('type', 'password');
    expect(screen.getByRole('button', { name: /Show password/i })).toBeInTheDocument();
  });
});
