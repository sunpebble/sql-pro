import type { ComponentProps } from 'react';

import { Input } from '@sqlpro/ui/input';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

import { cn } from '@/lib/utils';

interface PasswordInputProps extends ComponentProps<'input'> {
  showPasswordLabel?: string;
  hidePasswordLabel?: string;
}

export function PasswordInput({
  className,
  showPasswordLabel = 'Show password',
  hidePasswordLabel = 'Hide password',
  type, // intercept type to prevent it from overriding our logic
  ref,
  ...props
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

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
        onClick={() => setShowPassword((prev) => !prev)}
        className={cn(
          'absolute right-0 top-0 h-full px-3 py-2',
          'text-muted-foreground hover:text-foreground transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
        )}
        aria-label={showPassword ? hidePasswordLabel : showPasswordLabel}
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
