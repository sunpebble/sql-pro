import { useTranslation } from 'react-i18next';
import './SkipLink.css';

export default function SkipLink() {
  const { t } = useTranslation();

  return (
    <a href="#main-content" className="skip-link">
      {t('a11y.skipToContent')}
    </a>
  );
}
