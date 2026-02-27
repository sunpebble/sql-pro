import { useTranslation } from 'react-i18next';

export default function SkipLink() {
  const { t } = useTranslation();

  return (
    <a
      href="#main-content"
      className="rounded-base border-border bg-main text-main-foreground focus:ring-border absolute -top-full left-1/2 z-[9999] -translate-x-1/2 border px-7 py-3.5 text-sm font-semibold shadow-sm transition-all duration-200 hover:translate-x-[calc(-50%+4px)] hover:translate-y-1 hover:shadow-none focus:top-4 focus:ring-2 focus:ring-offset-2 focus:outline-none"
    >
      {t('a11y.skipToContent')}
    </a>
  );
}
