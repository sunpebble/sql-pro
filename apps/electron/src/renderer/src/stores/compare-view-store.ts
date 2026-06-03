import { create } from 'zustand';

export type CompareTab = 'schema' | 'data';

interface CompareViewState {
  // Which inner tab of the Compare view is active
  activeTab: CompareTab;
  setActiveTab: (tab: CompareTab) => void;
}

/**
 * Shared state for the Compare view's inner tab selection (Schema Compare /
 * Data Compare). Lifted out of CompareView's local state so that global
 * navigation actions (command palette, keyboard shortcuts, Monaco editor
 * commands) can request a specific inner tab when switching to the view.
 */
export const useCompareViewStore = create<CompareViewState>((set) => ({
  activeTab: 'schema',
  setActiveTab: (activeTab) => set({ activeTab }),
}));
