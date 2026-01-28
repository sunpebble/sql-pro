import { useTranslation } from 'react-i18next';
import { useInView } from '../hooks/useInView';
import './OpenSource.css';

export default function OpenSource() {
  const { t } = useTranslation();
  const { ref: contentRef, isInView } = useInView<HTMLDivElement>();

  return (
    <section
      className="opensource"
      id="opensource"
      aria-labelledby="opensource-title"
    >
      <div className="container">
        <div
          ref={contentRef}
          className={`opensource-content ${isInView ? 'visible' : ''}`}
        >
          <div className="opensource-info">
            <span className="opensource-label">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              {t('opensource.label')}
            </span>
            <h2 id="opensource-title" className="opensource-title">
              {t('opensource.title')}{' '}
              <span className="opensource-title-gradient">
                {t('opensource.titleHighlight')}
              </span>
            </h2>
            <p className="opensource-description">
              {t('opensource.description')}
            </p>

            <div className="opensource-features">
              <div className="opensource-feature">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <span>{t('opensource.features.secure')}</span>
              </div>
              <div className="opensource-feature">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                <span>{t('opensource.features.community')}</span>
              </div>
              <div className="opensource-feature">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                </svg>
                <span>{t('opensource.features.extensible')}</span>
              </div>
            </div>

            <div className="opensource-actions">
              <a
                href="https://github.com/anthropics/sql-pro"
                target="_blank"
                rel="noopener noreferrer"
                className="opensource-btn-primary"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                {t('opensource.viewOnGithub')}
              </a>
              <a
                href="https://github.com/anthropics/sql-pro/stargazers"
                target="_blank"
                rel="noopener noreferrer"
                className="opensource-btn-secondary"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                {t('opensource.starOnGithub')}
              </a>
            </div>
          </div>

          <div className="opensource-visual">
            <div className="terminal-window">
              <div className="terminal-header">
                <div className="terminal-dots">
                  <span className="terminal-dot red" />
                  <span className="terminal-dot yellow" />
                  <span className="terminal-dot green" />
                </div>
                <span className="terminal-title">Terminal</span>
              </div>
              <div className="terminal-content">
                <div className="terminal-line">
                  <span className="terminal-prompt">$</span>
                  <span className="terminal-command">
                    git clone https://github.com/anthropics/sql-pro.git
                  </span>
                </div>
                <div className="terminal-line">
                  <span className="terminal-output">
                    Cloning into 'sql-pro'...
                  </span>
                </div>
                <div className="terminal-line">
                  <span className="terminal-prompt">$</span>
                  <span className="terminal-command">
                    cd sql-pro && pnpm install
                  </span>
                </div>
                <div className="terminal-line">
                  <span className="terminal-output">
                    Packages: +1234 Done in 12.5s
                  </span>
                </div>
                <div className="terminal-line">
                  <span className="terminal-prompt">$</span>
                  <span className="terminal-command">pnpm dev:electron</span>
                </div>
                <div className="terminal-line">
                  <span className="terminal-output terminal-success">
                    SQL Pro is ready!
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
