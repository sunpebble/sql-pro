import { Button } from '@sqlpro/ui/button';
import { CheckCircle2, Download, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { sqlPro } from '@/lib/api';
import { useDialogStore } from '@/stores/dialog-store';

/**
 * Dialog showing update check results
 */
export function UpdateCheckDialog() {
  const { t } = useTranslation('common');
  const {
    updateCheckOpen,
    updateCheckMessage,
    updateAvailable,
    updateInfo,
    closeUpdateCheck,
  } = useDialogStore();

  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadComplete, setDownloadComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    setIsDownloading(true);
    setError(null);

    try {
      const result = await sqlPro.updates.download();
      if (result.success) {
        setDownloadComplete(true);
        setDownloadProgress(100);
      } else {
        setError(result.error || t('updateCheck.downloadFailed'));
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t('updateCheck.downloadFailed')
      );
    } finally {
      setIsDownloading(false);
    }
  };

  const handleInstall = async () => {
    try {
      const result = await sqlPro.updates.install();
      if (result.success) {
        // The app will restart, so close the dialog
        closeUpdateCheck();
      } else {
        setError(result.error || t('updateCheck.installFailed'));
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t('updateCheck.installFailed')
      );
    }
  };

  const handleClose = () => {
    setIsDownloading(false);
    setDownloadProgress(0);
    setDownloadComplete(false);
    setError(null);
    closeUpdateCheck();
  };

  return (
    <Dialog
      open={updateCheckOpen}
      onOpenChange={(open) => !open && handleClose()}
    >
      <DialogContent className="max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
            {updateAvailable ? (
              <Download className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            ) : (
              <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
            )}
          </div>
          <DialogTitle>
            {updateAvailable
              ? t('updateCheck.updateAvailable')
              : t('updateCheck.checkForUpdates')}
          </DialogTitle>
          <DialogDescription className="text-center">
            {error ? (
              <span className="text-red-600 dark:text-red-400">{error}</span>
            ) : (
              updateCheckMessage
            )}
          </DialogDescription>
        </DialogHeader>

        {updateInfo && (
          <div className="bg-muted/50 space-y-2 rounded-lg p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {t('updateCheck.version')}:
              </span>
              <span className="font-medium">{updateInfo.version}</span>
            </div>
            {updateInfo.releaseDate && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {t('updateCheck.releaseDate')}:
                </span>
                <span className="font-medium">
                  {new Date(updateInfo.releaseDate).toLocaleDateString()}
                </span>
              </div>
            )}
            {updateInfo.releaseNotes && (
              <div className="mt-2">
                <span className="text-muted-foreground">
                  {t('updateCheck.releaseNotes')}:
                </span>
                <p className="mt-1 text-xs whitespace-pre-wrap">
                  {updateInfo.releaseNotes}
                </p>
              </div>
            )}
          </div>
        )}

        {isDownloading && (
          <div className="space-y-2">
            <div className="bg-muted h-2 overflow-hidden rounded-full">
              <div
                className="bg-primary h-full transition-all duration-300"
                style={{ width: `${downloadProgress}%` }}
              />
            </div>
            <p className="text-muted-foreground text-center text-sm">
              {t('updateCheck.downloading')} {downloadProgress.toFixed(0)}%
            </p>
          </div>
        )}

        <DialogFooter className="gap-2 sm:justify-center">
          {updateAvailable && !downloadComplete && !isDownloading && (
            <>
              <Button variant="outline" onClick={handleClose}>
                {t('updateCheck.later')}
              </Button>
              <Button onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                {t('updateCheck.download')}
              </Button>
            </>
          )}
          {downloadComplete && (
            <>
              <Button variant="outline" onClick={handleClose}>
                {t('updateCheck.later')}
              </Button>
              <Button onClick={handleInstall}>
                <RefreshCw className="mr-2 h-4 w-4" />
                {t('updateCheck.restartAndInstall')}
              </Button>
            </>
          )}
          {isDownloading && (
            <Button variant="outline" disabled>
              {t('updateCheck.downloadingButton')}
            </Button>
          )}
          {!updateAvailable && !isDownloading && (
            <Button onClick={handleClose}>{t('updateCheck.ok')}</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
