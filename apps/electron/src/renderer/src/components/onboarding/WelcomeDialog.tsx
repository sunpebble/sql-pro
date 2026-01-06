import { Button } from '@sqlpro/ui/button';
import { Database, PlayCircle, X } from 'lucide-react';
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
}

export function WelcomeDialog({ open, onOpenChange }: WelcomeDialogProps) {
  const { startTour, skipTour } = useOnboardingStore();

  const handleTakeTour = () => {
    startTour();
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
          <DialogTitle className="text-xl">Welcome to SQL Pro</DialogTitle>
          <DialogDescription
            id="welcome-dialog-description"
            className="text-center"
          >
            Your professional database manager for SQLite, MySQL, PostgreSQL,
            and Supabase. Take a quick tour to discover powerful features like
            the command palette, Vim mode, visual diff preview, and ER diagrams.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-4 flex-col gap-2 sm:flex-col">
          <Button onClick={handleTakeTour} className="w-full" size="lg">
            <PlayCircle className="mr-2 h-4 w-4" />
            Take a Tour
          </Button>
          <Button
            variant="ghost"
            onClick={handleSkip}
            className="text-muted-foreground w-full"
          >
            <X className="mr-2 h-4 w-4" />
            Skip for Now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
