import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import './CheckoutModal.css';

type Plan = 'monthly' | 'yearly' | 'lifetime';

interface CheckoutModalProps {
  isOpen: boolean;
  plan: Plan | null;
  onClose: () => void;
}

const API_URL =
  import.meta.env.VITE_LICENSE_API_URL || 'https://license.sqlpro.dev';

const PLAN_FEATURES: Record<Plan, string[]> = {
  monthly: ['All Pro features', '3 devices', 'Priority support'],
  yearly: ['All Pro features', '5 devices', 'Priority support', 'Save 33%'],
  lifetime: ['All Pro features', 'Unlimited devices', 'Forever updates'],
};

export default function CheckoutModal({
  isOpen,
  plan,
  onClose,
}: CheckoutModalProps) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      dialog.showModal();
      inputRef.current?.focus();
    } else {
      dialog.close();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === dialogRef.current) {
        onClose();
      }
    },
    [onClose]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plan || !email) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          plan,
          successUrl: `${window.location.origin}/?checkout=success`,
          cancelUrl: `${window.location.origin}/?checkout=canceled`,
        }),
      });

      const data = await response.json();

      if (data.success && data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || t('checkout.error'));
      }
    } catch {
      setError(t('checkout.networkError'));
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !plan) return null;

  const features = PLAN_FEATURES[plan] || [];

  return (
    <dialog
      ref={dialogRef}
      className="checkout-modal"
      onClick={handleBackdropClick}
      aria-labelledby="checkout-title"
    >
      <div className="checkout-content">
        <button
          type="button"
          className="checkout-close"
          onClick={onClose}
          aria-label={t('checkout.close')}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <h2 id="checkout-title" className="checkout-title">
          {t('checkout.title')}
        </h2>

        {/* Order Summary */}
        <div className="checkout-summary">
          <div className="checkout-plan">
            <div className="checkout-plan-info">
              <span className="checkout-plan-name">
                {t(`pricing.plans.${plan}.title`)} Plan
              </span>
              <span className="checkout-plan-description">
                {t(`pricing.plans.${plan}.description`)}
              </span>
            </div>
            <span className="checkout-plan-price">
              {t(`pricing.plans.${plan}.price`)}
              <small>{t(`pricing.plans.${plan}.period`)}</small>
            </span>
          </div>

          {/* Feature list */}
          <ul className="checkout-features">
            {features.map((feature, index) => (
              <li key={index}>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  aria-hidden="true"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <form onSubmit={handleSubmit} className="checkout-form">
          <label htmlFor="checkout-email" className="checkout-label">
            {t('checkout.emailLabel')}
          </label>
          <input
            ref={inputRef}
            id="checkout-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('checkout.emailPlaceholder')}
            required
            className="checkout-input"
            disabled={isLoading}
          />
          <p className="checkout-email-hint">{t('checkout.emailHint')}</p>

          {error && (
            <p className="checkout-error" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="btn btn-primary checkout-submit"
            disabled={isLoading || !email}
          >
            {isLoading ? (
              <>
                <span className="checkout-spinner" aria-hidden="true" />
                {t('checkout.processing')}
              </>
            ) : (
              t('checkout.submit')
            )}
          </button>

          {/* Trust indicators */}
          <div className="checkout-trust">
            <div className="checkout-secure">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              {t('checkout.secure')}
            </div>
            <div className="checkout-guarantee">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              {t('checkout.guarantee')}
            </div>
          </div>
        </form>
      </div>
    </dialog>
  );
}
