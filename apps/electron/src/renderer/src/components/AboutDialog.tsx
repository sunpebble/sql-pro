import { Database } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useDialogStore } from '@/stores';

/**
 * About dialog showing application information
 */
export function AboutDialog() {
  const { aboutOpen, closeAbout } = useDialogStore();

  return (
    <Dialog
      open={aboutOpen}
      onOpenChange={(open: boolean) => !open && closeAbout()}
    >
      <DialogContent className="max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700">
            <Database className="h-8 w-8 text-white" />
          </div>
          <DialogTitle className="text-xl">SQL Pro</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Professional SQLite Database Manager
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-center">
          <div className="space-y-1">
            <p className="text-muted-foreground text-sm">Version</p>
            <p className="font-mono text-sm">1.0.0</p>
          </div>

          <div className="space-y-1">
            <p className="text-muted-foreground text-sm">Built with</p>
            <p className="text-sm">Tauri + React + TypeScript</p>
          </div>

          <div className="border-t pt-4">
            <p className="text-muted-foreground text-xs">
              © 2025 SQL Pro. All rights reserved.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
