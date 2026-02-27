import { useTranslation } from 'react-i18next';

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
    <footer
      className="bg-background border-border border-t py-8"
      role="contentinfo"
    >
      <div className="mx-auto max-w-[1280px] px-5 md:px-12">
        <div className="mb-6 flex flex-col items-center justify-between gap-6 md:flex-row">
          {/* Brand */}
          <a
            href="#"
            className="text-foreground flex items-center gap-2 text-lg font-bold no-underline transition-transform duration-200 hover:scale-105"
          >
            <img
              src="/icon.svg"
              alt=""
              width="32"
              height="32"
              aria-hidden="true"
              className="border-border rounded-base border"
            />
            SQL Pro
          </a>

          {/* Essential links - inline */}
          <nav
            className="flex flex-wrap items-center justify-center gap-4 md:gap-6"
            aria-label="Footer navigation"
          >
            {essentialLinks.map((link) => (
              <a
                key={link.key}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-main link-underline text-sm font-medium no-underline transition-colors duration-150"
              >
                {t(`footer.${link.key}`)}
              </a>
            ))}
          </nav>
        </div>

        {/* Copyright */}
        <p className="text-muted-foreground m-0 text-center text-sm">
          {t('footer.copyright', { year: currentYear })}
        </p>
      </div>
    </footer>
  );
}
