/**
 * Pro Status Card Component
 * Displays the current Pro license status with management options
 */

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
        'border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-yellow-500/5',
        className
      )}
    >
      {/* Decorative gradient */}
      <div className="absolute -top-8 -right-8 h-24 w-24 rounded-full bg-gradient-to-br from-amber-500/20 to-yellow-500/20 blur-2xl" />

      <CardHeader className="relative pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-yellow-500">
              <Crown className="h-4 w-4 text-white" />
            </div>
            <span>{t('pro.proLicense')}</span>
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
        <div className="flex items-center justify-between rounded-lg bg-white/50 p-3 dark:bg-white/5">
          <div>
            <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
              {t('pro.currentPlan')}
            </p>
            <p className="text-lg font-semibold">
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
                  isExpiringSoon && 'text-amber-600 dark:text-amber-400'
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
              className="border-amber-500/50 text-amber-600"
            >
              {t('pro.forever')}
            </Badge>
          )}
        </div>

        {/* Expiring soon warning */}
        {isExpiringSoon && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
            <p className="text-sm text-amber-700 dark:text-amber-300">
              {t('pro.renewsInDays', {
                days: daysUntilExpiry,
                count: daysUntilExpiry,
              })}
            </p>
          </div>
        )}
      </CardContent>

      <CardFooter className="relative flex gap-2 pt-0">
        <Button
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
        </Button>
      </CardFooter>

      {/* Deactivate option */}
      {onDeactivate && (
        <div className="border-t px-6 py-3">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-destructive w-full text-xs"
            onClick={onDeactivate}
          >
            {t('pro.deactivateDevice')}
          </Button>
        </div>
      )}
    </Card>
  );
}
