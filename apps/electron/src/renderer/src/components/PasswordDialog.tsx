import * as Dialog from '@radix-ui/react-dialog';
import { Button } from '@sqlpro/ui/button';
import { PasswordInput } from '@sqlpro/ui/password-input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@sqlpro/ui/tooltip';
import { Info, Lock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { sqlPro } from '@/lib/api';
import { cn } from '@/lib/utils';

interface PasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (password: string, rememberPassword: boolean) => void;
  filename: string;
  dbPath: string;
}

export function PasswordDialog({
  open,
  onOpenChange,
  onSubmit,
  filename,
  dbPath,
}: PasswordDialogProps) {
  const { t } = useTranslation('common');
  const [password, setPassword] = useState('');
  const [rememberPassword, setRememberPassword] = useState(false);
  const [isStorageAvailable, setIsStorageAvailable] = useState(false);
  const [hasSavedPassword, setHasSavedPassword] = useState(false);

  // Check if password storage is available and if there's a saved password
  useEffect(() => {
    if (open && dbPath) {
      Promise.all([
        sqlPro.password.isAvailable(),
        sqlPro.password.has({ dbPath }),
      ]).then(([availableResult, hasResult]) => {
        setIsStorageAvailable(availableResult.available);
        setHasSavedPassword(hasResult.hasPassword);
        // Default to remember if storage is available
        setRememberPassword(availableResult.available);
      });
    }
  }, [open, dbPath]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim()) {
      onSubmit(password, rememberPassword && isStorageAvailable);
      setPassword('');
      setRememberPassword(false);
    }
  };

  const handleForgetPassword = async () => {
    if (dbPath) {
      await sqlPro.password.remove({ dbPath });
      setHasSavedPassword(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content className="bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] rounded-base border-border shadow-shadow fixed top-1/2 left-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 border-2 p-6">
          <div className="flex flex-col items-center text-center">
            <div className="bg-main rounded-base border-border mb-4 flex h-12 w-12 items-center justify-center border-2">
              <Lock className="text-main-foreground h-6 w-6" />
            </div>
            <Dialog.Title
              className="font-semibold"
              style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 1.15)' }}
            >
              {t('passwordDialog.title')}
            </Dialog.Title>
            <Dialog.Description
              className="text-muted-foreground mt-2"
              style={{ fontSize: 'var(--font-ui-size, 13px)' }}
            >
              {t('passwordDialog.description')}{' '}
              <span className="font-medium">{filename}</span>
            </Dialog.Description>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <PasswordInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('passwordDialog.placeholder')}
              autoFocus
              className="w-full"
            />

            {/* Remember password checkbox */}
            <div className="flex items-center justify-between">
              <label
                className={cn(
                  'flex cursor-pointer items-center gap-2',
                  !isStorageAvailable && 'cursor-not-allowed opacity-50'
                )}
              >
                <input
                  type="checkbox"
                  checked={rememberPassword}
                  onChange={(e) => setRememberPassword(e.target.checked)}
                  disabled={!isStorageAvailable}
                  className="border-border rounded-base h-4 w-4 border-2"
                />
                <span>{t('passwordDialog.rememberPassword')}</span>
                {!isStorageAvailable && (
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="text-muted-foreground h-3.5 w-3.5" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t('passwordDialog.storageUnavailable')}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </label>

              {/* Forget saved password link */}
              {hasSavedPassword && (
                <button
                  type="button"
                  onClick={handleForgetPassword}
                  className="text-muted-foreground hover:text-foreground hover:underline"
                  style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
                >
                  {t('passwordDialog.forgetPassword')}
                </button>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
              >
                {t('actions.cancel')}
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={!password.trim()}
              >
                {t('passwordDialog.open')}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
