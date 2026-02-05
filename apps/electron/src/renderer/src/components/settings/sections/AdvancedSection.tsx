import { Label } from '@sqlpro/ui/label';
import { ChevronRight, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
// Direct imports to avoid barrel file overhead (bundle-barrel-imports)
import { useDialogStore } from '@/stores/dialog-store';

interface AdvancedSectionProps {
  onOpenChange?: (open: boolean) => void;
}

export function AdvancedSection({ onOpenChange }: AdvancedSectionProps) {
  return (
    <div className="space-y-6">
      {/* Developer Section */}
      <DeveloperPanel onOpenChange={onOpenChange} />
    </div>
  );
}

interface DeveloperPanelProps {
  onOpenChange?: (open: boolean) => void;
}

function DeveloperPanel({ onOpenChange }: DeveloperPanelProps) {
  const { t } = useTranslation('settings');
  const openMemoryMonitor = useDialogStore((s) => s.openMemoryMonitor);

  const handleOpenMemoryMonitor = () => {
    // Close settings dialog and open memory monitor
    onOpenChange?.(false);
    openMemoryMonitor();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Zap className="h-4 w-4" />
        <Label
          className="font-medium"
          style={{ fontSize: 'var(--font-ui-size, 14px)' }}
        >
          {t('developer.title')}
        </Label>
      </div>

      <button
        onClick={handleOpenMemoryMonitor}
        className="card-interactive flex w-full items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-full">
            <Zap className="text-muted-foreground h-5 w-5" />
          </div>
          <div className="text-left">
            <span
              className="font-medium"
              style={{ fontSize: 'var(--font-ui-size, 14px)' }}
            >
              {t('developer.memoryMonitor')}
            </span>
            <p
              className="text-muted-foreground"
              style={{ fontSize: 'calc(var(--font-ui-size, 14px) * 0.85)' }}
            >
              {t('developer.memoryMonitorDescription')}
            </p>
          </div>
        </div>
        <ChevronRight className="text-muted-foreground h-5 w-5" />
      </button>

      <p
        className="text-muted-foreground"
        style={{ fontSize: 'calc(var(--font-ui-size, 14px) * 0.85)' }}
      >
        Access via menu: View → Developer → Memory Monitor (⌘⇧M)
      </p>
    </div>
  );
}
