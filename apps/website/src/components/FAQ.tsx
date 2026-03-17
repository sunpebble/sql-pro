import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useInView } from '../hooks/useInView';

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
    <section
      className="bg-secondary-background relative overflow-hidden py-16 md:py-24 lg:py-32"
      id="faq"
      aria-labelledby="faq-title"
    >
      <div className="mx-auto max-w-[1280px] px-4 sm:px-5 md:px-12">
        <header
          ref={headerRef}
          className={`mb-10 text-center transition-all duration-500 sm:mb-16 ${
            headerVisible
              ? 'translate-y-0 opacity-100'
              : 'translate-y-8 opacity-0'
          }`}
        >
          <span className="bg-main/10 text-main border-main/20 mb-5 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold">
            <svg
              className="h-4 w-4"
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
          <h2
            id="faq-title"
            className="text-foreground mb-4 text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl"
          >
            {t('faq.title')}{' '}
            <span className="text-main">{t('faq.titleHighlight')}</span>
          </h2>
          <p className="text-muted-foreground mx-auto max-w-[600px] text-lg leading-relaxed">
            {t('faq.subtitle')}
          </p>
        </header>

        <div className="mx-auto flex max-w-[800px] flex-col gap-3">
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
      className={`bg-card border-border rounded-xl border transition-all duration-300 ${
        isInView
          ? 'translate-y-0 opacity-100 shadow-sm'
          : 'translate-y-8 opacity-0'
      } ${isOpen ? 'border-main/50 shadow-md' : 'hover:border-border/80'}`}
      style={{ transitionDelay: `${index * 50}ms` }}
    >
      <button
        type="button"
        className="text-foreground flex w-full cursor-pointer items-center justify-between gap-4 border-none bg-transparent p-4 text-left text-sm font-semibold sm:p-5 sm:text-base"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls={`faq-answer-${faqKey}`}
      >
        <span>{t(`faq.items.${faqKey}.question`)}</span>
        <svg
          className={`text-main h-5 w-5 flex-shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
            isOpen ? 'rotate-45' : ''
          }`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path d="M12 5v14" />
          <path d="M5 12h14" />
        </svg>
      </button>
      <div
        id={`faq-answer-${faqKey}`}
        className="accordion-content"
        data-open={isOpen}
        role="region"
        aria-hidden={!isOpen}
      >
        <div>
          <p className="text-muted-foreground border-border m-0 border-t px-4 pt-3 pb-4 text-sm leading-relaxed sm:px-5 sm:pt-4 sm:pb-5 sm:text-base">
            {t(`faq.items.${faqKey}.answer`)}
          </p>
        </div>
      </div>
    </div>
  );
}
