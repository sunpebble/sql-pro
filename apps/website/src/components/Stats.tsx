import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useCountUp } from '../hooks/useCountUp';
import { useInView } from '../hooks/useInView';

interface Stat {
  key: string;
  value: string;
  suffix?: string;
  icon: ReactNode;
}

const stats: Stat[] = [
  {
    key: 'databases',
    value: '5',
    suffix: '+',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="h-5 w-5"
        aria-hidden="true"
      >
        <ellipse cx="12" cy="5" rx="9" ry="3" />
        <path d="M3 5V19A9 3 0 0 0 21 19V5" />
        <path d="M3 12A9 3 0 0 0 21 12" />
      </svg>
    ),
  },
  {
    key: 'platforms',
    value: '3',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="h-5 w-5"
        aria-hidden="true"
      >
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
  },
  {
    key: 'queries',
    value: '∞',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="h-5 w-5"
        aria-hidden="true"
      >
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
  },
  {
    key: 'license',
    value: 'MIT',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="h-5 w-5"
        aria-hidden="true"
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
];

function StatValue({
  value,
  suffix,
  animate,
}: {
  value: string;
  suffix?: string;
  animate: boolean;
}) {
  const numericValue = Number(value);
  const isNumeric =
    !Number.isNaN(numericValue) && Number.isFinite(numericValue);
  const count = useCountUp({
    end: numericValue,
    enabled: animate && isNumeric,
    duration: 1200,
  });

  return (
    <div className="text-foreground mb-1 text-3xl font-bold sm:text-4xl md:text-5xl">
      {isNumeric ? count : value}
      {suffix && (
        <span className="text-main text-2xl sm:text-3xl md:text-4xl">
          {suffix}
        </span>
      )}
    </div>
  );
}

export default function Stats() {
  const { t } = useTranslation();
  const { ref, isInView } = useInView<HTMLElement>();

  return (
    <section
      ref={ref}
      className={`py-16 transition-all duration-500 md:py-20 ${
        isInView ? 'opacity-100' : 'opacity-0'
      }`}
      aria-labelledby="stats-title"
    >
      <div className="mx-auto max-w-[1280px] px-4 sm:px-5 md:px-12">
        <h2 id="stats-title" className="sr-only">
          {t('stats.title')}
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4 md:gap-6">
          {stats.map((stat, index) => (
            <div
              key={stat.key}
              className={`bg-card border-border border-t-main/60 rounded-xl border border-t-2 p-4 text-center shadow-sm transition-all duration-300 sm:p-6 ${
                isInView
                  ? 'translate-y-0 opacity-100'
                  : 'translate-y-4 opacity-0'
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <div className="text-main/60 mb-3 flex justify-center">
                {stat.icon}
              </div>
              <StatValue
                value={stat.value}
                suffix={stat.suffix}
                animate={isInView}
              />
              <div className="text-muted-foreground text-xs font-medium tracking-wide uppercase sm:text-sm">
                {t(`stats.${stat.key}`)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
