import { useTranslation } from 'react-i18next';
import { useInView } from '../hooks/useInView';
import './Stats.css';

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

export default function Stats() {
  const { t } = useTranslation();
  const { ref, isInView } = useInView<HTMLElement>();

  return (
    <section
      ref={ref}
      className={`stats ${isInView ? 'visible' : ''}`}
      aria-labelledby="stats-title"
    >
      <div className="container">
        <h2 id="stats-title" className="sr-only">
          {t('stats.title')}
        </h2>
        <div className="stats-grid">
          {stats.map((stat, index) => (
            <div
              key={stat.key}
              className="stat-item"
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <div className="stat-value">
                {stat.value}
                {stat.suffix && (
                  <span className="stat-suffix">{stat.suffix}</span>
                )}
              </div>
              <div className="stat-label">{t(`stats.${stat.key}`)}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
