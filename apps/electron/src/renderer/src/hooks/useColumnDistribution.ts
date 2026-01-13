import type {
  ColumnDistributionValue,
  GetColumnDistributionResponse,
} from '@shared/types';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { sqlPro } from '@/lib/api';

export interface UseColumnDistributionOptions {
  connectionId: string | null;
  schema?: string;
  table: string | null;
  column: string | null;
  limit?: number;
  enabled?: boolean;
}

export interface UseColumnDistributionResult {
  distribution: ColumnDistributionValue[];
  totalRows: number;
  distinctCount: number;
  nullCount: number;
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Hook for fetching column value distribution (full table aggregation).
 * Uses GROUP BY to get all unique values and their counts regardless of pagination.
 */
export function useColumnDistribution(
  options: UseColumnDistributionOptions
): UseColumnDistributionResult {
  const {
    connectionId,
    schema = 'main',
    table,
    column,
    limit,
    enabled = true,
  } = options;

  const query = useQuery({
    queryKey: [
      'column-distribution',
      connectionId,
      schema,
      table,
      column,
      limit,
    ],
    queryFn: async (): Promise<GetColumnDistributionResponse> => {
      if (!connectionId || !table || !column) {
        return {
          success: false,
          error: 'Missing required parameters',
        };
      }

      return sqlPro.db.getColumnDistribution({
        connectionId,
        schema,
        table,
        column,
        limit,
      });
    },
    enabled: enabled && !!connectionId && !!table && !!column,
    staleTime: 30000, // 30 seconds cache
    gcTime: 5 * 60 * 1000, // 5 minutes garbage collection
    // Keep previous data during refetch to avoid UI flickering
    placeholderData: keepPreviousData,
  });

  return {
    distribution: query.data?.distribution ?? [],
    totalRows: query.data?.totalRows ?? 0,
    distinctCount: query.data?.distinctCount ?? 0,
    nullCount: query.data?.nullCount ?? 0,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
}
