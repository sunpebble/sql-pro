// AI Query Store
// Manages state for natural language to SQL conversion and preview

import type {
  GeneratedSQL,
  QueryOptimization,
  SQLExplanation,
} from '@shared/types/agent';
import { create } from 'zustand';

export type AIQueryMode =
  | 'idle'
  | 'generating'
  | 'preview'
  | 'explaining'
  | 'optimizing'
  | 'executing'
  | 'error';

interface AIQueryState {
  // State
  mode: AIQueryMode;
  naturalLanguageInput: string;
  generatedSQL: GeneratedSQL | null;
  explanation: SQLExplanation | null;
  optimization: QueryOptimization | null;
  error: string | null;

  // Preview dialog state
  isPreviewOpen: boolean;

  // Explanation popover state
  isExplanationOpen: boolean;
  explanationAnchorRect: DOMRect | null;
  selectedSQL: string;

  // Actions
  setInput: (input: string) => void;
  setMode: (mode: AIQueryMode) => void;
  setGeneratedSQL: (sql: GeneratedSQL | null) => void;
  setExplanation: (explanation: SQLExplanation | null) => void;
  setOptimization: (optimization: QueryOptimization | null) => void;
  setError: (error: string | null) => void;

  // Preview dialog actions
  openPreview: (sql: GeneratedSQL) => void;
  closePreview: () => void;

  // Explanation popover actions
  openExplanation: (sql: string, anchorRect: DOMRect) => void;
  closeExplanation: () => void;

  // Reset
  reset: () => void;
}

const initialState = {
  mode: 'idle' as AIQueryMode,
  naturalLanguageInput: '',
  generatedSQL: null,
  explanation: null,
  optimization: null,
  error: null,
  isPreviewOpen: false,
  isExplanationOpen: false,
  explanationAnchorRect: null,
  selectedSQL: '',
};

export const useAIQueryStore = create<AIQueryState>()((set) => ({
  ...initialState,

  setInput: (input) => set({ naturalLanguageInput: input }),

  setMode: (mode) => set({ mode }),

  setGeneratedSQL: (sql) => set({ generatedSQL: sql }),

  setExplanation: (explanation) => set({ explanation }),

  setOptimization: (optimization) => set({ optimization }),

  setError: (error) => set({ error, mode: error ? 'error' : 'idle' }),

  openPreview: (sql) =>
    set({
      generatedSQL: sql,
      isPreviewOpen: true,
      mode: 'preview',
      error: null,
    }),

  closePreview: () =>
    set({
      isPreviewOpen: false,
      mode: 'idle',
    }),

  openExplanation: (sql, anchorRect) =>
    set({
      selectedSQL: sql,
      explanationAnchorRect: anchorRect,
      isExplanationOpen: true,
      mode: 'explaining',
    }),

  closeExplanation: () =>
    set({
      isExplanationOpen: false,
      explanationAnchorRect: null,
      mode: 'idle',
    }),

  reset: () => set(initialState),
}));
