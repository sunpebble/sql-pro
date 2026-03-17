import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

type Plan = 'monthly' | 'yearly' | 'lifetime';

interface CheckoutModalProps {
  isOpen: boolean;
  plan: Plan | null;
  onClose: () => void;
}

// When deployed to the same origin via Cloudflare Workers, use relative path
// Otherwise, use the configured API URL or default to the production URL
const API_URL =
  (import.meta.env.VITE_LICENSE_API_URL as string | undefined) || '';

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
    (e: React.MouseEvent | React.KeyboardEvent) => {
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
      className="rounded-base border-border bg-background fixed inset-0 m-auto w-[calc(100%-32px)] max-w-md overflow-hidden border p-0 shadow-lg backdrop:bg-black/60 backdrop:backdrop-blur-sm"
      onClick={handleBackdropClick}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
      aria-labelledby="checkout-title"
    >
      <div className="relative p-6 md:p-8">
        <button
          type="button"
          className="rounded-base text-muted-foreground hover:border-border hover:bg-secondary-background hover:text-foreground absolute top-4 right-4 flex h-9 w-9 items-center justify-center border border-transparent transition-all"
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

        <h2
          id="checkout-title"
          className="mb-6 pr-10 text-xl font-bold md:text-2xl"
        >
          {t('checkout.title')}
        </h2>

        {/* Order Summary */}
        <div className="rounded-base border-border mb-6 overflow-hidden border">
          <div className="bg-secondary-background flex items-start justify-between gap-4 p-4">
            <div className="flex flex-col gap-1">
              <span className="font-semibold">
                {t(`pricing.plans.${plan}.title`)} Plan
              </span>
              <span className="text-muted-foreground max-w-48 text-xs">
                {t(`pricing.plans.${plan}.description`)}
              </span>
            </div>
            <span className="text-main flex flex-col items-end gap-0.5 text-lg font-bold md:text-xl">
              {t(`pricing.plans.${plan}.price`)}
              <small className="text-muted-foreground text-xs font-normal">
                {t(`pricing.plans.${plan}.period`)}
              </small>
            </span>
          </div>

          {/* Feature list */}
          <ul className="border-border grid grid-cols-2 gap-2 border-t p-3">
            {features.map((feature) => (
              <li
                key={feature}
                className="text-muted-foreground flex items-center gap-1.5 text-xs"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  aria-hidden="true"
                  className="text-main shrink-0"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label
            htmlFor="checkout-email"
            className="text-muted-foreground -mb-2 text-sm font-medium"
          >
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
            className="rounded-base border-border bg-background placeholder:text-muted-foreground focus:border-main focus:ring-main/20 w-full border px-4 py-3 text-base transition-all focus:ring-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isLoading}
          />
          <p className="text-muted-foreground -mt-2 text-xs">
            {t('checkout.emailHint')}
          </p>

          {error && (
            <p
              className="rounded-base bg-destructive/10 text-destructive p-3 text-sm"
              role="alert"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            className="rounded-base border-border bg-main text-main-foreground mt-2 flex w-full items-center justify-center gap-2 border px-4 py-4 text-base font-semibold shadow-sm transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-sm"
            disabled={isLoading || !email}
          >
            {isLoading ? (
              <>
                <span
                  className="mr-2 h-4 w-4 animate-spin rounded-full border border-transparent border-t-current"
                  aria-hidden="true"
                />
                {t('checkout.processing')}
              </>
            ) : (
              t('checkout.submit')
            )}
          </button>

          {/* Trust indicators */}
          <div className="border-border mt-4 flex flex-col items-center justify-center gap-3 border-t pt-4 sm:flex-row sm:gap-6">
            <div className="text-muted-foreground flex items-center gap-2 text-xs">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
                className="text-main"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              {t('checkout.secure')}
            </div>
            <div className="text-muted-foreground flex items-center gap-2 text-xs">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
                className="text-[#22c55e]"
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
