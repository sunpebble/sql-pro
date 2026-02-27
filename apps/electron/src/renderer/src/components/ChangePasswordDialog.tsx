import * as Dialog from '@radix-ui/react-dialog';
import { Alert, AlertDescription } from '@sqlpro/ui/alert';
import { Button } from '@sqlpro/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@sqlpro/ui/tooltip';
import { AlertCircle, Info, KeyRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { sqlPro } from '@/lib/api';
import { cn } from '@/lib/utils';

interface ChangePasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  connectionId: string;
  filename: string;
  dbPath: string;
  isCurrentlyEncrypted: boolean;
}

export function ChangePasswordDialog({
  open,
  onOpenChange,
  onSuccess,
  connectionId,
  filename,
  dbPath,
  isCurrentlyEncrypted,
}: ChangePasswordDialogProps) {
  const { t } = useTranslation();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberPassword, setRememberPassword] = useState(false);
  const [isStorageAvailable, setIsStorageAvailable] = useState(false);
  const [hasSavedPassword, setHasSavedPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRemoveEncryptionConfirm, setShowRemoveEncryptionConfirm] =
    useState(false);

  // Check if password storage is available and if there's a saved password
  useEffect(() => {
    if (open && dbPath) {
      Promise.all([
        sqlPro.password.isAvailable(),
        sqlPro.password.has({ dbPath }),
      ]).then(([availableResult, hasResult]) => {
        setIsStorageAvailable(availableResult.available);
        setHasSavedPassword(hasResult.hasPassword);
        // Default to remember if storage is available or already has saved password
        setRememberPassword(availableResult.available || hasResult.hasPassword);
      });
    }
  }, [open, dbPath]);

  // Reset form when dialog closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset form state when closing
      setNewPassword('');
      setConfirmPassword('');
      setError(null);
      setIsLoading(false);
      setShowRemoveEncryptionConfirm(false);
    }
    onOpenChange(newOpen);
  };

  const performPasswordChange = async () => {
    setIsLoading(true);

    try {
      const result = await sqlPro.db.changePassword({
        connectionId,
        newPassword,
      });

      if (result.success) {
        // Update stored password if:
        // 1. User chose to remember the new password, OR
        // 2. There was already a saved password (auto-update it)
        const shouldUpdatePassword =
          (rememberPassword || hasSavedPassword) && isStorageAvailable;

        if (newPassword && shouldUpdatePassword) {
          await sqlPro.password.save({ dbPath, password: newPassword });
        } else if (!newPassword) {
          // Remove stored password if encryption is removed
          await sqlPro.password.remove({ dbPath });
        }

        onSuccess();
        handleOpenChange(false);
      } else {
        setError(result.error || t('changePassword.failedToChangePassword'));
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t('common.unexpectedError')
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setError(t('changePassword.passwordsNotMatch'));
      return;
    }

    // Warn if removing encryption - show confirmation dialog
    if (newPassword === '' && isCurrentlyEncrypted) {
      setShowRemoveEncryptionConfirm(true);
      return;
    }

    await performPasswordChange();
  };

  const passwordsMatch = newPassword === confirmPassword;
  const canSubmit =
    !isLoading &&
    (newPassword === '' || (newPassword.length > 0 && passwordsMatch));

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content className="bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 rounded-base border-border fixed top-1/2 left-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 border p-6 shadow-sm">
          <div className="flex flex-col items-center text-center">
            <div className="bg-primary/10 mb-4 flex h-12 w-12 items-center justify-center rounded-full">
              <KeyRound className="text-primary h-6 w-6" />
            </div>
            <Dialog.Title
              className="font-semibold"
              style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 1.15)' }}
            >
              {isCurrentlyEncrypted
                ? t('changePassword.changeTitle')
                : t('changePassword.encryptTitle')}
            </Dialog.Title>
            <Dialog.Description
              className="text-muted-foreground mt-2"
              style={{ fontSize: 'var(--font-ui-size, 13px)' }}
            >
              {isCurrentlyEncrypted
                ? t('changePassword.changeDesc', { filename })
                : t('changePassword.encryptDesc', { filename })}
            </Dialog.Description>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* New Password */}
            <div className="space-y-2">
              <label
                htmlFor="newPassword"
                className="font-medium"
                style={{ fontSize: 'var(--font-ui-size, 13px)' }}
              >
                {t('changePassword.newPassword')}
              </label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={
                  isCurrentlyEncrypted
                    ? t('changePassword.newPasswordPlaceholder')
                    : t('changePassword.enterPassword')
                }
                autoFocus
                className={cn(
                  'border-input bg-background w-full rounded-md border px-3 py-2',
                  'placeholder:text-muted-foreground',
                  'focus:ring-ring focus:ring-2 focus:ring-offset-2 focus:outline-none'
                )}
              />
              {isCurrentlyEncrypted && (
                <p
                  className="text-muted-foreground"
                  style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
                >
                  {t('changePassword.leaveEmptyToRemove')}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <label
                htmlFor="confirmPassword"
                className="font-medium"
                style={{ fontSize: 'var(--font-ui-size, 13px)' }}
              >
                {t('changePassword.confirmPassword')}
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t('changePassword.confirmPlaceholder')}
                className={cn(
                  'border-input bg-background w-full rounded-md border px-3 py-2',
                  'placeholder:text-muted-foreground',
                  'focus:ring-ring focus:ring-2 focus:ring-offset-2 focus:outline-none',
                  confirmPassword && !passwordsMatch && 'border-destructive'
                )}
              />
              {confirmPassword && !passwordsMatch && (
                <p
                  className="text-destructive"
                  style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
                >
                  {t('changePassword.passwordsNotMatch')}
                </p>
              )}
            </div>

            {/* Remember password checkbox - only show if setting a password and no saved password */}
            {newPassword && !hasSavedPassword && (
              <label
                className={cn(
                  'border-input hover:bg-accent/50 flex cursor-pointer items-center gap-3 rounded-md border p-3',
                  !isStorageAvailable && 'cursor-not-allowed opacity-50'
                )}
              >
                <input
                  type="checkbox"
                  checked={rememberPassword}
                  onChange={(e) => setRememberPassword(e.target.checked)}
                  disabled={!isStorageAvailable}
                  className="border-input h-4 w-4 rounded-md"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="font-medium"
                      style={{ fontSize: 'var(--font-ui-size, 13px)' }}
                    >
                      {t('changePassword.rememberPassword')}
                    </span>
                    {!isStorageAvailable && (
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="text-muted-foreground h-3.5 w-3.5" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{t('changePassword.secureStorageNotAvailable')}</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                  <p
                    className="text-muted-foreground"
                    style={{
                      fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)',
                    }}
                  >
                    {t('changePassword.storeInKeychain')}
                  </p>
                </div>
              </label>
            )}

            {/* Info message when there's already a saved password */}
            {newPassword && hasSavedPassword && (
              <div
                className="text-muted-foreground flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950"
                style={{ fontSize: 'var(--font-ui-size, 13px)' }}
              >
                <Info className="h-4 w-4 text-blue-500" />
                <span>{t('changePassword.autoUpdateSavedPassword')}</span>
              </div>
            )}

            {/* Warning for removing encryption */}
            {isCurrentlyEncrypted && newPassword === '' && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {t('changePassword.removeEncryptionWarning')}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => handleOpenChange(false)}
                disabled={isLoading}
              >
                {t('changePassword.cancel')}
              </Button>
              <Button type="submit" className="flex-1" disabled={!canSubmit}>
                {isLoading
                  ? t('changePassword.changing')
                  : newPassword === ''
                    ? t('changePassword.removeEncryption')
                    : isCurrentlyEncrypted
                      ? t('changePassword.changePasswordBtn')
                      : t('changePassword.encrypt')}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>

      {/* Remove Encryption Confirmation Dialog */}
      <ConfirmDialog
        open={showRemoveEncryptionConfirm}
        onOpenChange={setShowRemoveEncryptionConfirm}
        title={t('changePassword.removeEncryptionTitle')}
        description={t('changePassword.removeEncryptionDesc')}
        confirmLabel={t('changePassword.removeEncryption')}
        variant="destructive"
        onConfirm={performPasswordChange}
      />
    </Dialog.Root>
  );
}
