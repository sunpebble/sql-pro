import type { QueryParameter } from '@shared/types/saved-query';

import { Button } from '@sqlpro/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@sqlpro/ui/dialog';
import { Input } from '@sqlpro/ui/input';
import { Label } from '@sqlpro/ui/label';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface ParameterInputDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parameters: QueryParameter[];
  queryName: string;
  onSubmit: (values: Record<string, string>) => void;
}

export function ParameterInputDialog({
  open,
  onOpenChange,
  parameters,
  queryName,
  onSubmit,
}: ParameterInputDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        {open && (
          <ParameterInputForm
            parameters={parameters}
            queryName={queryName}
            onSubmit={onSubmit}
            onOpenChange={onOpenChange}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ParameterInputForm({
  parameters,
  queryName,
  onSubmit,
  onOpenChange,
}: {
  parameters: QueryParameter[];
  queryName: string;
  onSubmit: (values: Record<string, string>) => void;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation('common');

  // Initialize values from parameter defaults
  const initialValues = useMemo(
    () =>
      Object.fromEntries(parameters.map((p) => [p.name, p.defaultValue || ''])),
    [parameters]
  );

  const [values, setValues] = useState<Record<string, string>>(initialValues);

  const handleSubmit = useCallback(() => {
    onSubmit(values);
    onOpenChange(false);
  }, [values, onSubmit, onOpenChange]);

  const handleValueChange = useCallback((name: string, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  // Check if all required values are filled
  const allFilled = parameters.every((p) => values[p.name]?.trim());

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {t('savedQueries.enterParameters', {
            defaultValue: 'Enter Parameters',
          })}
        </DialogTitle>
        <DialogDescription>
          {t('savedQueries.provideValuesFor', {
            defaultValue: 'Provide values for "{{queryName}}"',
            queryName,
          })}
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-2">
        {parameters.map((param) => (
          <div key={param.name} className="space-y-2">
            <Label htmlFor={`param-${param.name}`}>
              {param.name}
              {param.type && param.type !== 'string' && (
                <span className="text-muted-foreground ml-1 text-xs">
                  ({param.type})
                </span>
              )}
            </Label>
            <Input
              id={`param-${param.name}`}
              type={param.type === 'number' ? 'number' : 'text'}
              value={values[param.name] || ''}
              onChange={(e) => handleValueChange(param.name, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && allFilled) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder={
                param.defaultValue ||
                t('savedQueries.enterParam', {
                  defaultValue: 'Enter {{name}}',
                  name: param.name,
                })
              }
              autoFocus={parameters.indexOf(param) === 0}
            />
          </div>
        ))}
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          {t('common.cancel', { defaultValue: 'Cancel' })}
        </Button>
        <Button onClick={handleSubmit} disabled={!allFilled}>
          {t('savedQueries.runQuery', { defaultValue: 'Run Query' })}
        </Button>
      </DialogFooter>
    </>
  );
}
