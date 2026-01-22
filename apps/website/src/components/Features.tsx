import type {ReactNode} from 'react';
import {  useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import './Features.css';

interface Feature {
  key: string;
  icon: string;
  title: string;
  description: string;
  variant: string;
  hasList?: boolean;
  listItems?: string[];
  hasVisual?: boolean;
  badge?: string;
}

const features: Feature[] = [
  {
    key: 'ai',
    icon: 'sparkles',
    title: 'AI Guidance',
    description:
      'Get intelligent query suggestions and optimization tips powered by AI.',
    variant: 'large',
    hasList: true,
    listItems: ['Smart autocomplete', 'Query optimization', 'Error detection'],
  },
  {
    key: 'clarity',
    icon: 'eye',
    title: 'Clarity Meets Compliance',
    description:
      "We make sure you're 100% safe while keeping things 100% clear without doubt.",
    variant: 'dark tall',
    hasVisual: true,
  },
  {
    key: 'smart',
    icon: 'zap',
    title: 'Smart Help',
    description: 'Intelligent assistance that understands your workflow.',
    variant: 'default',
  },
  {
    key: 'expert',
    icon: 'users',
    title: 'Expert Support',
    description: 'Dedicated support to help you get the most out of SQL Pro.',
    variant: 'default',
    badge: 'Pro',
  },
  {
    key: 'multi',
    icon: 'database',
    title: 'Multi-Database Support',
    description:
      'Connect to PostgreSQL, MySQL, SQLite, MongoDB and 120+ more database engines.',
    variant: 'accent',
  },
  {
    key: 'secure',
    icon: 'lock',
    title: 'Enterprise Security',
    description: 'Your data never leaves your machine. Full local encryption.',
    variant: 'default',
  },
];

const icons: Record<string, ReactNode> = {
  sparkles: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  eye: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  zap: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  users: (
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
  ),
  database: (
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
  ),
  lock: (
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
          <span className="features-label">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            Our Services
          </span>
          <h2 id="features-title" className="features-title">
            Redefining database management
            <br />
            with{' '}
            <span className="features-title-gradient">AI intelligence</span>
          </h2>
          <p className="features-subtitle">{t('features.subtitle')}</p>
        </header>

        <div className="features-grid" role="list">
          {features.map((feature, index) => (
            <div
              key={feature.key}
              ref={(el) => {
                cardsRef.current[index] = el;
              }}
              data-index={index}
              className={`feature-card-wrapper ${visibleCards.has(index) ? 'visible' : ''}`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <div
                className={`feature-card ${feature.variant}`}
                role="listitem"
              >
                {feature.badge && (
                  <span className="feature-card-badge">{feature.badge}</span>
                )}

                <div className="feature-card-icon">{icons[feature.icon]}</div>

                <div className="feature-card-content">
                  <h3 className="feature-card-title">{feature.title}</h3>
                  <p className="feature-card-description">
                    {feature.description}
                  </p>

                  {feature.hasList && feature.listItems && (
                    <div className="feature-card-list">
                      {feature.listItems.map((item, i) => (
                        <div key={i} className="feature-card-list-item">
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            aria-hidden="true"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          {item}
                        </div>
                      ))}
                    </div>
                  )}

                  {feature.hasVisual && (
                    <div className="feature-card-visual">
                      <div className="feature-card-visual-row">
                        <span className="feature-card-visual-dot" />
                        <span className="feature-card-visual-line long" />
                      </div>
                      <div className="feature-card-visual-row">
                        <span className="feature-card-visual-dot" />
                        <span className="feature-card-visual-line medium" />
                      </div>
                      <div className="feature-card-visual-row">
                        <span className="feature-card-visual-dot" />
                        <span className="feature-card-visual-line short" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
