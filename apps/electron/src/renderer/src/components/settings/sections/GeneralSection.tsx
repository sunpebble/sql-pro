import type { LanguageCode } from '@/lib/i18n';
import { Button } from '@sqlpro/ui/button';
import { Switch } from '@sqlpro/ui/switch';
import { Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { changeLanguage, LANGUAGES } from '@/lib/i18n';
import { useSettingsStore } from '@/stores/settings-store';
import { SettingGroup } from '../items/SettingGroup';
import { SettingItem } from '../items/SettingItem';

export function GeneralSection() {
  const { t, i18n } = useTranslation('settings');
  const { restoreSession, setRestoreSession } = useSettingsStore();

  return (
    <div className="space-y-6">
      {/* Language Section */}
      <SettingGroup title={t('general.language')}>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(LANGUAGES) as LanguageCode[]).map((code) => {
            const isActive = i18n.language?.startsWith(code);
            return (
              <Button
                key={code}
                variant={isActive ? 'accent' : 'outline'}
                size="sm"
                onClick={() => changeLanguage(code)}
                className={`justify-start ${
                  !isActive && 'hover:border-primary/50 hover:text-primary'
                }`}
              >
                <Globe className="mr-2 h-4 w-4" />
                {LANGUAGES[code].nativeName}
              </Button>
            );
          })}
        </div>
      </SettingGroup>

      {/* Session Section */}
      <SettingGroup title={t('session.title')}>
        <SettingItem
          label={t('session.restore')}
          description={t('session.restoreDesc')}
        >
          <Switch
            checked={restoreSession}
            onCheckedChange={setRestoreSession}
            className="data-checked:bg-primary"
          />
        </SettingItem>
      </SettingGroup>
    </div>
  );
}
