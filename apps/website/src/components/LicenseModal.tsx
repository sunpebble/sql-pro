import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface LicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// When deployed to the same origin via Cloudflare Workers, use relative path
const API_URL =
  (import.meta.env.VITE_LICENSE_API_URL as string | undefined) || '';

interface LicenseInfo {
  email: string;
  licenseKey: string;
  plan: string;
  status: string;
  expiresAt: string;
  maxMachines: number;
}

export default function LicenseModal({ isOpen, onClose }: LicenseModalProps) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [license, setLicense] = useState<LicenseInfo | null>(null);
  const [copied, setCopied] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClose = useCallback(() => {
    setLicense(null);
    setEmail('');
    setError(null);
    onClose();
  }, [onClose]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      dialog.showModal();
      // If we already have a license from URL params, don't focus input
      if (!license) {
        inputRef.current?.focus();
      }
    } else {
      dialog.close();
    }
  }, [isOpen, license]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, handleClose]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent | React.KeyboardEvent) => {
      if (e.target === dialogRef.current) {
        handleClose();
      }
    },
    [handleClose]
  );

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/license/lookup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success && data.license) {
        setLicense(data.license);
      } else {
        setError(data.error || t('license.notFound'));
      }
    } catch {
      setError(t('license.networkError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!license) return;
    try {
      await navigator.clipboard.writeText(license.licenseKey);
      setCopied(true);
      setTimeout(setCopied, 2000, false);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = license.licenseKey;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(setCopied, 2000, false);
    }
  };

  const getStatusClasses = (status: string): string => {
    const statusMap: Record<string, string> = {
      active: 'text-[#22c55e]',
      canceled: 'text-destructive',
      expired: 'text-[#f59e0b]',
    };
    return statusMap[status] || '';
  };

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      className="fixed inset-0 m-0 flex h-full max-h-full w-full max-w-full items-center justify-center border-none bg-black/60 p-4 backdrop-blur-sm"
      onClick={handleBackdropClick}
      onKeyDown={(e) => {
        if (e.key === 'Escape') handleClose();
      }}
      aria-labelledby="license-title"
    >
      <div className="animate-pop-in rounded-base border-border bg-background relative max-h-[90vh] w-full max-w-md overflow-y-auto border p-6 shadow-lg md:p-8">
        <button
          type="button"
          className="bg-secondary-background text-muted-foreground hover:border-border hover:text-foreground absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full border border-transparent transition-all"
          onClick={handleClose}
          aria-label={t('license.close')}
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

        {license ? (
          // Show license info
          <div className="text-center">
            <div className="from-main to-main/80 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br text-white">
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>

            <h2
              id="license-title"
              className="mb-2 text-center text-xl font-bold md:text-2xl"
            >
              {t('license.successTitle')}
            </h2>

            <p className="text-muted-foreground mb-6">{license.email}</p>

            {/* License Key Box */}
            <div className="rounded-base border-main bg-secondary-background mb-6 border border-dashed p-4">
              <p className="text-muted-foreground mb-2 text-xs tracking-widest uppercase">
                {t('license.keyLabel')}
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 font-mono text-base font-bold break-all">
                  {license.licenseKey}
                </code>
                <button
                  type="button"
                  className="rounded-base border-border bg-main hover:bg-main/90 flex h-10 w-10 shrink-0 items-center justify-center border text-white transition-all"
                  onClick={handleCopy}
                  aria-label={t('license.copy')}
                >
                  {copied ? (
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      aria-hidden="true"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      aria-hidden="true"
                    >
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* License Details */}
            <div className="mb-6 grid grid-cols-3 gap-4 text-left">
              <div className="rounded-base bg-secondary-background p-3">
                <span className="text-muted-foreground mb-1 block text-xs">
                  {t('license.plan')}
                </span>
                <span className="block font-semibold capitalize">
                  {license.plan}
                </span>
              </div>
              <div className="rounded-base bg-secondary-background p-3">
                <span className="text-muted-foreground mb-1 block text-xs">
                  {t('license.status')}
                </span>
                <span
                  className={`block font-semibold capitalize ${getStatusClasses(license.status)}`}
                >
                  {license.status}
                </span>
              </div>
              <div className="rounded-base bg-secondary-background p-3">
                <span className="text-muted-foreground mb-1 block text-xs">
                  {t('license.devices')}
                </span>
                <span className="block font-semibold">
                  {license.maxMachines}
                </span>
              </div>
            </div>

            {/* Instructions */}
            <div className="rounded-base bg-secondary-background mb-6 p-4 text-left">
              <h3 className="mb-3 text-sm font-semibold">
                {t('license.howToActivate')}
              </h3>
              <ol className="text-muted-foreground list-decimal space-y-1 pl-5 text-sm leading-relaxed">
                <li>{t('license.step1')}</li>
                <li>{t('license.step2')}</li>
                <li>{t('license.step3')}</li>
              </ol>
            </div>

            <button
              type="button"
              className="rounded-base border-border bg-main text-main-foreground w-full border px-4 py-3.5 text-base font-semibold shadow-sm transition-all active:scale-95"
              onClick={handleClose}
            >
              {t('license.done')}
            </button>
          </div>
        ) : (
          // Show lookup form
          <>
            <h2
              id="license-title"
              className="mb-2 text-center text-xl font-bold md:text-2xl"
            >
              {t('license.lookupTitle')}
            </h2>
            <p className="text-muted-foreground mb-6 text-center">
              {t('license.lookupSubtitle')}
            </p>

            <form onSubmit={handleLookup} className="flex flex-col gap-4">
              <label
                htmlFor="license-email"
                className="text-foreground font-medium"
              >
                {t('license.emailLabel')}
              </label>
              <input
                ref={inputRef}
                id="license-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('license.emailPlaceholder')}
                required
                className="rounded-base border-border bg-background placeholder:text-muted-foreground focus:border-main w-full border px-4 py-3.5 text-base transition-colors focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isLoading}
              />

              {error && (
                <p
                  className="rounded-base bg-destructive/10 text-destructive p-2 text-sm"
                  role="alert"
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                className="rounded-base border-border bg-main text-main-foreground flex w-full items-center justify-center gap-2 border px-4 py-3.5 text-base font-semibold shadow-sm transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-sm"
                disabled={isLoading || !email}
              >
                {isLoading ? (
                  <>
                    <span
                      className="h-4 w-4 animate-spin rounded-full border border-current border-r-transparent"
                      aria-hidden="true"
                    />
                    {t('license.searching')}
                  </>
                ) : (
                  t('license.lookup')
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </dialog>
  );
}
