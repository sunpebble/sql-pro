import { Outlet } from '@tanstack/react-router';
import { Upload } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CommandPalette } from '@/components/CommandPalette';
import { GlobalDialogs } from '@/components/GlobalDialogs';
import { Titlebar } from '@/components/Titlebar';
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
  const { t } = useTranslation('common');
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
    handleDragEnter,
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
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Global drag overlay for database files */}
      {isDragging && (
        <div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center backdrop-blur-md">
          <div className="bg-background/80 border-primary flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-16 py-12">
            <Upload className="text-primary mb-4 h-12 w-12" />
            <p className="text-primary text-lg font-medium">
              {t('dragDrop.dropDatabaseFile')}
            </p>
            <p className="text-muted-foreground mt-1 text-sm">
              {DB_EXTENSIONS.join(', ')}
            </p>
          </div>
        </div>
      )}

      {/* Titlebar with theme and settings controls */}
      <Titlebar />

      {/* Main content - rendered by child routes */}
      <div className="min-h-0 flex-1">
        <Outlet />
      </div>

      {/* Command Palette - global keyboard shortcut ⌘K */}
      <CommandPalette />

      {/* Global dialogs - settings, connection management, etc. */}
      <GlobalDialogs />
    </div>
  );
}
