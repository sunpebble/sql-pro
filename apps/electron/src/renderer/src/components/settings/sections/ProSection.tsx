import { Button } from '@sqlpro/ui/button';
import { Crown } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ProActivationDialog } from '@/components/pro/ProActivation';
import { ProBadge } from '@/components/pro/ProBadge';
import { cn } from '@/lib/utils';
import { useProStore } from '@/stores';

export function ProSection() {
  const { t } = useTranslation('settings');
  const { isPro, activatedAt, features } = useProStore();

  // Pro activation dialog state
  const [proDialogOpen, setProDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div
        className={cn(
          'rounded-lg border p-4 transition-colors',
          isPro
            ? 'border-amber-500/20 bg-linear-to-r from-amber-500/10 to-yellow-500/10'
            : 'border-border'
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-full',
                isPro ? 'bg-amber-500/20' : 'bg-muted'
              )}
            >
              <Crown
                className={cn(
                  'h-5 w-5',
                  isPro ? 'text-amber-500' : 'text-muted-foreground'
                )}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {isPro ? t('pro.active') : t('pro.free')}
                </span>
                {isPro && <ProBadge size="sm" />}
              </div>
              <p className="text-muted-foreground text-xs">
                {isPro
                  ? t('pro.featuresUnlocked', {
                      count: features.length,
                    }) +
                    (activatedAt
                      ? ` • ${t('pro.activated', { date: new Date(activatedAt).toLocaleDateString() })}`
                      : '')
                  : t('pro.unlockFeatures')}
              </p>
            </div>
          </div>
          <Button
            variant={isPro ? 'outline' : 'default'}
            size="sm"
            onClick={() => setProDialogOpen(true)}
            className={
              isPro
                ? ''
                : 'bg-linear-to-r from-amber-500 to-yellow-500 text-white hover:from-amber-600 hover:to-yellow-600'
            }
          >
            {isPro ? t('pro.manage') : t('pro.upgrade')}
          </Button>
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
      <ProActivationDialog
        open={proDialogOpen}
        onOpenChange={setProDialogOpen}
      />
    </div>
  );
}
