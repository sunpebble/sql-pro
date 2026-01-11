import { useTranslation } from 'react-i18next';
import { languages } from '../i18n';
import './LanguageSwitcher.css';

export default function LanguageSwitcher() {
  const { i18n, t } = useTranslation();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    i18n.changeLanguage(e.target.value);
  };

  return (
    <div
      className="language-switcher"
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
        className="language-select"
        aria-label={t('a11y.languageSelector')}
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.nativeName}
          </option>
        ))}
      </select>
      <svg
        className="language-icon"
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
