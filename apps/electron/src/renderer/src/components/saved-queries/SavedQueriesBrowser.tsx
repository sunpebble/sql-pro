import type { SavedQuery } from '@shared/types/saved-query';

import { Button } from '@sqlpro/ui/button';
import { Input } from '@sqlpro/ui/input';
import { ScrollArea } from '@sqlpro/ui/scroll-area';
import { FileText, FolderOpen, Search, X } from 'lucide-react';
import { memo, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useSavedQueriesStore } from '@/stores/saved-queries-store';

import { EditQueryDialog } from './EditQueryDialog';
import { FolderManagement } from './FolderManagement';
import { QueryCard } from './QueryCard';

interface SavedQueriesBrowserProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (query: SavedQuery) => void;
  onRun: (query: SavedQuery) => void;
}

export const SavedQueriesBrowser = memo(
  ({ open, onOpenChange, onSelect, onRun }: SavedQueriesBrowserProps) => {
    const { t } = useTranslation('common');
    const {
      folders,
      searchQuery,
      activeFolderId,
      setSearchQuery,
      setActiveFolderId,
      getFilteredQueries,
      deleteQuery,
      createFolder,
    } = useSavedQueriesStore();

    const [editingQuery, setEditingQuery] = useState<SavedQuery | null>(null);

    const filteredQueries = useMemo(
      () => getFilteredQueries(),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [getFilteredQueries, searchQuery, activeFolderId]
    );

    const handleSelect = useCallback(
      (query: SavedQuery) => {
        onSelect(query);
        onOpenChange(false);
      },
      [onSelect, onOpenChange]
    );

    const handleRun = useCallback(
      (query: SavedQuery) => {
        onRun(query);
        onOpenChange(false);
      },
      [onRun, onOpenChange]
    );

    const handleDelete = useCallback(
      (id: string) => {
        deleteQuery(id);
      },
      [deleteQuery]
    );

    const handleCreateFolder = useCallback(
      (name: string, color?: string) => {
        createFolder({ name, color });
      },
      [createFolder]
    );

    return (
      <>
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="max-w-4xl p-0">
            <DialogHeader className="border-b px-6 py-4">
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {t('savedQueries.title', { defaultValue: 'Saved Queries' })}
              </DialogTitle>
              <DialogDescription>
                {t('savedQueries.browserDescription', {
                  defaultValue:
                    'Browse and run your saved queries. Click to load into editor.',
                })}
              </DialogDescription>
            </DialogHeader>

            {/* Sidebar with folders + main content */}
            <div className="flex h-[60vh]">
              {/* Folder sidebar */}
              <div className="flex w-48 flex-col border-r">
                <div className="flex-1 space-y-1 p-3">
                  <button
                    className={cn(
                      'rounded-base flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors',
                      activeFolderId === null
                        ? 'bg-accent text-accent-foreground'
                        : 'hover:bg-accent/50'
                    )}
                    onClick={() => setActiveFolderId(null)}
                  >
                    <FileText className="h-4 w-4" />
                    {t('savedQueries.allQueries', {
                      defaultValue: 'All Queries',
                    })}
                  </button>

                  {folders.map((folder) => (
                    <button
                      key={folder.id}
                      className={cn(
                        'rounded-base flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors',
                        activeFolderId === folder.id
                          ? 'bg-accent text-accent-foreground'
                          : 'hover:bg-accent/50'
                      )}
                      onClick={() => setActiveFolderId(folder.id)}
                    >
                      <FolderOpen
                        className="h-4 w-4"
                        style={{ color: folder.color }}
                      />
                      <span className="truncate">{folder.name}</span>
                    </button>
                  ))}
                </div>

                {/* Folder management at bottom */}
                <div className="border-t p-3">
                  <FolderManagement onCreateFolder={handleCreateFolder} />
                </div>
              </div>

              {/* Query list */}
              <div className="flex flex-1 flex-col">
                {/* Search bar */}
                <div className="border-b p-4">
                  <div className="relative">
                    <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                    <Input
                      placeholder={t('savedQueries.searchPlaceholder', {
                        defaultValue: 'Search queries...',
                      })}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                    {searchQuery && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-1/2 right-1 h-6 w-6 -translate-y-1/2"
                        onClick={() => setSearchQuery('')}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Query grid */}
                <ScrollArea className="flex-1">
                  <div className="p-4">
                    {filteredQueries.length === 0 ? (
                      <div className="text-muted-foreground flex flex-col items-center justify-center py-16">
                        <FileText className="mb-3 h-12 w-12 opacity-40" />
                        <p className="font-medium">
                          {t('savedQueries.noQueriesFound', {
                            defaultValue: 'No queries found',
                          })}
                        </p>
                        <p className="text-sm opacity-70">
                          {searchQuery
                            ? t('savedQueries.tryAdjustingSearch', {
                                defaultValue:
                                  'Try adjusting your search or filters',
                              })
                            : t('savedQueries.saveFirstQuery', {
                                defaultValue:
                                  'Save a query from the editor to get started',
                              })}
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-4">
                        {filteredQueries.map((query) => (
                          <QueryCard
                            key={query.id}
                            query={query}
                            onSelect={() => handleSelect(query)}
                            onRun={() => handleRun(query)}
                            onEdit={() => setEditingQuery(query)}
                            onDelete={() => handleDelete(query.id)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit query dialog */}
        <EditQueryDialog
          open={editingQuery !== null}
          onOpenChange={(open) => {
            if (!open) setEditingQuery(null);
          }}
          query={editingQuery}
        />
      </>
    );
  }
);

SavedQueriesBrowser.displayName = 'SavedQueriesBrowser';
