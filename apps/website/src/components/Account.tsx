import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

// API base URL - use relative path in production, localhost for dev
const API_URL = import.meta.env.DEV ? 'http://localhost:8787' : '';

interface License {
  id: string;
  licenseKey: string;
  plan: string;
  status: string;
  expiresAt: string | null;
  maxMachines: number;
  activeMachines?: number;
  stripeSubscriptionId?: string;
}

interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string;
  provider: string;
}

interface AuthState {
  authenticated: boolean;
  user?: User;
  licenses?: License[];
}

// Icons
const BackIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
);

const CopyIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const CheckIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const CreditCardIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
    <line x1="1" y1="10" x2="23" y2="10" />
  </svg>
);

const KeyIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
  </svg>
);

const DeviceIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
    <line x1="8" y1="21" x2="16" y2="21" />
    <line x1="12" y1="17" x2="12" y2="21" />
  </svg>
);

const CalendarIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const ExternalLinkIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

interface AccountProps {
  onClose: () => void;
}

export default function Account({ onClose }: AccountProps) {
  const { t } = useTranslation();
  const [authState, setAuthState] = useState<AuthState>({
    authenticated: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [billingLoading, setBillingLoading] = useState(false);

  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/auth/me`, {
        credentials: 'include',
      });
      const data = await response.json();
      setAuthState(data);

      // If not authenticated, redirect to home
      if (!data.authenticated) {
        onClose();
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      onClose();
    } finally {
      setIsLoading(false);
    }
  }, [onClose]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  async function copyLicenseKey(key: string) {
    try {
      await navigator.clipboard.writeText(key);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  }

  async function openBillingPortal() {
    setBillingLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/billing/portal`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error('No portal URL returned');
      }
    } catch (error) {
      console.error('Failed to open billing portal:', error);
    } finally {
      setBillingLoading(false);
    }
  }

  function formatPlan(plan: string): string {
    const planNames: Record<string, string> = {
      monthly: t('account.planMonthly', 'Monthly'),
      yearly: t('account.planYearly', 'Yearly'),
      lifetime: t('account.planLifetime', 'Lifetime'),
    };
    return planNames[plan] || plan.charAt(0).toUpperCase() + plan.slice(1);
  }

  function getStatusClasses(status: string): string {
    const statusMap: Record<string, string> = {
      active: 'bg-[#22c55e]/20 text-[#22c55e]',
      trialing: 'bg-[#3b82f6]/20 text-[#3b82f6]',
      expired: 'bg-destructive/20 text-destructive',
      cancelled: 'bg-destructive/20 text-destructive',
      past_due: 'bg-[#f59e0b]/20 text-[#f59e0b]',
    };
    return statusMap[status] || 'bg-secondary-background text-muted-foreground';
  }

  function getStatusLabel(status: string): string {
    const labelMap: Record<string, string> = {
      active: t('account.statusActive', 'Active'),
      trialing: t('account.statusTrial', 'Trial'),
      expired: t('account.statusExpired', 'Expired'),
      cancelled: t('account.statusCancelled', 'Cancelled'),
      past_due: t('account.statusPastDue', 'Past Due'),
    };
    return labelMap[status] || status;
  }

  function formatDate(dateString: string | null): string {
    if (!dateString) return t('account.never', 'Never');
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  function getDaysRemaining(dateString: string | null): number | null {
    if (!dateString) return null;
    const now = new Date();
    const expiry = new Date(dateString);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  if (isLoading) {
    return (
      <div className="bg-secondary-background min-h-screen px-5 py-10">
        <div className="flex min-h-96 items-center justify-center">
          <div className="border-border border-t-main h-10 w-10 animate-spin rounded-full border-[3px]" />
        </div>
      </div>
    );
  }

  const { user, licenses } = authState;
  const hasActiveLicense = licenses?.some(
    (l) => l.status === 'active' || l.status === 'trialing'
  );
  const hasSubscription = licenses?.some(
    (l) => l.stripeSubscriptionId && l.plan !== 'lifetime'
  );

  return (
    <div className="bg-secondary-background min-h-screen px-5 py-10">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <header className="mb-8">
          <button
            type="button"
            className="rounded-base text-muted-foreground hover:bg-background hover:text-foreground mb-4 flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors"
            onClick={onClose}
          >
            <BackIcon />
            <span>{t('account.backToHome', 'Back to Home')}</span>
          </button>
          <h1 className="text-2xl font-bold md:text-3xl">
            {t('account.title', 'Account')}
          </h1>
        </header>

        {/* Profile Section */}
        <section className="mb-8">
          <h2 className="mb-4 text-lg font-semibold">
            {t('account.profile', 'Profile')}
          </h2>
          <div className="rounded-base border-border bg-background flex flex-col items-start gap-4 border-2 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col items-center gap-4 sm:flex-row">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt=""
                  className="h-16 w-16 rounded-full object-cover"
                />
              ) : (
                <div className="bg-main/10 text-main flex h-16 w-16 items-center justify-center rounded-full text-2xl font-semibold">
                  {user?.name?.charAt(0) || '?'}
                </div>
              )}
              <div className="flex flex-col gap-1 text-center sm:text-left">
                <span className="text-lg font-semibold">{user?.name}</span>
                <span className="text-muted-foreground text-sm">
                  {user?.email}
                </span>
                <span className="text-muted-foreground text-xs">
                  {t('account.connectedVia', 'Connected via')}{' '}
                  {user?.provider === 'github' ? 'GitHub' : user?.provider}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Subscription Section */}
        <section className="mb-8">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
            <h2 className="flex items-center gap-2.5 text-lg font-semibold">
              <span className="text-main">
                <KeyIcon />
              </span>
              {t('account.subscriptions', 'Subscriptions')}
            </h2>
            {hasSubscription && (
              <button
                type="button"
                className="rounded-base border-border bg-background hover:border-main hover:bg-main/10 hover:text-main flex items-center gap-2 border-2 px-4 py-2.5 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-60"
                onClick={openBillingPortal}
                disabled={billingLoading}
              >
                <CreditCardIcon />
                <span>
                  {billingLoading
                    ? t('account.loading', 'Loading...')
                    : t('account.manageBilling', 'Manage Billing')}
                </span>
                <ExternalLinkIcon />
              </button>
            )}
          </div>

          {licenses && licenses.length > 0 ? (
            <div className="flex flex-col gap-4">
              {licenses.map((license) => {
                const daysRemaining = getDaysRemaining(license.expiresAt);
                const isExpiringSoon =
                  daysRemaining !== null &&
                  daysRemaining > 0 &&
                  daysRemaining <= 7;

                return (
                  <div
                    key={license.id}
                    className="rounded-base border-border bg-background border-2 p-5 md:p-6"
                  >
                    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                      <span className="bg-main text-main-foreground rounded-full px-3.5 py-1.5 text-sm font-semibold">
                        {formatPlan(license.plan)}
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(license.status)}`}
                      >
                        {getStatusLabel(license.status)}
                      </span>
                    </div>

                    <div className="border-border mb-5 border-b-2 pb-5">
                      <span className="text-muted-foreground mb-2 block text-xs font-medium tracking-wide uppercase">
                        {t('account.licenseKey', 'License Key')}
                      </span>
                      <div className="flex flex-col items-stretch gap-3 sm:flex-row">
                        <code className="rounded-base border-border bg-secondary-background flex-1 truncate border-2 px-4 py-3 text-center font-mono text-sm sm:text-left">
                          {license.licenseKey}
                        </code>
                        <button
                          type="button"
                          className="rounded-base border-border bg-main text-main-foreground hover:bg-main/90 flex items-center justify-center gap-1.5 border-2 px-3.5 py-2.5 text-sm font-medium whitespace-nowrap transition-colors"
                          onClick={() => copyLicenseKey(license.licenseKey)}
                        >
                          {copiedKey === license.licenseKey ? (
                            <CheckIcon />
                          ) : (
                            <CopyIcon />
                          )}
                          <span>
                            {copiedKey === license.licenseKey
                              ? t('account.copied', 'Copied!')
                              : t('account.copy', 'Copy')}
                          </span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      <div className="rounded-base bg-secondary-background flex items-center gap-2.5 px-4 py-3">
                        <span className="text-muted-foreground shrink-0">
                          <DeviceIcon />
                        </span>
                        <span className="text-muted-foreground text-xs">
                          {t('account.devices', 'Devices')}
                        </span>
                        <span className="ml-auto text-sm font-semibold">
                          {license.activeMachines || 0} / {license.maxMachines}
                        </span>
                      </div>

                      {license.expiresAt && (
                        <div
                          className={`rounded-base flex items-center gap-2.5 px-4 py-3 ${isExpiringSoon ? 'bg-[#f59e0b]/20' : 'bg-secondary-background'}`}
                        >
                          <span
                            className={`shrink-0 ${isExpiringSoon ? 'text-[#f59e0b]' : 'text-muted-foreground'}`}
                          >
                            <CalendarIcon />
                          </span>
                          <span
                            className={`text-xs ${isExpiringSoon ? 'text-[#f59e0b]' : 'text-muted-foreground'}`}
                          >
                            {license.status === 'active'
                              ? t('account.renewsOn', 'Renews on')
                              : t('account.expiresOn', 'Expires on')}
                          </span>
                          <span className="ml-auto flex flex-col items-end text-sm font-semibold">
                            {formatDate(license.expiresAt)}
                            {isExpiringSoon && (
                              <span className="text-[11px] font-medium text-[#f59e0b]">
                                ({daysRemaining}{' '}
                                {t('account.daysLeft', 'days left')})
                              </span>
                            )}
                          </span>
                        </div>
                      )}

                      {license.plan === 'lifetime' && (
                        <div className="rounded-base bg-secondary-background flex items-center gap-2.5 px-4 py-3">
                          <span className="text-muted-foreground shrink-0">
                            <CalendarIcon />
                          </span>
                          <span className="text-muted-foreground text-xs">
                            {t('account.validity', 'Validity')}
                          </span>
                          <span className="text-main ml-auto text-sm font-semibold">
                            {t('account.lifetimeAccess', 'Lifetime Access')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-base border-border bg-background border-2 border-dashed px-6 py-12 text-center">
              <div className="bg-secondary-background text-muted-foreground mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
                <KeyIcon />
              </div>
              <h3 className="mb-2 text-lg font-semibold">
                {t('account.noLicenses', 'No Active Licenses')}
              </h3>
              <p className="text-muted-foreground mb-5 text-sm">
                {t(
                  'account.noLicensesDesc',
                  'Purchase a license to unlock all Pro features.'
                )}
              </p>
              <button
                type="button"
                className="rounded-base border-border bg-main text-main-foreground shadow-shadow inline-flex items-center gap-2 border-2 px-6 py-3 text-sm font-semibold transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none"
                onClick={() => {
                  onClose();
                  // Scroll to pricing section
                  setTimeout(() => {
                    document
                      .getElementById('pricing')
                      ?.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                }}
              >
                {t('account.viewPlans', 'View Plans')}
              </button>
            </div>
          )}
        </section>

        {/* Quick Actions */}
        {hasActiveLicense && (
          <section className="mb-8">
            <h2 className="mb-4 text-lg font-semibold">
              {t('account.quickActions', 'Quick Actions')}
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <button
                type="button"
                className="rounded-base border-border bg-background hover:border-main hover:bg-main/10 hover:shadow-shadow flex items-center gap-3 border-2 px-5 py-4 text-sm font-medium transition-all hover:-translate-y-0.5"
                onClick={() => {
                  onClose();
                  setTimeout(() => {
                    document
                      .getElementById('download')
                      ?.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                }}
              >
                <div className="rounded-base bg-main/10 text-main flex h-10 w-10 items-center justify-center">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                </div>
                <span>{t('account.downloadApp', 'Download App')}</span>
              </button>

              <a
                href="https://docs.sqlpro.app"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-base border-border bg-background hover:border-main hover:bg-main/10 hover:shadow-shadow flex items-center gap-3 border-2 px-5 py-4 text-sm font-medium no-underline transition-all hover:-translate-y-0.5"
              >
                <div className="rounded-base bg-main/10 text-main flex h-10 w-10 items-center justify-center">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                  </svg>
                </div>
                <span>{t('account.documentation', 'Documentation')}</span>
                <span className="text-muted-foreground ml-auto">
                  <ExternalLinkIcon />
                </span>
              </a>

              <a
                href="mailto:support@sqlpro.app"
                className="rounded-base border-border bg-background hover:border-main hover:bg-main/10 hover:shadow-shadow flex items-center gap-3 border-2 px-5 py-4 text-sm font-medium no-underline transition-all hover:-translate-y-0.5"
              >
                <div className="rounded-base bg-main/10 text-main flex h-10 w-10 items-center justify-center">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </div>
                <span>{t('account.support', 'Get Support')}</span>
              </a>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
