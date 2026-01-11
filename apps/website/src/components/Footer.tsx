import { useTranslation } from 'react-i18next';
import './Footer.css';

export default function Footer() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  const links = [
    { key: 'docs', href: 'https://kunish-homelab.github.io/sql-pro/' },
    { key: 'github', href: 'https://github.com/kunish-homelab/sql-pro' },
    {
      key: 'releases',
      href: 'https://github.com/kunish-homelab/sql-pro/releases',
    },
    { key: 'issues', href: 'https://github.com/kunish-homelab/sql-pro/issues' },
    {
      key: 'discussions',
      href: 'https://github.com/kunish-homelab/sql-pro/discussions',
    },
  ];

  const techStack = [
    { name: 'Electron', href: 'https://www.electronjs.org/' },
    { name: 'React', href: 'https://react.dev/' },
    { name: 'TypeScript', href: 'https://www.typescriptlang.org/' },
  ];

  return (
    <footer className="footer" role="contentinfo">
      <div className="container">
        <div className="footer-top">
          <div className="footer-brand">
            <img
              src="/icon.svg"
              alt=""
              width="40"
              height="40"
              aria-hidden="true"
            />
            <span>SQL Pro</span>
          </div>

          <nav className="footer-links" aria-label={t('a11y.mainNavigation')}>
            {links.map((link) => (
              <a
                key={link.key}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t('a11y.socialLink', {
                  name: t(`footer.${link.key}`),
                })}
              >
                {t(`footer.${link.key}`)}
              </a>
            ))}
          </nav>
        </div>

        <hr className="footer-divider" aria-hidden="true" />

        <div className="footer-bottom">
          <p className="footer-copyright">
            {t('footer.copyright', { year: currentYear })}
          </p>

          <div className="footer-tech">
            <span>{t('footer.techStack')}</span>
            {techStack.map((tech) => (
              <a
                key={tech.name}
                href={tech.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t('a11y.socialLink', { name: tech.name })}
              >
                {tech.name}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
