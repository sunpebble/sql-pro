import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from '@sqlpro/ui/command';
import { Command as CommandIcon, Sparkles } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { QuickQueryInput } from '@/components/ai';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
// Direct imports to avoid barrel file overhead (bundle-barrel-imports)
import {
  getFilteredCommands,
  useCommandPaletteStore,
} from '@/stores/command-palette-store';
import { useUIFont } from '@/stores/settings-store';
import { useActiveView } from '@/stores/view-context-store';

// Natural language trigger words for AI query mode
const NL_QUERY_TRIGGERS = [
  'show',
  'find',
  'list',
  'get',
  'count',
  'how many',
  'select',
  'display',
  'fetch',
  'search',
  'what',
  'which',
];

const categoryOrder = ['actions', 'navigation', 'view', 'settings', 'help'];

// Detect if input looks like natural language query
const detectMode = (input: string): 'command' | 'query' => {
  const lower = input.toLowerCase().trim();

  // If input starts with '>' force command mode
  if (lower.startsWith('>')) return 'command';

  // If input starts with '?' or 'ai:' force query mode
  if (lower.startsWith('?') || lower.startsWith('ai:')) return 'query';

  // Detect natural language patterns
  if (NL_QUERY_TRIGGERS.some((trigger) => lower.startsWith(trigger))) {
    return 'query';
  }

  // Check for natural language patterns (contains spaces and question-like structure)
  if (
    input.includes(' ') &&
    (lower.includes(' all ') ||
      lower.includes(' from ') ||
      lower.includes(' where ') ||
      lower.includes(' with ') ||
      lower.endsWith('?'))
  ) {
    return 'query';
  }

  return 'command';
};

export function CommandPalette() {
  // Use individual selectors to prevent unnecessary re-renders
  const isOpen = useCommandPaletteStore((s) => s.isOpen);
  const close = useCommandPaletteStore((s) => s.close);

  const { t } = useTranslation('common');

  // Get UI font settings
  const uiFont = useUIFont();

  // Handle dialog open state change
  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        close();
      }
    },
    [close]
  );

  // Font style for dialog content
  const fontStyle = {
    fontFamily: uiFont.family
      ? `"${uiFont.family}", system-ui, sans-serif`
      : undefined,
    fontSize: `${uiFont.size}px`,
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className="overflow-hidden p-0"
        style={fontStyle}
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">
          {t('commandPalette.title', { defaultValue: 'Command Palette' })}
        </DialogTitle>
        {isOpen && <CommandPaletteInner />}
      </DialogContent>
    </Dialog>
  );
}

function CommandPaletteInner() {
  const search = useCommandPaletteStore((s) => s.search);
  const commands = useCommandPaletteStore((s) => s.commands);
  const close = useCommandPaletteStore((s) => s.close);
  const setSearch = useCommandPaletteStore((s) => s.setSearch);
  const executeCommand = useCommandPaletteStore((s) => s.executeCommand);

  const { t } = useTranslation('common');

  // AI query mode state - derive mode from search to avoid state updates in useEffect
  const [manualMode, setManualMode] = useState<'command' | 'query' | null>(
    null
  );

  // Compute mode: manual override takes precedence, otherwise auto-detect from search
  const mode = useMemo(() => {
    if (manualMode) return manualMode;
    return detectMode(search);
  }, [manualMode, search]);

  // Helper to set mode explicitly
  const setMode = useCallback((newMode: 'command' | 'query') => {
    setManualMode(newMode);
  }, []);

  // Category labels with translations
  const categoryLabels: Record<string, string> = useMemo(
    () => ({
      navigation: t('commandPalette.categories.navigation', {
        defaultValue: 'Navigation',
      }),
      view: t('commandPalette.categories.view', { defaultValue: 'View' }),
      actions: t('commandPalette.categories.actions', {
        defaultValue: 'Actions',
      }),
      settings: t('commandPalette.categories.settings', {
        defaultValue: 'Settings',
      }),
      help: t('commandPalette.categories.help', { defaultValue: 'Help' }),
    }),
    [t]
  );

  // Get active view for contextual command filtering
  const activeView = useActiveView();

  // Memoize filtered commands to prevent recalculation on every render
  const filteredCommands = useMemo(
    () => getFilteredCommands(commands, search, activeView),
    [commands, search, activeView]
  );

  // Memoize grouped commands
  const groupedCommands = useMemo(() => {
    return filteredCommands.reduce(
      (acc, command) => {
        if (!acc[command.category]) {
          acc[command.category] = [];
        }
        acc[command.category].push(command);
        return acc;
      },
      {} as Record<string, typeof filteredCommands>
    );
  }, [filteredCommands]);

  // Listen for open-command-palette events (from context menu)
  useEffect(() => {
    const handleOpenPalette = (
      event: CustomEvent<{ mode?: 'command' | 'query' }>
    ) => {
      if (event.detail?.mode) {
        setMode(event.detail.mode);
        if (event.detail.mode === 'query') {
          setSearch('');
        }
      }
    };

    document.addEventListener(
      'open-command-palette',
      handleOpenPalette as EventListener
    );
    return () => {
      document.removeEventListener(
        'open-command-palette',
        handleOpenPalette as EventListener
      );
    };
  }, [setSearch, setMode]);

  return (
    <Command
      className="**:[[cmdk-group-heading]]:text-muted-foreground **:[[cmdk-group-heading]]:px-2 **:[[cmdk-group-heading]]:font-medium **:[[cmdk-group]]:px-2"
      shouldFilter={false}
    >
      <CommandInput
        placeholder={t('commandPalette.placeholder', {
          defaultValue: 'Search commands...',
        })}
        value={search}
        onValueChange={setSearch}
      />
      <CommandList className="max-h-75 overflow-hidden">
        {/* AI Query Mode */}
        {mode === 'query' && (
          <div className="border-b p-4">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="text-primary h-4 w-4" />
              <span className="text-sm font-medium">
                {t('commandPalette.aiQueryMode', {
                  defaultValue: 'AI Query Mode',
                })}
              </span>
              <span className="text-muted-foreground ml-auto text-xs">
                {t('commandPalette.aiQueryHint', {
                  defaultValue: 'Type naturally to generate SQL',
                })}
              </span>
            </div>
            <QuickQueryInput onClose={close} autoFocus={false} />
          </div>
        )}

        {/* Command Mode */}
        {mode === 'command' && (
          <>
            <CommandEmpty>
              {t('commandPalette.noCommands', {
                defaultValue: 'No commands found',
              })}
            </CommandEmpty>
            {categoryOrder
              .filter((category) => groupedCommands[category]?.length > 0)
              .map((category) => (
                <CommandGroup
                  key={category}
                  heading={categoryLabels[category] || category}
                >
                  {groupedCommands[category].map((command) => (
                    <CommandItem
                      key={command.id}
                      value={command.id}
                      onSelect={() => executeCommand(command.id)}
                      className="data-selected:bg-accent gap-3"
                    >
                      {command.icon ? (
                        <command.icon className="text-muted-foreground h-4 w-4 shrink-0" />
                      ) : (
                        <CommandIcon className="text-muted-foreground h-4 w-4 shrink-0" />
                      )}
                      <span className="flex-1">{command.label}</span>
                      {command.shortcut && (
                        <CommandShortcut className="bg-muted rounded px-1.5 py-0.5 font-mono text-xs">
                          {command.shortcut}
                        </CommandShortcut>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
          </>
        )}
      </CommandList>
      {/* Footer */}
      <div className="text-muted-foreground border-border/50 flex items-center justify-between border-t px-4 py-2 text-xs">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setMode('command')}
            className={cn(
              'flex items-center gap-1',
              mode === 'command' ? 'text-foreground' : 'hover:text-foreground'
            )}
          >
            <span>
              {t('commandPalette.commands', { defaultValue: 'Commands' })}
            </span>
            <kbd className="bg-muted rounded px-1.5 py-0.5 text-[10px]">
              &gt;
            </kbd>
          </button>
          <button
            onClick={() => setMode('query')}
            className={cn(
              'flex items-center gap-1',
              mode === 'query' ? 'text-foreground' : 'hover:text-foreground'
            )}
          >
            <Sparkles className="h-3 w-3" />
            <span>
              {t('commandPalette.aiQuery', { defaultValue: 'AI Query' })}
            </span>
            <kbd className="bg-muted rounded px-1.5 py-0.5 text-[10px]">?</kbd>
          </button>
        </div>
        <span>
          {mode === 'command'
            ? t('commandPalette.commandsCount', {
                count: filteredCommands.length,
                defaultValue: '{{count}} commands',
              })
            : t('commandPalette.pressEsc', {
                defaultValue: 'Press Esc to close',
              })}
        </span>
      </div>
    </Command>
  );
}
