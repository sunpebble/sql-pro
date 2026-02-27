/**
 * SSH Tunnel Configuration Component
 * Collapsible section for SSH tunnel settings in connection dialogs
 */

import { Button } from '@sqlpro/ui/button';
import { Checkbox } from '@sqlpro/ui/checkbox';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@sqlpro/ui/collapsible';
import { Input } from '@sqlpro/ui/input';
import { Label } from '@sqlpro/ui/label';
import { RadioGroup, RadioGroupItem } from '@sqlpro/ui/radio-group';
import { ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface SSHTunnelConfigProps {
  // SSH tunnel enabled state
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;

  // SSH connection fields
  sshHost: string;
  onSshHostChange: (host: string) => void;
  sshPort: string;
  onSshPortChange: (port: string) => void;
  sshUsername: string;
  onSshUsernameChange: (username: string) => void;

  // Authentication method
  sshAuthMethod: 'password' | 'privateKey';
  onSshAuthMethodChange: (method: 'password' | 'privateKey') => void;

  // Password auth
  sshPassword: string;
  onSshPasswordChange: (password: string) => void;

  // Private key auth
  sshPrivateKeyPath: string;
  onSshPrivateKeyPathChange: (path: string) => void;
  sshPassphrase: string;
  onSshPassphraseChange: (passphrase: string) => void;

  // Jump host toggle
  showJumpHost: boolean;
  onShowJumpHostChange: (show: boolean) => void;

  // Jump host fields
  jumpHost: string;
  onJumpHostChange: (host: string) => void;
  jumpPort: string;
  onJumpPortChange: (port: string) => void;
  jumpUsername: string;
  onJumpUsernameChange: (username: string) => void;
  jumpAuthMethod: 'password' | 'privateKey';
  onJumpAuthMethodChange: (method: 'password' | 'privateKey') => void;
  jumpPassword: string;
  onJumpPasswordChange: (password: string) => void;
  jumpPrivateKeyPath: string;
  onJumpPrivateKeyPathChange: (path: string) => void;
  jumpPassphrase: string;
  onJumpPassphraseChange: (passphrase: string) => void;

  // Disabled state (when connecting)
  disabled?: boolean;
}

export function SSHTunnelConfig({
  enabled,
  onEnabledChange,
  sshHost,
  onSshHostChange,
  sshPort,
  onSshPortChange,
  sshUsername,
  onSshUsernameChange,
  sshAuthMethod,
  onSshAuthMethodChange,
  sshPassword,
  onSshPasswordChange,
  sshPrivateKeyPath,
  onSshPrivateKeyPathChange,
  sshPassphrase,
  onSshPassphraseChange,
  showJumpHost,
  onShowJumpHostChange,
  jumpHost,
  onJumpHostChange,
  jumpPort,
  onJumpPortChange,
  jumpUsername,
  onJumpUsernameChange,
  jumpAuthMethod,
  onJumpAuthMethodChange,
  jumpPassword,
  onJumpPasswordChange,
  jumpPrivateKeyPath,
  onJumpPrivateKeyPathChange,
  jumpPassphrase,
  onJumpPassphraseChange,
  disabled = false,
}: SSHTunnelConfigProps) {
  const { t } = useTranslation('dialog');

  const handleBrowsePrivateKey = async (
    onPathChange: (path: string) => void
  ) => {
    try {
      const result = await window.sqlPro.dialog.openFile({
        title: t('connection.ssh.privateKeyPath'),
      });
      if (result && result.success && result.filePath) {
        onPathChange(result.filePath);
      }
    } catch {
      // User cancelled or error
    }
  };

  const renderAuthFields = (
    prefix: 'ssh' | 'jump',
    authMethod: 'password' | 'privateKey',
    onAuthMethodChange: (method: 'password' | 'privateKey') => void,
    password: string,
    onPasswordChange: (password: string) => void,
    privateKeyPath: string,
    onPrivateKeyPathChange: (path: string) => void,
    passphrase: string,
    onPassphraseChange: (passphrase: string) => void
  ) => (
    <>
      {/* Auth Method */}
      <div className="space-y-2">
        <Label>{t('connection.ssh.authMethod')}</Label>
        <RadioGroup
          value={authMethod}
          onValueChange={(value) =>
            onAuthMethodChange(value as 'password' | 'privateKey')
          }
          disabled={disabled}
          className="flex gap-4"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem
              value="password"
              id={`${prefix}-auth-password`}
              disabled={disabled}
            />
            <Label htmlFor={`${prefix}-auth-password`} className="font-normal">
              {t('connection.ssh.password')}
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem
              value="privateKey"
              id={`${prefix}-auth-privateKey`}
              disabled={disabled}
            />
            <Label
              htmlFor={`${prefix}-auth-privateKey`}
              className="font-normal"
            >
              {t('connection.ssh.privateKey')}
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Password field */}
      {authMethod === 'password' && (
        <div className="space-y-2">
          <Label htmlFor={`${prefix}-password`}>
            {t('connection.ssh.password')}
          </Label>
          <Input
            id={`${prefix}-password`}
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            disabled={disabled}
          />
        </div>
      )}

      {/* Private key fields */}
      {authMethod === 'privateKey' && (
        <>
          <div className="space-y-2">
            <Label htmlFor={`${prefix}-privateKeyPath`}>
              {t('connection.ssh.privateKeyPath')}
            </Label>
            <div className="flex gap-2">
              <Input
                id={`${prefix}-privateKeyPath`}
                placeholder={t('connection.ssh.privateKeyPlaceholder')}
                value={privateKeyPath}
                onChange={(e) => onPrivateKeyPathChange(e.target.value)}
                disabled={disabled}
                className="flex-1 font-mono"
                style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleBrowsePrivateKey(onPrivateKeyPathChange)}
                disabled={disabled}
              >
                {t('connection.ssh.browse')}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${prefix}-passphrase`}>
              {t('connection.ssh.passphrase')}{' '}
              <span
                className="text-muted-foreground"
                style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
              >
                ({t('connection.optional')})
              </span>
            </Label>
            <Input
              id={`${prefix}-passphrase`}
              type="password"
              placeholder={t('connection.ssh.passphrasePlaceholder')}
              value={passphrase}
              onChange={(e) => onPassphraseChange(e.target.value)}
              disabled={disabled}
            />
          </div>
        </>
      )}
    </>
  );

  return (
    <Collapsible open={enabled} onOpenChange={onEnabledChange}>
      <div className="space-y-3">
        {/* Toggle header */}
        <div className="flex cursor-pointer items-center gap-2">
          <Checkbox
            id="ssh-enabled"
            checked={enabled}
            onCheckedChange={(checked) => onEnabledChange(checked === true)}
            disabled={disabled}
          />
          <CollapsibleTrigger disabled={disabled}>
            <Label
              htmlFor="ssh-enabled"
              className="flex cursor-pointer items-center gap-1 font-normal"
            >
              {t('connection.ssh.enable')}
              <ChevronDown
                className={`text-muted-foreground h-4 w-4 transition-transform ${enabled ? 'rotate-180' : ''}`}
              />
            </Label>
          </CollapsibleTrigger>
        </div>

        {/* SSH configuration fields */}
        <CollapsibleContent>
          <div className="border-primary/20 space-y-4 border-l pt-2 pl-4">
            {/* SSH Host */}
            <div className="space-y-2">
              <Label htmlFor="ssh-host">
                {t('connection.ssh.host')}{' '}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="ssh-host"
                placeholder={t('connection.ssh.hostPlaceholder')}
                value={sshHost}
                onChange={(e) => onSshHostChange(e.target.value)}
                disabled={disabled}
                required={enabled}
              />
            </div>

            {/* SSH Port */}
            <div className="space-y-2">
              <Label htmlFor="ssh-port">{t('connection.ssh.port')}</Label>
              <Input
                id="ssh-port"
                type="number"
                placeholder="22"
                value={sshPort}
                onChange={(e) => onSshPortChange(e.target.value)}
                disabled={disabled}
              />
            </div>

            {/* SSH Username */}
            <div className="space-y-2">
              <Label htmlFor="ssh-username">
                {t('connection.ssh.username')}{' '}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="ssh-username"
                placeholder={t('connection.ssh.usernamePlaceholder')}
                value={sshUsername}
                onChange={(e) => onSshUsernameChange(e.target.value)}
                disabled={disabled}
                required={enabled}
              />
            </div>

            {/* SSH Auth fields */}
            {renderAuthFields(
              'ssh',
              sshAuthMethod,
              onSshAuthMethodChange,
              sshPassword,
              onSshPasswordChange,
              sshPrivateKeyPath,
              onSshPrivateKeyPathChange,
              sshPassphrase,
              onSshPassphraseChange
            )}

            {/* Jump Host Toggle */}
            <div className="flex items-center gap-2 pt-2">
              <Checkbox
                id="show-jump-host"
                checked={showJumpHost}
                onCheckedChange={(checked) =>
                  onShowJumpHostChange(checked === true)
                }
                disabled={disabled}
              />
              <Label htmlFor="show-jump-host" className="font-normal">
                {t('connection.ssh.jumpHost.enable')}
              </Label>
            </div>

            {/* Jump Host Configuration */}
            {showJumpHost && (
              <div className="border-primary/10 space-y-4 border-l pt-2 pl-4">
                <Label
                  className="text-muted-foreground font-medium"
                  style={{ fontSize: 'var(--font-ui-size, 13px)' }}
                >
                  {t('connection.ssh.jumpHost.title')}
                </Label>

                {/* Jump Host */}
                <div className="space-y-2">
                  <Label htmlFor="jump-host">
                    {t('connection.ssh.jumpHost.host')}{' '}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="jump-host"
                    placeholder={t('connection.ssh.jumpHost.hostPlaceholder')}
                    value={jumpHost}
                    onChange={(e) => onJumpHostChange(e.target.value)}
                    disabled={disabled}
                    required={enabled && showJumpHost}
                  />
                </div>

                {/* Jump Port */}
                <div className="space-y-2">
                  <Label htmlFor="jump-port">{t('connection.ssh.port')}</Label>
                  <Input
                    id="jump-port"
                    type="number"
                    placeholder="22"
                    value={jumpPort}
                    onChange={(e) => onJumpPortChange(e.target.value)}
                    disabled={disabled}
                  />
                </div>

                {/* Jump Username */}
                <div className="space-y-2">
                  <Label htmlFor="jump-username">
                    {t('connection.ssh.username')}{' '}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="jump-username"
                    placeholder={t('connection.ssh.usernamePlaceholder')}
                    value={jumpUsername}
                    onChange={(e) => onJumpUsernameChange(e.target.value)}
                    disabled={disabled}
                    required={enabled && showJumpHost}
                  />
                </div>

                {/* Jump Auth fields */}
                {renderAuthFields(
                  'jump',
                  jumpAuthMethod,
                  onJumpAuthMethodChange,
                  jumpPassword,
                  onJumpPasswordChange,
                  jumpPrivateKeyPath,
                  onJumpPrivateKeyPathChange,
                  jumpPassphrase,
                  onJumpPassphraseChange
                )}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
