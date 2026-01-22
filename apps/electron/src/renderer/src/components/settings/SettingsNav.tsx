import type { LucideIcon } from 'lucide-react';
import { Code, Crown, Palette, Settings, Wrench } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

export type SettingsSection =
  | 'general'
  | 'appearance'
  | 'editor'
  | 'pro'
  | 'advanced';

interface NavItem {
  id: SettingsSection;
  labelKey: string;
  icon: LucideIcon;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'general', labelKey: 'nav.general', icon: Settings },
  { id: 'appearance', labelKey: 'nav.appearance', icon: Palette },
  { id: 'editor', labelKey: 'nav.editor', icon: Code },
  { id: 'pro', labelKey: 'nav.pro', icon: Crown },
  { id: 'advanced', labelKey: 'nav.advanced', icon: Wrench },
];

interface SettingsNavProps {
  activeSection: SettingsSection;
  onSectionChange: (section: SettingsSection) => void;
}

export function SettingsNav({
  activeSection,
  onSectionChange,
}: SettingsNavProps) {
  const { t } = useTranslation('settings');

  return (
    <nav className="flex w-[160px] shrink-0 flex-col gap-1 pr-3">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = activeSection === item.id;

        return (
          <button
            key={item.id}
            onClick={() => onSectionChange(item.id)}
            className={cn(
              'flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors',
              isActive ? 'btn-gold-active font-medium' : 'hover-gold'
            )}
          >
            <Icon
              className={cn('h-4 w-4 shrink-0', isActive && 'text-primary')}
            />
            <span className="truncate">{t(item.labelKey)}</span>
          </button>
        );
      })}
    </nav>
  );
}
