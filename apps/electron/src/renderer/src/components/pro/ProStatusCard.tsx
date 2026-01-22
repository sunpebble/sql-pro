/**
 * Pro Status Card Component
 * Displays the current Pro license status with management options
 * Uses Fresh Modern primary color system
 */

import { DecoFrame, GoldButton, GradientText } from '@sqlpro/ui';
import { Badge } from '@sqlpro/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@sqlpro/ui/card';
import {
  Calendar,
  Check,
  Cloud,
  CloudOff,
  Crown,
  ExternalLink,
  Loader2,
  Settings,
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

const STATUS_VARIANTS: Record<string, 'default' | 'destructive' | 'outline'> = {
  active: 'default',
  canceled: 'destructive',
  expired: 'destructive',
  past_due: 'destructive',
};

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
      month: 'long',
      day: 'numeric',
    });
  };

  const isLifetime = license.plan === 'lifetime';

  // Calculate days until expiry using date-only comparison for accuracy
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
    <Card
      className={cn(
        'relative overflow-hidden',
        'border-[var(--primary)]/30 bg-gradient-to-br from-[var(--primary-subtle)] to-[var(--primary-subtle)]',
        className
      )}
    >
      {/* Decorative gradient */}
      <div className="absolute -top-8 -right-8 h-24 w-24 rounded-full bg-gradient-to-br from-[var(--primary)]/20 to-[var(--primary)]/20 blur-2xl" />

      <CardHeader className="relative pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <DecoFrame
              size="sm"
              variant="gold"
              className="flex h-8 w-8 items-center justify-center"
            >
              <Crown className="text-primary h-4 w-4" />
            </DecoFrame>
            <GradientText variant="primary">{t('pro.proLicense')}</GradientText>
          </CardTitle>
          <Badge variant={STATUS_VARIANTS[license.status] || 'outline'}>
            {license.status === 'active' && <Check className="mr-1 h-3 w-3" />}
            {t(`pro.status.${license.status}`, {
              defaultValue: license.status,
            })}
          </Badge>
        </div>
        <CardDescription className="flex items-center gap-1.5">
          {license.email}
          {(isCached || isOffline) && (
            <span className="text-muted-foreground ml-2 flex items-center gap-1 text-xs">
              {isOffline ? (
                <>
                  <CloudOff className="h-3 w-3" />
                  {t('pro.offline')}
                </>
              ) : (
                <>
                  <Cloud className="h-3 w-3" />
                  {t('pro.cached')}
                </>
              )}
            </span>
          )}
        </CardDescription>
      </CardHeader>

      <CardContent className="relative space-y-3 pt-0">
        {/* Plan info */}
        <div className="flex items-center justify-between rounded-lg bg-[var(--primary-subtle)] p-3 dark:bg-[var(--primary-subtle)]">
          <div>
            <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
              {t('pro.currentPlan')}
            </p>
            <p className="text-lg font-semibold text-[var(--primary)]">
              {t(`pro.plans.${license.plan}`, { defaultValue: license.plan })}
            </p>
          </div>
          {!isLifetime && (
            <div className="text-right">
              <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                {isExpiringSoon ? t('pro.renewsSoon') : t('pro.renews')}
              </p>
              <p
                className={cn(
                  'flex items-center gap-1.5 text-sm font-medium',
                  isExpiringSoon && 'text-[var(--primary)]'
                )}
              >
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(license.expiresAt)}
              </p>
            </div>
          )}
          {isLifetime && (
            <Badge
              variant="outline"
              className="border-[var(--primary)]/50 text-[var(--primary)]"
            >
              {t('pro.forever')}
            </Badge>
          )}
        </div>

        {/* Expiring soon warning */}
        {isExpiringSoon && (
          <div className="rounded-lg border border-[var(--primary)]/30 bg-[var(--primary-subtle)] p-3">
            <p className="text-sm text-[var(--primary-dark)] dark:text-[var(--primary)]">
              {t('pro.renewsInDays', {
                days: daysUntilExpiry,
                count: daysUntilExpiry,
              })}
            </p>
          </div>
        )}
      </CardContent>

      <CardFooter className="relative flex gap-2 pt-0">
        <GoldButton
          variant="outline"
          className="flex-1"
          onClick={onManageSubscription}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Settings className="mr-2 h-4 w-4" />
          )}
          {t('pro.manageSubscription', { defaultValue: 'Manage Subscription' })}
          <ExternalLink className="ml-1.5 h-3 w-3 opacity-50" />
        </GoldButton>
      </CardFooter>

      {/* Deactivate option */}
      {onDeactivate && (
        <div className="border-t border-[var(--primary)]/10 px-6 py-3">
          <GoldButton
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-destructive w-full text-xs"
            onClick={onDeactivate}
          >
            {t('pro.deactivateDevice')}
          </GoldButton>
        </div>
      )}
    </Card>
  );
}
