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
    color: 'text-muted-foreground group-hover:text-main',
    bgColor: 'bg-muted/50',
  },
  {
    icon: <Edit className="h-4.5 w-4.5" />,
    key: 'inlineEditing',
    color: 'text-muted-foreground group-hover:text-main',
    bgColor: 'bg-muted/50',
  },
  {
    icon: <Code className="h-4.5 w-4.5" />,
    key: 'sqlEditor',
    color: 'text-muted-foreground group-hover:text-main',
    bgColor: 'bg-muted/50',
  },
  {
    icon: <GitFork className="h-4.5 w-4.5" />,
    key: 'erDiagram',
    color: 'text-muted-foreground group-hover:text-main',
    bgColor: 'bg-muted/50',
  },
  {
    icon: <GitCompare className="h-4.5 w-4.5" />,
    key: 'schemaCompare',
    color: 'text-muted-foreground group-hover:text-main',
    bgColor: 'bg-muted/50',
  },
  {
    icon: <ArrowLeftRight className="h-4.5 w-4.5" />,
    key: 'dataDiff',
    color: 'text-muted-foreground group-hover:text-main',
    bgColor: 'bg-muted/50',
  },
  {
    icon: <Command className="h-4.5 w-4.5" />,
    key: 'commandPalette',
    color: 'text-muted-foreground group-hover:text-main',
    bgColor: 'bg-muted/50',
  },
  {
    icon: <Keyboard className="h-4.5 w-4.5" />,
    key: 'vimMode',
    color: 'text-muted-foreground group-hover:text-main',
    bgColor: 'bg-muted/50',
  },
  {
    icon: <Settings className="h-4.5 w-4.5" />,
    key: 'customizable',
    color: 'text-muted-foreground group-hover:text-main',
    bgColor: 'bg-muted/50',
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
              className="group rounded-base border-border/70 bg-card/70 hover:bg-card flex flex-col items-center gap-2 border p-4 text-center shadow-sm transition-all duration-150 active:scale-[0.98]"
            >
              <div
                className={cn(
                  'rounded-base border-border/60 flex h-8 w-8 items-center justify-center border transition-all duration-150',
                  feature.bgColor,
                  feature.color
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
