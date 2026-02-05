import type { Theme } from '../hooks/useTheme';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../hooks/useTheme';

const SunIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
  </svg>
);

const MoonIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
  </svg>
);

const MonitorIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect width="20" height="14" x="2" y="3" rx="2" />
    <line x1="8" x2="16" y1="21" y2="21" />
    <line x1="12" x2="12" y1="17" y2="21" />
  </svg>
);

const themeOptions: {
  value: Theme;
  icon: React.ReactNode;
  labelKey: string;
}[] = [
  { value: 'light', icon: <SunIcon />, labelKey: 'theme.light' },
  { value: 'dark', icon: <MoonIcon />, labelKey: 'theme.dark' },
  { value: 'system', icon: <MonitorIcon />, labelKey: 'theme.system' },
];

export default function ThemeSwitcher() {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();

  return (
    <div
      className="bg-background border-border rounded-base shadow-shadow-sm flex items-center gap-0.5 border-2 p-1"
      role="radiogroup"
      aria-label={t('a11y.themeSelector', 'Theme')}
    >
      {themeOptions.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={theme === option.value}
          aria-label={t(option.labelKey, option.value)}
          className={`rounded-base flex h-8 w-8 cursor-pointer items-center justify-center border-none p-0 transition-all duration-150 ${
            theme === option.value
              ? 'bg-main text-main-foreground'
              : 'text-muted-foreground hover:bg-secondary-background hover:text-foreground bg-transparent'
          } focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none`}
          onClick={() => setTheme(option.value)}
        >
          {option.icon}
        </button>
      ))}
    </div>
  );
}
