import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import CheckoutModal from './CheckoutModal';
import './Pricing.css';

const plans = ['monthly', 'yearly', 'lifetime'] as const;
type Plan = (typeof plans)[number];

const planIcons: Record<string, JSX.Element> = {
  monthly: (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  yearly: (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  lifetime: (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
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
        <header className="pricing-header">
          <h2 id="pricing-title" className="pricing-title">
            {t('pricing.title')}{' '}
            <span className="gradient-text">{t('pricing.titleHighlight')}</span>
          </h2>
          <p className="pricing-subtitle">{t('pricing.subtitle')}</p>
        </header>

        <div className="pricing-grid" role="list">
          {plans.map((plan) => (
            <article
              key={plan}
              className={`card pricing-card ${plan === 'yearly' ? 'pricing-card-featured' : ''}`}
              role="listitem"
            >
              {plan === 'yearly' && (
                <div className="pricing-badge">{t('pricing.popular')}</div>
              )}
              <div className="pricing-icon">{planIcons[plan]}</div>
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
                      width="16"
                      height="16"
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
                onClick={() => handleSelectPlan(plan)}
                className={`btn ${plan === 'yearly' ? 'btn-primary' : 'btn-secondary'} pricing-cta`}
              >
                {t('pricing.cta')}
              </button>
            </article>
          ))}
        </div>

        <p className="pricing-note">{t('pricing.note')}</p>
      </div>

      <CheckoutModal
        isOpen={isModalOpen}
        plan={selectedPlan}
        onClose={handleCloseModal}
      />
    </section>
  );
}
