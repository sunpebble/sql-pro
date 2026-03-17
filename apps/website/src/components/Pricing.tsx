import type { ReactNode } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import CheckoutModal from './CheckoutModal';
import FeatureComparisonTable from './FeatureComparisonTable';

const plans = ['monthly', 'yearly', 'lifetime'] as const;
type Plan = (typeof plans)[number];

interface PlanIcon {
  icon: ReactNode;
}

const planIcons: Record<Plan, PlanIcon> = {
  monthly: {
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  yearly: {
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  lifetime: {
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
  },
};

export default function Pricing() {
  const { t } = useTranslation();
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSelectPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPlan(null);
  };

  return (
    <section
      className="relative overflow-hidden py-24 md:py-32"
      id="pricing"
      aria-labelledby="pricing-title"
    >
      <div className="mx-auto max-w-[1280px] px-5 md:px-12">
        {/* Header */}
        <header className="mb-16 text-center">
          <div className="bg-main text-main-foreground border-border rounded-base mb-5 inline-flex items-center gap-2 border px-4 py-2 text-sm font-semibold tracking-wide uppercase shadow-sm">
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
            Pricing
          </div>
          <h2
            id="pricing-title"
            className="text-foreground mb-4 text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl"
          >
            {t('pricing.title')}{' '}
            <span className="text-main">{t('pricing.titleHighlight')}</span>
          </h2>
          <p className="text-muted-foreground mx-auto max-w-[600px] text-lg leading-relaxed">
            {t('pricing.subtitle')}
          </p>
        </header>

        {/* Pricing Cards */}
        <div
          className="mx-auto grid max-w-[1100px] grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
          role="list"
        >
          {plans.map((plan, index) => (
            <div
              key={plan}
              className={`bg-card rounded-base animate-fade-up relative flex flex-col border p-9 transition-all duration-300 ${
                plan === 'yearly'
                  ? 'border-main shadow-lg'
                  : 'border-border shadow-sm hover:-translate-y-0.5 hover:shadow-md active:scale-95'
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
              role="listitem"
            >
              {plan === 'yearly' && (
                <div className="bg-main text-main-foreground border-border rounded-base absolute -top-3 left-1/2 -translate-x-1/2 border px-4 py-1.5 text-xs font-semibold whitespace-nowrap">
                  {t('pricing.popular')}
                </div>
              )}

              <div className="bg-main text-main-foreground border-border rounded-base mb-6 flex h-14 w-14 items-center justify-center border">
                <div className="h-7 w-7">{planIcons[plan].icon}</div>
              </div>

              <h3 className="text-foreground mb-2 text-xl font-semibold">
                {t(`pricing.plans.${plan}.title`)}
              </h3>

              <div className="mb-3 flex items-baseline gap-1">
                <span className="text-foreground text-4xl font-bold tracking-tight">
                  {t(`pricing.plans.${plan}.price`)}
                </span>
                <span className="text-muted-foreground text-sm">
                  {t(`pricing.plans.${plan}.period`)}
                </span>
              </div>

              <p className="text-muted-foreground mb-6 text-sm leading-relaxed">
                {t(`pricing.plans.${plan}.description`)}
              </p>

              <ul className="m-0 mb-8 flex-1 list-none p-0">
                {(
                  t(`pricing.plans.${plan}.features`, {
                    returnObjects: true,
                  }) as string[]
                ).map((feature) => (
                  <li
                    key={feature}
                    className="text-muted-foreground border-border flex items-start gap-3 border-b py-2.5 text-sm last:border-b-0"
                  >
                    <svg
                      className="text-main mt-0.5 h-4.5 w-4.5 flex-shrink-0"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      aria-hidden="true"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                type="button"
                className={`rounded-base border-border w-full cursor-pointer border px-6 py-3.5 text-center text-base font-semibold transition-all duration-150 ${
                  plan === 'yearly'
                    ? 'bg-main text-main-foreground shadow-sm hover:-translate-y-0.5 hover:shadow-md active:scale-95'
                    : 'bg-background text-foreground shadow-sm hover:-translate-y-0.5 hover:shadow-md active:scale-95'
                }`}
                onClick={() => handleSelectPlan(plan)}
              >
                {t('pricing.cta')}
              </button>
            </div>
          ))}
        </div>

        <p className="text-muted-foreground mt-12 text-center text-sm">
          {t('pricing.note')}
        </p>

        {/* Feature Comparison Table */}
        <FeatureComparisonTable />

        {/* Trust badges */}
        <div className="border-border mt-12 flex flex-col justify-center gap-8 border-t pt-8 md:flex-row">
          <div className="text-muted-foreground flex items-center gap-2.5 text-sm font-medium">
            <svg
              className="text-main h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span>{t('pricing.trust.secure')}</span>
          </div>
          <div className="text-muted-foreground flex items-center gap-2.5 text-sm font-medium">
            <svg
              className="text-main h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M3 3v18h18" />
              <path d="m19 9-5 5-4-4-3 3" />
            </svg>
            <span>{t('pricing.trust.guarantee')}</span>
          </div>
          <div className="text-muted-foreground flex items-center gap-2.5 text-sm font-medium">
            <svg
              className="text-main h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span>{t('pricing.trust.stripe')}</span>
          </div>
        </div>
      </div>

      <CheckoutModal
        isOpen={isModalOpen}
        plan={selectedPlan}
        onClose={handleCloseModal}
      />
    </section>
  );
}
