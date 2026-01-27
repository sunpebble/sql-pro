import { create } from 'zustand';

export type ViewType =
  | 'data'
  | 'query'
  | 'diagram'
  | 'compare'
  | 'vectorSearch'
  | 'dashboard'
  | 'welcome'
  | 'settings';

interface ViewContextState {
  activeView: ViewType | null;
  setActiveView: (view: ViewType | null) => void;
}

export const useViewContextStore = create<ViewContextState>()((set) => ({
  activeView: null,
  setActiveView: (activeView) => set({ activeView }),
}));

// Selector hook for convenience
export const useActiveView = () => useViewContextStore((s) => s.activeView);
export const setActiveView = (view: ViewType | null) =>
  useViewContextStore.getState().setActiveView(view);
