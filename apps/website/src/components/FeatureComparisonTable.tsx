import { useTranslation } from 'react-i18next';

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
          className="text-main"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          role="img"
          aria-label="Included"
        >
          <title>Included</title>
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <svg
          className="text-muted-foreground opacity-50"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          role="img"
          aria-label="Not included"
        >
          <title>Not included</title>
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      );
    }
    return (
      <span className="text-muted-foreground text-xs sm:text-sm">{value}</span>
    );
  };

  return (
    <div className="border-border mt-12 border-t pt-8 md:mt-16 md:pt-12">
      <h3 className="mb-6 text-center text-lg font-bold md:mb-8 md:text-xl">
        {t('pricing.comparison.title')}
      </h3>
      <div className="-webkit-overflow-scrolling-touch overflow-x-auto">
        <table className="mx-auto w-full max-w-3xl border-collapse text-sm">
          <thead>
            <tr>
              <th className="border-border bg-secondary-background text-muted-foreground w-36 border-b p-3 text-left text-xs font-semibold tracking-wide uppercase md:w-48 md:p-4">
                {t('pricing.comparison.feature')}
              </th>
              <th className="border-border bg-secondary-background min-w-20 border-b p-3 text-center align-bottom font-semibold md:min-w-28 md:p-4">
                <span className="block text-sm font-semibold md:text-base">
                  {t('pricing.plans.monthly.title')}
                </span>
                <span className="text-muted-foreground block text-xs md:text-sm">
                  {t('pricing.plans.monthly.price')}
                </span>
              </th>
              <th className="border-main bg-main/10 relative min-w-20 border-x border-b p-3 text-center align-bottom font-semibold md:min-w-28 md:p-4">
                <div className="from-main to-main absolute top-0 right-0 left-0 h-1 bg-gradient-to-r" />
                <span className="bg-main text-main-foreground mb-2 inline-block rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-wide uppercase">
                  {t('pricing.popular')}
                </span>
                <span className="block text-sm font-semibold md:text-base">
                  {t('pricing.plans.yearly.title')}
                </span>
                <span className="text-muted-foreground block text-xs md:text-sm">
                  {t('pricing.plans.yearly.price')}
                </span>
              </th>
              <th className="border-border bg-secondary-background min-w-20 border-b p-3 text-center align-bottom font-semibold md:min-w-28 md:p-4">
                <span className="block text-sm font-semibold md:text-base">
                  {t('pricing.plans.lifetime.title')}
                </span>
                <span className="text-muted-foreground block text-xs md:text-sm">
                  {t('pricing.plans.lifetime.price')}
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {features.map((feature) => (
              <tr key={feature.key}>
                <td className="border-border border-b p-3 text-left text-sm font-medium md:p-4">
                  {t(`pricing.comparison.features.${feature.key}`)}
                </td>
                <td className="border-border border-b p-3 text-center md:p-4">
                  {renderValue(planFeatures.monthly[feature.key])}
                </td>
                <td className="border-main bg-main/5 border-x border-b p-3 text-center md:p-4">
                  {renderValue(planFeatures.yearly[feature.key])}
                </td>
                <td className="border-border border-b p-3 text-center md:p-4">
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
