import type {
  PluginInfo,
  PluginListing,
  PluginPermission,
} from './plugin-types';
import { Badge } from '@sqlpro/ui/badge';

import { Button } from '@sqlpro/ui/button';
import { ScrollArea } from '@sqlpro/ui/scroll-area';
import { Separator } from '@sqlpro/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@sqlpro/ui/sheet';
import { Switch } from '@sqlpro/ui/switch';
import {
  AlertCircle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  Github,
  Globe,
  Loader2,
  Package,
  Shield,
  Trash2,
  User,
} from 'lucide-react';
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

// ============ Detail-only Helper Functions ============

/**
 * Get plugin homepage from either PluginInfo or PluginListing
 */
function getPluginHomepage(
  plugin: PluginInfo | PluginListing
): string | undefined {
  return isPluginInfo(plugin) ? plugin.manifest.homepage : plugin.homepage;
}

/**
 * Get plugin repository from either PluginInfo or PluginListing
 */
function getPluginRepository(
  plugin: PluginInfo | PluginListing
): string | undefined {
  return isPluginInfo(plugin) ? plugin.manifest.repository : plugin.repository;
}

/**
 * Get plugin screenshots from either PluginInfo or PluginListing
 */
function getPluginScreenshots(
  plugin: PluginInfo | PluginListing
): string[] | undefined {
  return isPluginInfo(plugin)
    ? plugin.manifest.screenshots
    : plugin.screenshots;
}

/**
 * Get plugin permissions from either PluginInfo or PluginListing
 */
function getPluginPermissions(
  plugin: PluginInfo | PluginListing
): PluginPermission[] | undefined {
  return isPluginInfo(plugin)
    ? plugin.manifest.permissions
    : plugin.permissions;
}

/**
 * Get plugin license from PluginInfo (not available in PluginListing)
 */
function getPluginLicense(
  plugin: PluginInfo | PluginListing
): string | undefined {
  return isPluginInfo(plugin) ? plugin.manifest.license : undefined;
}

/**
 * Get plugin keywords from PluginInfo or categories from PluginListing
 */
function getPluginKeywords(
  plugin: PluginInfo | PluginListing
): string[] | undefined {
  return isPluginInfo(plugin) ? plugin.manifest.keywords : plugin.categories;
}

/**
 * Get permission label key
 */
function getPermissionLabelKey(permission: PluginPermission): string {
  return `pluginDetail.permissionLabels.${permission}`;
}

/**
 * Get permission description key
 */
function getPermissionDescriptionKey(permission: PluginPermission): string {
  return `pluginDetail.permissionDescriptions.${permission}`;
}

/**
 * Format date string for display
 */
function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
}

// ============ PluginDetailView Component ============

export type PluginDetailVariant = 'installed' | 'marketplace';

export interface PluginDetailViewProps {
  /** Whether the detail view is open */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
  /** Plugin data - either installed plugin info or marketplace listing */
  plugin: PluginInfo | PluginListing | null;
  /** Detail view variant determines available actions */
  variant: PluginDetailVariant;
  /** Whether the plugin is currently being operated on (loading state) */
  isLoading?: boolean;
  /** Whether this plugin is already installed (for marketplace variant) */
  isInstalled?: boolean;
  /** Whether an update is available (for installed variant) */
  hasUpdate?: boolean;
  /** Available update version (for installed variant) */
  updateVersion?: string;
  /** Callback when user enables/disables the plugin (installed variant only) */
  onToggleEnabled?: (pluginId: string, enabled: boolean) => void;
  /** Callback when user clicks install (marketplace variant only) */
  onInstall?: (pluginId: string) => void;
  /** Callback when user clicks uninstall (installed variant only) */
  onUninstall?: (pluginId: string) => void;
  /** Callback when user clicks update (installed variant only) */
  onUpdate?: (pluginId: string) => void;
}

/**
 * PluginDetailView displays detailed information about a plugin in a slide-out sheet.
 * Shows plugin metadata, permissions, screenshots, and action buttons.
 */
export function PluginDetailView({
  open,
  onOpenChange,
  plugin,
  variant,
  isLoading = false,
  isInstalled = false,
  hasUpdate = false,
  updateVersion,
  onToggleEnabled,
  onInstall,
  onUninstall,
  onUpdate,
}: PluginDetailViewProps) {
  const { t } = useTranslation();
  // State for screenshot carousel
  const [currentScreenshotIndex, setCurrentScreenshotIndex] = React.useState(0);

  // Track previous plugin ID to reset screenshot index when plugin changes
  const prevPluginIdRef = React.useRef<string | null>(null);
  const currentPluginId = plugin ? getPluginId(plugin) : null;

  if (currentPluginId !== prevPluginIdRef.current) {
    prevPluginIdRef.current = currentPluginId;
    if (currentScreenshotIndex !== 0) {
      setCurrentScreenshotIndex(0);
    }
  }

  // Early return if no plugin
  if (!plugin) {
    return null;
  }

  const pluginId = getPluginId(plugin);
  const pluginName = getPluginName(plugin);
  const pluginVersion = getPluginVersion(plugin);
  const pluginDescription = getPluginDescription(plugin);
  const pluginAuthor = getPluginAuthor(plugin);
  const pluginIcon = getPluginIcon(plugin);
  const pluginHomepage = getPluginHomepage(plugin);
  const pluginRepository = getPluginRepository(plugin);
  const pluginScreenshots = getPluginScreenshots(plugin);
  const pluginPermissions = getPluginPermissions(plugin);
  const pluginLicense = getPluginLicense(plugin);
  const pluginKeywords = getPluginKeywords(plugin);

  const isPluginInfoType = isPluginInfo(plugin);
  const pluginState = isPluginInfoType ? plugin.state : undefined;
  const isEnabled = isPluginInfoType ? plugin.enabled : false;
  const hasError = pluginState === 'error';
  const errorMessage = isPluginInfoType ? plugin.error : undefined;
  const installedAt = isPluginInfoType ? plugin.installedAt : undefined;
  const updatedAt = isPluginInfoType
    ? plugin.updatedAt
    : (plugin as PluginListing).updatedAt;
  const downloads = !isPluginInfoType
    ? (plugin as PluginListing).downloads
    : undefined;
  const rating = !isPluginInfoType
    ? (plugin as PluginListing).rating
    : undefined;

  // Screenshot navigation
  const screenshotCount = pluginScreenshots?.length || 0;
  const hasScreenshots = screenshotCount > 0;

  const handlePrevScreenshot = () => {
    setCurrentScreenshotIndex((prev) =>
      prev === 0 ? screenshotCount - 1 : prev - 1
    );
  };

  const handleNextScreenshot = () => {
    setCurrentScreenshotIndex((prev) =>
      prev === screenshotCount - 1 ? 0 : prev + 1
    );
  };

  // Action handlers
  const handleToggleEnabled = (checked: boolean) => {
    onToggleEnabled?.(pluginId, checked);
  };

  const handleInstall = () => {
    onInstall?.(pluginId);
  };

  const handleUninstall = () => {
    onUninstall?.(pluginId);
  };

  const handleUpdate = () => {
    onUpdate?.(pluginId);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className={cn(
          'flex w-full flex-col sm:max-w-lg',
          isLoading && 'pointer-events-none opacity-60'
        )}
      >
        <SheetHeader className="pb-0">
          {/* Plugin Header */}
          <div className="flex items-start gap-4">
            {/* Plugin Icon */}
            <div className="bg-muted rounded-base flex size-16 shrink-0 items-center justify-center overflow-hidden">
              {pluginIcon ? (
                <img
                  src={pluginIcon}
                  alt={`${pluginName} icon`}
                  className="size-full object-cover"
                />
              ) : (
                <Package className="text-muted-foreground size-8" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <SheetTitle
                  style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 1.4)' }}
                >
                  {pluginName}
                </SheetTitle>
                {variant === 'installed' && pluginState && (
                  <Badge variant={getStateBadgeVariant(pluginState)}>
                    {t(getStateLabelKey(pluginState))}
                  </Badge>
                )}
                {variant === 'marketplace' && isInstalled && (
                  <Badge variant="secondary">{t('pluginCard.installed')}</Badge>
                )}
                {hasUpdate && (
                  <Badge variant="default">
                    {updateVersion
                      ? t('pluginDetail.updateVersion', {
                          version: updateVersion,
                        })
                      : t('pluginDetail.updateAvailable')}
                  </Badge>
                )}
              </div>
              <SheetDescription className="mt-1">
                v{pluginVersion}{' '}
                {t('pluginCard.byAuthor', { author: pluginAuthor })}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="-mx-4 flex-1 px-4">
          <div className="space-y-6 py-4">
            {/* Error Message */}
            {hasError && errorMessage && (
              <div className="bg-destructive/10 border-destructive/50 rounded-base flex items-start gap-3 border p-3">
                <AlertCircle className="text-destructive mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <p
                    className="text-destructive font-medium"
                    style={{ fontSize: 'var(--font-ui-size, 13px)' }}
                  >
                    {t('pluginCard.error')}
                  </p>
                  <p
                    className="text-destructive/80"
                    style={{
                      fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)',
                    }}
                  >
                    {errorMessage}
                  </p>
                </div>
              </div>
            )}

            {/* Description */}
            <div>
              <h4
                className="mb-2 font-medium"
                style={{ fontSize: 'var(--font-ui-size, 13px)' }}
              >
                {t('pluginDetail.description')}
              </h4>
              <p
                className="text-muted-foreground"
                style={{ fontSize: 'var(--font-ui-size, 13px)' }}
              >
                {pluginDescription}
              </p>
            </div>

            {/* Screenshots */}
            {hasScreenshots && (
              <div>
                <h4
                  className="mb-2 font-medium"
                  style={{ fontSize: 'var(--font-ui-size, 13px)' }}
                >
                  {t('pluginDetail.screenshots')}
                </h4>
                <div className="bg-muted rounded-base relative overflow-hidden">
                  <img
                    src={pluginScreenshots![currentScreenshotIndex]}
                    alt={`${pluginName} screenshot ${currentScreenshotIndex + 1}`}
                    className="h-48 w-full object-contain"
                  />
                  {screenshotCount > 1 && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="bg-background/80 hover:bg-background/90 absolute top-1/2 left-2 -translate-y-1/2"
                        onClick={handlePrevScreenshot}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        <span className="sr-only">
                          {t('pluginDetail.previousScreenshot')}
                        </span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="bg-background/80 hover:bg-background/90 absolute top-1/2 right-2 -translate-y-1/2"
                        onClick={handleNextScreenshot}
                      >
                        <ChevronRight className="h-4 w-4" />
                        <span className="sr-only">
                          {t('pluginDetail.nextScreenshot')}
                        </span>
                      </Button>
                      <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-1.5">
                        {pluginScreenshots!.map((screenshot, index) => (
                          <button
                            key={screenshot}
                            className={cn(
                              'size-2 rounded-full transition-colors',
                              index === currentScreenshotIndex
                                ? 'bg-primary'
                                : 'bg-background/60 hover:bg-background/80'
                            )}
                            onClick={() => setCurrentScreenshotIndex(index)}
                          >
                            <span className="sr-only">
                              {t('pluginDetail.screenshotN', { n: index + 1 })}
                            </span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Permissions */}
            {pluginPermissions && pluginPermissions.length > 0 && (
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <Shield className="text-muted-foreground h-4 w-4" />
                  <h4
                    className="font-medium"
                    style={{ fontSize: 'var(--font-ui-size, 13px)' }}
                  >
                    {t('pluginDetail.permissions')}
                  </h4>
                </div>
                <div className="space-y-2">
                  {pluginPermissions.map((permission) => (
                    <div
                      key={permission}
                      className="bg-muted/50 flex items-start gap-3 rounded-md p-2"
                    >
                      <Badge variant="outline" className="shrink-0">
                        {t(getPermissionLabelKey(permission))}
                      </Badge>
                      <p
                        className="text-muted-foreground"
                        style={{
                          fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)',
                        }}
                      >
                        {t(getPermissionDescriptionKey(permission))}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* Metadata */}
            <div className="space-y-3">
              {/* Author */}
              <div
                className="flex items-center gap-3"
                style={{ fontSize: 'var(--font-ui-size, 13px)' }}
              >
                <User className="text-muted-foreground h-4 w-4 shrink-0" />
                <span className="text-muted-foreground">
                  {t('pluginDetail.author')}
                </span>
                <span className="ml-auto font-medium">{pluginAuthor}</span>
              </div>

              {/* License */}
              {pluginLicense && (
                <div
                  className="flex items-center gap-3"
                  style={{ fontSize: 'var(--font-ui-size, 13px)' }}
                >
                  <Shield className="text-muted-foreground h-4 w-4 shrink-0" />
                  <span className="text-muted-foreground">
                    {t('pluginDetail.license')}
                  </span>
                  <span className="ml-auto font-medium">{pluginLicense}</span>
                </div>
              )}

              {/* Installed Date */}
              {installedAt && (
                <div
                  className="flex items-center gap-3"
                  style={{ fontSize: 'var(--font-ui-size, 13px)' }}
                >
                  <Calendar className="text-muted-foreground h-4 w-4 shrink-0" />
                  <span className="text-muted-foreground">
                    {t('pluginDetail.installed')}
                  </span>
                  <span className="ml-auto font-medium">
                    {formatDate(installedAt)}
                  </span>
                </div>
              )}

              {/* Last Updated */}
              {updatedAt && (
                <div
                  className="flex items-center gap-3"
                  style={{ fontSize: 'var(--font-ui-size, 13px)' }}
                >
                  <Calendar className="text-muted-foreground h-4 w-4 shrink-0" />
                  <span className="text-muted-foreground">
                    {t('pluginDetail.lastUpdated')}
                  </span>
                  <span className="ml-auto font-medium">
                    {formatDate(updatedAt)}
                  </span>
                </div>
              )}

              {/* Downloads (marketplace only) */}
              {downloads !== undefined && (
                <div
                  className="flex items-center gap-3"
                  style={{ fontSize: 'var(--font-ui-size, 13px)' }}
                >
                  <Download className="text-muted-foreground h-4 w-4 shrink-0" />
                  <span className="text-muted-foreground">
                    {t('pluginDetail.downloads')}
                  </span>
                  <span className="ml-auto font-medium">
                    {downloads.toLocaleString()}
                  </span>
                </div>
              )}

              {/* Rating (marketplace only) */}
              {rating !== undefined && (
                <div
                  className="flex items-center gap-3"
                  style={{ fontSize: 'var(--font-ui-size, 13px)' }}
                >
                  <span className="text-muted-foreground">
                    {t('pluginDetail.rating')}
                  </span>
                  <span className="ml-auto font-medium">
                    {t('pluginDetail.stars', { rating: rating.toFixed(1) })}
                  </span>
                </div>
              )}
            </div>

            {/* Keywords / Categories */}
            {pluginKeywords && pluginKeywords.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4
                    className="mb-2 font-medium"
                    style={{ fontSize: 'var(--font-ui-size, 13px)' }}
                  >
                    {isPluginInfoType
                      ? t('pluginDetail.keywords')
                      : t('pluginDetail.categories')}
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {pluginKeywords.map((keyword) => (
                      <Badge
                        key={keyword}
                        variant="secondary"
                        style={{
                          fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)',
                        }}
                      >
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Links */}
            {(pluginHomepage || pluginRepository) && (
              <>
                <Separator />
                <div className="flex items-center gap-3">
                  {pluginHomepage && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => window.open(pluginHomepage, '_blank')}
                    >
                      <Globe className="mr-2 h-4 w-4" />
                      {t('pluginDetail.website')}
                      <ExternalLink className="ml-auto h-3 w-3 opacity-50" />
                    </Button>
                  )}
                  {pluginRepository && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => window.open(pluginRepository, '_blank')}
                    >
                      <Github className="mr-2 h-4 w-4" />
                      {t('pluginDetail.repository')}
                      <ExternalLink className="ml-auto h-3 w-3 opacity-50" />
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>
        </ScrollArea>

        <SheetFooter className="border-t pt-4">
          {/* Installed Plugin Actions */}
          {variant === 'installed' && (
            <div className="flex w-full items-center justify-between gap-3">
              {/* Enable/Disable Toggle */}
              {onToggleEnabled && (
                <div className="flex items-center gap-3">
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
                  <span
                    className="text-muted-foreground"
                    style={{ fontSize: 'var(--font-ui-size, 13px)' }}
                  >
                    {isEnabled
                      ? t('pluginCard.enabled')
                      : t('pluginCard.disabled')}
                  </span>
                </div>
              )}

              <div className="ml-auto flex items-center gap-2">
                {/* Update Button */}
                {hasUpdate && onUpdate && (
                  <Button
                    variant="accent"
                    size="sm"
                    onClick={handleUpdate}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="mr-2 h-4 w-4" />
                    )}
                    {t('pluginDetail.update')}
                  </Button>
                )}

                {/* Uninstall Button */}
                {onUninstall && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleUninstall}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="mr-2 h-4 w-4" />
                    )}
                    {t('pluginCard.uninstall')}
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Marketplace Plugin Actions */}
          {variant === 'marketplace' && (
            <div className="flex w-full items-center justify-end gap-3">
              {isInstalled ? (
                <Badge
                  variant="secondary"
                  className="px-4 py-1.5"
                  style={{ fontSize: 'var(--font-ui-size, 13px)' }}
                >
                  {t('pluginDetail.alreadyInstalled')}
                </Badge>
              ) : (
                <Button
                  variant="accent"
                  onClick={handleInstall}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('pluginDetail.installing')}
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      {t('pluginDetail.installPlugin')}
                    </>
                  )}
                </Button>
              )}
            </div>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export default PluginDetailView;
