import type { ProFeature } from '@shared/types';
import type { ReactNode } from 'react';
import { Button } from '@sqlpro/ui/button';
import { Crown, Key, Lock, Settings, Sparkles, Wand2, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { useAIStore, useProStore } from '@/stores';
import { ProBadge } from './ProBadge';

/**
 * AI features that can be unlocked with user's own API key.
 */
const AI_FEATURES: ProFeature[] = [
  'ai-nl-to-sql',
  'ai-data-analysis',
  'query-optimizer',
];

/**
 * Feature-specific configurations for display
 */
const FEATURE_CONFIG: Record<
  ProFeature,
  {
    icon: React.ElementType;
    gradient: string;
    previewDescription: string;
  }
> = {
  'ai-nl-to-sql': {
    icon: Wand2,
    gradient: 'from-violet-500 to-purple-500',
    previewDescription:
      'Just describe what you want in plain English, and let AI write the SQL for you.',
  },
  'ai-data-analysis': {
    icon: Sparkles,
    gradient: 'from-blue-500 to-cyan-500',
    previewDescription:
      'Get AI-powered insights and analysis from your data with natural language queries.',
  },
  'query-optimizer': {
    icon: Zap,
    gradient: 'from-orange-500 to-amber-500',
    previewDescription:
      'Automatically optimize your SQL queries for better performance.',
  },
  'advanced-export': {
    icon: Settings,
    gradient: 'from-emerald-500 to-green-500',
    previewDescription:
      'Export your data in multiple formats with advanced customization options.',
  },
  'plugin-system': {
    icon: Settings,
    gradient: 'from-pink-500 to-rose-500',
    previewDescription:
      'Extend SQL Pro with powerful plugins and custom integrations.',
  },
};

interface ProGateProps {
  /**
   * The Pro feature to check access for.
   */
  feature: ProFeature;
  /**
   * Content to render when user has Pro access.
   */
  children: ReactNode;
  /**
   * Optional custom fallback UI to show when user doesn't have Pro access.
   * If not provided, a default upgrade prompt is shown.
   */
  fallback?: ReactNode;
  /**
   * Callback when user clicks the upgrade button.
   * If not provided, the button will have no action.
   */
  onUpgrade?: () => void;
  /**
   * Callback when user clicks the "Configure API Key" button.
   * Only shown for AI features.
   */
  onConfigureApiKey?: () => void;
  /**
   * Additional class name for the gate container.
   */
  className?: string;
  /**
   * Whether to show a compact version of the gate.
   * @default false
   */
  compact?: boolean;
}

/**
 * Component that gates Pro features.
 * Shows children if user has Pro access for the specified feature,
 * or if user has configured their own API key for AI features,
 * otherwise shows an upgrade prompt (or custom fallback).
 *
 * @example
 * ```tsx
 * <ProGate feature="ai-nl-to-sql" onUpgrade={() => setShowProDialog(true)}>
 *   <NLToSQLContent />
 * </ProGate>
 * ```
 */
export function ProGate({
  feature,
  children,
  fallback,
  onUpgrade,
  onConfigureApiKey,
  className,
  compact = false,
}: ProGateProps) {
  const { t } = useTranslation('common');
  const { isPro, hasFeature } = useProStore();
  const { isConfigured: hasOwnApiKey } = useAIStore();

  // Check if user has access to this specific feature
  // Pro users get access through their subscription
  // For AI features, users with their own API key also get access
  const isAIFeature = AI_FEATURES.includes(feature);
  const hasAccess =
    (isPro && hasFeature(feature)) || (isAIFeature && hasOwnApiKey);

  // If user has access, render children
  if (hasAccess) {
    return <>{children}</>;
  }

  // If custom fallback provided, render it
  if (fallback !== undefined) {
    return <>{fallback}</>;
  }

  // Get translated feature names and descriptions
  const featureName = t(`pro.features.${feature}.name`, {
    defaultValue: feature,
  });
  const featureDescription = t(`pro.features.${feature}.description`, {
    defaultValue: '',
  });

  const config = FEATURE_CONFIG[feature];
  const FeatureIcon = config?.icon || Crown;

  if (compact) {
    return (
      <div
        data-slot="pro-gate-compact"
        className={cn(
          'flex items-center justify-between gap-4 rounded-lg border border-dashed p-4',
          'bg-muted/30 border-amber-500/30',
          className
        )}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br',
              config?.gradient || 'from-amber-500 to-yellow-500'
            )}
          >
            <FeatureIcon className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{featureName}</span>
              <ProBadge size="sm" />
            </div>
            <p className="text-muted-foreground text-sm">
              {featureDescription}
            </p>
          </div>
        </div>
        <Button
          onClick={onUpgrade}
          size="sm"
          className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white hover:from-amber-600 hover:to-yellow-600"
        >
          <Sparkles className="mr-1.5 h-3.5 w-3.5" />
          Upgrade
        </Button>
      </div>
    );
  }

  return (
    <div
      data-slot="pro-gate"
      className={cn(
        'flex flex-col items-center justify-center gap-5 rounded-xl border border-dashed p-8 text-center',
        'border-amber-500/30 bg-gradient-to-b from-amber-500/5 to-transparent',
        className
      )}
    >
      {/* Icon with gradient background */}
      <div className="relative">
        <div
          className={cn(
            'flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br shadow-lg',
            config?.gradient || 'from-amber-500 to-yellow-500'
          )}
        >
          <FeatureIcon className="h-10 w-10 text-white" />
        </div>
        <div className="bg-background absolute -right-1 -bottom-1 rounded-full border-2 border-amber-500/30 p-1.5">
          <Lock className="h-4 w-4 text-amber-600" />
        </div>
      </div>

      {/* Feature Info */}
      <div className="space-y-2">
        <div className="flex items-center justify-center gap-2">
          <h3 className="text-xl font-semibold">{featureName}</h3>
          <ProBadge variant="glow" />
        </div>
        <p className="text-muted-foreground max-w-md text-sm leading-relaxed">
          {config?.previewDescription || featureDescription}
        </p>
      </div>

      {/* Pricing hint */}
      <p className="text-muted-foreground text-xs">
        Starting at{' '}
        <span className="text-foreground font-semibold">$6.67/month</span> with
        yearly plan
      </p>

      {/* Upgrade CTA */}
      <div className="flex flex-col items-center gap-3">
        <Button
          onClick={onUpgrade}
          size="lg"
          className="bg-gradient-to-r from-amber-500 to-yellow-500 px-8 text-white shadow-lg shadow-amber-500/25 hover:from-amber-600 hover:to-yellow-600 hover:shadow-amber-500/35"
        >
          <Sparkles className="mr-2 h-4 w-4" />
          {t('pro.upgrade', { defaultValue: 'Upgrade to Pro' })}
        </Button>

        {/* API Key option for AI features */}
        {isAIFeature && onConfigureApiKey && (
          <div className="flex flex-col items-center gap-1">
            <span className="text-muted-foreground text-xs">or</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onConfigureApiKey}
              className="text-muted-foreground hover:text-foreground"
            >
              <Key className="mr-1.5 h-3.5 w-3.5" />
              Use your own API key
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Inline version of ProGate that renders minimal fallback content.
 * Useful for inline feature gating (e.g., buttons, menu items).
 *
 * @example
 * ```tsx
 * <ProGateInline feature="ai-nl-to-sql" onUpgrade={handleUpgrade}>
 *   <Button onClick={handleNLToSQL}>
 *     <Wand2 className="h-4 w-4" />
 *     NL to SQL
 *   </Button>
 * </ProGateInline>
 * ```
 */
export function ProGateInline({
  feature,
  children,
  fallback,
  onUpgrade,
}: Omit<ProGateProps, 'className' | 'compact' | 'onConfigureApiKey'>) {
  const { isPro, hasFeature } = useProStore();
  const { isConfigured: hasOwnApiKey } = useAIStore();

  // Check if user has access - same logic as ProGate
  const isAIFeature = AI_FEATURES.includes(feature);
  const hasAccess =
    (isPro && hasFeature(feature)) || (isAIFeature && hasOwnApiKey);

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback !== undefined) {
    return <>{fallback}</>;
  }

  // Default inline fallback: show ProBadge that opens upgrade
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onUpgrade}
      className="border-amber-500/50 text-amber-700 hover:bg-amber-500/10 dark:text-amber-400"
    >
      <Lock className="mr-1 h-3 w-3" />
      <ProBadge size="sm" variant="subtle" showIcon={false} />
    </Button>
  );
}
