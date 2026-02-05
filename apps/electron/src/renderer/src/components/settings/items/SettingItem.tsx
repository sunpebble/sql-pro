import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SettingItemProps {
  label: string;
  description?: string;
  children: React.ReactNode;
  icon?: LucideIcon;
  badge?: React.ReactNode;
  className?: string;
}

export function SettingItem({
  label,
  description,
  children,
  icon: Icon,
  badge,
  className,
}: SettingItemProps) {
  return (
    <div className={cn('setting-row', className)}>
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="bg-muted flex h-9 w-9 shrink-0 items-center justify-center rounded-md">
            <Icon className="text-muted-foreground h-4 w-4" />
          </div>
        )}
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span
              className="font-medium"
              style={{ fontSize: 'var(--font-ui-size)' }}
            >
              {label}
            </span>
            {badge}
          </div>
          {description && (
            <p
              className="text-muted-foreground"
              style={{ fontSize: 'calc(var(--font-ui-size) * 0.85)' }}
            >
              {description}
            </p>
          )}
        </div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}
