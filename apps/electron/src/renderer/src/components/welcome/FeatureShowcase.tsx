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
}

interface FeatureKey {
  icon: React.ReactNode;
  key: string;
}

const featureKeys: FeatureKey[] = [
  {
    icon: <Database className="h-5 w-5 text-blue-500" />,
    key: 'schemaBrowser',
  },
  { icon: <Edit className="h-5 w-5 text-green-500" />, key: 'inlineEditing' },
  { icon: <Code className="h-5 w-5 text-purple-500" />, key: 'sqlEditor' },
  { icon: <GitFork className="h-5 w-5 text-orange-500" />, key: 'erDiagram' },
  {
    icon: <GitCompare className="h-5 w-5 text-cyan-500" />,
    key: 'schemaCompare',
  },
  {
    icon: <ArrowLeftRight className="h-5 w-5 text-pink-500" />,
    key: 'dataDiff',
  },
  {
    icon: <Command className="h-5 w-5 text-yellow-500" />,
    key: 'commandPalette',
  },
  { icon: <Keyboard className="h-5 w-5 text-lime-500" />, key: 'vimMode' },
  {
    icon: <Settings className="h-5 w-5 text-slate-500" />,
    key: 'customizable',
  },
];

export function FeatureShowcase({ onStartTour }: FeatureShowcaseProps) {
  const { hasCompletedTour } = useOnboardingStore();
  const { t } = useTranslation('common');

  const handleOpenDocs = () => {
    window.open('https://kunish-homelab.github.io/sql-pro/', '_blank');
  };

  return (
    <div className="flex h-full flex-col justify-center">
      <div data-tour-target="feature-showcase">
        {/* Header */}
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">
            {t('features.title', { defaultValue: 'Features' })}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground h-auto px-2 py-1 text-xs"
            onClick={handleOpenDocs}
          >
            <BookOpen className="mr-1 h-3 w-3" />
            {t('features.docs', { defaultValue: 'Documentation' })}
          </Button>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-3 gap-2">
          {featureKeys.map((feature) => (
            <div
              key={feature.key}
              className="bg-card/50 hover:bg-card flex flex-col items-center gap-1.5 rounded-lg border p-3 text-center transition-colors"
            >
              {feature.icon}
              <span className="text-xs leading-tight font-medium">
                {t(`features.${feature.key}.title`)}
              </span>
              <span className="text-muted-foreground text-2xs line-clamp-2 leading-tight">
                {t(`features.${feature.key}.desc`)}
              </span>
            </div>
          ))}
        </div>

        {/* Tour CTA */}
        {!hasCompletedTour && (
          <button
            onClick={onStartTour}
            className="hover:bg-accent group mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed bg-transparent p-3 transition-colors"
          >
            <PlayCircle className="text-primary h-4 w-4" />
            <span className="text-primary text-xs group-hover:underline">
              {t('features.takeTour', { defaultValue: 'Take the quick tour' })}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
