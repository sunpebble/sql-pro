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
import { useOnboardingStore } from '@/stores';

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const features: Feature[] = [
  {
    icon: <Database className="h-5 w-5 text-blue-500" />,
    title: 'Schema Browser',
    description: 'Navigate tables, views, and database objects',
  },
  {
    icon: <Edit className="h-5 w-5 text-green-500" />,
    title: 'Inline Editing',
    description: 'Edit data directly with diff preview',
  },
  {
    icon: <Code className="h-5 w-5 text-purple-500" />,
    title: 'SQL Editor',
    description: 'Syntax highlighting and autocomplete',
  },
  {
    icon: <GitFork className="h-5 w-5 text-orange-500" />,
    title: 'ER Diagram',
    description: 'Visualize table relationships',
  },
  {
    icon: <GitCompare className="h-5 w-5 text-cyan-500" />,
    title: 'Schema Compare',
    description: 'Compare database structures',
  },
  {
    icon: <ArrowLeftRight className="h-5 w-5 text-pink-500" />,
    title: 'Data Diff',
    description: 'Compare table data across databases',
  },
  {
    icon: <Command className="h-5 w-5 text-yellow-500" />,
    title: 'Command Palette',
    description: 'Quick access with ⌘K / Ctrl+K',
  },
  {
    icon: <Keyboard className="h-5 w-5 text-lime-500" />,
    title: 'Vim Mode',
    description: 'Keyboard-driven editing',
  },
  {
    icon: <Settings className="h-5 w-5 text-slate-500" />,
    title: 'Customizable',
    description: 'Themes, fonts, and shortcuts',
  },
];

export function FeatureShowcase() {
  const { hasCompletedTour } = useOnboardingStore();

  const handleOpenDocs = () => {
    window.open('https://kunish-homelab.github.io/sql-pro/', '_blank');
  };

  return (
    <div className="flex h-full flex-col justify-center">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Features</h2>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground h-auto px-2 py-1 text-xs"
          onClick={handleOpenDocs}
        >
          <BookOpen className="mr-1 h-3 w-3" />
          Documentation
        </Button>
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-3 gap-2">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="bg-card/50 hover:bg-card flex flex-col items-center gap-1.5 rounded-lg border p-3 text-center transition-colors"
          >
            {feature.icon}
            <span className="text-xs leading-tight font-medium">
              {feature.title}
            </span>
            <span className="text-muted-foreground line-clamp-2 text-[10px] leading-tight">
              {feature.description}
            </span>
          </div>
        ))}
      </div>

      {/* Tour CTA */}
      {!hasCompletedTour && (
        <div className="mt-4 flex items-center justify-center gap-2 rounded-lg border border-dashed p-3">
          <PlayCircle className="text-primary h-4 w-4" />
          <span className="text-muted-foreground text-xs">
            Connect to a database to take the interactive tour
          </span>
        </div>
      )}
    </div>
  );
}
