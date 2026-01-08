import type { RendererOnboardingState } from '@shared/types/renderer-store';
import { create } from 'zustand';
import { persistOnboarding, registerOnboardingHydrator } from '@/lib/storage';

interface OnboardingState {
  // Onboarding state
  hasSeenWelcome: boolean;
  hasCompletedTour: boolean;
  currentStep: number;
  isTourVisible: boolean;

  // Actions
  setHasSeenWelcome: (seen: boolean) => void;
  setHasCompletedTour: (completed: boolean) => void;
  setCurrentStep: (step: number) => void;
  setIsTourVisible: (visible: boolean) => void;
  startTour: () => void;
  nextStep: () => void;
  previousStep: () => void;
  skipTour: () => void;
  completeTour: () => void;
  resetTour: () => void;
  // Aliases for useCommands compatibility
  skip: () => void;
  next: () => void;
}

export const useOnboardingStore = create<OnboardingState>()((set) => ({
  // Default state - user hasn't seen welcome or completed tour
  hasSeenWelcome: false,
  hasCompletedTour: false,
  currentStep: 0,
  isTourVisible: false,

  setHasSeenWelcome: (seen) => set({ hasSeenWelcome: seen }),

  setHasCompletedTour: (completed) => set({ hasCompletedTour: completed }),

  setCurrentStep: (step) => set({ currentStep: step }),

  setIsTourVisible: (visible) => set({ isTourVisible: visible }),

  startTour: () =>
    set({
      isTourVisible: true,
      currentStep: 0,
      hasSeenWelcome: true,
    }),

  nextStep: () =>
    set((state) => ({
      currentStep: state.currentStep + 1,
    })),

  previousStep: () =>
    set((state) => ({
      currentStep: Math.max(0, state.currentStep - 1),
    })),

  skipTour: () =>
    set({
      isTourVisible: false,
      hasSeenWelcome: true,
    }),

  completeTour: () =>
    set({
      isTourVisible: false,
      hasCompletedTour: true,
      hasSeenWelcome: true,
    }),

  resetTour: () =>
    set({
      hasSeenWelcome: false,
      hasCompletedTour: false,
      currentStep: 0,
      isTourVisible: false,
    }),

  // Aliases for useCommands compatibility
  skip: () =>
    set({
      isTourVisible: false,
      hasSeenWelcome: true,
    }),

  next: () =>
    set((state) => ({
      currentStep: state.currentStep + 1,
    })),
}));

// Register hydrator for loading persisted onboarding state
registerOnboardingHydrator((data: RendererOnboardingState) => {
  useOnboardingStore.setState({
    hasSeenWelcome: data.hasSeenWelcome,
    hasCompletedTour: data.hasCompletedTour,
    currentStep: data.currentStep,
    isTourVisible: data.isTourVisible,
  });
});

// Subscribe to state changes and persist to electron-store
useOnboardingStore.subscribe((state) => {
  const persistedState: RendererOnboardingState = {
    hasSeenWelcome: state.hasSeenWelcome,
    hasCompletedTour: state.hasCompletedTour,
    currentStep: state.currentStep,
    isTourVisible: state.isTourVisible,
  };
  persistOnboarding(persistedState);
});
