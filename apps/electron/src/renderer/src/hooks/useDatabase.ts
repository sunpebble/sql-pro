/**
 * Database hook for managing database connections
 */

import type { OpenDatabaseRequest } from '@shared/types';
import { useCallback, useState } from 'react';
import { quarry } from '../lib/api';
import { getErrorMessage } from '../lib/error-utils';

// Type matching the structure returned by quarry.db.open
interface ConnectionInfo {
  id: string;
  path: string;
  filename: string;
  isEncrypted: boolean;
  isReadOnly: boolean;
}

export interface UseDatabaseState {
  connection: ConnectionInfo | null;
  isConnecting: boolean;
  error: string | null;
}

export function useDatabase() {
  const [state, setState] = useState<UseDatabaseState>({
    connection: null,
    isConnecting: false,
    error: null,
  });

  const openDatabase = useCallback(async (request: OpenDatabaseRequest) => {
    setState((prev) => ({ ...prev, isConnecting: true, error: null }));

    try {
      const response = await quarry.db.open(request);

      if (response.success && response.connection) {
        setState({
          connection: response.connection,
          isConnecting: false,
          error: null,
        });
        return response;
      } else {
        setState({
          connection: null,
          isConnecting: false,
          error: response.error || 'Failed to open database',
        });
        return response;
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      setState({
        connection: null,
        isConnecting: false,
        error: errorMessage,
      });
      return {
        success: false as const,
        error: errorMessage,
      };
    }
  }, []);

  const closeDatabase = useCallback(async () => {
    if (!state.connection) {
      return { success: true as const };
    }

    try {
      const response = await quarry.db.close({
        connectionId: state.connection.id,
      });

      if (response.success) {
        setState({
          connection: null,
          isConnecting: false,
          error: null,
        });
      }

      return response;
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      return {
        success: false as const,
        error: errorMessage,
      };
    }
  }, [state.connection]);

  const executeQuery = useCallback(
    async (query: string) => {
      if (!state.connection) {
        return {
          success: false as const,
          error: 'No database connection',
        };
      }

      try {
        return await quarry.db.executeQuery({
          connectionId: state.connection.id,
          query,
        });
      } catch (error) {
        const errorMessage = getErrorMessage(error);
        return {
          success: false as const,
          error: errorMessage,
        };
      }
    },
    [state.connection]
  );

  return {
    ...state,
    openDatabase,
    closeDatabase,
    executeQuery,
  };
}
