import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import './Features.css';

interface Feature {
  key: string;
  icon: string;
  title: string;
  description: string;
  variant: string;
}

const features: Feature[] = [
  {
    key: 'multi',
    icon: 'database',
    title: 'Multi-Database Support',
    description:
      'Connect to PostgreSQL, MySQL, SQLite, MongoDB and more. One tool for all your databases.',
    variant: 'default',
  },
  {
    key: 'ai',
    icon: 'sparkles',
    title: 'AI-Powered Assistant',
    description:
      'Get intelligent query suggestions, natural language to SQL, and smart autocomplete.',
    variant: 'accent',
  },
  {
    key: 'secure',
    icon: 'lock',
    title: 'Local First & Secure',
    description:
      'Your data never leaves your machine. All connections are stored locally with encryption.',
    variant: 'default',
  },
];

const icons: Record<string, ReactNode> = {
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
  const [visibleCards, setVisibleCards] = useState<Set<number>>(
    () => new Set()
  );
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
            Features
          </span>
          <h2 id="features-title" className="features-title">
            Everything you need for
            <br />
            <span className="features-title-gradient">database management</span>
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
                <div className="feature-card-icon">{icons[feature.icon]}</div>

                <div className="feature-card-content">
                  <h3 className="feature-card-title">{feature.title}</h3>
                  <p className="feature-card-description">
                    {feature.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
