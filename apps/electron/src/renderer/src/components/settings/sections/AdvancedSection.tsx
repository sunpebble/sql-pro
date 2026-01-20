import type { AIProvider } from '@shared/types';
import { Button } from '@sqlpro/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@sqlpro/ui/command';
import { Input } from '@sqlpro/ui/input';
import { Label } from '@sqlpro/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@sqlpro/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@sqlpro/ui/select';
import {
  Check,
  ChevronRight,
  ChevronsUpDown,
  Eye,
  EyeOff,
  FolderSearch,
  Loader2,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { DEFAULT_MODELS, useAIStore, useDialogStore } from '@/stores';
import { SettingGroup } from '../items/SettingGroup';
import { SkeletonSettingsPanel } from './SkeletonSettingsPanel';

interface AdvancedSectionProps {
  onOpenChange?: (open: boolean) => void;
}

export function AdvancedSection({ onOpenChange }: AdvancedSectionProps) {
  return (
    <div className="space-y-6">
      {/* AI Settings */}
      <AISettingsPanel />

      {/* Developer Section */}
      <DeveloperPanel onOpenChange={onOpenChange} />
    </div>
  );
}

function AISettingsPanel() {
  const { t } = useTranslation('settings');
  const {
    provider,
    providerSettings,
    claudeCodePath,
    availableClaudeCodePaths,
    isLoading,
    isLoadingClaudeCodePaths,
    loadSettings,
    loadClaudeCodePaths,
    saveSettings,
  } = useAIStore();

  // Compute current provider's values reactively
  const currentSettings = providerSettings[provider] || {};
  const apiKey = currentSettings.apiKey || '';
  const model = currentSettings.model || '';
  const baseUrl = currentSettings.baseUrl || '';

  const [showApiKey, setShowApiKey] = useState(false);
  const [modelPopoverOpen, setModelPopoverOpen] = useState(false);
  const [claudeCodePathPopoverOpen, setClaudeCodePathPopoverOpen] =
    useState(false);

  // Claude Code info state
  const [claudeCodeInfo, setClaudeCodeInfo] = useState<{
    version: string;
    path: string;
  } | null>(null);
  const [isLoadingClaudeCodeInfo, setIsLoadingClaudeCodeInfo] = useState(false);

  // Dynamic models state
  const [dynamicModels, setDynamicModels] = useState<string[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [modelsError, setModelsError] = useState<string | null>(null);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
    loadClaudeCodePaths();
  }, [loadSettings, loadClaudeCodePaths]);

  // Fetch Claude Code info when path changes
  useEffect(() => {
    if (!claudeCodePath) {
      // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
      setClaudeCodeInfo(null);
      return;
    }

    let cancelled = false;
    const fetchClaudeCodeInfo = async () => {
      setIsLoadingClaudeCodeInfo(true);
      try {
        const result = await window.sqlPro.ai.getClaudeCodeInfo({
          path: claudeCodePath,
        });
        if (!cancelled) {
          if (result.success && result.info) {
            setClaudeCodeInfo(result.info);
          } else {
            setClaudeCodeInfo(null);
          }
        }
      } catch {
        if (!cancelled) {
          setClaudeCodeInfo(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingClaudeCodeInfo(false);
        }
      }
    };

    const timeoutId = setTimeout(fetchClaudeCodeInfo, 300);
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [claudeCodePath]);

  // Debounced effect for fetching models
  useEffect(() => {
    if (!apiKey) {
      // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
      setDynamicModels(DEFAULT_MODELS[provider]);
      return;
    }

    let cancelled = false;
    const fetchModels = async () => {
      setIsLoadingModels(true);
      setModelsError(null);

      try {
        const result = await window.sqlPro.ai.listModels({
          provider,
          baseUrl: baseUrl || undefined,
          apiKey,
        });

        if (!cancelled) {
          if (result.success && result.models) {
            setDynamicModels(result.models);
          } else {
            setModelsError(result.error || t('ai.failedToFetchModels'));
            setDynamicModels(DEFAULT_MODELS[provider]);
          }
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to fetch models:', error);
          setModelsError(t('ai.failedToFetchModels'));
          setDynamicModels(DEFAULT_MODELS[provider]);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingModels(false);
        }
      }
    };

    const timeoutId = setTimeout(fetchModels, 500);
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [provider, apiKey, baseUrl]);

  const handleProviderChange = (newProvider: AIProvider) => {
    setDynamicModels(DEFAULT_MODELS[newProvider]);
    saveSettings({ provider: newProvider });
  };

  const handleApiKeyChange = (newApiKey: string) => {
    saveSettings({ apiKey: newApiKey });
  };

  const handleModelChange = (newModel: string) => {
    saveSettings({ model: newModel });
  };

  const handleBaseUrlChange = (newBaseUrl: string) => {
    saveSettings({ baseUrl: newBaseUrl });
  };

  const handleClaudeCodePathChange = (newPath: string) => {
    saveSettings({ claudeCodePath: newPath });
  };

  const availableModels =
    dynamicModels.length > 0 ? dynamicModels : DEFAULT_MODELS[provider];

  if (isLoading) {
    return (
      <SettingGroup title={t('ai.title')}>
        <SkeletonSettingsPanel />
      </SettingGroup>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4" />
        <Label className="text-sm font-medium">{t('ai.title')}</Label>
      </div>

      {/* Provider Selection */}
      <div className="space-y-2">
        <Label htmlFor="provider-select" className="text-xs font-medium">
          {t('ai.provider')}
        </Label>
        <Select
          value={provider}
          onValueChange={(v) => v && handleProviderChange(v)}
        >
          <SelectTrigger id="provider-select" className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="min-w-[180px]">
            <SelectItem value="anthropic" className="text-xs">
              Anthropic (Claude)
            </SelectItem>
            <SelectItem value="openai" className="text-xs">
              OpenAI
            </SelectItem>
            <SelectItem value="custom" className="text-xs">
              {t('ai.custom')}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Base URL */}
      <div className="space-y-2">
        <Label htmlFor="base-url-input" className="text-xs font-medium">
          {t('ai.baseUrl')}
        </Label>
        <Input
          id="base-url-input"
          type="text"
          value={baseUrl}
          onChange={(e) => handleBaseUrlChange(e.target.value)}
          placeholder={
            provider === 'anthropic'
              ? 'https://api.anthropic.com'
              : provider === 'openai'
                ? 'https://api.openai.com/v1'
                : 'https://api.custom.com'
          }
          className="h-8 text-xs"
        />
        <p className="text-muted-foreground text-xs">
          {t('ai.baseUrlHint', {
            defaultValue:
              'Leave empty to use default API endpoint, or set a custom URL for proxy/compatible endpoints',
          })}
        </p>
      </div>

      {/* API Key Input */}
      <div className="space-y-2">
        <Label htmlFor="api-key-input" className="text-xs font-medium">
          {t('ai.apiKey')} <span className="text-red-500">*</span>
        </Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              id="api-key-input"
              type={showApiKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => handleApiKeyChange(e.target.value)}
              placeholder={t('ai.apiKeyPlaceholder', {
                defaultValue: 'Enter your API key',
              })}
              className="h-8 pr-10 text-xs"
            />
            <button
              onClick={() => setShowApiKey(!showApiKey)}
              className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
            >
              {showApiKey ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Model Selection */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label className="text-xs font-medium">{t('ai.model')}</Label>
          {isLoadingModels && <Loader2 className="h-3 w-3 animate-spin" />}
          {modelsError && (
            <span className="text-destructive text-xs">
              {t('ai.modelsFetchError', {
                defaultValue: 'Failed to fetch models, using defaults',
              })}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <Input
            value={model}
            onChange={(e) => handleModelChange(e.target.value)}
            placeholder={t('ai.inputModel', {
              defaultValue: 'Enter model name...',
            })}
            className="h-8 flex-1 text-xs"
            disabled={isLoadingModels}
          />
          <Popover
            open={modelPopoverOpen}
            onOpenChange={setModelPopoverOpen}
            modal
          >
            <PopoverTrigger>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 shrink-0"
                disabled={isLoadingModels || availableModels.length === 0}
              >
                <ChevronsUpDown className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[280px] p-0" align="end">
              <Command>
                <CommandInput
                  placeholder={t('ai.searchModels', {
                    defaultValue: 'Search models...',
                  })}
                  className="h-8 text-xs"
                />
                <CommandEmpty>
                  <p className="text-muted-foreground p-2 text-center text-xs">
                    {t('ai.noModelFound', { defaultValue: 'No model found.' })}
                  </p>
                </CommandEmpty>
                <CommandGroup>
                  <CommandList>
                    {availableModels.map((m) => (
                      <CommandItem
                        key={m}
                        value={m}
                        onSelect={() => {
                          handleModelChange(m);
                          setModelPopoverOpen(false);
                        }}
                        className="text-xs"
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            model === m ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        {m}
                      </CommandItem>
                    ))}
                  </CommandList>
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Claude Code Path */}
      <div className="space-y-2">
        <Label className="text-xs font-medium">{t('ai.claudeCodePath')}</Label>
        <div className="flex gap-2">
          <Input
            value={claudeCodePath}
            onChange={(e) => handleClaudeCodePathChange(e.target.value)}
            placeholder={t('ai.inputPath', {
              defaultValue: 'Enter Claude Code path...',
            })}
            className="h-8 flex-1 text-xs"
          />
          <Popover
            open={claudeCodePathPopoverOpen}
            onOpenChange={setClaudeCodePathPopoverOpen}
            modal
          >
            <PopoverTrigger>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 shrink-0"
                disabled={
                  isLoadingClaudeCodePaths ||
                  availableClaudeCodePaths.length === 0
                }
              >
                {isLoadingClaudeCodePaths ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ChevronsUpDown className="h-4 w-4" />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[320px] p-0" align="end">
              <Command>
                <CommandInput
                  placeholder={t('ai.searchPaths', {
                    defaultValue: 'Search paths...',
                  })}
                  className="h-8 text-xs"
                />
                <CommandEmpty>
                  <p className="text-muted-foreground p-2 text-center text-xs">
                    {t('ai.noPathFound', { defaultValue: 'No path found.' })}
                  </p>
                </CommandEmpty>
                <CommandGroup>
                  <CommandList>
                    {availableClaudeCodePaths.map((path) => (
                      <CommandItem
                        key={path}
                        value={path}
                        onSelect={() => {
                          handleClaudeCodePathChange(path);
                          setClaudeCodePathPopoverOpen(false);
                        }}
                        className="text-xs"
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            claudeCodePath === path
                              ? 'opacity-100'
                              : 'opacity-0'
                          )}
                        />
                        <FolderSearch className="mr-2 h-4 w-4" />
                        <span className="truncate">{path}</span>
                      </CommandItem>
                    ))}
                  </CommandList>
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
        {/* Claude Code Version Info */}
        {claudeCodePath && (
          <div className="bg-muted/50 mt-2 rounded-md px-3 py-2">
            {isLoadingClaudeCodeInfo ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span className="text-muted-foreground text-xs">
                  {t('ai.loadingInfo', {
                    defaultValue: 'Loading Claude Code info...',
                  })}
                </span>
              </div>
            ) : claudeCodeInfo ? (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-xs">
                    {t('ai.version', { defaultValue: 'Version' })}:
                  </span>
                  <span className="text-xs font-medium">
                    {claudeCodeInfo.version}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-destructive text-xs">
                  {t('ai.pathNotFound', {
                    defaultValue: 'Claude Code not found at this path',
                  })}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface DeveloperPanelProps {
  onOpenChange?: (open: boolean) => void;
}

function DeveloperPanel({ onOpenChange }: DeveloperPanelProps) {
  const { t } = useTranslation('settings');
  const openMemoryMonitor = useDialogStore((s) => s.openMemoryMonitor);

  const handleOpenMemoryMonitor = () => {
    // Close settings dialog and open memory monitor
    onOpenChange?.(false);
    openMemoryMonitor();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Zap className="h-4 w-4" />
        <Label className="text-sm font-medium">{t('developer.title')}</Label>
      </div>

      <button
        onClick={handleOpenMemoryMonitor}
        className="hover:border-gold hover:bg-muted flex w-full items-center justify-between rounded-lg border p-3 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-full">
            <Zap className="text-muted-foreground h-5 w-5" />
          </div>
          <div className="text-left">
            <span className="text-sm font-medium">
              {t('developer.memoryMonitor')}
            </span>
            <p className="text-muted-foreground text-xs">
              {t('developer.memoryMonitorDescription')}
            </p>
          </div>
        </div>
        <ChevronRight className="text-muted-foreground h-5 w-5" />
      </button>

      <p className="text-muted-foreground text-xs">
        Access via menu: View → Developer → Memory Monitor (⌘⇧M)
      </p>
    </div>
  );
}
