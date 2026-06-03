import type { PluginInfo, PluginListing } from './plugin-types';
import { Badge } from '@sqlpro/ui/badge';

import { Button } from '@sqlpro/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@sqlpro/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@sqlpro/ui/dropdown-menu';
import { Switch } from '@sqlpro/ui/switch';
import { Download, MoreHorizontal, Package, Trash2 } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import {
  getPluginAuthor,
  getPluginDescription,
  getPluginIcon,
  getPluginId,
  getPluginName,
  getPluginVersion,
  getStateBadgeVariant,
  getStateLabelKey,
  isPluginInfo,
} from './plugin-types';

// Re-export shared types so existing importers of './PluginCard' keep working.
export type {
  PluginInfo,
  PluginListing,
  PluginManifest,
  PluginPermission,
  PluginState,
} from './plugin-types';

// ============ PluginCard Component ============

export type PluginCardVariant = 'installed' | 'marketplace';
export type PluginCardLayout = 'grid' | 'list';

export interface PluginCardProps {
  /** Plugin data - either installed plugin info or marketplace listing */
  plugin: PluginInfo | PluginListing;
  /** Card variant determines available actions */
  variant: PluginCardVariant;
  /** Layout mode for the card */
  layout?: PluginCardLayout;
  /** Whether the plugin is currently being operated on (loading state) */
  isLoading?: boolean;
  /** Whether this plugin is already installed (for marketplace variant) */
  isInstalled?: boolean;
  /** Whether an update is available (for installed variant) */
  hasUpdate?: boolean;
  /** Callback when user clicks on the card to view details */
  onViewDetails?: (pluginId: string) => void;
  /** Callback when user enables/disables the plugin (installed variant only) */
  onToggleEnabled?: (pluginId: string, enabled: boolean) => void;
  /** Callback when user clicks install (marketplace variant only) */
  onInstall?: (pluginId: string) => void;
  /** Callback when user clicks uninstall (installed variant only) */
  onUninstall?: (pluginId: string) => void;
  /** Callback when user clicks update (installed variant only) */
  onUpdate?: (pluginId: string) => void;
  /** Additional class names */
  className?: string;
}

/**
 * PluginCard displays a plugin in a list or grid view.
 * Supports both installed plugins and marketplace listings with appropriate actions.
 */
export function PluginCard({
  plugin,
  variant,
  layout = 'grid',
  isLoading = false,
  isInstalled = false,
  hasUpdate = false,
  onViewDetails,
  onToggleEnabled,
  onInstall,
  onUninstall,
  onUpdate,
  className,
}: PluginCardProps) {
  const { t } = useTranslation();
  const pluginId = getPluginId(plugin);
  const pluginName = getPluginName(plugin);
  const pluginVersion = getPluginVersion(plugin);
  const pluginDescription = getPluginDescription(plugin);
  const pluginAuthor = getPluginAuthor(plugin);
  const pluginIcon = getPluginIcon(plugin);

  const isPluginInfoType = isPluginInfo(plugin);
  const pluginState = isPluginInfoType ? plugin.state : undefined;
  const isEnabled = isPluginInfoType ? plugin.enabled : false;
  const hasError = pluginState === 'error';
  const errorMessage = isPluginInfoType ? plugin.error : undefined;

  // Handle card click for viewing details
  const handleCardClick = React.useCallback(
    (e: React.MouseEvent) => {
      // Don't trigger if clicking on interactive elements
      const target = e.target as HTMLElement;
      if (
        target.closest('button') ||
        target.closest('[role="switch"]') ||
        target.closest('[role="menuitem"]')
      ) {
        return;
      }
      onViewDetails?.(pluginId);
    },
    [onViewDetails, pluginId]
  );

  // Handle enable/disable toggle
  const handleToggleEnabled = React.useCallback(
    (checked: boolean) => {
      onToggleEnabled?.(pluginId, checked);
    },
    [onToggleEnabled, pluginId]
  );

  // Handle install action
  const handleInstall = React.useCallback(() => {
    onInstall?.(pluginId);
  }, [onInstall, pluginId]);

  // Handle uninstall action
  const handleUninstall = React.useCallback(() => {
    onUninstall?.(pluginId);
  }, [onUninstall, pluginId]);

  // Handle update action
  const handleUpdate = React.useCallback(() => {
    onUpdate?.(pluginId);
  }, [onUpdate, pluginId]);

  // List layout renders a more compact horizontal card
  if (layout === 'list') {
    return (
      <Card
        data-slot="plugin-card"
        data-variant={variant}
        data-layout="list"
        className={cn(
          'hover:bg-accent/50 flex cursor-pointer flex-row items-center gap-4 px-4 py-3 transition-colors',
          isLoading && 'pointer-events-none opacity-60',
          hasError && 'border-destructive/50',
          className
        )}
        onClick={handleCardClick}
      >
        {/* Plugin Icon */}
        <div className="bg-muted rounded-base flex size-10 shrink-0 items-center justify-center overflow-hidden">
          {pluginIcon ? (
            <img
              src={pluginIcon}
              alt={`${pluginName} icon`}
              className="size-full object-cover"
            />
          ) : (
            <Package className="text-muted-foreground size-5" />
          )}
        </div>

        {/* Plugin Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-medium">{pluginName}</span>
            <span
              className="text-muted-foreground"
              style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
            >
              v{pluginVersion}
            </span>
            {variant === 'installed' && pluginState && (
              <Badge
                variant={getStateBadgeVariant(pluginState)}
                className="text-2xs px-1.5"
              >
                {t(getStateLabelKey(pluginState))}
              </Badge>
            )}
            {variant === 'marketplace' && isInstalled && (
              <Badge variant="secondary" className="text-2xs px-1.5">
                {t('pluginCard.installed')}
              </Badge>
            )}
            {hasUpdate && (
              <Badge variant="default" className="text-2xs px-1.5">
                {t('pluginCard.update')}
              </Badge>
            )}
          </div>
          <p
            className="text-muted-foreground truncate"
            style={{ fontSize: 'var(--font-ui-size, 13px)' }}
          >
            {pluginDescription}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {variant === 'installed' && onToggleEnabled && (
            <Switch
              checked={isEnabled}
              onCheckedChange={handleToggleEnabled}
              disabled={isLoading || hasError}
              aria-label={
                isEnabled
                  ? t('pluginCard.disablePlugin')
                  : t('pluginCard.enablePlugin')
              }
            />
          )}
          {variant === 'marketplace' && !isInstalled && onInstall && (
            <Button
              variant="accent"
              size="sm"
              onClick={handleInstall}
              disabled={isLoading}
            >
              <Download className="size-4" />
              {t('pluginCard.install')}
            </Button>
          )}
          {variant === 'installed' && (
            <DropdownMenu>
              <DropdownMenuTrigger>
                <Button variant="ghost" size="icon-sm" disabled={isLoading}>
                  <MoreHorizontal className="size-4" />
                  <span className="sr-only">
                    {t('pluginCard.pluginOptions')}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {hasUpdate && onUpdate && (
                  <>
                    <DropdownMenuItem onClick={handleUpdate}>
                      <Download className="size-4" />
                      {t('pluginCard.updatePlugin')}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                {onUninstall && (
                  <DropdownMenuItem
                    onClick={handleUninstall}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="size-4" />
                    {t('pluginCard.uninstall')}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </Card>
    );
  }

  // Grid layout renders a full card with header, content, and footer
  return (
    <Card
      data-slot="plugin-card"
      data-variant={variant}
      data-layout="grid"
      className={cn(
        'hover:bg-accent/30 cursor-pointer transition-colors',
        isLoading && 'pointer-events-none opacity-60',
        hasError && 'border-destructive/50',
        className
      )}
      onClick={handleCardClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start gap-3">
          {/* Plugin Icon */}
          <div className="bg-muted rounded-base flex size-12 shrink-0 items-center justify-center overflow-hidden">
            {pluginIcon ? (
              <img
                src={pluginIcon}
                alt={`${pluginName} icon`}
                className="size-full object-cover"
              />
            ) : (
              <Package className="text-muted-foreground size-6" />
            )}
          </div>

          {/* Title and Status */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle
                className="truncate"
                style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 1.15)' }}
              >
                {pluginName}
              </CardTitle>
              {variant === 'installed' && pluginState && (
                <Badge variant={getStateBadgeVariant(pluginState)}>
                  {t(getStateLabelKey(pluginState))}
                </Badge>
              )}
              {variant === 'marketplace' && isInstalled && (
                <Badge variant="secondary">{t('pluginCard.installed')}</Badge>
              )}
              {hasUpdate && (
                <Badge variant="default">{t('pluginCard.update')}</Badge>
              )}
            </div>
            <div className="mt-1 flex items-center gap-2">
              <span
                className="text-muted-foreground"
                style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
              >
                v{pluginVersion}
              </span>
              <span
                className="text-muted-foreground"
                style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
              >
                {t('pluginCard.byAuthor', { author: pluginAuthor })}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <CardDescription className="line-clamp-2">
          {pluginDescription}
        </CardDescription>
        {hasError && errorMessage && (
          <p
            className="text-destructive mt-2 line-clamp-2"
            style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
          >
            {errorMessage}
          </p>
        )}
      </CardContent>

      <CardFooter className="justify-between pt-0">
        {/* Marketplace downloads/rating info */}
        {variant === 'marketplace' && !isPluginInfoType && (
          <div
            className="text-muted-foreground flex items-center gap-3"
            style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
          >
            {'downloads' in plugin && plugin.downloads !== undefined && (
              <span>
                {t('pluginCard.downloads', { count: plugin.downloads })}
              </span>
            )}
            {'rating' in plugin && plugin.rating !== undefined && (
              <span>
                {t('pluginCard.stars', { rating: plugin.rating.toFixed(1) })}
              </span>
            )}
          </div>
        )}

        {/* Installed plugin enable toggle */}
        {variant === 'installed' && (
          <div className="flex-1" /> // Spacer
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
          {variant === 'installed' && onToggleEnabled && (
            <div className="flex items-center gap-2">
              <span
                className="text-muted-foreground"
                style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
              >
                {isEnabled ? t('pluginCard.enabled') : t('pluginCard.disabled')}
              </span>
              <Switch
                checked={isEnabled}
                onCheckedChange={handleToggleEnabled}
                disabled={isLoading || hasError}
                aria-label={
                  isEnabled
                    ? t('pluginCard.disablePlugin')
                    : t('pluginCard.enablePlugin')
                }
              />
            </div>
          )}
          {variant === 'marketplace' && !isInstalled && onInstall && (
            <Button
              variant="accent"
              size="sm"
              onClick={handleInstall}
              disabled={isLoading}
            >
              <Download className="size-4" />
              {t('pluginCard.install')}
            </Button>
          )}
          {variant === 'installed' && (
            <DropdownMenu>
              <DropdownMenuTrigger>
                <Button variant="ghost" size="icon-sm" disabled={isLoading}>
                  <MoreHorizontal className="size-4" />
                  <span className="sr-only">
                    {t('pluginCard.pluginOptions')}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {hasUpdate && onUpdate && (
                  <>
                    <DropdownMenuItem onClick={handleUpdate}>
                      <Download className="size-4" />
                      {t('pluginCard.updatePlugin')}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                {onUninstall && (
                  <DropdownMenuItem
                    onClick={handleUninstall}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="size-4" />
                    {t('pluginCard.uninstall')}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}

export default PluginCard;
