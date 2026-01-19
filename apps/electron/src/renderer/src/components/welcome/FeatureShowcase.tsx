import { DecoFrame, DecoLine, GoldButton } from '@sqlpro/ui';
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
import { useOnboardingStore } from '@/stores';

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

// Using gold-tinted monochromatic icons for cohesive Data Sanctum aesthetic
const featureKeys: FeatureKey[] = [
  {
    icon: <Database className="text-gold h-5 w-5" />,
    key: 'schemaBrowser',
  },
  {
    icon: <Edit className="text-gold h-5 w-5" />,
    key: 'inlineEditing',
  },
  {
    icon: <Code className="text-gold h-5 w-5" />,
    key: 'sqlEditor',
  },
  {
    icon: <GitFork className="text-gold h-5 w-5" />,
    key: 'erDiagram',
  },
  {
    icon: <GitCompare className="text-gold h-5 w-5" />,
    key: 'schemaCompare',
  },
  {
    icon: <ArrowLeftRight className="text-gold h-5 w-5" />,
    key: 'dataDiff',
  },
  {
    icon: <Command className="text-gold h-5 w-5" />,
    key: 'commandPalette',
  },
  {
    icon: <Keyboard className="text-gold h-5 w-5" />,
    key: 'vimMode',
  },
  {
    icon: <Settings className="text-gold h-5 w-5" />,
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
      className={`flex h-full flex-col justify-center transition-opacity ${disabled ? 'pointer-events-none opacity-50' : ''}`}
    >
      <div data-tour-target="feature-showcase">
        {/* Header with decorative line */}
        <div className="animate-fade-in-up stagger-1 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <DecoLine length="w-8" />
            <h2 className="text-gold text-sm font-medium tracking-widest uppercase">
              {t('features.title', { defaultValue: 'Features' })}
            </h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-gold h-auto px-2 py-1 text-xs"
            onClick={handleOpenDocs}
          >
            <BookOpen className="mr-1 h-3 w-3" />
            {t('features.docs', { defaultValue: 'Documentation' })}
          </Button>
        </div>

        {/* Feature Grid - Art Deco inspired cards with staggered animation */}
        <div className="grid grid-cols-3 gap-2.5">
          {featureKeys.map((feature, index) => (
            <DecoFrame
              key={feature.key}
              size="sm"
              variant="gold"
              animated
              className="animate-fade-in-up group hover:border-gold flex flex-col items-center gap-1.5 rounded-lg border border-transparent bg-[rgba(212,175,55,0.08)] p-3.5 text-center transition-all duration-300 ease-out hover:scale-[1.03] hover:shadow-[0_8px_24px_rgba(212,175,55,0.35)]"
              style={{ animationDelay: `${150 + index * 50}ms` }}
            >
              {feature.icon}
              <span className="text-xs leading-tight font-medium">
                {t(`features.${feature.key}.title`)}
              </span>
              <span className="text-muted-foreground text-2xs line-clamp-2 leading-tight">
                {t(`features.${feature.key}.desc`)}
              </span>
            </DecoFrame>
          ))}
        </div>

        {/* Tour CTA - Gold themed with animation */}
        {!hasCompletedTour && (
          <GoldButton
            variant="outline"
            onClick={onStartTour}
            className="animate-fade-in-up stagger-6 vault-frame mt-5 w-full border-dashed"
          >
            <PlayCircle className="h-4 w-4" />
            {t('features.takeTour', { defaultValue: 'Take the quick tour' })}
          </GoldButton>
        )}
      </div>
    </div>
  );
}
