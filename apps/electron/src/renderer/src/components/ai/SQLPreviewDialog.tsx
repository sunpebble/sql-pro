// SQLPreviewDialog Component
// Shows generated SQL with syntax highlighting and Edit/Execute/Cancel buttons

import Editor from '@monaco-editor/react';
import { Badge } from '@sqlpro/ui/badge';
import { Button } from '@sqlpro/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@sqlpro/ui/dialog';
import { AlertTriangle, Info, Pencil, Play, X } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useAIQueryStore } from '@/stores/ai-query-store';
import { useQueryStore } from '@/stores/query-store';
import { useEditorFont } from '@/stores/settings-store';
import { useThemeStore } from '@/stores/theme-store';

// Default monospace font stack for Monaco editor
const DEFAULT_FONT_FAMILY =
  'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';

export function SQLPreviewDialog() {
  const theme = useThemeStore((s) => s.theme);
  const editorFont = useEditorFont();
  const { isPreviewOpen, generatedSQL, closePreview } = useAIQueryStore();
  const { setCurrentQuery } = useQueryStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editedSQL, setEditedSQL] = useState('');

  const handleEdit = useCallback(() => {
    if (generatedSQL) {
      setEditedSQL(generatedSQL.sql);
      setIsEditing(true);
    }
  }, [generatedSQL]);

  const handleExecute = useCallback(() => {
    const sqlToExecute = isEditing ? editedSQL : generatedSQL?.sql;
    if (sqlToExecute) {
      setCurrentQuery(sqlToExecute);
      setTimeout(() => {
        const executeBtn = document.querySelector(
          '[data-action="execute-query"]'
        );
        if (executeBtn instanceof HTMLButtonElement) {
          executeBtn.click();
        }
      }, 0);
      closePreview();
      setIsEditing(false);
    }
  }, [isEditing, editedSQL, generatedSQL, setCurrentQuery, closePreview]);

  const handleCancel = useCallback(() => {
    closePreview();
    setIsEditing(false);
    setEditedSQL('');
  }, [closePreview]);

  const handleCopyToEditor = useCallback(() => {
    const sqlToCopy = isEditing ? editedSQL : generatedSQL?.sql;
    if (sqlToCopy) {
      setCurrentQuery(sqlToCopy);
      closePreview();
      setIsEditing(false);
    }
  }, [isEditing, editedSQL, generatedSQL, setCurrentQuery, closePreview]);

  if (!generatedSQL) return null;

  const displaySQL = isEditing ? editedSQL : generatedSQL.sql;
  const monacoTheme = theme === 'dark' ? 'vs-dark' : 'light';

  return (
    <Dialog
      open={isPreviewOpen}
      onOpenChange={(open) => !open && handleCancel()}
    >
      <DialogContent className="flex max-h-[80vh] max-w-3xl flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Generated SQL
            {generatedSQL.isDestructive && (
              <Badge variant="destructive" className="ml-2">
                <AlertTriangle className="mr-1 h-3 w-3" />
                Modifies Data
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription className="flex items-start gap-2">
            <Info className="mt-0.5 h-4 w-4 flex-shrink-0" />
            {generatedSQL.explanation}
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-base border-border min-h-[200px] flex-1 overflow-hidden border-2">
          <Editor
            height="100%"
            language="sql"
            theme={monacoTheme}
            value={displaySQL}
            onChange={(value) => isEditing && setEditedSQL(value || '')}
            options={{
              readOnly: !isEditing,
              minimap: { enabled: false },
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              fontSize: editorFont.size,
              fontFamily: editorFont.family || DEFAULT_FONT_FAMILY,
              padding: { top: 12, bottom: 12 },
              wordWrap: 'on',
              automaticLayout: true,
            }}
          />
        </div>

        <div
          className="text-muted-foreground flex items-center gap-2"
          style={{ fontSize: 'var(--font-ui-size, 14px)' }}
        >
          <span>Tables:</span>
          {generatedSQL.referencedTables.map((table) => (
            <Badge
              key={table}
              variant="secondary"
              className="font-mono"
              style={{ fontSize: 'calc(var(--font-ui-size, 14px) * 0.85)' }}
            >
              {table}
            </Badge>
          ))}
          <span className="ml-auto">
            Dialect: {generatedSQL.dialect.toUpperCase()}
          </span>
        </div>

        <DialogFooter className="flex-row gap-2 sm:gap-2">
          <Button variant="outline" onClick={handleCancel}>
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button variant="outline" onClick={handleCopyToEditor}>
            Copy to Editor
          </Button>
          {!isEditing ? (
            <Button variant="outline" onClick={handleEdit}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
          ) : (
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Done Editing
            </Button>
          )}
          <Button
            onClick={handleExecute}
            className="bg-primary hover:bg-primary/90"
          >
            <Play className="mr-2 h-4 w-4" />
            Execute
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
