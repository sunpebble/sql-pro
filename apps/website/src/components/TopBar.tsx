import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';
import ThemeSwitcher from './ThemeSwitcher';
import UserMenu from './UserMenu';

const navLinks = [
  { href: '#features', labelKey: 'nav.features', fallback: 'Features' },
  {
    href: '#screenshots',
    labelKey: 'nav.screenshots',
    fallback: 'Screenshots',
  },
  { href: '#opensource', labelKey: 'nav.opensource', fallback: 'Open Source' },
  { href: '#faq', labelKey: 'nav.faq', fallback: 'FAQ' },
];

export default function TopBar() {
  const { t } = useTranslation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [menuClosing, setMenuClosing] = useState(false);
  const [activeSection, setActiveSection] = useState('');

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Active section detection via IntersectionObserver
  useEffect(() => {
    const sections = navLinks
      .map((link) => document.querySelector(link.href))
      .filter(Boolean) as Element[];

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(`#${entry.target.id}`);
          }
        });
      },
      { threshold: 0.3, rootMargin: '-80px 0px -50% 0px' }
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  // Body scroll lock when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.classList.add('menu-open');
    } else {
      document.body.classList.remove('menu-open');
    }
    return () => {
      document.body.classList.remove('menu-open');
    };
  }, [mobileMenuOpen]);

  // Close mobile menu with animation
  const closeMobileMenu = useCallback(() => {
    setMenuClosing(true);
    setTimeout(() => {
      setMobileMenuOpen(false);
      setMenuClosing(false);
    }, 150);
  }, []);

  // Close mobile menu on navigation
  const handleNavClick = () => closeMobileMenu();

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    if (mobileMenuOpen) {
      closeMobileMenu();
    } else {
      setMobileMenuOpen(true);
    }
  };

  const getLabel = (labelKey: string, fallback: string) => {
    const translated = t(labelKey, { defaultValue: fallback });
    return translated === labelKey ? fallback : translated;
  };

  return (
    <nav
      className={`fixed top-0 right-0 left-0 z-[100] transition-all duration-300 ${
        scrolled
          ? 'border-border bg-background/80 border-b shadow-sm backdrop-blur-md'
          : ''
      }`}
    >
      <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-4 sm:px-5 md:px-12">
        {/* Logo */}
        <a
          href="#"
          className="text-foreground group flex items-center gap-2.5 no-underline"
        >
          <img
            src="/icon.svg"
            alt=""
            width="28"
            height="28"
            className="rounded-base border-border border"
          />
          <span className="text-base font-bold tracking-tight">Quarry</span>
        </a>

        {/* Desktop nav links */}
        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`rounded-md px-3 py-1.5 text-sm font-medium no-underline transition-all duration-150 ${
                activeSection === link.href
                  ? 'text-main bg-main/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary-background'
              }`}
            >
              {getLabel(link.labelKey, link.fallback)}
            </a>
          ))}
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 sm:flex">
            <ThemeSwitcher />
            <LanguageSwitcher />
          </div>
          <UserMenu />

          {/* Mobile hamburger — 44x44px touch target */}
          <button
            type="button"
            className="border-border bg-background text-foreground flex h-11 w-11 items-center justify-center rounded-md border transition-all duration-150 active:scale-95 md:hidden"
            onClick={toggleMobileMenu}
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              {mobileMenuOpen && !menuClosing ? (
                <path d="M18 6L6 18M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile dropdown with enter/exit animation */}
      {mobileMenuOpen && (
        <div
          className={`border-border bg-background/95 border-b backdrop-blur-md md:hidden ${
            menuClosing ? 'animate-slide-up-out' : 'animate-slide-down'
          }`}
        >
          <div className="flex flex-col gap-1 px-4 py-4 sm:px-5">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={handleNavClick}
                className={`rounded-md px-4 py-3 text-sm font-medium no-underline transition-all duration-150 ${
                  activeSection === link.href
                    ? 'text-main bg-main/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary-background'
                }`}
              >
                {getLabel(link.labelKey, link.fallback)}
              </a>
            ))}
            <div className="border-border mt-2 flex items-center gap-2 border-t pt-3 sm:hidden">
              <ThemeSwitcher />
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
