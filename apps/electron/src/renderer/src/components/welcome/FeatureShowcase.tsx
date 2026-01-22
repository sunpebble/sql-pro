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
}

// Clean monochromatic icons with subtle gold accent on hover
const featureKeys: FeatureKey[] = [
  {
    icon: <Database className="h-4.5 w-4.5" />,
    key: 'schemaBrowser',
  },
  {
    icon: <Edit className="h-4.5 w-4.5" />,
    key: 'inlineEditing',
  },
  {
    icon: <Code className="h-4.5 w-4.5" />,
    key: 'sqlEditor',
  },
  {
    icon: <GitFork className="h-4.5 w-4.5" />,
    key: 'erDiagram',
  },
  {
    icon: <GitCompare className="h-4.5 w-4.5" />,
    key: 'schemaCompare',
  },
  {
    icon: <ArrowLeftRight className="h-4.5 w-4.5" />,
    key: 'dataDiff',
  },
  {
    icon: <Command className="h-4.5 w-4.5" />,
    key: 'commandPalette',
  },
  {
    icon: <Keyboard className="h-4.5 w-4.5" />,
    key: 'vimMode',
  },
  {
    icon: <Settings className="h-4.5 w-4.5" />,
    key: 'customizable',
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
        'flex h-full flex-col justify-center transition-opacity',
        disabled && 'pointer-events-none opacity-50'
      )}
    >
      <div data-tour-target="feature-showcase">
        {/* Header - minimal and clean */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="from-gold/60 h-px w-8 bg-gradient-to-r to-transparent" />
            <h2 className="text-foreground/80 text-xs font-medium tracking-widest uppercase">
              {t('features.title', { defaultValue: 'Features' })}
            </h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground h-auto px-2 py-1 text-xs"
            onClick={handleOpenDocs}
          >
            <BookOpen className="mr-1 h-3 w-3" />
            {t('features.docs', { defaultValue: 'Documentation' })}
          </Button>
        </div>

        {/* Feature Grid - refined cards with subtle interactions */}
        <div className="grid grid-cols-3 gap-3">
          {featureKeys.map((feature) => (
            <div
              key={feature.key}
              className="group border-border/40 bg-card/30 hover:border-primary/30 hover:bg-primary/5 flex flex-col items-center gap-2 rounded-lg border p-4 text-center transition-all duration-200 hover:shadow-sm"
            >
              <div className="text-muted-foreground group-hover:text-primary transition-colors">
                {feature.icon}
              </div>
              <span className="text-foreground/90 text-xs leading-tight font-medium">
                {t(`features.${feature.key}.title`)}
              </span>
              <span className="text-muted-foreground text-2xs line-clamp-2 leading-tight">
                {t(`features.${feature.key}.desc`)}
              </span>
            </div>
          ))}
        </div>

        {/* Tour CTA - subtle, non-intrusive */}
        {!hasCompletedTour && (
          <Button
            variant="outline"
            onClick={onStartTour}
            className="border-border/60 text-muted-foreground hover:border-primary/40 hover:text-foreground hover:bg-primary/5 mt-6 w-full border-dashed transition-colors"
          >
            <PlayCircle className="mr-2 h-4 w-4" />
            {t('features.takeTour', { defaultValue: 'Take the quick tour' })}
          </Button>
        )}
      </div>
    </div>
  );
}
