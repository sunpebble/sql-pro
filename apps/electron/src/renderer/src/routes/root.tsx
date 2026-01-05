import { Outlet } from '@tanstack/react-router';
import { Upload } from 'lucide-react';
import { CommandPalette } from '@/components/CommandPalette';
import { getFontFamilyCSS, useApplyFont } from '@/hooks/useApplyFont';
import { useCommands } from '@/hooks/useCommands';
import { useDragAndDrop } from '@/hooks/useDragAndDrop';
import { useMenuActions } from '@/hooks/useMenuActions';
import { useUIFont } from '@/stores';

/**
 * Root layout component that wraps all routes.
 * Provides the common app shell with titlebar and DevTools.
 */
export function RootLayout() {
  const uiFont = useUIFont();

  // Register commands and global keyboard shortcuts
  useCommands();

  // Listen for menu actions from main process
  useMenuActions();

  // Apply UI font to document root
  useApplyFont(uiFont, 'ui');

  // Global drag-and-drop for database files
  const {
    isDragging,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    DB_EXTENSIONS,
  } = useDragAndDrop();

  return (
    <div
      className="bg-background text-foreground flex h-screen flex-col overflow-hidden"
      style={{
        fontFamily: getFontFamilyCSS(uiFont.family),
        fontSize: `${uiFont.size}px`,
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Global drag overlay for database files */}
      {isDragging && (
        <div className="bg-primary/5 border-primary pointer-events-none absolute inset-4 z-50 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed">
          <Upload className="text-primary mb-4 h-12 w-12" />
          <p className="text-primary text-lg font-medium">
            Drop database file here
          </p>
          <p className="text-muted-foreground mt-1 text-sm">
            {DB_EXTENSIONS.join(', ')}
          </p>
        </div>
      )}

      {/* Titlebar - draggable area for macOS traffic lights */}
      <div className="titlebar border-border/50 h-10 shrink-0 border-b" />

      {/* Main content - rendered by child routes */}
      <div className="min-h-0 flex-1">
        <Outlet />
      </div>

      {/* Command Palette - global keyboard shortcut ⌘K */}
      <CommandPalette />
    </div>
  );
}
