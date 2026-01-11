import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import './Features.css';

const featureKeys = [
  { key: 'database', icon: 'database' },
  { key: 'query', icon: 'code' },
  { key: 'data', icon: 'edit' },
  { key: 'visualization', icon: 'image' },
  { key: 'security', icon: 'lock' },
  { key: 'crossPlatform', icon: 'monitor' },
] as const;

const icons: Record<string, JSX.Element> = {
  database: (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5V19A9 3 0 0 0 21 19V5" />
      <path d="M3 12A9 3 0 0 0 21 12" />
    </svg>
  ),
  code: (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  ),
  edit: (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  image: (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  ),
  lock: (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  monitor: (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  ),
};

export default function Features() {
  const { t } = useTranslation();
  const [visibleCards, setVisibleCards] = useState<Set<number>>(new Set());
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = Number(entry.target.getAttribute('data-index'));
          if (entry.isIntersecting) {
            setVisibleCards((prev) => new Set([...prev, index]));
          }
        });
      },
      { threshold: 0.2, rootMargin: '0px 0px -50px 0px' }
    );

    cardsRef.current.forEach((card) => {
      if (card) observer.observe(card);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <section
      className="features"
      id="features"
      aria-labelledby="features-title"
    >
      <div className="container">
        <header className="features-header">
          <h2 id="features-title" className="features-title">
            {t('features.title')}
            <span className="gradient-text">
              {t('features.titleHighlight')}
            </span>
          </h2>
          <p className="features-subtitle">{t('features.subtitle')}</p>
        </header>

        <div className="features-grid" role="list">
          {featureKeys.map((feature, index) => (
            <article
              key={feature.key}
              ref={(el) => {
                cardsRef.current[index] = el;
              }}
              data-index={index}
              className={`card feature-card ${visibleCards.has(index) ? 'visible' : ''}`}
              style={{ transitionDelay: `${index * 100}ms` }}
              role="listitem"
              aria-label={t(`a11y.featureCard`, {
                title: t(`features.${feature.key}.title`),
              })}
            >
              <div className="feature-icon">{icons[feature.icon]}</div>
              <h3 className="feature-title">
                {t(`features.${feature.key}.title`)}
              </h3>
              <p className="feature-description">
                {t(`features.${feature.key}.description`)}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
