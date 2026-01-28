import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useInView } from '../hooks/useInView';
import './FAQ.css';

const faqKeys = [
  'free',
  'platforms',
  'sqlite',
  'encryption',
  'updates',
  'support',
];

export default function FAQ() {
  const { t } = useTranslation();
  const { ref: headerRef, isInView: headerVisible } = useInView<HTMLElement>();

  return (
    <section className="faq" id="faq" aria-labelledby="faq-title">
      <div className="container">
        <header
          ref={headerRef}
          className={`faq-header ${headerVisible ? 'visible' : ''}`}
        >
          <span className="faq-label">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            {t('faq.label')}
          </span>
          <h2 id="faq-title" className="faq-title">
            {t('faq.title')}{' '}
            <span className="faq-title-gradient">
              {t('faq.titleHighlight')}
            </span>
          </h2>
          <p className="faq-subtitle">{t('faq.subtitle')}</p>
        </header>

        <div className="faq-list">
          {faqKeys.map((key, index) => (
            <FAQItem key={key} faqKey={key} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQItem({ faqKey, index }: { faqKey: string; index: number }) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const { ref, isInView } = useInView<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className={`faq-item ${isOpen ? 'open' : ''} ${isInView ? 'visible' : ''}`}
      style={{ transitionDelay: `${index * 50}ms` }}
    >
      <button
        className="faq-question"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls={`faq-answer-${faqKey}`}
      >
        <span>{t(`faq.items.${faqKey}.question`)}</span>
        <svg
          className="faq-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path d="M12 5v14" className="faq-icon-vertical" />
          <path d="M5 12h14" />
        </svg>
      </button>
      <div
        id={`faq-answer-${faqKey}`}
        className="faq-answer"
        role="region"
        aria-hidden={!isOpen}
      >
        <p>{t(`faq.items.${faqKey}.answer`)}</p>
      </div>
    </div>
  );
}
