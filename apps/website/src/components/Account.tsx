import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import './Account.css';

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

  function getStatusInfo(status: string): { label: string; className: string } {
    const statusMap: Record<string, { label: string; className: string }> = {
      active: {
        label: t('account.statusActive', 'Active'),
        className: 'status-active',
      },
      trialing: {
        label: t('account.statusTrial', 'Trial'),
        className: 'status-trial',
      },
      expired: {
        label: t('account.statusExpired', 'Expired'),
        className: 'status-expired',
      },
      cancelled: {
        label: t('account.statusCancelled', 'Cancelled'),
        className: 'status-cancelled',
      },
      past_due: {
        label: t('account.statusPastDue', 'Past Due'),
        className: 'status-past-due',
      },
    };
    return statusMap[status] || { label: status, className: 'status-default' };
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
      <div className="account-page">
        <div className="account-loading">
          <div className="account-spinner" />
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
    <div className="account-page">
      <div className="account-container">
        {/* Header */}
        <header className="account-header">
          <button type="button" className="account-back-btn" onClick={onClose}>
            <BackIcon />
            <span>{t('account.backToHome', 'Back to Home')}</span>
          </button>
          <h1 className="account-title">{t('account.title', 'Account')}</h1>
        </header>

        {/* Profile Section */}
        <section className="account-section">
          <h2 className="account-section-title">
            {t('account.profile', 'Profile')}
          </h2>
          <div className="account-card profile-card">
            <div className="profile-info">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="profile-avatar" />
              ) : (
                <div className="profile-avatar-placeholder">
                  {user?.name?.charAt(0) || '?'}
                </div>
              )}
              <div className="profile-details">
                <span className="profile-name">{user?.name}</span>
                <span className="profile-email">{user?.email}</span>
                <span className="profile-provider">
                  {t('account.connectedVia', 'Connected via')}{' '}
                  {user?.provider === 'github' ? 'GitHub' : user?.provider}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Subscription Section */}
        <section className="account-section">
          <div className="account-section-header">
            <h2 className="account-section-title">
              <KeyIcon />
              {t('account.subscriptions', 'Subscriptions')}
            </h2>
            {hasSubscription && (
              <button
                type="button"
                className="billing-portal-btn"
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
            <div className="licenses-list">
              {licenses.map((license) => {
                const statusInfo = getStatusInfo(license.status);
                const daysRemaining = getDaysRemaining(license.expiresAt);
                const isExpiringSoon =
                  daysRemaining !== null &&
                  daysRemaining > 0 &&
                  daysRemaining <= 7;

                return (
                  <div key={license.id} className="license-card-full">
                    <div className="license-card-header">
                      <div className="license-plan-badge">
                        {formatPlan(license.plan)}
                      </div>
                      <span
                        className={`license-status-badge ${statusInfo.className}`}
                      >
                        {statusInfo.label}
                      </span>
                    </div>

                    <div className="license-key-section">
                      <label className="license-key-label">
                        {t('account.licenseKey', 'License Key')}
                      </label>
                      <div className="license-key-row">
                        <code className="license-key-code">
                          {license.licenseKey}
                        </code>
                        <button
                          type="button"
                          className="copy-key-btn"
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

                    <div className="license-details-grid">
                      <div className="license-detail">
                        <DeviceIcon />
                        <span className="license-detail-label">
                          {t('account.devices', 'Devices')}
                        </span>
                        <span className="license-detail-value">
                          {license.activeMachines || 0} / {license.maxMachines}
                        </span>
                      </div>

                      {license.expiresAt && (
                        <div
                          className={`license-detail ${isExpiringSoon ? 'expiring-soon' : ''}`}
                        >
                          <CalendarIcon />
                          <span className="license-detail-label">
                            {license.status === 'active'
                              ? t('account.renewsOn', 'Renews on')
                              : t('account.expiresOn', 'Expires on')}
                          </span>
                          <span className="license-detail-value">
                            {formatDate(license.expiresAt)}
                            {isExpiringSoon && (
                              <span className="expiry-warning">
                                ({daysRemaining}{' '}
                                {t('account.daysLeft', 'days left')})
                              </span>
                            )}
                          </span>
                        </div>
                      )}

                      {license.plan === 'lifetime' && (
                        <div className="license-detail">
                          <CalendarIcon />
                          <span className="license-detail-label">
                            {t('account.validity', 'Validity')}
                          </span>
                          <span className="license-detail-value license-lifetime">
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
            <div className="no-licenses">
              <div className="no-licenses-icon">
                <KeyIcon />
              </div>
              <h3>{t('account.noLicenses', 'No Active Licenses')}</h3>
              <p>
                {t(
                  'account.noLicensesDesc',
                  'Purchase a license to unlock all Pro features.'
                )}
              </p>
              <button
                type="button"
                className="get-license-btn"
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
          <section className="account-section">
            <h2 className="account-section-title">
              {t('account.quickActions', 'Quick Actions')}
            </h2>
            <div className="quick-actions-grid">
              <a
                href="#download"
                className="quick-action-card"
                onClick={(e) => {
                  e.preventDefault();
                  onClose();
                  setTimeout(() => {
                    document
                      .getElementById('download')
                      ?.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                }}
              >
                <div className="quick-action-icon">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                </div>
                <span>{t('account.downloadApp', 'Download App')}</span>
              </a>

              <a
                href="https://docs.sqlpro.app"
                target="_blank"
                rel="noopener noreferrer"
                className="quick-action-card"
              >
                <div className="quick-action-icon">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                  </svg>
                </div>
                <span>{t('account.documentation', 'Documentation')}</span>
                <ExternalLinkIcon />
              </a>

              <a href="mailto:support@sqlpro.app" className="quick-action-card">
                <div className="quick-action-icon">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
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
