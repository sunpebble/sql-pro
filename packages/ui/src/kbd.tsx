'use client';

import * as React from 'react';

import { cn } from './lib/utils';

/**
 * Maps common key names to their abbreviation and display symbol
 */
const keyMap: Record<string, { abbr: string; label: string }> = {
  command: { abbr: 'Cmd', label: '⌘' },
  cmd: { abbr: 'Cmd', label: '⌘' },
  control: { abbr: 'Ctrl', label: '⌃' },
  ctrl: { abbr: 'Ctrl', label: '⌃' },
  option: { abbr: 'Opt', label: '⌥' },
  opt: { abbr: 'Opt', label: '⌥' },
  alt: { abbr: 'Alt', label: '⌥' },
  shift: { abbr: 'Shift', label: '⇧' },
  enter: { abbr: 'Enter', label: '↵' },
  return: { abbr: 'Return', label: '↵' },
  backspace: { abbr: 'Backspace', label: '⌫' },
  delete: { abbr: 'Del', label: '⌦' },
  escape: { abbr: 'Esc', label: '⎋' },
  esc: { abbr: 'Esc', label: '⎋' },
  tab: { abbr: 'Tab', label: '⇥' },
  space: { abbr: 'Space', label: '␣' },
  up: { abbr: 'Up', label: '↑' },
  down: { abbr: 'Down', label: '↓' },
  left: { abbr: 'Left', label: '←' },
  right: { abbr: 'Right', label: '→' },
  pageup: { abbr: 'PgUp', label: '⇞' },
  pagedown: { abbr: 'PgDn', label: '⇟' },
  home: { abbr: 'Home', label: '↖' },
  end: { abbr: 'End', label: '↘' },
  capslock: { abbr: 'Caps', label: '⇪' },
};

function getKeyLabel(key: string): { abbr: string; label: string } {
  const lowerKey = key.toLowerCase();
  if (keyMap[lowerKey]) {
    return keyMap[lowerKey];
  }
  // For single characters or unmapped keys, use as-is
  return { abbr: key, label: key.length === 1 ? key.toUpperCase() : key };
}

interface KbdProps extends React.ComponentProps<'kbd'> {
  /**
   * The key or keys to display.
   * Can be a single key string (e.g., "⌘") or an array of keys for combinations (e.g., ["⌘", "K"])
   */
  keys?: string | string[];
  /**
   * Visual variant of the keyboard key
   */
  variant?: 'default' | 'outline';
  /**
   * Size of the keyboard key
   */
  size?: 'sm' | 'default';
}

function Kbd({
  className,
  keys,
  variant = 'default',
  size = 'default',
  children,
  ...props
}: KbdProps) {
  const renderKey = (key: string) => {
    const { abbr, label } = getKeyLabel(key);
    return (
      <abbr key={key} data-slot="kbd-key" className="no-underline" title={abbr}>
        {label}
      </abbr>
    );
  };

  const renderContent = () => {
    if (children) {
      return children;
    }

    if (!keys) {
      return null;
    }

    if (typeof keys === 'string') {
      return renderKey(keys);
    }

    return keys.map((key, index) => (
      <React.Fragment key={key}>
        {index > 0 && (
          <span data-slot="kbd-separator" className="opacity-60">
            +
          </span>
        )}
        {renderKey(key)}
      </React.Fragment>
    ));
  };

  return (
    <kbd
      data-slot="kbd"
      data-variant={variant}
      data-size={size}
      className={cn(
        // Base styles
        'inline-flex items-center justify-center gap-0.5 font-mono font-medium',
        // Variant styles
        'data-[variant=default]:bg-muted data-[variant=default]:text-muted-foreground',
        'data-[variant=outline]:border-border data-[variant=outline]:text-muted-foreground data-[variant=outline]:border data-[variant=outline]:bg-transparent',
        // Size styles
        'data-[size=default]:h-5 data-[size=default]:min-w-5 data-[size=default]:rounded data-[size=default]:px-1 data-[size=default]:[font-size:calc(var(--font-ui-size,14px)*0.75)]',
        'data-[size=sm]:h-4 data-[size=sm]:min-w-4 data-[size=sm]:rounded-sm data-[size=sm]:px-0.5 data-[size=sm]:text-[10px]',
        className
      )}
      {...props}
    >
      {renderContent()}
    </kbd>
  );
}

export { Kbd };
export type { KbdProps };
