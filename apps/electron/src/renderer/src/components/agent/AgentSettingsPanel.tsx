// Agent Settings Panel
// Configuration for AI Agent API and execution settings

import type {
  AgentConfig,
  AgentExecutionSettings,
  AgentSettings,
} from '@shared/types/agent';
import { Button } from '@sqlpro/ui/button';
import { Input } from '@sqlpro/ui/input';
import { Label } from '@sqlpro/ui/label';
import { Switch } from '@sqlpro/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@sqlpro/ui/tabs';
import { Eye, EyeOff } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface AgentSettingsPanelProps {
  settings: AgentSettings | null;
  onSave: (settings: Partial<AgentSettings>) => Promise<void>;
  onCancel?: () => void;
}

export function AgentSettingsPanel({
  settings,
  onSave,
  onCancel,
}: AgentSettingsPanelProps) {
  const { t } = useTranslation();
  const [isSaving, setIsSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  // Config state
  const [config, setConfig] = useState<AgentConfig>(
    settings?.config || {
      baseUrl: '',
      apiKey: '',
      model: '',
    }
  );

  // Execution settings state
  const [execution, setExecution] = useState<AgentExecutionSettings>(
    settings?.execution || {
      autoExecuteSelect: true,
      autoExecuteInsert: false,
      autoExecuteUpdate: false,
      autoExecuteDelete: false,
      confirmDDL: true,
      queryTimeout: 30000,
    }
  );

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      await onSave({ config, execution });
    } finally {
      setIsSaving(false);
    }
  }, [config, execution, onSave]);

  return (
    <div className="space-y-6">
      <Tabs defaultValue="api" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="api">
            {t('agent.settings.api', 'API Configuration')}
          </TabsTrigger>
          <TabsTrigger value="execution">
            {t('agent.settings.execution', 'Execution')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="api" className="mt-4 space-y-4">
          {/* Base URL */}
          <div className="space-y-2">
            <Label htmlFor="baseUrl">
              {t('agent.settings.baseUrl', 'API Base URL')}
            </Label>
            <Input
              id="baseUrl"
              value={config.baseUrl}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setConfig((prev) => ({ ...prev, baseUrl: e.target.value }))
              }
              placeholder="https://api.openai.com/v1"
            />
            <p className="text-muted-foreground text-xs">
              {t(
                'agent.settings.baseUrlHelp',
                'Leave empty for default OpenAI API. Supports OpenAI, Anthropic, and compatible providers.'
              )}
            </p>
          </div>

          {/* API Key */}
          <div className="space-y-2">
            <Label htmlFor="apiKey">
              {t('agent.settings.apiKey', 'API Key')}
            </Label>
            <div className="relative">
              <Input
                id="apiKey"
                type={showApiKey ? 'text' : 'password'}
                value={config.apiKey}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setConfig((prev) => ({ ...prev, apiKey: e.target.value }))
                }
                placeholder="sk-..."
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute top-0 right-0"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Model */}
          <div className="space-y-2">
            <Label htmlFor="model">{t('agent.settings.model', 'Model')}</Label>
            <Input
              id="model"
              value={config.model}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setConfig((prev) => ({ ...prev, model: e.target.value }))
              }
              placeholder="gpt-4o-mini"
            />
            <p className="text-muted-foreground text-xs">
              {t(
                'agent.settings.modelHelp',
                'Model identifier (e.g., gpt-4o, claude-sonnet-4-20250514)'
              )}
            </p>
          </div>
        </TabsContent>

        <TabsContent value="execution" className="mt-4 space-y-4">
          <div className="space-y-4">
            <div className="rounded-lg border p-4">
              <h4 className="mb-3 font-medium">
                {t('agent.settings.autoExecute', 'Auto-Execute Settings')}
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="autoSelect" className="cursor-pointer">
                    SELECT {t('agent.settings.queries', 'queries')}
                  </Label>
                  <Switch
                    id="autoSelect"
                    checked={execution.autoExecuteSelect}
                    onCheckedChange={(checked: boolean) =>
                      setExecution((prev) => ({
                        ...prev,
                        autoExecuteSelect: checked,
                      }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="autoInsert" className="cursor-pointer">
                    INSERT {t('agent.settings.statements', 'statements')}
                  </Label>
                  <Switch
                    id="autoInsert"
                    checked={execution.autoExecuteInsert}
                    onCheckedChange={(checked: boolean) =>
                      setExecution((prev) => ({
                        ...prev,
                        autoExecuteInsert: checked,
                      }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="autoUpdate" className="cursor-pointer">
                    UPDATE {t('agent.settings.statements', 'statements')}
                  </Label>
                  <Switch
                    id="autoUpdate"
                    checked={execution.autoExecuteUpdate}
                    onCheckedChange={(checked: boolean) =>
                      setExecution((prev) => ({
                        ...prev,
                        autoExecuteUpdate: checked,
                      }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="autoDelete" className="cursor-pointer">
                    DELETE {t('agent.settings.statements', 'statements')}
                  </Label>
                  <Switch
                    id="autoDelete"
                    checked={execution.autoExecuteDelete}
                    onCheckedChange={(checked: boolean) =>
                      setExecution((prev) => ({
                        ...prev,
                        autoExecuteDelete: checked,
                      }))
                    }
                  />
                </div>
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="confirmDDL" className="cursor-pointer">
                    {t('agent.settings.confirmDDL', 'Confirm DDL Operations')}
                  </Label>
                  <p className="text-muted-foreground text-xs">
                    {t(
                      'agent.settings.confirmDDLHelp',
                      'Always require confirmation for DROP, ALTER, TRUNCATE'
                    )}
                  </p>
                </div>
                <Switch
                  id="confirmDDL"
                  checked={execution.confirmDDL}
                  onCheckedChange={(checked: boolean) =>
                    setExecution((prev) => ({
                      ...prev,
                      confirmDDL: checked,
                    }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timeout">
                {t('agent.settings.timeout', 'Query Timeout (ms)')}
              </Label>
              <Input
                id="timeout"
                type="number"
                value={execution.queryTimeout}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setExecution((prev) => ({
                    ...prev,
                    queryTimeout: Number.parseInt(e.target.value, 10) || 30000,
                  }))
                }
                min={1000}
                max={300000}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            {t('common.cancel', 'Cancel')}
          </Button>
        )}
        <Button onClick={handleSave} disabled={isSaving || !config.apiKey}>
          {isSaving
            ? t('common.saving', 'Saving...')
            : t('common.save', 'Save')}
        </Button>
      </div>
    </div>
  );
}
