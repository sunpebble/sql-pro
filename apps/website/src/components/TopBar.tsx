import { useEffect, useState } from 'react';
import LanguageSwitcher from './LanguageSwitcher';
import ThemeSwitcher from './ThemeSwitcher';
import UserMenu from './UserMenu';

export default function TopBar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div
      className={`fixed top-0 right-0 z-[100] flex items-center gap-2 px-4 py-3 transition-all duration-300 sm:gap-1.5 md:gap-2 ${
        scrolled
          ? 'bg-background/80 border-border rounded-bl-base border-b border-l shadow-sm backdrop-blur-md'
          : ''
      }`}
    >
      <ThemeSwitcher />
      <LanguageSwitcher />
      <UserMenu />
    </div>
  );
}
