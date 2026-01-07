import { Button } from '@sqlpro/ui/button';
import { CheckCircle2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useDialogStore } from '@/stores';

/**
 * Dialog showing update check results
 */
export function UpdateCheckDialog() {
  const { updateCheckOpen, updateCheckMessage, closeUpdateCheck } =
    useDialogStore();

  return (
    <Dialog
      open={updateCheckOpen}
      onOpenChange={(open: boolean) => !open && closeUpdateCheck()}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
            <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <DialogTitle>Check for Updates</DialogTitle>
          <DialogDescription className="text-center">
            {updateCheckMessage}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-center">
          <Button onClick={closeUpdateCheck}>OK</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
