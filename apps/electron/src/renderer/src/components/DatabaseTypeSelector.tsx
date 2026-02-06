/**
 * Database Type Selector
 * Allows users to select which type of database to connect to
 */

import type { DatabaseType } from '@shared/types';
import { Button } from '@sqlpro/ui/button';
import { Box, Cloud, Database, Server } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface DatabaseTypeOption {
  type: DatabaseType;
  icon: typeof Database;
  color: string;
}

const DATABASE_TYPES: DatabaseTypeOption[] = [
  {
    type: 'sqlite',
    icon: Database,
    color: 'text-blue-500',
  },
  {
    type: 'mysql',
    icon: Server,
    color: 'text-orange-500',
  },
  {
    type: 'postgresql',
    icon: Server,
    color: 'text-indigo-500',
  },
  {
    type: 'supabase',
    icon: Cloud,
    color: 'text-green-500',
  },
  {
    type: 'turso',
    icon: Cloud,
    color: 'text-cyan-500',
  },
  {
    type: 'qdrant',
    icon: Box,
    color: 'text-purple-500',
  },
];

interface DatabaseTypeSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (type: DatabaseType) => void;
}

export function DatabaseTypeSelector({
  open,
  onOpenChange,
  onSelect,
}: DatabaseTypeSelectorProps) {
  const { t } = useTranslation('dialog');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('databaseType.title')}</DialogTitle>
          <DialogDescription>{t('databaseType.description')}</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 pt-4">
          {DATABASE_TYPES.map((option) => {
            const Icon = option.icon;
            return (
              <Button
                key={option.type}
                variant="outline"
                className="flex h-auto flex-col items-center gap-2 p-4"
                onClick={() => {
                  onSelect(option.type);
                  onOpenChange(false);
                }}
              >
                <Icon className={cn('h-8 w-8', option.color)} />
                <div className="text-center">
                  <div className="font-medium">
                    {t(`databaseType.${option.type}.name`)}
                  </div>
                  <div
                    className="text-muted-foreground"
                    style={{
                      fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)',
                    }}
                  >
                    {t(`databaseType.${option.type}.description`)}
                  </div>
                </div>
              </Button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
