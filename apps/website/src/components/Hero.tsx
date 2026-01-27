import { useTranslation } from 'react-i18next';
import './Hero.css';

export default function Hero() {
  const { t } = useTranslation();

  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-container">
        {/* Header Section */}
        <div className="hero-header">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span className="hero-badge">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              Open Source
            </span>
            <span className="hero-version">v1.0.0</span>
          </div>

          <h1 id="hero-title" className="hero-title">
            {t('hero.title')}
          </h1>

          <p className="hero-description">{t('hero.description')}</p>
        </div>

        {/* Actions */}
        <div
          className="hero-actions"
          role="group"
          aria-label={t('a11y.mainNavigation')}
        >
          <a href="#download" className="hero-btn-primary">
            <svg
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
            {t('hero.download')}
          </a>
          <a
            href="https://github.com/anthropics/sql-pro"
            target="_blank"
            rel="noopener noreferrer"
            className="hero-btn-secondary"
            aria-label={t('a11y.socialLink', { name: 'GitHub' })}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            {t('hero.github')}
          </a>
        </div>

        {/* Product Screenshot */}
        <div className="hero-screenshot">
          <img
            src="/screenshots/query-dark.png"
            alt="SQL Pro query editor interface showing SQL syntax highlighting and database sidebar"
            className="hero-screenshot-img"
          />
        </div>
      </div>
    </section>
  );
}
