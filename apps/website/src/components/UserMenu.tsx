import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import './UserMenu.css';

// API base URL - use relative path in production, localhost for dev
const API_URL = import.meta.env.DEV ? 'http://localhost:8787' : '';

interface License {
  id: string;
  licenseKey: string;
  plan: string;
  status: string;
  expiresAt: string;
  maxMachines: number;
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

const GitHubIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
  </svg>
);

const UserIcon = () => (
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
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const SettingsIcon = () => (
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
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const LogOutIcon = () => (
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
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

export default function UserMenu() {
  const { t } = useTranslation();
  const [authState, setAuthState] = useState<AuthState>({
    authenticated: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Check authentication status on mount
  useEffect(() => {
    checkAuth();
  }, []);

  // Check for login success/error in URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const loginStatus = params.get('login');
    const error = params.get('error');

    if (loginStatus === 'success') {
      checkAuth();
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    } else if (error) {
      console.error('Login error:', error);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function checkAuth() {
    try {
      const response = await fetch(`${API_URL}/api/auth/me`, {
        credentials: 'include',
      });
      const data = await response.json();
      setAuthState(data);
    } catch (error) {
      console.error('Auth check failed:', error);
      setAuthState({ authenticated: false });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      setAuthState({ authenticated: false });
      setIsOpen(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

  function handleLogin() {
    window.location.href = `${API_URL}/api/auth/github`;
  }

  function handleOpenAccount() {
    setIsOpen(false);
    // Dispatch custom event to open account page
    window.dispatchEvent(new CustomEvent('openAccountPage'));
  }

  function getSubscriptionStatus(): {
    label: string;
    className: string;
  } | null {
    const { licenses } = authState;
    if (!licenses || licenses.length === 0) return null;

    const activeLicense = licenses.find(
      (l) => l.status === 'active' || l.status === 'trialing'
    );
    if (activeLicense) {
      if (activeLicense.plan === 'lifetime') {
        return {
          label: t('auth.lifetimePro', 'Lifetime Pro'),
          className: 'status-lifetime',
        };
      }
      if (activeLicense.status === 'trialing') {
        return { label: t('auth.trial', 'Trial'), className: 'status-trial' };
      }
      return { label: t('auth.pro', 'Pro'), className: 'status-active' };
    }

    return { label: t('auth.free', 'Free'), className: 'status-free' };
  }

  if (isLoading) {
    return (
      <div className="user-menu">
        <div
          className="user-menu-loading"
          aria-label={t('auth.loading', 'Loading...')}
        >
          <div className="user-menu-spinner" />
        </div>
      </div>
    );
  }

  if (!authState.authenticated) {
    return (
      <div className="user-menu">
        <button
          type="button"
          className="login-btn"
          onClick={handleLogin}
          aria-label={t('auth.loginWithGithub', 'Sign in with GitHub')}
        >
          <GitHubIcon />
          <span className="login-btn-text">{t('auth.login', 'Sign in')}</span>
        </button>
      </div>
    );
  }

  const { user } = authState;
  const subscriptionStatus = getSubscriptionStatus();

  return (
    <div className="user-menu" ref={menuRef}>
      <button
        type="button"
        className="user-menu-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label={t('auth.accountMenu', 'Account menu')}
      >
        {user?.avatarUrl ? (
          <img src={user.avatarUrl} alt="" className="user-avatar" />
        ) : (
          <div className="user-avatar-placeholder">
            <UserIcon />
          </div>
        )}
      </button>

      {isOpen && (
        <div className="user-menu-dropdown" role="menu">
          <div className="user-menu-header">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="user-avatar-lg" />
            ) : (
              <div className="user-avatar-placeholder-lg">
                <UserIcon />
              </div>
            )}
            <div className="user-info">
              <span className="user-name">{user?.name}</span>
              <span className="user-email">{user?.email}</span>
              {subscriptionStatus && (
                <span
                  className={`user-subscription-badge ${subscriptionStatus.className}`}
                >
                  {subscriptionStatus.label}
                </span>
              )}
            </div>
          </div>

          <div className="user-menu-divider" />

          <button
            type="button"
            className="user-menu-item"
            onClick={handleOpenAccount}
            role="menuitem"
          >
            <SettingsIcon />
            <span>{t('auth.accountSettings', 'Account & Subscriptions')}</span>
          </button>

          <div className="user-menu-divider" />

          <button
            type="button"
            className="user-menu-item user-menu-item-danger"
            onClick={handleLogout}
            role="menuitem"
          >
            <LogOutIcon />
            <span>{t('auth.logout', 'Sign out')}</span>
          </button>
        </div>
      )}
    </div>
  );
}
