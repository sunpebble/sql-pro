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
  featured: 'min-h-[200px] p-8',
  wide: 'col-span-1 md:col-span-2 lg:col-span-3 flex-row items-center p-8 md:px-10',
  default: '',
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
      className="relative overflow-hidden py-24 md:py-32"
      id="features"
      aria-labelledby="features-title"
    >
      <div className="mx-auto max-w-[1280px] px-5 md:px-12">
        <header
          ref={headerRef}
          className={`mb-16 text-center transition-all duration-500 ${
            headerVisible
              ? 'translate-y-0 opacity-100'
              : 'translate-y-8 opacity-0'
          }`}
        >
          <span className="bg-main text-main-foreground border-border rounded-base shadow-shadow-sm mb-5 inline-flex items-center gap-2 border-2 px-4 py-2 text-sm font-semibold tracking-wide uppercase">
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
            Features
          </span>
          <h2
            id="features-title"
            className="text-foreground m-0 mb-4 text-3xl leading-tight font-bold tracking-tight md:text-4xl lg:text-5xl"
          >
            Everything you need for
            <br />
            <span className="text-main">database management</span>
          </h2>
          <p className="text-muted-foreground mx-auto max-w-[600px] text-lg leading-relaxed">
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
              className={`bg-card border-border rounded-base flex min-h-[180px] flex-col gap-5 border-2 p-7 transition-all duration-300 ${sizeClasses[feature.size]} ${
                visibleCards.has(index)
                  ? 'shadow-shadow hover:translate-x-boxShadowX hover:translate-y-boxShadowY translate-y-0 opacity-100 hover:shadow-none'
                  : 'translate-y-8 opacity-0'
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
              role="listitem"
            >
              <div
                className={`bg-main text-main-foreground border-border rounded-base flex h-13 w-13 flex-shrink-0 items-center justify-center border-2 ${
                  feature.size === 'featured' ? 'h-14 w-14' : ''
                }`}
              >
                <div
                  className={`h-6 w-6 ${feature.size === 'featured' ? 'h-7 w-7' : ''}`}
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
