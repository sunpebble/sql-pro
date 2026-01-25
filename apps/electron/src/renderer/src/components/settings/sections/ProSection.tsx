import { DecoFrame, GoldButton } from '@sqlpro/ui';
import { Crown } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LicenseActivationDialog } from '@/components/LicenseActivationDialog';
import { ProBadge } from '@/components/pro/ProBadge';
import { cn } from '@/lib/utils';
import { useLicenseStore } from '@/stores/license-store';

export function ProSection() {
  const { t } = useTranslation('settings');
  const { license, isValid } = useLicenseStore();

  // Map license store to Pro status
  const isPro = isValid;
  const expiresAt = license?.expiresAt;
  const features = license
    ? ['advanced-export', 'plugin-system', 'query-optimizer']
    : [];

  // Pro activation dialog state
  const [proDialogOpen, setProDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div
        className={cn(
          'rounded-lg border p-4 transition-colors',
          isPro
            ? 'border-primary/30 bg-gradient-to-r from-[rgba(212,175,55,0.08)] to-[rgba(201,169,98,0.08)]'
            : 'border-border'
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <DecoFrame
              size="sm"
              variant="gold"
              className={cn(
                'flex h-10 w-10 items-center justify-center',
                !isPro && 'opacity-50'
              )}
            >
              <Crown
                className={cn(
                  'h-5 w-5',
                  isPro ? 'text-primary' : 'text-muted-foreground'
                )}
              />
            </DecoFrame>
            <div>
              <div className="flex items-center gap-2">
                <span className={cn('font-medium', isPro && 'text-primary')}>
                  {isPro ? t('pro.active') : t('pro.free')}
                </span>
                {isPro && <ProBadge size="sm" />}
              </div>
              <p className="text-muted-foreground text-xs">
                {isPro
                  ? t('pro.featuresUnlocked', {
                      count: features.length,
                    }) +
                    (expiresAt
                      ? ` • ${t('pro.expiresOn', { date: new Date(expiresAt).toLocaleDateString(), defaultValue: `Expires ${new Date(expiresAt).toLocaleDateString()}` })}`
                      : '')
                  : t('pro.unlockFeatures')}
              </p>
            </div>
          </div>
          <GoldButton
            variant={isPro ? 'outline' : 'default'}
            size="sm"
            onClick={() => setProDialogOpen(true)}
          >
            {isPro ? t('pro.manage') : t('pro.upgrade')}
          </GoldButton>
        </div>
      </div>

      {/* Feature List when Pro is active */}
      {isPro && features.length > 0 && (
        <div className="space-y-2">
          <p className="text-muted-foreground text-xs font-medium uppercase">
            {t('pro.featuresUnlocked', { count: features.length })}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {features.map((feature) => (
              <div
                key={feature}
                className="bg-muted/50 flex items-center gap-2 rounded-md px-3 py-2"
              >
                <Crown className="h-3 w-3 text-amber-500" />
                <span className="text-xs">
                  {t(`pro.features.${feature}`, { defaultValue: feature })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pro Activation Dialog */}
      <LicenseActivationDialog
        open={proDialogOpen}
        onOpenChange={setProDialogOpen}
      />
    </div>
  );
}
