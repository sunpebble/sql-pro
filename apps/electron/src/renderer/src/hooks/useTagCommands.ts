import type {Command} from '@/stores/command-palette-store';
import { Tag } from 'lucide-react';
import { useEffect } from 'react';
import {
  
  useCommandPaletteStore
} from '@/stores/command-palette-store';
import { useTableOrganizationStore } from '@/stores/table-organization-store';

/**
 * Registers dynamic commands for filtering by tags in the command palette.
 * Commands are automatically updated when tags change.
 */
export function useTagCommands() {
  const tags = useTableOrganizationStore((s) => s.tags);
  const setActiveTagFilter = useTableOrganizationStore(
    (s) => s.setActiveTagFilter
  );
  const { registerCommands, unregisterCommand } =
    useCommandPaletteStore.getState();

  useEffect(() => {
    // Generate command IDs for cleanup
    const commandIds: string[] = [];

    // Create commands for each tag
    const tagCommands: Command[] = tags.map((tag) => {
      const commandId = `filter-tag-${tag.id}`;
      commandIds.push(commandId);

      return {
        id: commandId,
        label: `Filter by tag: ${tag.name}`,
        icon: Tag,
        category: 'navigation',
        keywords: ['tag', 'filter', tag.name.toLowerCase(), 'label'],
        action: () => setActiveTagFilter(tag.id),
      };
    });

    // Add "Clear tag filter" command if there are tags
    if (tags.length > 0) {
      const clearId = 'filter-tag-clear';
      commandIds.push(clearId);
      tagCommands.push({
        id: clearId,
        label: 'Clear tag filter',
        icon: Tag,
        category: 'navigation',
        keywords: ['tag', 'filter', 'clear', 'reset', 'all'],
        action: () => setActiveTagFilter(null),
      });
    }

    // Register all commands
    registerCommands(tagCommands);

    // Cleanup: unregister all commands when tags change or component unmounts
    return () => {
      commandIds.forEach((id) => unregisterCommand(id));
    };
  }, [tags, setActiveTagFilter, registerCommands, unregisterCommand]);
}
