import { DecoFrame, GoldDivider, GradientText } from '@sqlpro/ui';
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
 * Uses Data Sanctum design language for brand consistency
 */
export function AboutDialog() {
  const { t } = useTranslation('common');
  const { aboutOpen, closeAbout } = useDialogStore();

  return (
    <Dialog
      open={aboutOpen}
      onOpenChange={(open: boolean) => !open && closeAbout()}
    >
      <DialogContent className="max-w-md" decorated>
        <DialogHeader className="text-center">
          {/* Logo with decorative frame */}
          <DecoFrame
            size="default"
            variant="gold"
            animated
            className="mx-auto mb-4 flex h-20 w-20 items-center justify-center"
          >
            <Database className="text-primary h-10 w-10" />
          </DecoFrame>

          <DialogTitle className="text-2xl tracking-wide">
            <GradientText variant="primary" speed="slow">
              SQL Pro
            </GradientText>
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
            {t('about.subtitle')}
          </DialogDescription>
        </DialogHeader>

        <GoldDivider className="my-4" />

        <div className="space-y-4 text-center">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs tracking-wider uppercase">
                {t('about.version')}
              </p>
              <p className="text-primary font-mono text-sm">1.9.0</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs tracking-wider uppercase">
                {t('about.platform')}
              </p>
              <p className="font-mono text-sm">Electron</p>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-muted-foreground text-xs tracking-wider uppercase">
              {t('about.builtWith')}
            </p>
            <p className="text-sm">Electron · React · TypeScript · libSQL</p>
          </div>

          <GoldDivider className="my-4" />

          <div className="space-y-2">
            <p className="text-muted-foreground text-xs">
              {t('about.copyright')}
            </p>
            <p className="text-primary/60 text-xs tracking-widest uppercase">
              {t('about.tagline')}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
