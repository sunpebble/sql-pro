// @vitest-environment happy-dom
import { act, render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useOnboardingStore } from '../../stores/onboarding-store';
import { Tour } from './Tour';

// Mock dependencies
vi.mock('../../stores/onboarding-store', () => ({
  useOnboardingStore: vi.fn(),
}));

// Mock ResizeObserver
globalThis.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
} as any;

// Mock ScrollIntoView
window.HTMLElement.prototype.scrollIntoView = vi.fn();

describe('tour Component', () => {
  const mockNextStep = vi.fn();
  const mockPreviousStep = vi.fn();
  const mockSkipTour = vi.fn();
  const mockCompleteTour = vi.fn();
  const mockOnSwitchTab = vi.fn();

  const defaultStoreState = {
    isTourVisible: true,
    currentStep: 0,
    nextStep: mockNextStep,
    previousStep: mockPreviousStep,
    skipTour: mockSkipTour,
    completeTour: mockCompleteTour,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useOnboardingStore as any).mockReturnValue(defaultStoreState);

    // Mock requestAnimationFrame
    vi.stubGlobal('requestAnimationFrame', (fn) => {
      return setTimeout(fn, 0);
    });
    vi.stubGlobal('cancelAnimationFrame', (id) => {
      clearTimeout(id);
    });

    // Create target elements in DOM
    document.body.innerHTML = `
      <div data-tour-target="sidebar">Sidebar</div>
      <div data-tour-target="data-browser-tab">Data Browser</div>
      <div data-tour-target="query-editor-tab">Query Editor</div>
      <div data-tour-target="toolbar">Toolbar</div>
      <div data-tour-target="diagram-tab">ER Diagram</div>
      <div data-tour-target="settings-button">Settings</div>
    `;
  });

  it('renders welcome step correctly', async () => {
    (useOnboardingStore as any).mockReturnValue({
      ...defaultStoreState,
      currentStep: 0, // Welcome step (target: body)
    });

    render(<Tour />);

    await waitFor(() => {
      expect(screen.getByText('Welcome to SQL Pro')).toBeInTheDocument();
      expect(
        screen.getByText(/SQL Pro is a modern database client/)
      ).toBeInTheDocument();
    });
  });

  it('renders schema browser step correctly', async () => {
    (useOnboardingStore as any).mockReturnValue({
      ...defaultStoreState,
      currentStep: 1, // Schema Browser step
    });

    render(<Tour />);

    await waitFor(() => {
      expect(screen.getByText('Schema Browser')).toBeInTheDocument();
    });
  });

  it('navigates to next step', async () => {
    const user = userEvent.setup();

    render(<Tour />);

    // Wait for tour to render
    await waitFor(() => {
      expect(screen.getByText('Welcome to SQL Pro')).toBeInTheDocument();
    });

    // Find next button (usually "Next" or an arrow)
    const nextButton = screen.getByRole('button', { name: /next/i });

    await act(async () => {
      await user.click(nextButton);
    });

    expect(mockNextStep).toHaveBeenCalled();
  });

  it('skips tour', async () => {
    const user = userEvent.setup();

    render(<Tour />);

    // Wait for tour to render
    await waitFor(() => {
      expect(screen.getByText('Welcome to SQL Pro')).toBeInTheDocument();
    });

    // Find skip button
    const skipButton = screen.getByRole('button', { name: /skip/i });

    await act(async () => {
      await user.click(skipButton);
    });

    expect(mockSkipTour).toHaveBeenCalled();
  });

  it('calls onSwitchTab when step action requires it', async () => {
    // Mock a step that requires tab switching (e.g., Data Browser step)
    // In real config, Data Browser is step 2 (index 2)
    (useOnboardingStore as any).mockReturnValue({
      ...defaultStoreState,
      currentStep: 2,
    });

    render(<Tour onSwitchTab={mockOnSwitchTab} />);

    await waitFor(() => {
      expect(mockOnSwitchTab).toHaveBeenCalledWith('browser');
    });
  });

  it('handles tour completion', async () => {
    const user = userEvent.setup();

    // Mock last step
    (useOnboardingStore as any).mockReturnValue({
      ...defaultStoreState,
      currentStep: 7, // Diff Preview (last step)
    });

    render(<Tour />);

    // Wait for tour to render
    await waitFor(() => {
      expect(screen.getByText('Diff Preview')).toBeInTheDocument();
    });

    const finishButton = screen.getByRole('button', { name: /finish/i });

    await act(async () => {
      await user.click(finishButton);
    });

    expect(mockCompleteTour).toHaveBeenCalled();
  });

  it('does not render when tour is not visible', () => {
    (useOnboardingStore as any).mockReturnValue({
      ...defaultStoreState,
      isTourVisible: false,
    });

    const { container } = render(<Tour />);

    expect(container).toBeEmptyDOMElement();
  });
});
