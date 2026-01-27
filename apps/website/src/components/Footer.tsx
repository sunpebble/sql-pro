import { useTranslation } from 'react-i18next';
import './Footer.css';

const essentialLinks = [
  {
    key: 'github',
    href: 'https://github.com/kunish-homelab/sql-pro',
  },
  {
    key: 'releases',
    href: 'https://github.com/kunish-homelab/sql-pro/releases',
  },
  {
    key: 'docs',
    href: 'https://kunish-homelab.github.io/sql-pro/',
  },
  {
    key: 'discussions',
    href: 'https://github.com/kunish-homelab/sql-pro/discussions',
  },
];

export default function Footer() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer" role="contentinfo">
      <div className="container">
        <div className="footer-content">
          {/* Brand */}
          <a href="#" className="footer-logo">
            <img
              src="/icon.svg"
              alt=""
              width="32"
              height="32"
              aria-hidden="true"
            />
            SQL Pro
          </a>

          {/* Essential links - inline */}
          <nav className="footer-links" aria-label="Footer navigation">
            {essentialLinks.map((link) => (
              <a
                key={link.key}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t(`footer.${link.key}`)}
              </a>
            ))}
          </nav>
        </div>

        {/* Copyright */}
        <p className="footer-copyright">
          {t('footer.copyright', { year: currentYear })}
        </p>
      </div>
    </footer>
  );
}
