// @vitest-environment happy-dom
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useOnboardingStore } from './onboarding-store';

// Mock storage functions
vi.mock('@/lib/storage', () => ({
  persistOnboarding: vi.fn(),
  registerOnboardingHydrator: vi.fn((_callback) => {
    // Simulate rehydration immediately for testing if needed
    // (global as any).mockHydrateOnboarding = callback;
  }),
}));

describe('useOnboardingStore', () => {
  beforeEach(() => {
    // Reset store before each test
    const store = useOnboardingStore;
    act(() => {
      store.setState({
        hasSeenWelcome: false,
        hasCompletedTour: false,
        currentStep: 0,
        isTourVisible: false,
      });
    });
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useOnboardingStore());

    expect(result.current.hasSeenWelcome).toBe(false);
    expect(result.current.hasCompletedTour).toBe(false);
    expect(result.current.currentStep).toBe(0);
    expect(result.current.isTourVisible).toBe(false);
  });

  it('should start tour correctly', () => {
    const { result } = renderHook(() => useOnboardingStore());

    act(() => {
      result.current.startTour();
    });

    expect(result.current.isTourVisible).toBe(true);
    expect(result.current.currentStep).toBe(0);
    expect(result.current.hasSeenWelcome).toBe(true);
  });

  it('should advance to next step', () => {
    const { result } = renderHook(() => useOnboardingStore());

    act(() => {
      result.current.startTour();
    });

    act(() => {
      result.current.nextStep();
    });

    expect(result.current.currentStep).toBe(1);
  });

  it('should go to previous step but not below 0', () => {
    const { result } = renderHook(() => useOnboardingStore());

    act(() => {
      result.current.startTour();
      result.current.nextStep(); // step 1
    });

    expect(result.current.currentStep).toBe(1);

    act(() => {
      result.current.previousStep(); // step 0
    });

    expect(result.current.currentStep).toBe(0);

    act(() => {
      result.current.previousStep(); // still step 0
    });

    expect(result.current.currentStep).toBe(0);
  });

  it('should set specific step', () => {
    const { result } = renderHook(() => useOnboardingStore());

    act(() => {
      result.current.setCurrentStep(5);
    });

    expect(result.current.currentStep).toBe(5);
  });

  it('should skip tour', () => {
    const { result } = renderHook(() => useOnboardingStore());

    act(() => {
      result.current.startTour();
    });

    act(() => {
      result.current.skipTour();
    });

    expect(result.current.isTourVisible).toBe(false);
    expect(result.current.hasSeenWelcome).toBe(true);
    // Should NOT mark as completed if skipped (based on implementation)
    expect(result.current.hasCompletedTour).toBe(false);
  });

  it('should complete tour', () => {
    const { result } = renderHook(() => useOnboardingStore());

    act(() => {
      result.current.startTour();
    });

    act(() => {
      result.current.completeTour();
    });

    expect(result.current.isTourVisible).toBe(false);
    expect(result.current.hasCompletedTour).toBe(true);
    expect(result.current.hasSeenWelcome).toBe(true);
  });

  it('should reset tour state', () => {
    const { result } = renderHook(() => useOnboardingStore());

    // Set some non-default state
    act(() => {
      result.current.completeTour();
    });

    expect(result.current.hasCompletedTour).toBe(true);

    // Reset
    act(() => {
      result.current.resetTour();
    });

    expect(result.current.hasSeenWelcome).toBe(false);
    expect(result.current.hasCompletedTour).toBe(false);
    expect(result.current.currentStep).toBe(0);
    expect(result.current.isTourVisible).toBe(false);
  });

  it('should set individual flags directly', () => {
    const { result } = renderHook(() => useOnboardingStore());

    act(() => {
      result.current.setHasSeenWelcome(true);
    });
    expect(result.current.hasSeenWelcome).toBe(true);

    act(() => {
      result.current.setHasCompletedTour(true);
    });
    expect(result.current.hasCompletedTour).toBe(true);

    act(() => {
      result.current.setIsTourVisible(true);
    });
    expect(result.current.isTourVisible).toBe(true);
  });

  it('should persist state changes', async () => {
    const { persistOnboarding } = await import('@/lib/storage');
    const { result } = renderHook(() => useOnboardingStore());

    act(() => {
      result.current.setHasSeenWelcome(true);
    });

    // Check if persist function was called
    expect(persistOnboarding).toHaveBeenCalledWith(
      expect.objectContaining({
        hasSeenWelcome: true,
      })
    );
  });
});
