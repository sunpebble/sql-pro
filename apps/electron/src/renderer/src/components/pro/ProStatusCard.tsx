/**
 * Pro Status Card Component
 * Displays the current Pro license status with management options
 * Compact, informative design with visual polish
 */

import { Badge } from '@quarry/ui/badge';
import { Button } from '@quarry/ui/button';
import {
  Calendar,
  Check,
  Cloud,
  CloudOff,
  Crown,
  ExternalLink,
  Laptop,
  Loader2,
  Settings,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface ProStatusCardProps {
  license: {
    email: string;
    plan: 'monthly' | 'yearly' | 'lifetime';
    status: string;
    expiresAt: string;
  };
  isCached?: boolean;
  isOffline?: boolean;
  isLoading?: boolean;
  onManageSubscription?: () => void;
  onDeactivate?: () => void;
  className?: string;
}

const PRO_FEATURES = [
  { key: 'ai', icon: Sparkles },
  { key: 'optimizer', icon: Zap },
  { key: 'export', icon: Check },
] as const;

export function ProStatusCard({
  license,
  isCached = false,
  isOffline = false,
  isLoading = false,
  onManageSubscription,
  onDeactivate,
  className,
}: ProStatusCardProps) {
  const { t } = useTranslation('common');

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const isLifetime = license.plan === 'lifetime';
  const isActive = license.status === 'active';

  // Calculate days until expiry
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiryDate = new Date(license.expiresAt);
  expiryDate.setHours(0, 0, 0, 0);
  const daysUntilExpiry = Math.ceil(
    (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
  const isExpiringSoon =
    !isLifetime && daysUntilExpiry <= 7 && daysUntilExpiry > 0;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header: Status + Email */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-500/25">
              <Crown className="h-6 w-6 text-white" />
            </div>
            {isActive && (
              <div className="absolute -right-1 -bottom-1 flex h-5 w-5 items-center justify-center rounded-full border border-white bg-green-500 dark:border-gray-900">
                <Check className="h-3 w-3 text-white" />
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">Quarry</h3>
              <Badge
                variant={isActive ? 'default' : 'destructive'}
                className={cn(
                  isActive &&
                    'bg-green-500/10 text-green-600 hover:bg-green-500/20 dark:text-green-400'
                )}
                style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
              >
                {t(`pro.status.${license.status}`, {
                  defaultValue: license.status,
                })}
              </Badge>
            </div>
            <p
              className="text-muted-foreground flex items-center gap-1.5"
              style={{ fontSize: 'var(--font-ui-size, 13px)' }}
            >
              {license.email}
              {(isCached || isOffline) && (
                <span
                  className="text-muted-foreground/60 inline-flex items-center gap-0.5"
                  style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
                >
                  {isOffline ? (
                    <CloudOff className="h-3 w-3" />
                  ) : (
                    <Cloud className="h-3 w-3" />
                  )}
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Plan & Expiry Info */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border bg-gradient-to-br from-amber-50/50 to-transparent p-3 dark:from-amber-950/20">
          <p
            className="text-muted-foreground mb-0.5 font-medium tracking-wide uppercase"
            style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
          >
            {t('pro.currentPlan')}
          </p>
          <p className="flex items-center gap-1.5 font-semibold text-amber-600 dark:text-amber-400">
            {t(`pro.plans.${license.plan}`, { defaultValue: license.plan })}
            {isLifetime && <Sparkles className="h-3.5 w-3.5" />}
          </p>
        </div>

        <div className="rounded-lg border bg-gradient-to-br from-gray-50/50 to-transparent p-3 dark:from-gray-900/50">
          <p
            className="text-muted-foreground mb-0.5 font-medium tracking-wide uppercase"
            style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
          >
            {isLifetime
              ? t('pro.validity', { defaultValue: 'Validity' })
              : t('pro.renews')}
          </p>
          <p
            className={cn(
              'flex items-center gap-1.5 font-semibold',
              isExpiringSoon
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-foreground'
            )}
          >
            {isLifetime ? (
              <>
                <Check className="h-3.5 w-3.5 text-green-500" />
                {t('pro.forever')}
              </>
            ) : (
              <>
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(license.expiresAt)}
              </>
            )}
          </p>
        </div>
      </div>

      {/* Expiring Soon Warning */}
      {isExpiringSoon && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-50 p-3 dark:bg-amber-950/30">
          <Calendar className="h-4 w-4 flex-shrink-0 text-amber-600 dark:text-amber-400" />
          <p
            className="text-amber-700 dark:text-amber-300"
            style={{ fontSize: 'var(--font-ui-size, 13px)' }}
          >
            {t('pro.renewsInDays', {
              days: daysUntilExpiry,
              count: daysUntilExpiry,
              defaultValue: `Renews in ${daysUntilExpiry} days`,
            })}
          </p>
        </div>
      )}

      {/* Pro Features */}
      <div className="rounded-lg border p-3">
        <p
          className="text-muted-foreground mb-2 font-medium tracking-wide uppercase"
          style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
        >
          {t('pro.activeFeatures', { defaultValue: 'Active Features' })}
        </p>
        <div className="flex flex-wrap gap-2">
          {PRO_FEATURES.map((feature) => (
            <div
              key={feature.key}
              className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-2.5 py-1 font-medium text-green-700 dark:text-green-400"
              style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
            >
              <feature.icon className="h-3 w-3" />
              {t(`pro.featureShort.${feature.key}`, {
                defaultValue:
                  feature.key === 'ai'
                    ? 'AI Assistant'
                    : feature.key === 'optimizer'
                      ? 'Query Optimizer'
                      : 'Advanced Export',
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Device Info */}
      <div
        className="text-muted-foreground flex items-center gap-1.5"
        style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
      >
        <Laptop className="h-3.5 w-3.5" />
        <span>
          {t('pro.activatedOnDevice', {
            defaultValue: 'License activated on this device',
          })}
        </span>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2">
        <Button
          variant="outline"
          className="w-full border-amber-500/30 hover:bg-amber-50 dark:hover:bg-amber-950/30"
          onClick={onManageSubscription}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Settings className="mr-2 h-4 w-4" />
          )}
          {t('pro.manageSubscription', { defaultValue: 'Manage Subscription' })}
          <ExternalLink className="ml-auto h-3.5 w-3.5 opacity-50" />
        </Button>

        {onDeactivate && (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-destructive"
            style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
            onClick={onDeactivate}
          >
            {t('pro.deactivateDevice', {
              defaultValue: 'Deactivate on this device',
            })}
          </Button>
        )}
      </div>
    </div>
  );
}
