import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { PasswordDialog } from './PasswordDialog';

// Mock dependencies
vi.mock('@/lib/api', () => ({
  sqlPro: {
    password: {
      isAvailable: vi.fn().mockResolvedValue({ available: true }),
      has: vi.fn().mockResolvedValue({ hasPassword: false }),
    },
  },
}));

describe('passwordDialog', () => {
  it('should render and toggle password visibility', async () => {
    const onOpenChange = vi.fn();
    const onSubmit = vi.fn();
    const user = userEvent.setup();

    render(
      <PasswordDialog
        open={true}
        onOpenChange={onOpenChange}
        onSubmit={onSubmit}
        filename="test.db"
        dbPath="/path/to/test.db"
      />
    );

    // Wait for input to appear (handles potential async rendering or portals)
    // We use a regex to match either the translation key or the English text
    const input = await screen.findByPlaceholderText(/password/i);
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'password');

    // Find the toggle button by aria-label
    const toggleButton = screen.getByLabelText('Show password');
    expect(toggleButton).toBeInTheDocument();

    // Click to show password
    await user.click(toggleButton);

    // State should change to text
    expect(input).toHaveAttribute('type', 'text');

    // Toggle button label should change
    expect(toggleButton).toHaveAttribute('aria-label', 'Hide password');

    // Click to hide password
    await user.click(toggleButton);

    // State should revert to password
    expect(input).toHaveAttribute('type', 'password');
    expect(toggleButton).toHaveAttribute('aria-label', 'Show password');
  });
});
