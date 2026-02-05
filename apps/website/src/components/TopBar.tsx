import LanguageSwitcher from './LanguageSwitcher';
import ThemeSwitcher from './ThemeSwitcher';
import UserMenu from './UserMenu';

export default function TopBar() {
  return (
    <div className="fixed top-4 right-4 z-[100] flex items-center gap-2 sm:gap-1.5 md:gap-2">
      <ThemeSwitcher />
      <LanguageSwitcher />
      <UserMenu />
    </div>
  );
}
