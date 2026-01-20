import type { SchemaInfo } from '@shared/types';
import { Button } from '@sqlpro/ui/button';
import { ScrollArea } from '@sqlpro/ui/scroll-area';
import { Textarea } from '@sqlpro/ui/textarea';
import {
  AlertCircle,
  ArrowRight,
  Loader2,
  Settings2,
  Sparkles,
  Wand2,
} from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ProGate } from '@/components/pro/ProGate';
import { SettingsDialog } from '@/components/SettingsDialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SqlHighlight } from '@/components/ui/sql-highlight';
import { useNLToSQL } from '@/hooks/useAI';

interface NLToSQLDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schema: SchemaInfo[];
  onSQLGenerated: (sql: string) => void;
}

export function NLToSQLDialog({
  open,
  onOpenChange,
  schema,
  onSQLGenerated,
}: NLToSQLDialogProps) {
  const { t } = useTranslation('common');
  const [prompt, setPrompt] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  const { generateSQL, generatedSQL, isGenerating, error, isConfigured } =
    useNLToSQL({
      schema,
    });

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    await generateSQL(prompt);
  };

  const handleUseSQL = () => {
    if (generatedSQL) {
      onSQLGenerated(generatedSQL);
      onOpenChange(false);
      setPrompt('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleGenerate();
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-150">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5" />
              Natural Language to SQL
            </DialogTitle>
            <DialogDescription>
              Describe what you want to query in plain English, and AI will
              generate the SQL for you.
            </DialogDescription>
          </DialogHeader>

          <ProGate feature="ai-nl-to-sql">
            <div className="grid gap-4 py-4">
              {/* Configuration Warning */}
              {!isConfigured && (
                <div className="bg-warning/10 border-warning/50 flex items-start gap-3 rounded-lg border p-3">
                  <AlertCircle className="text-warning mt-0.5 h-5 w-5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {t('nlToSQL.aiNotConfigured')}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {t('nlToSQL.aiNotConfiguredDescription')}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSettings(true)}
                  >
                    <Settings2 className="mr-1 h-3 w-3" />
                    {t('nlToSQL.configure')}
                  </Button>
                </div>
              )}

              {/* Prompt Input */}
              <div className="grid gap-2">
                <Textarea
                  placeholder={t('nlToSQL.promptPlaceholder')}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={3}
                  disabled={isGenerating}
                  className="resize-none"
                />
                <div className="flex items-center justify-between">
                  <p className="text-muted-foreground text-xs">
                    {t('nlToSQL.pressToGenerate')}
                  </p>
                  <Button
                    size="sm"
                    onClick={handleGenerate}
                    disabled={!prompt.trim() || isGenerating || !isConfigured}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('nlToSQL.generating')}
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        {t('nlToSQL.generateSQL')}
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <div className="bg-destructive/10 border-destructive/50 flex items-start gap-3 rounded-lg border p-3">
                  <AlertCircle className="text-destructive mt-0.5 h-5 w-5 shrink-0" />
                  <div>
                    <p className="text-destructive text-sm font-medium">
                      {t('nlToSQL.error')}
                    </p>
                    <p className="text-destructive/80 text-xs">{error}</p>
                  </div>
                </div>
              )}

              {/* Generated SQL */}
              {generatedSQL && (
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">
                      {t('nlToSQL.generatedSQL')}
                    </p>
                    <Button size="sm" onClick={handleUseSQL}>
                      {t('nlToSQL.useThisSQL')}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                  <ScrollArea className="h-50">
                    <div className="bg-muted rounded-lg p-4">
                      <SqlHighlight code={generatedSQL} className="text-sm" />
                    </div>
                  </ScrollArea>
                </div>
              )}

              {/* Schema Context Info */}
              <div className="text-muted-foreground border-t pt-4 text-xs">
                <p>
                  <strong>{t('nlToSQL.availableTables')}:</strong>{' '}
                  {schema
                    .flatMap((s) =>
                      [...s.tables, ...s.views].map((tbl) => tbl.name)
                    )
                    .join(', ') || t('nlToSQL.noTablesLoaded')}
                </p>
              </div>
            </div>
          </ProGate>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <SettingsDialog open={showSettings} onOpenChange={setShowSettings} />
    </>
  );
}
