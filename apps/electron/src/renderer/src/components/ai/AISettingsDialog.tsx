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
  ChevronsUpDown,
  Eye,
  EyeOff,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ProBadge } from '@/components/pro/ProBadge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { DEFAULT_MODELS, useAIStore } from '@/stores';

interface AISettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AISettingsDialog({
  open,
  onOpenChange,
}: AISettingsDialogProps) {
  const { t } = useTranslation('common');
  const {
    provider,
    apiKey,
    model,
    baseUrl,
    isLoading,
    isSaving,
    loadSettings,
    saveSettings,
  } = useAIStore();

  const [showApiKey, setShowApiKey] = useState(false);
  const [modelPopoverOpen, setModelPopoverOpen] = useState(false);

  // Create a key that changes when store values change to reset local state
  const storeKey = useMemo(
    () => `${apiKey}-${provider}-${model}-${baseUrl}`,
    [apiKey, provider, model, baseUrl]
  );

  // Use a ref to track the last sync key, avoiding unnecessary state updates
  const lastSyncKeyRef = useRef(storeKey);

  // Initialize with current store values
  const [localApiKey, setLocalApiKey] = useState(() => apiKey);
  const [localProvider, setLocalProvider] = useState<AIProvider>(
    () => provider
  );
  const [localModel, setLocalModel] = useState(() => model);
  const [localBaseUrl, setLocalBaseUrl] = useState(() => baseUrl);

  // Load settings when dialog opens
  useEffect(() => {
    if (open) {
      loadSettings();
    }
  }, [open, loadSettings]);

  // Reset local state when store values change (only on actual changes)
  if (storeKey !== lastSyncKeyRef.current) {
    lastSyncKeyRef.current = storeKey;
    setLocalApiKey(apiKey);
    setLocalProvider(provider);
    setLocalModel(model);
    setLocalBaseUrl(baseUrl);
  }

  const handleProviderChange = (newProvider: AIProvider) => {
    setLocalProvider(newProvider);
    // Reset to first model of new provider
    setLocalModel(DEFAULT_MODELS[newProvider][0]);
    // Reset base URL when switching providers
    setLocalBaseUrl('');
  };

  const handleSave = async () => {
    const success = await saveSettings({
      provider: localProvider,
      apiKey: localApiKey,
      model: localModel,
      baseUrl: localBaseUrl,
    });
    if (success) {
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    // Reset to store values
    setLocalApiKey(apiKey);
    setLocalProvider(provider);
    setLocalModel(model);
    setLocalBaseUrl(baseUrl);
    onOpenChange(false);
  };

  const availableModels = DEFAULT_MODELS[localProvider];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-106.25">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            {t('aiSettings.title')}
            <ProBadge size="sm" />
          </DialogTitle>
          <DialogDescription>{t('aiSettings.description')}</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="grid gap-4 py-4">
            {/* Provider Selection */}
            <div className="grid gap-2">
              <Label htmlFor="provider">{t('aiSettings.provider')}</Label>
              <Select
                value={localProvider}
                onValueChange={(value: string) =>
                  handleProviderChange(value as AIProvider)
                }
              >
                <SelectTrigger id="provider">
                  <SelectValue placeholder={t('aiSettings.selectProvider')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="openai">OpenAI</SelectItem>
                  <SelectItem value="anthropic">Anthropic</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* API Key Input */}
            <div className="grid gap-2">
              <Label htmlFor="apiKey">{t('aiSettings.apiKey')}</Label>
              <div className="relative">
                <Input
                  id="apiKey"
                  type={showApiKey ? 'text' : 'password'}
                  value={localApiKey}
                  onChange={(e) => setLocalApiKey(e.target.value)}
                  placeholder={
                    localProvider === 'openai' ? 'sk-...' : 'sk-ant-...'
                  }
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-0 right-0 h-full px-3"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-muted-foreground text-xs">
                {t('aiSettings.apiKeySecure')}
              </p>
            </div>

            {/* Base URL Input */}
            <div className="grid gap-2">
              <Label htmlFor="baseUrl">{t('aiSettings.baseUrl')}</Label>
              <Input
                id="baseUrl"
                type="text"
                value={localBaseUrl}
                onChange={(e) => setLocalBaseUrl(e.target.value)}
                placeholder={
                  localProvider === 'openai'
                    ? 'https://api.openai.com/v1'
                    : 'https://api.anthropic.com'
                }
              />
              <p className="text-muted-foreground text-xs">
                {t('aiSettings.baseUrlDescription', {
                  provider: localProvider === 'openai' ? 'OpenAI' : 'Anthropic',
                })}
              </p>
            </div>

            {/* Model Selection with Custom Input */}
            <div className="grid gap-2">
              <Label htmlFor="model">{t('aiSettings.model')}</Label>
              <Popover
                open={modelPopoverOpen}
                onOpenChange={setModelPopoverOpen}
              >
                <PopoverTrigger>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={modelPopoverOpen}
                    className="w-full justify-between font-normal"
                  >
                    {localModel || t('aiSettings.selectOrEnterModel')}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-(--radix-popover-trigger-width) p-0"
                  align="start"
                >
                  <Command>
                    <CommandInput
                      placeholder={t('aiSettings.searchOrEnterModel')}
                      value={localModel}
                      onValueChange={setLocalModel}
                    />
                    <CommandList>
                      <CommandEmpty>
                        <div className="py-2 text-sm">
                          {t('aiSettings.pressEnterToUse', {
                            model: localModel,
                          })}
                        </div>
                      </CommandEmpty>
                      <CommandGroup heading={t('aiSettings.suggestedModels')}>
                        {availableModels.map((m) => (
                          <CommandItem
                            key={m}
                            value={m}
                            onSelect={(currentValue) => {
                              setLocalModel(currentValue);
                              setModelPopoverOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                'mr-2 h-4 w-4',
                                localModel === m ? 'opacity-100' : 'opacity-0'
                              )}
                            />
                            {m}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <p className="text-muted-foreground text-xs">
                {t('aiSettings.modelDescription')}
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
            {t('aiSettings.cancel')}
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !localApiKey}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('aiSettings.saving')}
              </>
            ) : (
              t('aiSettings.saveSettings')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
