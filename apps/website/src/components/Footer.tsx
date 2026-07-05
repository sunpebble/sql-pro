import { useTranslation } from 'react-i18next';

const essentialLinks = [
  { key: 'github', href: 'https://github.com/sunpebble/quarry' },
  {
    key: 'releases',
    href: 'https://github.com/sunpebble/quarry/releases',
  },
  { key: 'docs', href: 'https://sunpebble.github.io/quarry/' },
  {
    key: 'discussions',
    href: 'https://github.com/sunpebble/quarry/discussions',
  },
];

export default function Footer() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className="bg-background border-border border-t py-10"
      role="contentinfo"
    >
      <div className="mx-auto max-w-[1280px] px-4 sm:px-5 md:px-12">
        <div className="mb-6 flex flex-col items-center justify-between gap-6 md:flex-row">
          {/* Brand */}
          <a
            href="#"
            className="text-foreground group flex items-center gap-2.5 text-lg font-bold no-underline"
          >
            <img
              src="/icon.svg"
              alt=""
              width="28"
              height="28"
              aria-hidden="true"
              className="border-border rounded-lg border transition-transform duration-200 group-hover:scale-105"
            />
            Quarry
          </a>

          {/* Essential links */}
          <nav
            className="flex flex-wrap items-center justify-center gap-1"
            aria-label="Footer navigation"
          >
            {essentialLinks.map((link) => (
              <a
                key={link.key}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground hover:bg-secondary-background rounded-md px-3 py-2 text-sm font-medium no-underline transition-all duration-150"
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
