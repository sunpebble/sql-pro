import { Input } from '@sqlpro/ui/input';
import { Eye, EyeOff } from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

export interface PasswordInputProps
  extends React.ComponentProps<typeof Input> {
  ref?: React.Ref<HTMLInputElement>;
}

export function PasswordInput({ className, ref, ...props }: PasswordInputProps) {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = React.useState(false);

  return (
    <div className="relative">
      <Input
        type={showPassword ? 'text' : 'password'}
        className={cn('pr-10', className)}
        ref={ref}
        {...props}
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="absolute right-0 top-0 h-full px-3 py-2 text-muted-foreground hover:bg-transparent hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-main focus-visible:ring-offset-2 rounded-r-[5px]"
        aria-label={
          showPassword
            ? t('common.hidePassword', { defaultValue: 'Hide password' })
            : t('common.showPassword', { defaultValue: 'Show password' })
        }
      >
        {showPassword ? (
          <EyeOff className="h-4 w-4" aria-hidden="true" />
        ) : (
          <Eye className="h-4 w-4" aria-hidden="true" />
        )}
      </button>
    </div>
  );
}
PasswordInput.displayName = 'PasswordInput';
