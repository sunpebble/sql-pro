import { useTranslation } from 'react-i18next';
import { useCountUp } from '../hooks/useCountUp';
import { useInView } from '../hooks/useInView';

interface Stat {
  key: string;
  value: string;
  suffix?: string;
}

const stats: Stat[] = [
  { key: 'databases', value: '5', suffix: '+' },
  { key: 'platforms', value: '3' },
  { key: 'queries', value: '∞' },
  { key: 'license', value: 'MIT' },
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
    <div className="text-main mb-2 text-4xl font-bold md:text-5xl">
      {isNumeric ? count : value}
      {suffix && <span className="text-3xl md:text-4xl">{suffix}</span>}
    </div>
  );
}

export default function Stats() {
  const { t } = useTranslation();
  const { ref, isInView } = useInView<HTMLElement>();

  return (
    <section
      ref={ref}
      className={`bg-secondary-background py-16 transition-all duration-500 md:py-20 ${
        isInView ? 'opacity-100' : 'opacity-0'
      }`}
      aria-labelledby="stats-title"
    >
      <div className="mx-auto max-w-[1280px] px-5 md:px-12">
        <h2 id="stats-title" className="sr-only">
          {t('stats.title')}
        </h2>
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4 md:gap-8">
          {stats.map((stat, index) => (
            <div
              key={stat.key}
              className={`bg-card border-border rounded-base flex flex-col items-center border p-6 text-center shadow-sm transition-all duration-300 ${
                isInView
                  ? 'translate-y-0 opacity-100'
                  : 'translate-y-4 opacity-0'
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <StatValue
                value={stat.value}
                suffix={stat.suffix}
                animate={isInView}
              />
              <div className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
                {t(`stats.${stat.key}`)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
