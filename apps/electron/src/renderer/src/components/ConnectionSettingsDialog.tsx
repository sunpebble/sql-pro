import * as Dialog from '@radix-ui/react-dialog';
import { Alert, AlertDescription } from '@sqlpro/ui/alert';
import { Button } from '@sqlpro/ui/button';
import { Separator } from '@sqlpro/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@sqlpro/ui/tooltip';
import { AlertCircle, Info, KeyRound, Settings, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { sqlPro } from '@/lib/api';
import { cn } from '@/lib/utils';

export interface ConnectionSettings {
  displayName: string;
  readOnly: boolean;
  rememberPassword: boolean;
}

interface ConnectionSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (settings: ConnectionSettings) => void;
  /** Original filename from path - used as default displayName */
  filename: string;
  /** Full database path - used for password storage check */
  dbPath: string;
  /** Whether the database is encrypted */
  isEncrypted: boolean;
  /** Mode: 'new' for new connections, 'edit' for existing ones */
  mode?: 'new' | 'edit';
  /** Initial values for edit mode */
  initialValues?: Partial<ConnectionSettings>;
}

const MAX_DISPLAY_NAME_LENGTH = 100;

interface DialogFormContentProps {
  onOpenChange: (open: boolean) => void;
  onSubmit: (settings: ConnectionSettings) => void;
  filename: string;
  dbPath: string;
  isEncrypted: boolean;
  mode: 'new' | 'edit';
  initialValues?: Partial<ConnectionSettings>;
}

/** Internal form component - mounts fresh each time dialog opens */
function DialogFormContent({
  onOpenChange,
  onSubmit,
  filename,
  dbPath,
  isEncrypted,
  mode,
  initialValues,
}: DialogFormContentProps) {
  // State initializes from props - no useEffect needed
  const [displayName, setDisplayName] = useState(
    initialValues?.displayName ?? filename
  );
  const [readOnly, setReadOnly] = useState(initialValues?.readOnly ?? false);
  const [rememberPassword, setRememberPassword] = useState(
    initialValues?.rememberPassword ?? false
  );
  const [isStorageAvailable, setIsStorageAvailable] = useState(false);
  const [hasSavedPassword, setHasSavedPassword] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Password edit state (for edit mode)
  const [showPasswordEdit, setShowPasswordEdit] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [showRemovePasswordConfirm, setShowRemovePasswordConfirm] =
    useState(false);

  const { t } = useTranslation('dialog');

  // Check if password storage is available and if there's a saved password
  useEffect(() => {
    if (isEncrypted && dbPath) {
      Promise.all([
        sqlPro.password.isAvailable(),
        sqlPro.password.has({ dbPath }),
      ]).then(([availableResult, hasResult]) => {
        setIsStorageAvailable(availableResult.available);
        setHasSavedPassword(hasResult.hasPassword);
        // Default to remember if storage is available and this is a new connection
        if (
          mode === 'new' &&
          availableResult.available &&
          !initialValues?.rememberPassword
        ) {
          setRememberPassword(true);
        }
      });
    }
  }, [isEncrypted, dbPath, mode, initialValues?.rememberPassword]);

  const validateDisplayName = (value: string): string | null => {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      return t('connectionSettings.validation.empty');
    }
    if (trimmed.length > MAX_DISPLAY_NAME_LENGTH) {
      return t('connectionSettings.validation.tooLong', {
        max: MAX_DISPLAY_NAME_LENGTH,
      });
    }
    return null;
  };

  const handleDisplayNameChange = (value: string) => {
    setDisplayName(value);
    setValidationError(validateDisplayName(value));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const error = validateDisplayName(displayName);
    if (error) {
      setValidationError(error);
      return;
    }

    onSubmit({
      displayName: displayName.trim(),
      readOnly,
      rememberPassword: isEncrypted && rememberPassword && isStorageAvailable,
    });
  };

  // Password management handlers
  const handleSavePassword = async () => {
    if (newPassword !== confirmPassword) {
      setPasswordError(t('connectionSettings.passwordsDoNotMatch'));
      return;
    }
    if (!newPassword.trim()) {
      setPasswordError(t('connectionSettings.passwordCannotBeEmpty'));
      return;
    }

    setIsPasswordLoading(true);
    setPasswordError(null);

    try {
      const result = await sqlPro.password.save({
        dbPath,
        password: newPassword,
      });

      if (result.success) {
        setHasSavedPassword(true);
        setShowPasswordEdit(false);
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordError(
          result.error || t('connectionSettings.failedToSavePassword')
        );
      }
    } catch (err) {
      setPasswordError(
        err instanceof Error
          ? err.message
          : t('connectionSettings.unexpectedError')
      );
    } finally {
      setIsPasswordLoading(false);
    }
  };

  const handleRemovePassword = async () => {
    setShowRemovePasswordConfirm(true);
  };

  const confirmRemovePassword = async () => {
    setIsPasswordLoading(true);
    try {
      const result = await sqlPro.password.remove({ dbPath });
      if (result.success) {
        setHasSavedPassword(false);
        setShowPasswordEdit(false);
      } else {
        setPasswordError(
          result.error || t('connectionSettings.failedToRemovePassword')
        );
      }
    } catch (err) {
      setPasswordError(
        err instanceof Error
          ? err.message
          : t('connectionSettings.unexpectedError')
      );
    } finally {
      setIsPasswordLoading(false);
    }
  };

  const passwordsMatch = newPassword === confirmPassword;

  const isValid = !validateDisplayName(displayName);
  const dialogTitle =
    mode === 'new'
      ? t('connectionSettings.title')
      : t('connectionSettings.editTitle');
  const submitLabel =
    mode === 'new'
      ? t('connectionSettings.saveConnect')
      : t('connectionSettings.saveChanges');

  return (
    <>
      <div className="flex flex-col items-center text-center">
        <div className="bg-primary/10 mb-4 flex h-12 w-12 items-center justify-center rounded-full">
          <Settings className="text-primary h-6 w-6" />
        </div>
        <Dialog.Title className="text-lg font-semibold">
          {dialogTitle}
        </Dialog.Title>
        <Dialog.Description className="text-muted-foreground mt-2 text-sm">
          {t('connectionSettings.description', { filename })}
        </Dialog.Description>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {/* Display Name */}
        <div className="space-y-2">
          <label htmlFor="displayName" className="text-sm font-medium">
            {t('connectionSettings.displayName')}
          </label>
          <input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => handleDisplayNameChange(e.target.value)}
            placeholder={t('connectionSettings.displayNamePlaceholder')}
            autoFocus
            className={cn(
              'bg-background w-full rounded-md border px-3 py-2 text-sm',
              'placeholder:text-muted-foreground',
              'focus:ring-ring focus:ring-2 focus:ring-offset-2 focus:outline-none',
              validationError ? 'border-destructive' : 'border-input'
            )}
          />
          {validationError && (
            <p className="text-destructive text-xs">{validationError}</p>
          )}
          <p className="text-muted-foreground text-xs">
            {t('connectionSettings.charCount', {
              current: displayName.trim().length,
              max: MAX_DISPLAY_NAME_LENGTH,
            })}
          </p>
        </div>

        {/* Read-Only Checkbox */}
        <label className="border-input hover:bg-accent/50 flex cursor-pointer items-center gap-3 rounded-md border p-3">
          <input
            type="checkbox"
            checked={readOnly}
            onChange={(e) => setReadOnly(e.target.checked)}
            className="border-input h-4 w-4 rounded-md"
          />
          <div className="flex-1">
            <span className="text-sm font-medium">
              {t('connectionSettings.readOnly')}
            </span>
            <p className="text-muted-foreground text-xs">
              {t('connectionSettings.readOnlyDesc')}
            </p>
          </div>
        </label>

        {/* Remember Password Checkbox - Only for encrypted databases in new mode */}
        {isEncrypted && mode === 'new' && (
          <label
            className={cn(
              'border-input flex items-center gap-3 rounded-md border p-3',
              isStorageAvailable
                ? 'hover:bg-accent/50 cursor-pointer'
                : 'cursor-not-allowed opacity-50'
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
                <span className="text-sm font-medium">
                  {t('connectionSettings.rememberPassword')}
                </span>
                {!isStorageAvailable && (
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="text-muted-foreground h-3.5 w-3.5" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t('connectionSettings.storageUnavailable')}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
              <p className="text-muted-foreground text-xs">
                {t('connectionSettings.rememberPasswordDesc')}
              </p>
            </div>
          </label>
        )}

        {/* Password Management - Only for encrypted databases in edit mode */}
        {isEncrypted && mode === 'edit' && isStorageAvailable && (
          <>
            <Separator className="my-4" />
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <KeyRound className="text-muted-foreground h-4 w-4" />
                  <span className="text-sm font-medium">
                    {t('savedPassword')}
                  </span>
                </div>
                {hasSavedPassword && (
                  <span className="text-xs text-green-600 dark:text-green-400">
                    {t('passwordSaved')}
                  </span>
                )}
              </div>

              {!showPasswordEdit ? (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setShowPasswordEdit(true)}
                  >
                    {hasSavedPassword ? t('changePassword') : t('savePassword')}
                  </Button>
                  {hasSavedPassword && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={handleRemovePassword}
                      disabled={isPasswordLoading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-3 rounded-md border p-3">
                  {passwordError && (
                    <Alert variant="destructive" className="py-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        {passwordError}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <label
                      htmlFor="newPassword"
                      className="text-xs font-medium"
                    >
                      {hasSavedPassword ? t('newPassword') : t('password')}
                    </label>
                    <input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder={t('enterPassword')}
                      className={cn(
                        'border-input bg-background w-full rounded-md border px-3 py-1.5 text-sm',
                        'placeholder:text-muted-foreground',
                        'focus:ring-ring focus:ring-2 focus:ring-offset-2 focus:outline-none'
                      )}
                    />
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="confirmPassword"
                      className="text-xs font-medium"
                    >
                      {t('confirmPassword')}
                    </label>
                    <input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder={t('confirmPasswordPlaceholder')}
                      className={cn(
                        'border-input bg-background w-full rounded-md border px-3 py-1.5 text-sm',
                        'placeholder:text-muted-foreground',
                        'focus:ring-ring focus:ring-2 focus:ring-offset-2 focus:outline-none',
                        confirmPassword &&
                          !passwordsMatch &&
                          'border-destructive'
                      )}
                    />
                    {confirmPassword && !passwordsMatch && (
                      <p className="text-destructive text-xs">
                        {t('connectionSettings.passwordsDoNotMatch')}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setShowPasswordEdit(false);
                        setNewPassword('');
                        setConfirmPassword('');
                        setPasswordError(null);
                      }}
                      disabled={isPasswordLoading}
                    >
                      {t('actions.cancel', { ns: 'common' })}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      className="flex-1"
                      onClick={handleSavePassword}
                      disabled={
                        isPasswordLoading ||
                        !newPassword.trim() ||
                        !passwordsMatch
                      }
                    >
                      {isPasswordLoading
                        ? t('connectionSettings.saving')
                        : t('connectionSettings.save')}
                    </Button>
                  </div>
                </div>
              )}

              <p className="text-muted-foreground text-xs">
                {t('connectionSettings.keychainNote')}
              </p>
            </div>
          </>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
          >
            {t('actions.cancel', { ns: 'common' })}
          </Button>
          <Button type="submit" className="flex-1" disabled={!isValid}>
            {submitLabel}
          </Button>
        </div>
      </form>

      {/* Remove Password Confirmation Dialog */}
      <ConfirmDialog
        open={showRemovePasswordConfirm}
        onOpenChange={setShowRemovePasswordConfirm}
        title={t('connectionSettings.removePasswordTitle')}
        description={t('connectionSettings.removePasswordDesc')}
        confirmLabel={t('connectionSettings.removePasswordConfirm')}
        variant="destructive"
        onConfirm={confirmRemovePassword}
      />
    </>
  );
}

export function ConnectionSettingsDialog({
  open,
  onOpenChange,
  onSubmit,
  filename,
  dbPath,
  isEncrypted,
  mode = 'new',
  initialValues,
}: ConnectionSettingsDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content className="bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-1/2 left-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border p-6 shadow-lg">
          {open && (
            <DialogFormContent
              onOpenChange={onOpenChange}
              onSubmit={onSubmit}
              filename={filename}
              dbPath={dbPath}
              isEncrypted={isEncrypted}
              mode={mode}
              initialValues={initialValues}
            />
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
