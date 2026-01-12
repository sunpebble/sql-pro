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
      <div data-tour-target="compare-tab">Compare</div>
    `;
  });

  it('renders schema browser step correctly (first step)', async () => {
    (useOnboardingStore as any).mockReturnValue({
      ...defaultStoreState,
      currentStep: 0, // Schema Browser is now the first step
    });

    render(<Tour />);

    await waitFor(() => {
      expect(screen.getByText('Schema Browser')).toBeInTheDocument();
    });
  });

  it('renders data browser step correctly', async () => {
    (useOnboardingStore as any).mockReturnValue({
      ...defaultStoreState,
      currentStep: 1, // Data Browser step
    });

    render(<Tour />);

    await waitFor(() => {
      // Use getAllByText because the title appears both in DOM and in tooltip
      const elements = screen.getAllByText('Data Browser');
      expect(elements.length).toBeGreaterThan(0);
    });
  });

  it('navigates to next step', async () => {
    const user = userEvent.setup();

    render(<Tour />);

    // Wait for tour to render (Schema Browser is now step 0)
    await waitFor(() => {
      expect(screen.getByText('Schema Browser')).toBeInTheDocument();
    });

    // Find next button with hidden option since parent has aria-hidden
    const nextButton = screen.getByRole('button', {
      name: /next/i,
      hidden: true,
    });

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
      expect(screen.getByText('Schema Browser')).toBeInTheDocument();
    });

    // Find skip button with hidden option since parent has aria-hidden
    const skipButtons = screen.getAllByRole('button', {
      name: /skip/i,
      hidden: true,
    });
    // The text "Skip tour" button is the one without aria-label
    const skipButton = skipButtons.find(
      (btn) => !btn.hasAttribute('aria-label')
    );

    await act(async () => {
      await user.click(skipButton!);
    });

    expect(mockSkipTour).toHaveBeenCalled();
  });

  it('calls onSwitchTab when step action requires it', async () => {
    // Mock a step that requires tab switching (e.g., Data Browser step)
    // Data Browser is step 1 (index 1)
    (useOnboardingStore as any).mockReturnValue({
      ...defaultStoreState,
      currentStep: 1,
    });

    render(<Tour onSwitchTab={mockOnSwitchTab} />);

    await waitFor(() => {
      expect(mockOnSwitchTab).toHaveBeenCalledWith('browser');
    });
  });

  it('handles tour completion', async () => {
    const user = userEvent.setup();

    // Mock last step (Command Palette & Settings is now the last step, index 5)
    (useOnboardingStore as any).mockReturnValue({
      ...defaultStoreState,
      currentStep: 5,
    });

    render(<Tour />);

    // Wait for tour to render
    await waitFor(() => {
      expect(
        screen.getByText('Command Palette & Settings')
      ).toBeInTheDocument();
    });

    // Use hidden option to find button inside aria-hidden container (animation state in test)
    const finishButton = screen.getByRole('button', {
      name: /finish/i,
      hidden: true,
    });

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
