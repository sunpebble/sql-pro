import type { ReactNode} from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import CheckoutModal from './CheckoutModal';
import FeatureComparisonTable from './FeatureComparisonTable';
import './Pricing.css';

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
    <section className="pricing" id="pricing" aria-labelledby="pricing-title">
      <div className="container">
        {/* Header */}
        <header className="pricing-header">
          <div className="pricing-label">
            <svg
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
          <h2 id="pricing-title" className="pricing-title">
            {t('pricing.title')}{' '}
            <span className="pricing-title-gradient">
              {t('pricing.titleHighlight')}
            </span>
          </h2>
          <p className="pricing-subtitle">{t('pricing.subtitle')}</p>
        </header>

        {/* Pricing Cards */}
        <div className="pricing-grid" role="list">
          {plans.map((plan) => (
            <div
              key={plan}
              className={`pricing-card ${plan === 'yearly' ? 'featured' : ''}`}
              role="listitem"
            >
              {plan === 'yearly' && (
                <div className="pricing-badge">{t('pricing.popular')}</div>
              )}

              <div className="pricing-icon">{planIcons[plan].icon}</div>

              <h3 className="pricing-plan-title">
                {t(`pricing.plans.${plan}.title`)}
              </h3>

              <div className="pricing-price">
                <span className="pricing-amount">
                  {t(`pricing.plans.${plan}.price`)}
                </span>
                <span className="pricing-period">
                  {t(`pricing.plans.${plan}.period`)}
                </span>
              </div>

              <p className="pricing-description">
                {t(`pricing.plans.${plan}.description`)}
              </p>

              <ul className="pricing-features">
                {(
                  t(`pricing.plans.${plan}.features`, {
                    returnObjects: true,
                  }) as string[]
                ).map((feature, index) => (
                  <li key={index}>
                    <svg
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
                className={`pricing-cta ${plan === 'yearly' ? 'pricing-cta-primary' : 'pricing-cta-outline'}`}
                onClick={() => handleSelectPlan(plan)}
              >
                {t('pricing.cta')}
              </button>
            </div>
          ))}
        </div>

        <p className="pricing-note">{t('pricing.note')}</p>

        {/* Feature Comparison Table */}
        <FeatureComparisonTable />

        {/* Trust badges */}
        <div className="pricing-trust">
          <div className="trust-badge">
            <svg
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
          <div className="trust-badge">
            <svg
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
          <div className="trust-badge">
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
