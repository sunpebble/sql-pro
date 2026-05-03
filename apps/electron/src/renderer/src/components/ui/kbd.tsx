import type {
  ShortcutAction,
  ShortcutBinding,
} from '@/stores/keyboard-shortcuts-store';
import { cn } from '@/lib/utils';
import {
  formatShortcutBinding,
  useKeyboardShortcutsStore,
} from '@/stores/keyboard-shortcuts-store';

interface ShortcutKbdProps extends Omit<
  React.ComponentProps<'kbd'>,
  'children'
> {
  /** The shortcut action ID to display */
  action?: ShortcutAction;
  /** A custom shortcut binding to display (takes precedence over action) */
  binding?: ShortcutBinding | null;
  /** Fallback text if shortcut is not set */
  fallback?: string;
}

/**
 * A keyboard shortcut display component that reads from the global shortcuts store.
 * This ensures that displayed shortcuts are always in sync with the actual keybindings.
 *
 * @example
 * // Display a shortcut by action ID (recommended - auto-syncs with store)
 * <ShortcutKbd action="action.command-palette" />
 *
 * @example
 * // Display a custom binding
 * <ShortcutKbd binding={{ key: 'k', modifiers: { cmd: true } }} />
 */
function ShortcutKbd({
  action,
  binding: customBinding,
  fallback,
  className,
  ...props
}: ShortcutKbdProps) {
  // Subscribe to activePreset and customShortcuts to trigger re-renders when they change
  const activePreset = useKeyboardShortcutsStore((s) => s.activePreset);
  const customShortcuts = useKeyboardShortcutsStore((s) => s.customShortcuts);
  const getShortcut = useKeyboardShortcutsStore((s) => s.getShortcut);

  // Get binding from store if action is provided, otherwise use custom binding
  // Note: We include activePreset and customShortcuts in dependencies to ensure
  // the binding is recalculated when the preset changes
  const binding = action ? getShortcut(action) : customBinding;

  // Keep activePreset and customShortcuts referenced to avoid unused variable warnings
  void activePreset;
  void customShortcuts;

  const displayText = binding ? formatShortcutBinding(binding) : fallback;

  // Don't render if no binding and no fallback
  if (!binding && !fallback) {
    return null;
  }

  return (
    <kbd
      data-slot="kbd"
      className={cn(
        // Base styles
        'rounded-base border-border bg-muted pointer-events-none inline-flex h-5 w-fit min-w-5 items-center justify-center gap-1 border px-1.5 font-mono font-medium select-none',
        // Default text color
        'text-foreground',
        // Tooltip-specific colors
        '[.tooltip-kbd]:border-current/30 [.tooltip-kbd]:bg-current/15 [.tooltip-kbd]:text-inherit',
        "[&_svg:not([class*='size-'])]:size-3",
        className
      )}
      {...props}
    >
      {displayText}
    </kbd>
  );
}

export { ShortcutKbd };
