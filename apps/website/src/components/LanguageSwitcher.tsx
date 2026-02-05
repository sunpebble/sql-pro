import { useTranslation } from 'react-i18next';
import { languages } from '../i18n';

export default function LanguageSwitcher() {
  const { i18n, t } = useTranslation();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    i18n.changeLanguage(e.target.value);
  };

  return (
    <div
      className="relative flex items-center gap-2"
      role="navigation"
      aria-label={t('a11y.languageSelector')}
    >
      <label htmlFor="language-select" className="sr-only">
        {t('a11y.languageSelector')}
      </label>
      <select
        id="language-select"
        value={i18n.language.split('-')[0]}
        onChange={handleChange}
        className="bg-background border-border rounded-base text-foreground shadow-shadow-sm hover:translate-x-boxShadowX hover:translate-y-boxShadowY focus:ring-ring cursor-pointer appearance-none border-2 py-2.5 pr-10 pl-3.5 font-sans text-sm font-medium transition-all duration-150 hover:shadow-none focus:ring-2 focus:outline-none"
        aria-label={t('a11y.languageSelector')}
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.nativeName}
          </option>
        ))}
      </select>
      <svg
        className="text-muted-foreground pointer-events-none absolute right-3"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    </div>
  );
}
