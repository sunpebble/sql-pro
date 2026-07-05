import { Label } from '@quarry/ui/label';

interface SettingGroupProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function SettingGroup({
  title,
  description,
  children,
}: SettingGroupProps) {
  return (
    <div className="space-y-3">
      <div>
        <Label
          className="font-medium"
          style={{ fontSize: 'var(--font-ui-size)' }}
        >
          {title}
        </Label>
        {description && (
          <p
            className="text-muted-foreground mt-0.5"
            style={{ fontSize: 'calc(var(--font-ui-size) * 0.85)' }}
          >
            {description}
          </p>
        )}
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
