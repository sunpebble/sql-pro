import { useTranslation } from 'react-i18next';
import './FeatureComparisonTable.css';

const features = [
  { key: 'proFeatures', category: 'Features' },
  { key: 'sqlcipher', category: 'Features' },
  { key: 'schemaCompare', category: 'Features' },
  { key: 'aiFeatures', category: 'AI' },
  { key: 'devices', category: 'Limits' },
  { key: 'support', category: 'Support' },
  { key: 'updates', category: 'Support' },
] as const;

const planFeatures: Record<string, Record<string, string | boolean>> = {
  monthly: {
    proFeatures: true,
    sqlcipher: true,
    schemaCompare: true,
    aiFeatures: true,
    devices: '3 devices',
    support: 'Email support',
    updates: 'During subscription',
  },
  yearly: {
    proFeatures: true,
    sqlcipher: true,
    schemaCompare: true,
    aiFeatures: true,
    devices: '5 devices',
    support: 'Priority support',
    updates: 'During subscription',
  },
  lifetime: {
    proFeatures: true,
    sqlcipher: true,
    schemaCompare: true,
    aiFeatures: true,
    devices: 'Unlimited',
    support: 'Priority support',
    updates: 'Forever',
  },
};

export default function FeatureComparisonTable() {
  const { t } = useTranslation();

  const renderValue = (value: string | boolean) => {
    if (typeof value === 'boolean') {
      return value ? (
        <svg
          className="check-icon"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          aria-label="Included"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <svg
          className="x-icon"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-label="Not included"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      );
    }
    return <span className="feature-text">{value}</span>;
  };

  return (
    <div className="comparison-table-wrapper">
      <h3 className="comparison-title">{t('pricing.comparison.title')}</h3>
      <div className="comparison-table-container">
        <table className="comparison-table">
          <thead>
            <tr>
              <th className="feature-header">
                {t('pricing.comparison.feature')}
              </th>
              <th className="plan-header">
                <span className="plan-name">
                  {t('pricing.plans.monthly.title')}
                </span>
                <span className="plan-price">
                  {t('pricing.plans.monthly.price')}
                </span>
              </th>
              <th className="plan-header plan-header-featured">
                <span className="featured-badge">{t('pricing.popular')}</span>
                <span className="plan-name">
                  {t('pricing.plans.yearly.title')}
                </span>
                <span className="plan-price">
                  {t('pricing.plans.yearly.price')}
                </span>
              </th>
              <th className="plan-header">
                <span className="plan-name">
                  {t('pricing.plans.lifetime.title')}
                </span>
                <span className="plan-price">
                  {t('pricing.plans.lifetime.price')}
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {features.map((feature) => (
              <tr key={feature.key}>
                <td className="feature-name">
                  {t(`pricing.comparison.features.${feature.key}`)}
                </td>
                <td className="feature-value">
                  {renderValue(planFeatures.monthly[feature.key])}
                </td>
                <td className="feature-value feature-value-featured">
                  {renderValue(planFeatures.yearly[feature.key])}
                </td>
                <td className="feature-value">
                  {renderValue(planFeatures.lifetime[feature.key])}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
