import type { PluginInfo } from '@/components/plugins/PluginCard';
import { Button } from '@quarry/ui/button';
import { useNavigate } from '@tanstack/react-router';
import { ArrowLeft, Store } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PluginManager } from '@/components/plugins/PluginManager';
import { PluginMarketplace } from '@/components/plugins/PluginMarketplace';

/**
 * Plugins page route component.
 * Displays the plugin manager with installed plugins and access to the marketplace.
 */
export function PluginsPage() {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const [marketplaceOpen, setMarketplaceOpen] = useState(false);
  const [installedPlugins, setInstalledPlugins] = useState<PluginInfo[]>([]);

  const handleBack = () => {
    navigate({ to: '/' });
  };

  const handlePluginsChange = (plugins: PluginInfo[]) => {
    setInstalledPlugins(plugins);
  };

  const handlePluginInstalled = () => {
    // The PluginManager will automatically refresh via event subscription
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            aria-label={t('plugins.goBack')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1
              className="font-semibold"
              style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 1.15)' }}
            >
              {t('plugins.title')}
            </h1>
            <p
              className="text-muted-foreground"
              style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
            >
              {t('plugins.description')}
            </p>
          </div>
        </div>
        <Button
          variant="accent"
          onClick={() => setMarketplaceOpen(true)}
          data-action="open-marketplace"
        >
          <Store className="mr-2 h-4 w-4" />
          {t('plugins.browseMarketplace')}
        </Button>
      </div>

      {/* Plugin Manager */}
      <div className="min-h-0 flex-1">
        <PluginManager onPluginsChange={handlePluginsChange} />
      </div>

      {/* Marketplace Dialog */}
      <PluginMarketplace
        open={marketplaceOpen}
        onOpenChange={setMarketplaceOpen}
        installedPlugins={installedPlugins}
        onPluginInstalled={handlePluginInstalled}
      />
    </div>
  );
}
