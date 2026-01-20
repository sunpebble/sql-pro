import type { PluginInfo } from '@/components/plugins/PluginCard';
import { Button } from '@sqlpro/ui/button';
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
            <h1 className="text-lg font-semibold">{t('plugins.title')}</h1>
            <p className="text-muted-foreground text-sm">
              {t('plugins.description')}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => setMarketplaceOpen(true)}
          data-action="open-marketplace"
          className="border-gold bg-gold/15 text-gold hover:bg-gold/25"
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
