import { Database } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useDialogStore } from '@/stores/dialog-store';

/**
 * About dialog showing application information
 * Uses Neobrutalism design language
 */
export function AboutDialog() {
  const { t } = useTranslation('common');
  const { aboutOpen, closeAbout } = useDialogStore();

  return (
    <Dialog
      open={aboutOpen}
      onOpenChange={(open: boolean) => !open && closeAbout()}
    >
      <DialogContent className="max-w-md">
        <DialogHeader className="text-center">
          {/* Logo with neobrutalism frame */}
          <div className="rounded-base border-border bg-main shadow-shadow mx-auto mb-4 flex h-20 w-20 items-center justify-center border-2">
            <Database className="text-main-foreground h-10 w-10" />
          </div>

          <DialogTitle
            className="font-bold tracking-wide"
            style={{ fontSize: 'calc(var(--font-ui-size, 14px) * 1.4)' }}
          >
            SQL Pro
          </DialogTitle>
          <DialogDescription
            className="text-muted-foreground font-medium tracking-wider uppercase"
            style={{ fontSize: 'calc(var(--font-ui-size, 14px) * 0.85)' }}
          >
            {t('about.subtitle')}
          </DialogDescription>
        </DialogHeader>

        <div className="border-border my-4 border-t-2" />

        <div className="space-y-4 text-center">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-base border-border bg-secondary-background space-y-1 border-2 p-3">
              <p
                className="text-muted-foreground tracking-wider uppercase"
                style={{ fontSize: 'calc(var(--font-ui-size, 14px) * 0.85)' }}
              >
                {t('about.version')}
              </p>
              <p
                className="text-main font-mono font-bold"
                style={{ fontSize: 'var(--font-ui-size, 14px)' }}
              >
                1.9.0
              </p>
            </div>
            <div className="rounded-base border-border bg-secondary-background space-y-1 border-2 p-3">
              <p
                className="text-muted-foreground tracking-wider uppercase"
                style={{ fontSize: 'calc(var(--font-ui-size, 14px) * 0.85)' }}
              >
                {t('about.platform')}
              </p>
              <p
                className="font-mono font-bold"
                style={{ fontSize: 'var(--font-ui-size, 14px)' }}
              >
                Electron
              </p>
            </div>
          </div>

          <div className="rounded-base border-border bg-secondary-background space-y-1 border-2 p-3">
            <p
              className="text-muted-foreground tracking-wider uppercase"
              style={{ fontSize: 'calc(var(--font-ui-size, 14px) * 0.85)' }}
            >
              {t('about.builtWith')}
            </p>
            <p
              className="font-medium"
              style={{ fontSize: 'var(--font-ui-size, 14px)' }}
            >
              Electron · React · TypeScript · libSQL
            </p>
          </div>

          <div className="border-border my-4 border-t-2" />

          <div className="space-y-2">
            <p
              className="text-muted-foreground"
              style={{ fontSize: 'calc(var(--font-ui-size, 14px) * 0.85)' }}
            >
              {t('about.copyright')}
            </p>
            <p
              className="text-main font-bold tracking-widest uppercase"
              style={{ fontSize: 'calc(var(--font-ui-size, 14px) * 0.85)' }}
            >
              {t('about.tagline')}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
