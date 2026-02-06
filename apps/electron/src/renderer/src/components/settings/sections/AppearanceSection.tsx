import type { FontCategory, SystemFont } from '@shared/types/font';
import type { FontConfig } from '@/stores/settings-store';
import { FONT_CATEGORY_LABELS } from '@shared/types/font';
import { Button } from '@sqlpro/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@sqlpro/ui/command';
import { Label } from '@sqlpro/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@sqlpro/ui/popover';
import {
  Check,
  ChevronsUpDown,
  Link,
  Loader2,
  Monitor,
  Moon,
  Sun,
  Unlink,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getSystemFonts, isLocalFontAccessAvailable } from '@/lib/font-utils';
import { cn } from '@/lib/utils';
// Direct imports to avoid barrel file overhead (bundle-barrel-imports)
import { useSettingsStore } from '@/stores/settings-store';
import { useThemeStore } from '@/stores/theme-store';
import { SettingGroup } from '../items/SettingGroup';

interface FontOption {
  name: string;
  value: string;
  category?: FontCategory;
}

export function AppearanceSection() {
  const { t } = useTranslation('settings');
  const { theme, setTheme } = useThemeStore();
  const { fonts, setFont, setSyncAll, tabSize, setTabSize } =
    useSettingsStore();

  // System fonts state
  const [systemFonts, setSystemFonts] = useState<SystemFont[]>([]);
  const [fontsLoading, setFontsLoading] = useState(true);

  // Fetch system fonts using the Local Font Access API
  useEffect(() => {
    let cancelled = false;

    async function loadSystemFonts() {
      const fallbackFonts: SystemFont[] = [
        { name: 'Cascadia Code', category: 'monospace' },
        { name: 'Consolas', category: 'monospace' },
        { name: 'Courier New', category: 'monospace' },
        { name: 'Fira Code', category: 'monospace' },
        { name: 'JetBrains Mono', category: 'monospace' },
        { name: 'Menlo', category: 'monospace' },
        { name: 'Monaco', category: 'monospace' },
        { name: 'SF Mono', category: 'monospace' },
        { name: 'Arial', category: 'sans-serif' },
        { name: 'Helvetica', category: 'sans-serif' },
        { name: 'Inter', category: 'sans-serif' },
        { name: 'Roboto', category: 'sans-serif' },
        { name: 'SF Pro', category: 'sans-serif' },
        { name: 'Georgia', category: 'serif' },
        { name: 'Times New Roman', category: 'serif' },
      ];

      try {
        if (!isLocalFontAccessAvailable()) {
          if (!cancelled) {
            setSystemFonts(fallbackFonts);
            setFontsLoading(false);
          }
          return;
        }

        const fonts = await getSystemFonts();

        if (cancelled) return;

        if (fonts.length > 0) {
          setSystemFonts(fonts);
        } else {
          setSystemFonts(fallbackFonts);
        }
      } catch (error) {
        console.error('Failed to load system fonts:', error);
        if (!cancelled) {
          setSystemFonts(fallbackFonts);
        }
      } finally {
        if (!cancelled) {
          setFontsLoading(false);
        }
      }
    }

    loadSystemFonts();

    return () => {
      cancelled = true;
    };
  }, []);

  // Convert system fonts to FontOption format grouped by category
  const fontsByCategory = useMemo(() => {
    const grouped: Record<FontCategory, FontOption[]> = {
      monospace: [],
      'sans-serif': [],
      serif: [],
      display: [],
      other: [],
    };

    for (const font of systemFonts) {
      grouped[font.category].push({
        name: font.name,
        value: font.name,
        category: font.category,
      });
    }

    return grouped;
  }, [systemFonts]);

  // Flat list for backward compatibility
  const availableFonts = useMemo((): FontOption[] => {
    const result: FontOption[] = [
      { name: t('fonts.systemDefault'), value: '' },
    ];

    for (const font of systemFonts) {
      result.push({
        name: font.name,
        value: font.name,
        category: font.category,
      });
    }

    return result;
  }, [systemFonts, t]);

  return (
    <div className="space-y-6">
      {/* Theme Section */}
      <SettingGroup title={t('appearance.theme')}>
        <div className="grid grid-cols-3 gap-2">
          {(['light', 'dark', 'system'] as const).map((themeOption) => {
            const isActive = theme === themeOption;
            const Icon =
              themeOption === 'light'
                ? Sun
                : themeOption === 'dark'
                  ? Moon
                  : Monitor;
            const label = t(`appearance.${themeOption}`);
            return (
              <Button
                key={themeOption}
                variant={isActive ? 'accent' : 'outline'}
                size="sm"
                onClick={() => setTheme(themeOption)}
                className={`justify-start ${
                  !isActive && 'hover:border-primary/50 hover:text-primary'
                }`}
              >
                <Icon className="mr-2 h-4 w-4" />
                {label}
              </Button>
            );
          })}
        </div>
      </SettingGroup>

      {/* Font Settings Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label
            className="font-medium"
            style={{ fontSize: 'var(--font-ui-size, 13px)' }}
          >
            {t('fonts.title')}
          </Label>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSyncAll(!fonts.syncAll)}
            className={cn('h-7 gap-1.5', fonts.syncAll && 'text-primary')}
            style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
          >
            {fonts.syncAll ? (
              <Link className="h-3.5 w-3.5" />
            ) : (
              <Unlink className="h-3.5 w-3.5" />
            )}
            {fonts.syncAll ? t('fonts.synced') : t('fonts.independent')}
          </Button>
        </div>

        {fonts.syncAll && (
          <p
            className="text-muted-foreground -mt-2"
            style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
          >
            {t('fonts.syncDescription')}
          </p>
        )}

        {/* Font Controls */}
        <div className="space-y-3">
          <FontSettingsRow
            label={t('fonts.editor')}
            description={t('fonts.editorDesc')}
            config={fonts.editor}
            onChange={(config) => setFont('editor', config)}
            availableFonts={availableFonts}
            fontsByCategory={fontsByCategory}
            synced={fonts.syncAll}
            loading={fontsLoading}
          />
          <FontSettingsRow
            label={t('fonts.table')}
            description={t('fonts.tableDesc')}
            config={fonts.table}
            onChange={(config) => setFont('table', config)}
            availableFonts={availableFonts}
            fontsByCategory={fontsByCategory}
            synced={fonts.syncAll}
            loading={fontsLoading}
          />
          <FontSettingsRow
            label={t('fonts.ui')}
            description={t('fonts.uiDesc')}
            config={fonts.ui}
            onChange={(config) => setFont('ui', config)}
            availableFonts={availableFonts}
            fontsByCategory={fontsByCategory}
            synced={fonts.syncAll}
            loading={fontsLoading}
          />
        </div>
      </div>

      {/* Tab Size Section */}
      <SettingGroup title={t('tabSize.title')}>
        <div className="flex gap-2">
          {[2, 4, 8].map((size) => {
            const isActive = tabSize === size;
            return (
              <Button
                key={size}
                variant={isActive ? 'accent' : 'outline'}
                size="sm"
                onClick={() => setTabSize(size)}
                className={
                  !isActive ? 'hover:border-primary/50 hover:text-primary' : ''
                }
              >
                {size}
              </Button>
            );
          })}
        </div>
      </SettingGroup>
    </div>
  );
}

interface FontSettingsRowProps {
  label: string;
  description: string;
  config: FontConfig;
  onChange: (config: Partial<FontConfig>) => void;
  availableFonts: FontOption[];
  fontsByCategory: Record<FontCategory, FontOption[]>;
  synced: boolean;
  loading?: boolean;
}

function FontSettingsRow({
  label,
  description,
  config,
  onChange,
  availableFonts,
  fontsByCategory,
  synced,
  loading = false,
}: FontSettingsRowProps) {
  const { t } = useTranslation('settings');
  const [fontSelectOpen, setFontSelectOpen] = useState(false);

  const selectedFont = availableFonts.find(
    (f: FontOption) => f.value === config.family
  );
  const selectedFontName = selectedFont?.name || t('fonts.systemDefault');

  const categoriesToShow: FontCategory[] = [
    'monospace',
    'sans-serif',
    'serif',
    'display',
    'other',
  ].filter(
    (cat) => fontsByCategory[cat as FontCategory]?.length > 0
  ) as FontCategory[];

  return (
    <div
      className={cn(
        'rounded-base border p-3 transition-colors',
        synced && 'border-primary/20 bg-primary/5'
      )}
    >
      <div className="mb-2 flex items-center justify-between">
        <div>
          <span
            className="font-medium"
            style={{ fontSize: 'var(--font-ui-size, 13px)' }}
          >
            {label}
          </span>
          <span
            className="text-muted-foreground ml-2"
            style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
          >
            {description}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Font Family Dropdown with Search */}
        <Popover open={fontSelectOpen} onOpenChange={setFontSelectOpen} modal>
          <PopoverTrigger>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={fontSelectOpen}
              className="h-8 w-full flex-1 justify-between font-normal"
              style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  <span className="truncate">{t('fonts.loadingFonts')}</span>
                </>
              ) : (
                <span
                  className="truncate"
                  style={{ fontFamily: config.family || 'inherit' }}
                >
                  {selectedFontName}
                </span>
              )}
              <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-0" align="start" sideOffset={4}>
            <Command className="flex flex-col">
              <CommandInput
                placeholder={t('fonts.searchFonts')}
                className="h-9"
              />
              <CommandList className="max-h-75">
                <CommandEmpty>{t('fonts.noFontFound')}</CommandEmpty>
                {/* System Default option */}
                <CommandGroup>
                  <CommandItem
                    value="system-default"
                    onSelect={() => {
                      onChange({ family: '' });
                      setFontSelectOpen(false);
                    }}
                    style={{
                      fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)',
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-3 w-3',
                        config.family === '' ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    {t('fonts.systemDefault')}
                  </CommandItem>
                </CommandGroup>
                {/* Grouped fonts by category */}
                {categoriesToShow.map((category) => (
                  <CommandGroup
                    key={category}
                    heading={FONT_CATEGORY_LABELS[category]}
                  >
                    {fontsByCategory[category].map((font) => (
                      <CommandItem
                        key={font.value}
                        value={font.value}
                        onSelect={() => {
                          onChange({ family: font.value });
                          setFontSelectOpen(false);
                        }}
                        className=""
                        style={{
                          fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)',
                          fontFamily: font.value,
                        }}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-3 w-3',
                            config.family === font.value
                              ? 'opacity-100'
                              : 'opacity-0'
                          )}
                        />
                        {font.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ))}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Font Size Controls */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => onChange({ size: Math.max(10, config.size - 1) })}
            disabled={config.size <= 10}
          >
            -
          </Button>
          <span
            className="text-muted-foreground w-10 text-center"
            style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
          >
            {config.size}px
          </span>
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => onChange({ size: Math.min(24, config.size + 1) })}
            disabled={config.size >= 24}
          >
            +
          </Button>
        </div>
      </div>
    </div>
  );
}
