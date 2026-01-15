import type { ALL_PRO_FEATURES } from '@/stores';
import { Button } from '@sqlpro/ui/button';
import { Input } from '@sqlpro/ui/input';
import { Label } from '@sqlpro/ui/label';
import {
  Check,
  Crown,
  Eye,
  EyeOff,
  Key,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useProStore } from '@/stores';
import { ProBadge } from './ProBadge';
import { SkeletonProActivation } from './SkeletonProActivation';

/**
 * Feature IDs that map to translation keys
 */
const PRO_FEATURE_IDS = [
  'ai-nl-to-sql',
  'ai-data-analysis',
  'advanced-export',
  'plugin-system',
  'query-optimizer',
] as const;

interface ProActivationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Dialog component for Pro license activation and status management.
 * Allows users to enter their license key to activate Pro features,
 * view current Pro status, and deactivate if needed.
 */
export function ProActivationDialog({
  open,
  onOpenChange,
}: ProActivationDialogProps) {
  const { t } = useTranslation('common');
  const {
    isPro,
    licenseKey,
    activatedAt,
    features,
    isLoading,
    isActivating,
    loadStatus,
    activate,
    deactivate,
  } = useProStore();

  const [showLicenseKey, setShowLicenseKey] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create a key that changes when store values change to reset local state
  const storeKey = useMemo(
    () => `${licenseKey}-${isPro}-${activatedAt}`,
    [licenseKey, isPro, activatedAt]
  );

  // Use a ref to track the last sync key, avoiding unnecessary state updates
  const lastSyncKeyRef = useRef(storeKey);

  // Initialize with current store value, reset when storeKey changes
  const [localLicenseKey, setLocalLicenseKey] = useState(
    () => licenseKey ?? ''
  );

  // Load status when dialog opens
  useEffect(() => {
    if (open) {
      loadStatus();
    }
  }, [open, loadStatus]);

  // Reset local state when store values change (only on actual changes)
  if (storeKey !== lastSyncKeyRef.current) {
    lastSyncKeyRef.current = storeKey;
    setLocalLicenseKey(licenseKey ?? '');
    setError(null);
  }

  const handleActivate = async () => {
    setError(null);

    if (!localLicenseKey.trim()) {
      setError(t('pro.errors.enterKey'));
      return;
    }

    if (localLicenseKey.trim().length < 8) {
      setError(t('pro.errors.keyTooShort'));
      return;
    }

    const success = await activate(localLicenseKey.trim());
    if (success) {
      onOpenChange(false);
    } else {
      setError(t('pro.errors.activationFailed'));
    }
  };

  const handleDeactivate = async () => {
    setError(null);
    const success = await deactivate();
    if (!success) {
      setError(t('pro.errors.deactivationFailed'));
    }
  };

  const handleCancel = () => {
    // Reset to store values
    setLocalLicenseKey(licenseKey ?? '');
    setError(null);
    onOpenChange(false);
  };

  // Format activation date
  const formattedActivatedAt = activatedAt
    ? new Date(activatedAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-amber-500" />
            SQL Pro
            <ProBadge size="sm" />
          </DialogTitle>
          <DialogDescription>
            {isPro ? t('pro.manageDescription') : t('pro.enterKeyDescription')}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <SkeletonProActivation />
        ) : (
          <div className="grid gap-4 py-4">
            {/* Pro Status Section (shown when Pro is active) */}
            {isPro && (
              <div className="rounded-lg border border-amber-500/20 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 p-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/20">
                    <Crown className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="font-medium">{t('pro.proActive')}</p>
                    {formattedActivatedAt && (
                      <p className="text-muted-foreground text-xs">
                        {t('pro.activatedOn', { date: formattedActivatedAt })}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* License Key Input */}
            <div className="grid gap-2">
              <Label htmlFor="licenseKey">
                {isPro ? t('pro.licenseKey') : t('pro.enterLicenseKey')}
              </Label>
              <div className="relative">
                <Key className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                <Input
                  id="licenseKey"
                  type={showLicenseKey ? 'text' : 'password'}
                  value={localLicenseKey}
                  onChange={(e) => setLocalLicenseKey(e.target.value)}
                  placeholder="XXXX-XXXX-XXXX-XXXX"
                  className={cn('pr-10 pl-9', error && 'border-destructive')}
                  disabled={isPro}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-0 right-0 h-full px-3"
                  onClick={() => setShowLicenseKey(!showLicenseKey)}
                >
                  {showLicenseKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {error && <p className="text-destructive text-xs">{error}</p>}
              {!isPro && (
                <p className="text-muted-foreground text-xs">
                  {t('pro.keyStoredSecurely')}
                </p>
              )}
            </div>

            {/* Pro Features List */}
            <div className="grid gap-2">
              <Label>
                {isPro ? t('pro.activeFeatures') : t('pro.includedFeatures')}
              </Label>
              <div className="bg-muted/50 space-y-1 rounded-lg border p-3">
                {PRO_FEATURE_IDS.map((featureId) => {
                  const isActive =
                    isPro &&
                    features.includes(
                      featureId as (typeof ALL_PRO_FEATURES)[number]
                    );
                  return (
                    <div
                      key={featureId}
                      className="flex items-center gap-2 py-1"
                    >
                      <div
                        className={cn(
                          'flex h-5 w-5 shrink-0 items-center justify-center rounded-full',
                          isActive
                            ? 'bg-green-500/20 text-green-600'
                            : 'bg-muted text-muted-foreground'
                        )}
                      >
                        {isActive ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <Sparkles className="h-3 w-3" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p
                          className={cn(
                            'truncate text-sm font-medium',
                            !isActive && !isPro && 'text-muted-foreground'
                          )}
                        >
                          {t(`pro.features.${featureId}.name`)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          {isPro ? (
            <>
              <Button
                variant="outline"
                onClick={handleDeactivate}
                disabled={isActivating}
                className="text-destructive hover:bg-destructive/10"
              >
                {isActivating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('pro.deactivating')}
                  </>
                ) : (
                  t('pro.deactivateLicense')
                )}
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                {t('actions.close')}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isActivating}
              >
                {t('actions.cancel')}
              </Button>
              <Button
                onClick={handleActivate}
                disabled={isActivating || !localLicenseKey.trim()}
                className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white hover:from-amber-600 hover:to-yellow-600"
              >
                {isActivating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('pro.activating')}
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    {t('pro.activatePro')}
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
