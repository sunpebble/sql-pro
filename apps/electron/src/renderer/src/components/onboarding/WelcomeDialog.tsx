import { Button } from '@sqlpro/ui/button';
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
import { useOnboardingStore } from '@/stores';

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
          <div className="from-primary/20 to-primary/5 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br">
            <Database className="text-primary h-8 w-8" />
          </div>
          <DialogTitle className="text-xl">
            {t('welcomeDialog.title')}
          </DialogTitle>
          <DialogDescription
            id="welcome-dialog-description"
            className="text-center"
          >
            {t('welcomeDialog.description')}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-4 flex-col gap-2 sm:flex-col">
          <Button onClick={handleTakeTour} className="w-full" size="lg">
            <PlayCircle className="mr-2 h-4 w-4" />
            {t('welcomeDialog.takeTour')}
          </Button>
          <Button
            variant="ghost"
            onClick={handleSkip}
            className="text-muted-foreground w-full"
          >
            <X className="mr-2 h-4 w-4" />
            {t('welcomeDialog.skipForNow')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
