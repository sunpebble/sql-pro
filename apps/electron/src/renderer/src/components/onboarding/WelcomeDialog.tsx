import { Button } from '@quarry/ui/button';
// 直接导入优化 tree-shaking (vercel-react-best-practices: bundle-barrel-imports)
import { DecoFrame } from '@quarry/ui/decorations';
import { GradientText } from '@quarry/ui/typography';
import { Database, PlayCircle, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useOnboardingStore } from '@/stores/onboarding-store';

export interface WelcomeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Optional callback to start the tour. If not provided, uses the default onboarding store action */
  onStartTour?: () => void;
}

export function WelcomeDialog({
  open,
  onOpenChange,
  onStartTour,
}: WelcomeDialogProps) {
  const { t } = useTranslation('common');
  const { startTour, skipTour } = useOnboardingStore();

  const handleTakeTour = () => {
    if (onStartTour) {
      onStartTour();
    } else {
      startTour();
    }
    onOpenChange(false);
  };

  const handleSkip = () => {
    skipTour();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        showCloseButton={false}
        aria-describedby="welcome-dialog-description"
      >
        <DialogHeader className="text-center sm:text-center">
          {/* App Logo */}
          <DecoFrame
            size="default"
            variant="gold"
            animated
            className="rounded-base mx-auto mb-4 flex h-16 w-16 items-center justify-center"
          >
            <Database className="text-primary h-8 w-8" />
          </DecoFrame>
          <DialogTitle
            style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 1.4)' }}
          >
            <GradientText variant="primary">
              {t('welcomeDialog.title')}
            </GradientText>
          </DialogTitle>
          <DialogDescription
            id="welcome-dialog-description"
            className="text-center"
          >
            {t('welcomeDialog.description')}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-4 flex-col gap-2 sm:flex-col">
          <Button
            variant="default"
            size="lg"
            onClick={handleTakeTour}
            className="w-full"
          >
            <PlayCircle className="mr-2 h-4 w-4" />
            {t('welcomeDialog.takeTour')}
          </Button>
          <Button variant="ghost" onClick={handleSkip} className="w-full">
            <X className="mr-2 h-4 w-4" />
            {t('welcomeDialog.skipForNow')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
