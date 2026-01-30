// useQuickQuery Hook
// Provides quick query functionality for natural language to SQL conversion

import type {
  GeneratedSQL,
  QueryOptimization,
  SQLExplanation,
} from '@shared/types/agent';
import { useCallback } from 'react';
import { sqlPro } from '@/lib/api';
import { useAIQueryStore } from '@/stores/ai-query-store';
import { useConnectionStore } from '@/stores/connection-store';

interface UseQuickQueryReturn {
  isGenerating: boolean;
  isExplaining: boolean;
  isOptimizing: boolean;
  generatedSQL: GeneratedSQL | null;
  explanation: SQLExplanation | null;
  optimization: QueryOptimization | null;
  error: string | null;
  generateSQL: (naturalLanguage: string) => Promise<GeneratedSQL | null>;
  explainSQL: (sql: string) => Promise<SQLExplanation | null>;
  optimizeSQL: (sql: string) => Promise<QueryOptimization | null>;
  reset: () => void;
}

export function useQuickQuery(): UseQuickQueryReturn {
  const { activeConnectionId } = useConnectionStore();
  const {
    mode,
    generatedSQL,
    explanation,
    optimization,
    error,
    setMode,
    setGeneratedSQL,
    setExplanation,
    setOptimization,
    setError,
    openPreview,
    reset: resetStore,
  } = useAIQueryStore();

  const generateSQL = useCallback(
    async (naturalLanguage: string): Promise<GeneratedSQL | null> => {
      if (!activeConnectionId) {
        setError('No active connection');
        return null;
      }
      setMode('generating');
      setError(null);
      try {
        const response = await sqlPro.agent.nlGenerateSQL(
          activeConnectionId,
          naturalLanguage
        );
        if (!response.success || !response.result) {
          setError(response.error || 'Failed to generate SQL');
          return null;
        }
        setGeneratedSQL(response.result);
        openPreview(response.result);
        return response.result;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'SQL generation failed';
        setError(message);
        return null;
      }
    },
    [activeConnectionId, setMode, setError, setGeneratedSQL, openPreview]
  );

  const explainSQL = useCallback(
    async (sql: string): Promise<SQLExplanation | null> => {
      if (!activeConnectionId) {
        setError('No active connection');
        return null;
      }
      setMode('explaining');
      setError(null);
      try {
        const response = await sqlPro.agent.nlExplainSQL(
          activeConnectionId,
          sql
        );
        if (!response.success || !response.result) {
          setError(response.error || 'Failed to explain SQL');
          return null;
        }
        setExplanation(response.result);
        return response.result;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'SQL explanation failed';
        setError(message);
        return null;
      }
    },
    [activeConnectionId, setMode, setError, setExplanation]
  );

  const optimizeSQL = useCallback(
    async (sql: string): Promise<QueryOptimization | null> => {
      if (!activeConnectionId) {
        setError('No active connection');
        return null;
      }
      setMode('optimizing');
      setError(null);
      try {
        const response = await sqlPro.agent.nlOptimizeSQL(
          activeConnectionId,
          sql
        );
        if (!response.success || !response.result) {
          setError(response.error || 'Failed to optimize SQL');
          return null;
        }
        setOptimization(response.result);
        return response.result;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'SQL optimization failed';
        setError(message);
        return null;
      }
    },
    [activeConnectionId, setMode, setError, setOptimization]
  );

  const reset = useCallback(() => {
    resetStore();
  }, [resetStore]);

  return {
    isGenerating: mode === 'generating',
    isExplaining: mode === 'explaining',
    isOptimizing: mode === 'optimizing',
    generatedSQL,
    explanation,
    optimization,
    error,
    generateSQL,
    explainSQL,
    optimizeSQL,
    reset,
  };
}
