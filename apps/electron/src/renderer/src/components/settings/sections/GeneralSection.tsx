import type { LanguageCode } from '@/lib/i18n';
import { Button } from '@sqlpro/ui/button';
import { Switch } from '@sqlpro/ui/switch';
import { Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { changeLanguage, LANGUAGES } from '@/lib/i18n';
import { useSettingsStore } from '@/stores';
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
          {(Object.keys(LANGUAGES) as LanguageCode[]).map((code) => (
            <Button
              key={code}
              variant={i18n.language?.startsWith(code) ? 'default' : 'outline'}
              size="sm"
              onClick={() => changeLanguage(code)}
              className="justify-start"
            >
              <Globe className="mr-2 h-4 w-4" />
              {LANGUAGES[code].nativeName}
            </Button>
          ))}
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
          />
        </SettingItem>
      </SettingGroup>
    </div>
  );
}
