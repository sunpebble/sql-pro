/**
 * License Activation Dialog
 * Smart wizard-style dialog for purchasing, activating, and managing Pro license
 */

import { Badge } from '@sqlpro/ui/badge';
import { Button } from '@sqlpro/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@sqlpro/ui/card';
import { Input } from '@sqlpro/ui/input';
import { Label } from '@sqlpro/ui/label';
import {
  ArrowLeft,
  Check,
  CreditCard,
  Crown,
  Key,
  Loader2,
  Sparkles,
  Star,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useLicenseStore } from '@/stores/license-store';
import { LicenseKeyInput, MIN_LICENSE_KEY_LENGTH } from './pro/LicenseKeyInput';
import { ProStatusCard } from './pro/ProStatusCard';

interface LicenseActivationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type DialogView = 'main' | 'purchase' | 'activate' | 'manage';

const PLANS = [
  {
    id: 'monthly' as const,
    nameKey: 'pro.plans.monthly',
    price: '$9.99',
    periodKey: 'pro.periods.month',
    monthlyPrice: '$9.99',
    devices: 3,
    features: ['allProFeatures', 'prioritySupport', 'devices3'],
  },
  {
    id: 'yearly' as const,
    nameKey: 'pro.plans.yearly',
    price: '$79.99',
    periodKey: 'pro.periods.year',
    monthlyPrice: '$6.67',
    devices: 3,
    popular: true,
    savings: 33,
    features: ['allProFeatures', 'prioritySupport', 'devices3'],
  },
  {
    id: 'lifetime' as const,
    nameKey: 'pro.plans.lifetime',
    price: '$199',
    periodKey: 'pro.periods.oneTime',
    monthlyPrice: null,
    devices: 5,
    features: ['allProFeatures', 'lifetimeUpdates', 'devices5'],
  },
];

const PRO_FEATURES = [
  { nameKey: 'pro.featureList.aiNlToSql', icon: Sparkles },
  { nameKey: 'pro.featureList.queryOptimization', icon: Zap },
  { nameKey: 'pro.featureList.schemaCompare', icon: Check },
  { nameKey: 'pro.featureList.advancedExport', icon: Check },
  { nameKey: 'pro.featureList.prioritySupport', icon: Star },
];

export function LicenseActivationDialog({
  open,
  onOpenChange,
}: LicenseActivationDialogProps) {
  const { t } = useTranslation('common');
  const {
    license,
    isValid,
    isLoading,
    isActivating,
    error,
    isCached,
    isOffline,
    loadMachineId,
    verifyLicense,
    activateLicense,
    createCheckout,
    openPortal,
    deactivateLicense,
    clearError,
  } = useLicenseStore();

  const [view, setView] = useState<DialogView>('main');
  const [email, setEmail] = useState('');
  const [licenseKey, setLicenseKey] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<
    'monthly' | 'yearly' | 'lifetime'
  >('yearly');
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);

  // Determine initial view based on license status
  useEffect(() => {
    if (open) {
      loadMachineId();
      verifyLicense();
    }
  }, [open, loadMachineId, verifyLicense]);

  useEffect(() => {
    // Wait for verification to complete before setting view
    if (open && !isLoading) {
      if (isValid) {
        // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect -- Intentional initialization based on prop change
        setView('manage');
      } else {
        // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect -- Intentional initialization based on prop change
        setView('main');
      }
    }
  }, [open, isValid, isLoading]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect -- Intentional reset on dialog close
      setEmail('');
      // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect -- Intentional reset on dialog close
      setLicenseKey('');
      clearError();
    }
  }, [open, clearError]);

  const handlePurchase = async () => {
    if (!email) return;
    const success = await createCheckout(email, selectedPlan);
    if (success) {
      // Checkout opened in browser, optionally close dialog
    }
  };

  const handleActivate = async () => {
    if (!email || !licenseKey) return;
    const success = await activateLicense(email, licenseKey);
    if (success) {
      setView('manage');
    }
  };

  const handleDeactivate = async () => {
    await deactivateLicense();
    setView('main');
    setConfirmDeactivate(false);
  };

  const handleBack = () => {
    clearError();
    setView('main');
  };

  const renderMainView = () => (
    <div className="space-y-6">
      {/* Hero section */}
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-yellow-500">
          <Crown className="h-8 w-8 text-white" />
        </div>
        <h3 className="text-lg font-semibold">{t('pro.unlock')}</h3>
        <p className="text-muted-foreground text-sm">{t('pro.getAccess')}</p>
      </div>

      {/* Feature list */}
      <div className="rounded-lg border p-4">
        <ul className="space-y-2">
          {PRO_FEATURES.map((feature) => (
            <li
              key={feature.nameKey}
              className="flex items-center gap-3 text-sm"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/10">
                <feature.icon className="h-3.5 w-3.5 text-amber-600" />
              </div>
              {t(feature.nameKey)}
            </li>
          ))}
        </ul>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          size="lg"
          className="h-auto flex-col gap-1 py-4"
          onClick={() => setView('activate')}
        >
          <Key className="h-5 w-5" />
          <span className="font-medium">{t('pro.iHaveLicense')}</span>
          <span className="text-muted-foreground text-xs">
            {t('pro.activateExisting')}
          </span>
        </Button>
        <Button
          size="lg"
          className="h-auto flex-col gap-1 bg-gradient-to-r from-amber-500 to-yellow-500 py-4 text-white hover:from-amber-600 hover:to-yellow-600"
          onClick={() => setView('purchase')}
        >
          <CreditCard className="h-5 w-5" />
          <span className="font-medium">{t('pro.purchase')}</span>
          <span className="text-xs opacity-80">{t('pro.startingAt')}</span>
        </Button>
      </div>
    </div>
  );

  const renderPurchaseView = () => (
    <div className="space-y-4">
      {/* Back button */}
      <Button variant="ghost" size="sm" className="-ml-2" onClick={handleBack}>
        <ArrowLeft className="mr-1 h-4 w-4" />
        {t('pro.back')}
      </Button>

      {/* Email input */}
      <div className="space-y-2">
        <Label htmlFor="purchase-email">{t('pro.emailAddress')}</Label>
        <Input
          id="purchase-email"
          type="email"
          placeholder={t('pro.emailPlaceholder')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoFocus
        />
        <p className="text-muted-foreground text-xs">
          {t('pro.licenseEmailHint')}
        </p>
      </div>

      {/* Plan selection */}
      <div className="grid grid-cols-3 gap-2">
        {PLANS.map((plan) => (
          <Card
            key={plan.id}
            className={cn(
              'relative cursor-pointer transition-all',
              selectedPlan === plan.id
                ? 'ring-gold ring-2'
                : 'hover:border-primary/50'
            )}
            onClick={() => setSelectedPlan(plan.id)}
          >
            {plan.popular && (
              <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 text-xs">
                <Star className="mr-0.5 h-2.5 w-2.5" />
                {t('pro.best')}
              </Badge>
            )}
            <CardHeader className="p-3 pb-1">
              <CardTitle className="text-sm">{t(plan.nameKey)}</CardTitle>
              <CardDescription className="space-y-0.5">
                <span className="text-foreground text-lg font-semibold">
                  {plan.price}
                </span>
                <span className="text-muted-foreground text-xs">
                  {' '}
                  {t(plan.periodKey)}
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              {plan.savings && (
                <Badge variant="secondary" className="mb-1 text-xs">
                  {t('pro.save', { percent: plan.savings })}
                </Badge>
              )}
              <p className="text-muted-foreground text-xs">
                {t('pro.devices', { count: plan.devices })}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Purchase button */}
      <Button
        className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 text-white hover:from-amber-600 hover:to-yellow-600"
        size="lg"
        onClick={handlePurchase}
        disabled={isLoading || !email}
      >
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Zap className="mr-2 h-4 w-4" />
        )}
        {t('pro.continueToCheckout')}
      </Button>

      {/* Trust badges */}
      <div className="text-muted-foreground flex items-center justify-center gap-4 text-xs">
        <span className="flex items-center gap-1">
          <Check className="h-3 w-3" />
          {t('pro.securePayment')}
        </span>
        <span className="flex items-center gap-1">
          <Check className="h-3 w-3" />
          {t('pro.guarantee')}
        </span>
      </div>
    </div>
  );

  const renderActivateView = () => (
    <div className="space-y-4">
      {/* Back button */}
      <Button variant="ghost" size="sm" className="-ml-2" onClick={handleBack}>
        <ArrowLeft className="mr-1 h-4 w-4" />
        {t('pro.back')}
      </Button>

      <div className="text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10">
          <Key className="h-6 w-6 text-amber-600" />
        </div>
        <h3 className="font-semibold">{t('pro.activateTitle')}</h3>
        <p className="text-muted-foreground text-sm">
          {t('pro.activateDescription')}
        </p>
      </div>

      {/* Email input */}
      <div className="space-y-2">
        <Label htmlFor="activate-email">{t('pro.emailAddress')}</Label>
        <Input
          id="activate-email"
          type="email"
          placeholder={t('pro.emailPlaceholder')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoFocus
        />
      </div>

      {/* License key input */}
      <div className="space-y-2">
        <Label>{t('pro.licenseKey')}</Label>
        <LicenseKeyInput
          value={licenseKey}
          onChange={setLicenseKey}
          disabled={isActivating}
        />
      </div>

      {/* Activate button */}
      <Button
        className="w-full"
        size="lg"
        onClick={handleActivate}
        disabled={
          isActivating || !email || licenseKey.length < MIN_LICENSE_KEY_LENGTH
        }
      >
        {isActivating ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Key className="mr-2 h-4 w-4" />
        )}
        {t('pro.activateLicense')}
      </Button>

      {/* Help text */}
      <p className="text-muted-foreground text-center text-xs">
        {t('pro.cantFindKey')}{' '}
        <a
          href="mailto:support@sqlpro.dev"
          className="text-primary hover:underline"
        >
          {t('pro.contactSupport')}
        </a>
      </p>
    </div>
  );

  const renderManageView = () => (
    <div className="space-y-4">
      {license && (
        <ProStatusCard
          license={{
            email: license.email,
            plan: license.plan as 'monthly' | 'yearly' | 'lifetime',
            status: license.status,
            expiresAt: license.expiresAt,
          }}
          isCached={isCached}
          isOffline={isOffline}
          isLoading={isLoading}
          onManageSubscription={() => openPortal()}
          onDeactivate={() => setConfirmDeactivate(true)}
        />
      )}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-amber-500" />
            {view === 'manage'
              ? t('pro.title', { defaultValue: 'SQL Pro License' })
              : t('pro.getStarted', { defaultValue: 'Get SQL Pro' })}
          </DialogTitle>
          {view !== 'manage' && (
            <DialogDescription>
              {t('pro.description', {
                defaultValue: 'Unlock all Pro features with a subscription',
              })}
            </DialogDescription>
          )}
        </DialogHeader>

        {/* Error display */}
        {error && (
          <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
            {error}
            <Button
              variant="link"
              size="sm"
              className="ml-2 h-auto p-0"
              onClick={clearError}
            >
              {t('pro.dismiss')}
            </Button>
          </div>
        )}

        {/* Content based on view */}
        {view === 'main' && renderMainView()}
        {view === 'purchase' && renderPurchaseView()}
        {view === 'activate' && renderActivateView()}
        {view === 'manage' && renderManageView()}
      </DialogContent>

      {/* Deactivate confirmation */}
      <ConfirmDialog
        open={confirmDeactivate}
        onOpenChange={setConfirmDeactivate}
        title={t('pro.deactivateTitle')}
        description={t('pro.deactivateDescription')}
        confirmLabel={t('pro.deactivate')}
        onConfirm={handleDeactivate}
        variant="destructive"
      />
    </Dialog>
  );
}
