import type { ShortcutAction } from '@/stores/keyboard-shortcuts-store';
import { Button } from '@sqlpro/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@sqlpro/ui/popover';
import { ScrollArea } from '@sqlpro/ui/scroll-area';
import {
  ArrowUp,
  Command,
  CornerDownLeft,
  Keyboard,
  Search,
  X,
} from 'lucide-react';
import { memo, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import {
  formatShortcutBinding,
  isMac,
  useKeyboardShortcutsStore,
} from '@/stores/keyboard-shortcuts-store';

interface ShortcutItem {
  keys: string[];
  descriptionKey: string;
  category: 'navigation' | 'editing' | 'search' | 'general';
  action?: ShortcutAction; // If set, will be fetched from store
}

// Static shortcuts that don't change based on user settings
const staticShortcuts: ShortcutItem[] = [
  // Navigation
  {
    keys: ['↑', '↓'],
    descriptionKey: 'shortcuts.navigateRows',
    category: 'navigation',
  },
  {
    keys: ['←', '→'],
    descriptionKey: 'shortcuts.navigateColumns',
    category: 'navigation',
  },
  {
    keys: ['⌘', '↑'],
    descriptionKey: 'shortcuts.jumpToFirstRow',
    category: 'navigation',
  },
  {
    keys: ['⌘', '↓'],
    descriptionKey: 'shortcuts.jumpToLastRow',
    category: 'navigation',
  },
  {
    keys: ['Tab'],
    descriptionKey: 'shortcuts.nextCell',
    category: 'navigation',
  },
  {
    keys: ['⇧', 'Tab'],
    descriptionKey: 'shortcuts.previousCell',
    category: 'navigation',
  },
  {
    keys: ['Page↑'],
    descriptionKey: 'shortcuts.previousPage',
    category: 'navigation',
  },
  {
    keys: ['Page↓'],
    descriptionKey: 'shortcuts.nextPage',
    category: 'navigation',
  },

  // Editing - with action IDs for dynamic shortcuts
  {
    keys: ['Enter'],
    descriptionKey: 'shortcuts.editCell',
    category: 'editing',
  },
  {
    keys: ['Escape'],
    descriptionKey: 'shortcuts.cancelEdit',
    category: 'editing',
  },
  {
    keys: [],
    descriptionKey: 'shortcuts.saveChanges',
    category: 'editing',
    action: 'action.save-changes',
  },
  {
    keys: [],
    descriptionKey: 'shortcuts.discardChanges',
    category: 'editing',
    action: 'action.discard-changes',
  },
  {
    keys: [],
    descriptionKey: 'shortcuts.addRow',
    category: 'editing',
    action: 'action.add-row',
  },
  {
    keys: [],
    descriptionKey: 'shortcuts.deleteRow',
    category: 'editing',
    action: 'action.delete-row',
  },

  // Search & Filter
  {
    keys: [],
    descriptionKey: 'shortcuts.searchInTable',
    category: 'search',
    action: 'action.focus-search',
  },
  {
    keys: ['⌘', 'G'],
    descriptionKey: 'shortcuts.findNext',
    category: 'search',
  },
  {
    keys: ['⇧', '⌘', 'G'],
    descriptionKey: 'shortcuts.findPrevious',
    category: 'search',
  },

  // General - with action IDs for dynamic shortcuts
  {
    keys: [],
    descriptionKey: 'shortcuts.commandPalette',
    category: 'general',
    action: 'action.command-palette',
  },
  {
    keys: [],
    descriptionKey: 'shortcuts.refreshData',
    category: 'general',
    action: 'action.refresh-table',
  },
  {
    keys: [],
    descriptionKey: 'shortcuts.exportData',
    category: 'general',
    action: 'action.export-data',
  },
  {
    keys: [],
    descriptionKey: 'shortcuts.toggleSidebar',
    category: 'general',
    action: 'nav.toggle-sidebar',
  },
  {
    keys: ['?'],
    descriptionKey: 'shortcuts.showShortcuts',
    category: 'general',
  },
];

/**
 * Convert a formatted shortcut string to an array of keys for display
 */
function shortcutToKeys(shortcutStr: string): string[] {
  if (!shortcutStr || shortcutStr === 'Not set') return [];

  const mac = isMac();
  const keys: string[] = [];

  // On Mac, symbols are used (⌘⇧⌥), on other platforms words with + separator
  if (mac) {
    // Parse Mac-style shortcuts (e.g., "⇧⌘K")
    for (const char of shortcutStr) {
      keys.push(char);
    }
  } else {
    // Parse Windows/Linux-style shortcuts (e.g., "Ctrl+Shift+K")
    keys.push(...shortcutStr.split('+'));
  }

  return keys;
}

interface KeyboardShortcutsOverlayProps {
  className?: string;
}

/**
 * A floating button that shows keyboard shortcuts on hover/click
 */
export const KeyboardShortcutsOverlay = memo(
  ({ className }: KeyboardShortcutsOverlayProps) => {
    const { t } = useTranslation('common');
    const [isOpen, setIsOpen] = useState(false);
    const getShortcut = useKeyboardShortcutsStore((s) => s.getShortcut);

    // Resolve dynamic shortcuts from the store
    const shortcuts = useMemo(() => {
      return staticShortcuts.map((shortcut) => {
        if (shortcut.action) {
          const binding = getShortcut(shortcut.action);
          const formatted = formatShortcutBinding(binding);
          return {
            ...shortcut,
            keys: shortcutToKeys(formatted),
          };
        }
        return shortcut;
      });
    }, [getShortcut]);

    // Listen for ? key to toggle shortcuts
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        // Don't trigger if typing in an input
        if (
          e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement
        ) {
          return;
        }

        if (e.key === '?' && !e.metaKey && !e.ctrlKey) {
          e.preventDefault();
          setIsOpen((prev) => !prev);
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Group shortcuts by category
    const groupedShortcuts = shortcuts.reduce(
      (acc, shortcut) => {
        if (!acc[shortcut.category]) {
          acc[shortcut.category] = [];
        }
        acc[shortcut.category].push(shortcut);
        return acc;
      },
      {} as Record<string, ShortcutItem[]>
    );

    const categoryLabels: Record<string, string> = {
      navigation: t('keyboardShortcuts.navigation'),
      editing: t('keyboardShortcuts.editing'),
      search: t('keyboardShortcuts.searchAndFilter'),
      general: t('keyboardShortcuts.general'),
    };

    const categoryIcons: Record<string, React.ReactNode> = {
      navigation: <ArrowUp className="h-3 w-3" />,
      editing: <CornerDownLeft className="h-3 w-3" />,
      search: <Search className="h-3 w-3" />,
      general: <Command className="h-3 w-3" />,
    };

    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger
          className={cn(
            'fixed right-4 bottom-4 z-50 rounded-full shadow-lg',
            'bg-background/80 border backdrop-blur-sm',
            'hover:bg-muted transition-all duration-200 hover:scale-105',
            'opacity-50 hover:opacity-100',
            'flex h-8 w-8 items-center justify-center',
            className
          )}
          title={t('keyboardShortcuts.tooltipTitle')}
        >
          <Keyboard className="h-4 w-4" />
        </PopoverTrigger>
        <PopoverContent
          className="w-80 p-0"
          side="top"
          align="end"
          sideOffset={8}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b px-3 py-2">
            <div className="flex items-center gap-2">
              <Keyboard className="text-gold h-4 w-4" />
              <span className="text-sm font-medium">
                {t('keyboardShortcuts.title')}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>

          {/* Content */}
          <ScrollArea className="h-100">
            {Object.entries(groupedShortcuts).map(([category, items]) => (
              <div key={category} className="border-b last:border-b-0">
                {/* Category header */}
                <div className="bg-muted/50 flex items-center gap-1.5 px-3 py-1.5">
                  {categoryIcons[category]}
                  <span className="text-muted-foreground text-2xs font-medium uppercase">
                    {categoryLabels[category]}
                  </span>
                </div>
                {/* Shortcuts list */}
                <div className="divide-border/50 divide-y">
                  {items.map((shortcut) => (
                    <div
                      key={shortcut.descriptionKey}
                      className="hover:bg-muted/30 flex items-center justify-between px-3 py-1.5 transition-colors"
                    >
                      <span className="text-muted-foreground text-xs">
                        {t(shortcut.descriptionKey)}
                      </span>
                      <div className="flex items-center gap-0.5">
                        {shortcut.keys.map((key) => (
                          <kbd
                            key={key}
                            className={cn(
                              'text-2xs rounded px-1.5 py-0.5 font-mono',
                              'bg-muted border shadow-sm',
                              'min-w-5 text-center'
                            )}
                          >
                            {key}
                          </kbd>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </ScrollArea>

          {/* Footer */}
          <div className="bg-muted/30 border-t px-3 py-2">
            <p className="text-muted-foreground text-2xs text-center">
              {t('keyboardShortcuts.pressToToggle')}{' '}
              <kbd className="bg-muted text-2xs rounded border px-1 py-0.5">
                ?
              </kbd>
            </p>
          </div>
        </PopoverContent>
      </Popover>
    );
  }
);

KeyboardShortcutsOverlay.displayName = 'KeyboardShortcutsOverlay';

interface InlineShortcutHintProps {
  keys: string[];
  className?: string;
}

/**
 * Small inline keyboard shortcut hint
 */
export const InlineShortcutHint = memo(
  ({ keys, className }: InlineShortcutHintProps) => {
    return (
      <span className={cn('inline-flex items-center gap-0.5', className)}>
        {keys.map((key) => (
          <kbd
            key={key}
            className={cn(
              'rounded px-1 py-0.5 font-mono text-[9px]',
              'bg-muted/50 text-muted-foreground',
              'min-w-3.5 text-center'
            )}
          >
            {key}
          </kbd>
        ))}
      </span>
    );
  }
);

InlineShortcutHint.displayName = 'InlineShortcutHint';
