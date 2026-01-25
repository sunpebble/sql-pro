import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import './LicenseModal.css';

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
    (e: React.MouseEvent) => {
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
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = license.licenseKey;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      className="license-modal"
      onClick={handleBackdropClick}
      aria-labelledby="license-title"
    >
      <div className="license-content">
        <button
          type="button"
          className="license-close"
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
          <div className="license-result">
            <div className="license-success-icon">
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>

            <h2 id="license-title" className="license-title">
              {t('license.successTitle')}
            </h2>

            <p className="license-email">{license.email}</p>

            {/* License Key Box */}
            <div className="license-key-box">
              <p className="license-key-label">{t('license.keyLabel')}</p>
              <div className="license-key-wrapper">
                <code className="license-key">{license.licenseKey}</code>
                <button
                  type="button"
                  className="license-copy-btn"
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
                    >
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* License Details */}
            <div className="license-details">
              <div className="license-detail">
                <span className="license-detail-label">
                  {t('license.plan')}
                </span>
                <span className="license-detail-value">{license.plan}</span>
              </div>
              <div className="license-detail">
                <span className="license-detail-label">
                  {t('license.status')}
                </span>
                <span
                  className={`license-detail-value license-status-${license.status}`}
                >
                  {license.status}
                </span>
              </div>
              <div className="license-detail">
                <span className="license-detail-label">
                  {t('license.devices')}
                </span>
                <span className="license-detail-value">
                  {license.maxMachines}
                </span>
              </div>
            </div>

            {/* Instructions */}
            <div className="license-instructions">
              <h3>{t('license.howToActivate')}</h3>
              <ol>
                <li>{t('license.step1')}</li>
                <li>{t('license.step2')}</li>
                <li>{t('license.step3')}</li>
              </ol>
            </div>

            <button
              type="button"
              className="btn btn-primary license-done-btn"
              onClick={handleClose}
            >
              {t('license.done')}
            </button>
          </div>
        ) : (
          // Show lookup form
          <>
            <h2 id="license-title" className="license-title">
              {t('license.lookupTitle')}
            </h2>
            <p className="license-subtitle">{t('license.lookupSubtitle')}</p>

            <form onSubmit={handleLookup} className="license-form">
              <label htmlFor="license-email" className="license-label">
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
                className="license-input"
                disabled={isLoading}
              />

              {error && (
                <p className="license-error" role="alert">
                  {error}
                </p>
              )}

              <button
                type="submit"
                className="btn btn-primary license-submit"
                disabled={isLoading || !email}
              >
                {isLoading ? (
                  <>
                    <span className="license-spinner" aria-hidden="true" />
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
