import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useInView } from '../hooks/useInView';

type FeatureSize = 'featured' | 'wide' | 'default';

interface Feature {
  key: string;
  icon: string;
  size: FeatureSize;
}

const features: Feature[] = [
  { key: 'database', icon: 'database', size: 'featured' },
  { key: 'query', icon: 'code', size: 'featured' },
  { key: 'security', icon: 'lock', size: 'default' },
  { key: 'crossPlatform', icon: 'devices', size: 'default' },
  { key: 'visualization', icon: 'diagram', size: 'default' },
  { key: 'data', icon: 'table', size: 'wide' },
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
  code: (
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
  devices: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  ),
  diagram: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <line x1="10" y1="6.5" x2="14" y2="6.5" />
      <line x1="6.5" y1="10" x2="6.5" y2="14" />
      <line x1="17.5" y1="10" x2="17.5" y2="14" />
    </svg>
  ),
  table: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="3" y1="15" x2="21" y2="15" />
      <line x1="9" y1="3" x2="9" y2="21" />
    </svg>
  ),
};

const sizeClasses: Record<FeatureSize, string> = {
  featured: 'md:min-h-[220px] p-6 sm:p-8',
  wide: 'col-span-1 md:col-span-2 lg:col-span-3 flex-col md:flex-row md:items-center p-6 sm:p-8 md:px-10',
  default: 'p-5 sm:p-7',
};

export default function Features() {
  const { t } = useTranslation();
  const { ref: headerRef, isInView: headerVisible } = useInView<HTMLElement>();
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
      className="relative overflow-hidden py-16 md:py-24 lg:py-32"
      id="features"
      aria-labelledby="features-title"
    >
      {/* Subtle background decoration */}
      <div className="bg-grid-pattern pointer-events-none absolute inset-0 opacity-30" />

      <div className="relative mx-auto max-w-[1280px] px-4 sm:px-5 md:px-12">
        <header
          ref={headerRef}
          className={`mb-10 text-center transition-all duration-500 sm:mb-16 ${
            headerVisible
              ? 'translate-y-0 opacity-100'
              : 'translate-y-8 opacity-0'
          }`}
        >
          <span className="bg-main/10 text-main border-main/20 mb-5 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold">
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            {t('features.title')} {t('features.titleHighlight')}
          </span>
          <h2
            id="features-title"
            className="text-foreground m-0 mb-4 text-3xl leading-tight font-bold tracking-tight md:text-4xl lg:text-5xl"
          >
            {t('features.sectionTitle')}
            <br />
            <span className="text-main">{t('features.sectionHighlight')}</span>
          </h2>
          <p className="text-muted-foreground mx-auto max-w-[640px] text-lg leading-relaxed">
            {t('features.subtitle')}
          </p>
        </header>

        <div
          className="mx-auto grid max-w-[1100px] grid-cols-1 gap-4 md:grid-cols-2 md:gap-5 lg:grid-cols-3"
          role="list"
        >
          {features.map((feature, index) => (
            <div
              key={feature.key}
              ref={(el) => {
                cardsRef.current[index] = el;
              }}
              data-index={index}
              className={`bg-card border-border flex flex-col gap-4 rounded-xl border transition-all duration-300 sm:gap-5 ${sizeClasses[feature.size]} ${
                visibleCards.has(index)
                  ? 'card-neo-lift translate-y-0 opacity-100 shadow-sm'
                  : 'translate-y-8 opacity-0'
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
              role="listitem"
            >
              <div
                className={`bg-main/10 text-main flex flex-shrink-0 items-center justify-center rounded-lg ${
                  feature.size === 'featured' ? 'h-14 w-14' : 'h-12 w-12'
                } ${visibleCards.has(index) ? 'animate-icon-scale-in' : ''}`}
                style={
                  visibleCards.has(index)
                    ? { animationDelay: `${index * 100}ms` }
                    : undefined
                }
              >
                <div
                  className={
                    feature.size === 'featured' ? 'h-7 w-7' : 'h-6 w-6'
                  }
                >
                  {icons[feature.icon]}
                </div>
              </div>
              <div
                className={`flex flex-1 flex-col gap-2 ${feature.size === 'wide' ? 'flex-1' : ''}`}
              >
                <h3
                  className={`text-foreground m-0 text-lg font-semibold ${
                    feature.size === 'featured' ? 'text-xl' : ''
                  }`}
                >
                  {t(`features.${feature.key}.title`)}
                </h3>
                <p
                  className={`text-muted-foreground m-0 text-sm leading-relaxed ${
                    feature.size === 'featured' ? 'text-base' : ''
                  }`}
                >
                  {t(`features.${feature.key}.description`)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
