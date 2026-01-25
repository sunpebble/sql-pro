import LanguageSwitcher from './LanguageSwitcher';
import ThemeSwitcher from './ThemeSwitcher';
import UserMenu from './UserMenu';
import './TopBar.css';

export default function TopBar() {
  return (
    <div className="top-bar">
      <ThemeSwitcher />
      <LanguageSwitcher />
      <UserMenu />
    </div>
  );
}
