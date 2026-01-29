import type { SavedQuery } from '@shared/types/saved-query';
import type { Command } from '@/stores/command-palette-store';
import { Play } from 'lucide-react';
import { useEffect } from 'react';
import { useCommandPaletteStore } from '@/stores/command-palette-store';
import {
  parseParameters,
  useSavedQueriesStore,
} from '@/stores/saved-queries-store';

/**
 * Registers dynamic commands for running saved queries in the command palette.
 * Commands are automatically updated when queries change.
 *
 * @param onRunQuery - Callback invoked when a query is selected to run.
 *                     Receives the query and a boolean indicating if it has parameters.
 */
export function useSavedQueryCommands(
  onRunQuery: (query: SavedQuery, hasParams: boolean) => void
) {
  const queries = useSavedQueriesStore((s) => s.queries);
  const folders = useSavedQueriesStore((s) => s.folders);
  const { registerCommands, unregisterCommand } =
    useCommandPaletteStore.getState();

  useEffect(() => {
    const commandIds: string[] = [];

    const queryCommands: Command[] = queries.map((query) => {
      const commandId = `run-saved-query-${query.id}`;
      commandIds.push(commandId);

      const folder = folders.find((f) => f.id === query.folderId);
      const folderPrefix = folder ? `${folder.name}/` : '';
      const params = parseParameters(query.query);

      return {
        id: commandId,
        label: `Run: ${folderPrefix}${query.name}`,
        icon: Play,
        category: 'actions',
        keywords: [
          'run',
          'saved',
          'query',
          'execute',
          query.name.toLowerCase(),
          query.description?.toLowerCase() || '',
          folder?.name.toLowerCase() || '',
        ].filter(Boolean),
        action: () => onRunQuery(query, params.length > 0),
      };
    });

    registerCommands(queryCommands);

    return () => {
      commandIds.forEach((id) => unregisterCommand(id));
    };
  }, [queries, folders, onRunQuery, registerCommands, unregisterCommand]);
}
