import { useTranslation } from 'react-i18next';
import './Hero.css';

export default function Hero() {
  const { t } = useTranslation();

  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-container">
        {/* Left Column - Stats */}
        <div className="hero-left">
          <nav className="hero-nav" aria-label="Quick links">
            <a href="#features" className="hero-nav-item">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
              Features
            </a>
            <a href="#pricing" className="hero-nav-item">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
              Pricing
            </a>
            <a href="#download" className="hero-nav-item">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
              Download
            </a>
          </nav>

          <div className="hero-stats">
            <div className="hero-stat">
              <span className="hero-stat-value">
                125<sup>+</sup>
              </span>
              <span className="hero-stat-label">Database Types</span>
            </div>
            <div className="hero-stat">
              <span className="hero-stat-value">
                18K<sup>+</sup>
              </span>
              <span className="hero-stat-label">Active Users</span>
            </div>
          </div>
        </div>

        {/* Right Column - Main Content */}
        <div className="hero-right">
          <div className="hero-top-bar">
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
            Smarter
            <br />
            <span className="hero-title-gradient">Database</span>
            <br />
            Management
          </h1>

          <p className="hero-description">{t('hero.description')}</p>

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

          {/* Product Preview Card */}
          <div className="hero-preview">
            {/* Floating badges */}
            <div className="hero-float-badge top-right">
              <div className="hero-float-badge-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <div className="hero-float-badge-content">
                <span className="hero-float-badge-value">AI Confidence</span>
                <span className="hero-float-badge-label">98% Accuracy</span>
              </div>
            </div>

            <div className="hero-float-badge bottom-left">
              <div className="hero-float-badge-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              </div>
              <div className="hero-float-badge-content">
                <span className="hero-float-badge-value">Human-Centric</span>
                <span className="hero-float-badge-label">The Difference</span>
              </div>
            </div>

            <div className="hero-preview-card">
              <div className="hero-preview-header">
                <div className="hero-preview-dots">
                  <span className="hero-preview-dot red" />
                  <span className="hero-preview-dot yellow" />
                  <span className="hero-preview-dot green" />
                </div>
                <span className="hero-preview-title">
                  SQL Pro — Database Manager
                </span>
              </div>

              <div className="hero-preview-content">
                <div className="hero-preview-sidebar">
                  <div className="hero-preview-sidebar-item active">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      aria-hidden="true"
                    >
                      <ellipse cx="12" cy="5" rx="9" ry="3" />
                      <path d="M3 5V19A9 3 0 0 0 21 19V5" />
                      <path d="M3 12A9 3 0 0 0 21 12" />
                    </svg>
                    PostgreSQL
                  </div>
                  <div className="hero-preview-sidebar-item">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      aria-hidden="true"
                    >
                      <ellipse cx="12" cy="5" rx="9" ry="3" />
                      <path d="M3 5V19A9 3 0 0 0 21 19V5" />
                      <path d="M3 12A9 3 0 0 0 21 12" />
                    </svg>
                    MySQL
                  </div>
                  <div className="hero-preview-sidebar-item">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      aria-hidden="true"
                    >
                      <ellipse cx="12" cy="5" rx="9" ry="3" />
                      <path d="M3 5V19A9 3 0 0 0 21 19V5" />
                      <path d="M3 12A9 3 0 0 0 21 12" />
                    </svg>
                    SQLite
                  </div>
                  <div className="hero-preview-sidebar-item">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      aria-hidden="true"
                    >
                      <ellipse cx="12" cy="5" rx="9" ry="3" />
                      <path d="M3 5V19A9 3 0 0 0 21 19V5" />
                      <path d="M3 12A9 3 0 0 0 21 12" />
                    </svg>
                    MongoDB
                  </div>
                </div>

                <div className="hero-preview-main">
                  <div className="hero-preview-table-header">
                    <span className="hero-preview-table-col">Column</span>
                    <span className="hero-preview-table-col">Type</span>
                    <span className="hero-preview-table-col">Nullable</span>
                  </div>
                  <div className="hero-preview-table-row">
                    <span className="hero-preview-table-cell code">id</span>
                    <span className="hero-preview-table-cell">SERIAL</span>
                    <span className="hero-preview-table-cell">NO</span>
                  </div>
                  <div className="hero-preview-table-row">
                    <span className="hero-preview-table-cell code">name</span>
                    <span className="hero-preview-table-cell">
                      VARCHAR(255)
                    </span>
                    <span className="hero-preview-table-cell">NO</span>
                  </div>
                  <div className="hero-preview-table-row">
                    <span className="hero-preview-table-cell code">email</span>
                    <span className="hero-preview-table-cell">
                      VARCHAR(255)
                    </span>
                    <span className="hero-preview-table-cell">NO</span>
                  </div>
                  <div className="hero-preview-table-row">
                    <span className="hero-preview-table-cell code">
                      created_at
                    </span>
                    <span className="hero-preview-table-cell">TIMESTAMP</span>
                    <span className="hero-preview-table-cell">YES</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="hero-tags">
            <a href="#features" className="hero-tag">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
              SQL Editor
            </a>
            <a href="#features" className="hero-tag">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              Data Visualization
            </a>
            <a href="#features" className="hero-tag">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Secure
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
