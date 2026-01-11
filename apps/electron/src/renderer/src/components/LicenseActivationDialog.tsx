/**
 * License Activation Dialog
 * Allows users to purchase, activate, and manage their Pro license
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
import { Input } from '@sqlpro/ui/input';
import { Label } from '@sqlpro/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@sqlpro/ui/tabs';
import {
  Check,
  CreditCard,
  Crown,
  Key,
  Loader2,
  Settings,
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

interface LicenseActivationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PLANS = [
  {
    id: 'monthly' as const,
    name: 'Monthly',
    price: '$9.99',
    period: '/month',
    devices: 2,
    features: ['All Pro features', 'Priority support', '2 devices'],
  },
  {
    id: 'yearly' as const,
    name: 'Yearly',
    price: '$79.99',
    period: '/year',
    devices: 3,
    popular: true,
    savings: 'Save 33%',
    features: ['All Pro features', 'Priority support', '3 devices'],
  },
  {
    id: 'lifetime' as const,
    name: 'Lifetime',
    price: '$199',
    period: 'one-time',
    devices: 5,
    features: ['All Pro features', 'Lifetime updates', '5 devices'],
  },
];

const PRO_FEATURES = [
  'AI-powered Natural Language to SQL',
  'Query optimization suggestions',
  'Schema comparison & sync',
  'Advanced data export options',
  'Priority support',
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
    machineId,
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

  const [activeTab, setActiveTab] = useState<
    'purchase' | 'activate' | 'manage'
  >('purchase');
  const [email, setEmail] = useState('');
  const [licenseKey, setLicenseKey] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<
    'monthly' | 'yearly' | 'lifetime'
  >('yearly');
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);

  useEffect(() => {
    if (open) {
      loadMachineId();
      verifyLicense();
      // Auto-switch to manage tab if license is valid

      if (isValid) {
        // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
        setActiveTab('manage');
      }
    }
  }, [open, loadMachineId, verifyLicense, isValid]);

  const handlePurchase = async () => {
    if (!email) return;
    const success = await createCheckout(email, selectedPlan);
    if (success) {
      // Checkout opened in browser
    }
  };

  const handleActivate = async () => {
    if (!email || !licenseKey) return;
    const success = await activateLicense(email, licenseKey);
    if (success) {
      setActiveTab('manage');
    }
  };

  const handleDeactivate = async () => {
    await deactivateLicense();
    setActiveTab('purchase');
    setConfirmDeactivate(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-500" />
            {t('pro.title', { defaultValue: 'SQL Pro License' })}
          </DialogTitle>
          <DialogDescription>
            {t('pro.description', {
              defaultValue: 'Unlock all Pro features with a subscription',
            })}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
            {error}
            <Button
              variant="link"
              size="sm"
              className="ml-2 h-auto p-0"
              onClick={clearError}
            >
              Dismiss
            </Button>
          </div>
        )}

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as typeof activeTab)}
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="purchase" className="flex items-center gap-1">
              <CreditCard className="h-4 w-4" />
              {t('pro.purchase', { defaultValue: 'Purchase' })}
            </TabsTrigger>
            <TabsTrigger value="activate" className="flex items-center gap-1">
              <Key className="h-4 w-4" />
              {t('pro.activate', { defaultValue: 'Activate' })}
            </TabsTrigger>
            <TabsTrigger
              value="manage"
              className="flex items-center gap-1"
              disabled={!isValid}
            >
              <Settings className="h-4 w-4" />
              {t('pro.manage', { defaultValue: 'Manage' })}
            </TabsTrigger>
          </TabsList>

          {/* Purchase Tab */}
          <TabsContent value="purchase" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="purchase-email">Email</Label>
              <Input
                id="purchase-email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              {PLANS.map((plan) => (
                <Card
                  key={plan.id}
                  className={cn(
                    'relative cursor-pointer transition-all',
                    selectedPlan === plan.id
                      ? 'ring-primary ring-2'
                      : 'hover:border-primary/50'
                  )}
                  onClick={() => setSelectedPlan(plan.id)}
                >
                  {plan.popular && (
                    <Badge className="absolute -top-2 left-1/2 -translate-x-1/2">
                      <Star className="mr-1 h-3 w-3" />
                      Popular
                    </Badge>
                  )}
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    <CardDescription>
                      <span className="text-foreground text-2xl font-bold">
                        {plan.price}
                      </span>
                      <span className="text-muted-foreground">
                        {' '}
                        {plan.period}
                      </span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    {plan.savings && (
                      <Badge variant="secondary" className="mb-2">
                        {plan.savings}
                      </Badge>
                    )}
                    <p className="text-muted-foreground text-sm">
                      {plan.devices} devices
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="rounded-lg border p-4">
              <h4 className="mb-2 flex items-center gap-2 font-medium">
                <Sparkles className="h-4 w-4 text-yellow-500" />
                Pro Features
              </h4>
              <ul className="space-y-1">
                {PRO_FEATURES.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <Check className="text-primary h-4 w-4" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={handlePurchase}
              disabled={isLoading || !email}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Zap className="mr-2 h-4 w-4" />
              )}
              {t('pro.purchaseButton', {
                defaultValue: 'Continue to Checkout',
              })}
            </Button>
          </TabsContent>

          {/* Activate Tab */}
          <TabsContent value="activate" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="activate-email">Email</Label>
              <Input
                id="activate-email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="license-key">License Key</Label>
              <Input
                id="license-key"
                type="text"
                placeholder="SQLPRO-XXXX-XXXX-XXXX-XXXX"
                value={licenseKey}
                onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
                className="font-mono"
              />
              <p className="text-muted-foreground text-xs">
                You received your license key via email after purchase.
              </p>
            </div>

            {machineId && (
              <div className="bg-muted/50 rounded-md p-3">
                <p className="text-muted-foreground text-xs">
                  Machine ID:{' '}
                  <code className="text-foreground">
                    {machineId.slice(0, 16)}...
                  </code>
                </p>
              </div>
            )}

            <Button
              className="w-full"
              size="lg"
              onClick={handleActivate}
              disabled={isActivating || !email || !licenseKey}
            >
              {isActivating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Key className="mr-2 h-4 w-4" />
              )}
              {t('pro.activateButton', { defaultValue: 'Activate License' })}
            </Button>
          </TabsContent>

          {/* Manage Tab */}
          <TabsContent value="manage" className="space-y-4">
            {license && (
              <>
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Crown className="h-5 w-5 text-yellow-500" />
                        Pro License Active
                      </CardTitle>
                      <Badge
                        variant={
                          license.status === 'active'
                            ? 'default'
                            : 'destructive'
                        }
                      >
                        {license.status}
                      </Badge>
                    </div>
                    <CardDescription>{license.email}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Plan</span>
                      <span className="font-medium capitalize">
                        {license.plan}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Expires</span>
                      <span className="font-medium">
                        {formatDate(license.expiresAt)}
                      </span>
                    </div>
                    {(isCached || isOffline) && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Status</span>
                        <Badge variant="outline">
                          {isOffline ? 'Offline Mode' : 'Cached'}
                        </Badge>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => openPortal()}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Settings className="mr-2 h-4 w-4" />
                      )}
                      Manage Subscription
                    </Button>
                  </CardFooter>
                </Card>

                <Button
                  variant="ghost"
                  className="text-destructive hover:text-destructive w-full"
                  onClick={() => setConfirmDeactivate(true)}
                >
                  Deactivate on this machine
                </Button>
              </>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>

      <ConfirmDialog
        open={confirmDeactivate}
        onOpenChange={setConfirmDeactivate}
        title="Deactivate License"
        description="Are you sure you want to deactivate your license on this machine? You can reactivate it later."
        confirmText="Deactivate"
        onConfirm={handleDeactivate}
        variant="destructive"
      />
    </Dialog>
  );
}
