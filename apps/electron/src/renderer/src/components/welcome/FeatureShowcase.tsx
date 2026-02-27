import { Button } from '@sqlpro/ui/button';
import {
  ArrowLeftRight,
  BookOpen,
  Code,
  Command,
  Database,
  Edit,
  GitCompare,
  GitFork,
  Keyboard,
  PlayCircle,
  Settings,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { useOnboardingStore } from '@/stores/onboarding-store';

interface FeatureShowcaseProps {
  /** Callback to start the welcome tour */
  onStartTour?: () => void;
  /** Whether the component is disabled (e.g., during connection loading) */
  disabled?: boolean;
}

interface FeatureKey {
  icon: React.ReactNode;
  key: string;
  color: string;
  bgColor: string;
}

const featureKeys: FeatureKey[] = [
  {
    icon: <Database className="h-4.5 w-4.5" />,
    key: 'schemaBrowser',
    color: 'text-blue-500 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-500/10',
  },
  {
    icon: <Edit className="h-4.5 w-4.5" />,
    key: 'inlineEditing',
    color: 'text-amber-500 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-500/10',
  },
  {
    icon: <Code className="h-4.5 w-4.5" />,
    key: 'sqlEditor',
    color: 'text-emerald-500 dark:text-emerald-400',
    bgColor: 'bg-emerald-50 dark:bg-emerald-500/10',
  },
  {
    icon: <GitFork className="h-4.5 w-4.5" />,
    key: 'erDiagram',
    color: 'text-purple-500 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-500/10',
  },
  {
    icon: <GitCompare className="h-4.5 w-4.5" />,
    key: 'schemaCompare',
    color: 'text-rose-500 dark:text-rose-400',
    bgColor: 'bg-rose-50 dark:bg-rose-500/10',
  },
  {
    icon: <ArrowLeftRight className="h-4.5 w-4.5" />,
    key: 'dataDiff',
    color: 'text-cyan-500 dark:text-cyan-400',
    bgColor: 'bg-cyan-50 dark:bg-cyan-500/10',
  },
  {
    icon: <Command className="h-4.5 w-4.5" />,
    key: 'commandPalette',
    color: 'text-orange-500 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-500/10',
  },
  {
    icon: <Keyboard className="h-4.5 w-4.5" />,
    key: 'vimMode',
    color: 'text-lime-600 dark:text-lime-400',
    bgColor: 'bg-lime-50 dark:bg-lime-500/10',
  },
  {
    icon: <Settings className="h-4.5 w-4.5" />,
    key: 'customizable',
    color: 'text-indigo-500 dark:text-indigo-400',
    bgColor: 'bg-indigo-50 dark:bg-indigo-500/10',
  },
];

export function FeatureShowcase({
  onStartTour,
  disabled,
}: FeatureShowcaseProps) {
  const { hasCompletedTour } = useOnboardingStore();
  const { t } = useTranslation('common');

  const handleOpenDocs = () => {
    window.open('https://kunish-homelab.github.io/sql-pro/', '_blank');
  };

  return (
    <div
      className={cn(
        'flex flex-col transition-opacity',
        disabled && 'pointer-events-none opacity-50'
      )}
    >
      <div data-tour-target="feature-showcase">
        {/* Header - minimal and clean */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-main h-px w-8" />
            <h2
              className="text-foreground/80 font-medium tracking-widest uppercase"
              style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
            >
              {t('features.title', { defaultValue: 'Features' })}
            </h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground h-auto px-2 py-1"
            style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
            onClick={handleOpenDocs}
          >
            <BookOpen className="mr-1 h-3 w-3" />
            {t('features.docs', { defaultValue: 'Documentation' })}
          </Button>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-3 gap-3">
          {featureKeys.map((feature) => (
            <div
              key={feature.key}
              className="group rounded-base border-border bg-card flex flex-col items-center gap-2 border p-4 text-center shadow-sm transition-all hover:shadow-none active:scale-95"
            >
              <div
                className={cn(
                  'rounded-base border-border flex h-9 w-9 items-center justify-center border transition-all',
                  feature.bgColor,
                  feature.color,
                  'group-hover:scale-110'
                )}
              >
                {feature.icon}
              </div>
              <span
                className="text-foreground leading-tight font-medium"
                style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
              >
                {t(`features.${feature.key}.title`)}
              </span>
              <span
                className="text-muted-foreground line-clamp-2 leading-tight"
                style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.75)' }}
              >
                {t(`features.${feature.key}.desc`)}
              </span>
            </div>
          ))}
        </div>

        {/* Tour CTA */}
        {!hasCompletedTour && (
          <Button
            variant="outline"
            onClick={onStartTour}
            className="mt-6 w-full"
          >
            <PlayCircle className="mr-2 h-4 w-4" />
            {t('features.takeTour', { defaultValue: 'Take the quick tour' })}
          </Button>
        )}
      </div>
    </div>
  );
}
