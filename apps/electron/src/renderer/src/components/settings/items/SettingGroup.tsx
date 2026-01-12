import { Label } from '@sqlpro/ui/label';

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
        <Label className="text-sm font-medium">{title}</Label>
        {description && (
          <p className="text-muted-foreground mt-0.5 text-xs">{description}</p>
        )}
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
