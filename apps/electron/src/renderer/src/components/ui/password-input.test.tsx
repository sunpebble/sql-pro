import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PasswordInput } from './password-input';

// Mock translation
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => options?.defaultValue || key,
  }),
}));

describe('passwordInput', () => {
  it('renders input with password type by default', () => {
    render(<PasswordInput placeholder="Enter password" />);
    const input = screen.getByPlaceholderText('Enter password');
    expect(input).toHaveAttribute('type', 'password');
  });

  it('toggles password visibility when eye icon is clicked', () => {
    render(<PasswordInput placeholder="Enter password" />);
    const input = screen.getByPlaceholderText('Enter password');
    const toggleButton = screen.getByRole('button', { name: /Show password/i });

    expect(input).toHaveAttribute('type', 'password');

    // Click to show password
    fireEvent.click(toggleButton);
    expect(input).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: /Hide password/i })).toBeInTheDocument();

    // Click to hide password
    fireEvent.click(toggleButton);
    expect(input).toHaveAttribute('type', 'password');
    expect(screen.getByRole('button', { name: /Show password/i })).toBeInTheDocument();
  });

  it('forwards refs correctly', () => {
    const ref = { current: null };
    render(<PasswordInput ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });
});
