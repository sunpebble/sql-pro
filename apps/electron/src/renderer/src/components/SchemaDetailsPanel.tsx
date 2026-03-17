import type {
  ColumnSchema,
  ForeignKeySchema,
  IndexSchema,
  TableSchema,
  TriggerSchema,
} from '@/types/database';
import { Button } from '@sqlpro/ui/button';
import { ScrollArea } from '@sqlpro/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@sqlpro/ui/tooltip';
import {
  ChevronDown,
  ChevronRight,
  Code,
  Columns3,
  Eye,
  Key,
  Link2,
  Table,
  X,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SqlHighlight } from '@/components/ui/sql-highlight';
import { cn, TOOLTIP_CONTENT_STYLE } from '@/lib/utils';

interface SchemaDetailsPanelProps {
  table: TableSchema | null;
  onClose: () => void;
}

type SectionKey = 'columns' | 'indexes' | 'foreignKeys' | 'triggers' | 'sql';

export function SchemaDetailsPanel({
  table,
  onClose,
}: SchemaDetailsPanelProps) {
  const { t } = useTranslation('common');
  const [expandedSections, setExpandedSections] = useState<
    Record<SectionKey, boolean>
  >({
    columns: true,
    indexes: true,
    foreignKeys: true,
    triggers: true,
    sql: true,
  });

  const toggleSection = (key: SectionKey) => {
    setExpandedSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  if (!table) {
    return (
      <div className="bg-background flex h-full w-full flex-col overflow-hidden border-l">
        <div className="panel-header">
          <h2 className="font-semibold">
            {t('schema.title', { defaultValue: 'Schema Details' })}
          </h2>
          <Tooltip>
            <TooltipTrigger>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                aria-label={t('common.close', { defaultValue: 'Close' })}
              >
                <X className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className={TOOLTIP_CONTENT_STYLE}>
              {t('common.close', { defaultValue: 'Close' })}
            </TooltipContent>
          </Tooltip>
        </div>
        <div
          className="text-muted-foreground flex flex-1 items-center justify-center"
          style={{ fontSize: 'var(--font-ui-size, 13px)' }}
        >
          {t('schema.selectTable', {
            defaultValue: 'Select a table or view to see details',
          })}
        </div>
      </div>
    );
  }

  const isView = table.type === 'view';

  return (
    <div className="bg-background flex h-full w-full flex-col overflow-hidden border-l">
      {/* Header */}
      <div className="panel-header">
        <div className="panel-header-title">
          {isView ? (
            <Eye className="text-muted-foreground h-4 w-4" />
          ) : (
            <Table className="text-muted-foreground h-4 w-4" />
          )}
          <div>
            <h2 className="font-semibold">{table.name}</h2>
            <p
              className="text-muted-foreground"
              style={{ fontSize: 'var(--font-ui-size, 13px)' }}
            >
              {isView
                ? t('schema.viewIn', {
                    defaultValue: 'View in {{schema}}',
                    schema: table.schema,
                  })
                : t('schema.tableIn', {
                    defaultValue: 'Table in {{schema}}',
                    schema: table.schema,
                  })}
            </p>
          </div>
        </div>
        <Tooltip>
          <TooltipTrigger>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              aria-label={t('common.close', { defaultValue: 'Close' })}
            >
              <X className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent className={TOOLTIP_CONTENT_STYLE}>
            {t('common.close', { defaultValue: 'Close' })}
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="space-y-4 p-4">
          {/* Columns Section */}
          <Section
            id="section-columns"
            title={t('schema.columns', { defaultValue: 'Columns' })}
            icon={<Columns3 className="h-4 w-4" />}
            count={table.columns.length}
            isExpanded={expandedSections.columns}
            onToggle={() => toggleSection('columns')}
          >
            <ColumnsTable
              columns={table.columns}
              primaryKey={table.primaryKey}
              t={t}
            />
          </Section>

          {/* Indexes Section */}
          {table.indexes.length > 0 && (
            <Section
              id="section-indexes"
              title={t('schema.indexes', { defaultValue: 'Indexes' })}
              icon={<Key className="h-4 w-4" />}
              count={table.indexes.length}
              isExpanded={expandedSections.indexes}
              onToggle={() => toggleSection('indexes')}
            >
              <IndexesList indexes={table.indexes} t={t} />
            </Section>
          )}

          {/* Foreign Keys Section */}
          {table.foreignKeys.length > 0 && (
            <Section
              id="section-foreign-keys"
              title={t('schema.foreignKeys', { defaultValue: 'Foreign Keys' })}
              icon={<Link2 className="h-4 w-4" />}
              count={table.foreignKeys.length}
              isExpanded={expandedSections.foreignKeys}
              onToggle={() => toggleSection('foreignKeys')}
            >
              <ForeignKeysList foreignKeys={table.foreignKeys} />
            </Section>
          )}

          {/* Triggers Section (only for tables, not views) */}
          {!isView && table.triggers.length > 0 && (
            <Section
              id="section-triggers"
              title={t('schema.triggers', { defaultValue: 'Triggers' })}
              icon={<Zap className="h-4 w-4" />}
              count={table.triggers.length}
              isExpanded={expandedSections.triggers}
              onToggle={() => toggleSection('triggers')}
            >
              <TriggersList triggers={table.triggers} />
            </Section>
          )}

          {/* CREATE Statement Section */}
          {table.sql && (
            <Section
              id="section-sql"
              title={t('schema.createStatement', {
                defaultValue: 'CREATE Statement',
              })}
              icon={<Code className="h-4 w-4" />}
              isExpanded={expandedSections.sql}
              onToggle={() => toggleSection('sql')}
            >
              <SqlBlock sql={table.sql} />
            </Section>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

interface SectionProps {
  id: string;
  title: string;
  icon: React.ReactNode;
  count?: number;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function Section({
  id,
  title,
  icon,
  count,
  isExpanded,
  onToggle,
  children,
}: SectionProps) {
  const contentId = `${id}-content`;

  return (
    <div className="bg-muted/30 rounded-base border-border border">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isExpanded}
        aria-controls={contentId}
        className="hover:bg-accent/50 rounded-t-base flex w-full items-center gap-2 px-3 py-2 font-medium transition-colors"
        style={{ fontSize: 'var(--font-ui-size, 13px)' }}
      >
        {isExpanded ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
        {icon}
        <span>{title}</span>
        {count !== undefined && (
          <span
            className="text-muted-foreground ml-auto"
            style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
          >
            ({count})
          </span>
        )}
      </button>
      {isExpanded && (
        <div id={contentId} className="border-t px-3 py-2">
          {children}
        </div>
      )}
    </div>
  );
}

interface ColumnsTableProps {
  columns: ColumnSchema[];
  primaryKey: string[];
  t: (key: string, options?: Record<string, unknown>) => string;
}

function ColumnsTable({ columns, primaryKey, t }: ColumnsTableProps) {
  if (columns.length === 0) {
    return (
      <div
        className="text-muted-foreground py-2"
        style={{ fontSize: 'var(--font-ui-size, 13px)' }}
      >
        {t('schema.noColumns', { defaultValue: 'No columns defined' })}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table
        className="w-full"
        style={{ tableLayout: 'fixed', fontSize: 'var(--font-ui-size, 13px)' }}
      >
        <colgroup>
          <col style={{ width: '30%' }} />
          <col style={{ width: '35%' }} />
          <col style={{ width: '15%' }} />
          <col style={{ width: '20%' }} />
        </colgroup>
        <thead>
          <tr className="text-muted-foreground border-b text-left">
            <th className="pr-3 pb-2 font-medium whitespace-nowrap">
              {t('schema.columnName', { defaultValue: 'Name' })}
            </th>
            <th className="pr-3 pb-2 font-medium whitespace-nowrap">
              {t('schema.columnType', { defaultValue: 'Type' })}
            </th>
            <th className="pr-3 pb-2 font-medium whitespace-nowrap">
              {t('schema.columnNull', { defaultValue: 'Null' })}
            </th>
            <th className="pb-2 font-medium whitespace-nowrap">
              {t('schema.columnKey', { defaultValue: 'Key' })}
            </th>
          </tr>
        </thead>
        <tbody>
          {columns.map((column) => {
            const isPK =
              primaryKey.includes(column.name) || column.isPrimaryKey;
            return (
              <tr key={column.name} className="border-b last:border-0">
                <td
                  className="truncate py-1.5 pr-3 font-mono"
                  style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
                  title={column.name}
                >
                  {column.name}
                </td>
                <td className="py-1.5 pr-3">
                  <span
                    className="bg-muted inline-block max-w-full truncate rounded px-1.5 py-0.5 font-mono"
                    style={{
                      fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)',
                    }}
                    title={column.type}
                  >
                    {column.type}
                  </span>
                </td>
                <td className="py-1.5 pr-3 whitespace-nowrap">
                  <span
                    className={cn(
                      column.nullable
                        ? 'text-muted-foreground'
                        : 'text-amber-600'
                    )}
                    style={{
                      fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)',
                    }}
                  >
                    {column.nullable
                      ? t('schema.yes', { defaultValue: 'Yes' })
                      : t('schema.no', { defaultValue: 'No' })}
                  </span>
                </td>
                <td className="py-1.5 whitespace-nowrap">
                  {isPK && (
                    <span
                      className="bg-primary/10 text-primary rounded px-1.5 py-0.5 font-medium"
                      style={{
                        fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)',
                      }}
                    >
                      PK
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

interface IndexesListProps {
  indexes: IndexSchema[];
  t: (key: string, options?: Record<string, unknown>) => string;
}

function IndexesList({ indexes, t }: IndexesListProps) {
  return (
    <div className="space-y-2">
      {indexes.map((index) => (
        <div key={index.name} className="bg-background rounded border p-2">
          <div className="flex items-center gap-2">
            <span
              className="font-mono font-medium"
              style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
            >
              {index.name}
            </span>
            {index.isUnique && (
              <span
                className="rounded-md bg-blue-100 px-1.5 py-0.5 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
              >
                UNIQUE
              </span>
            )}
          </div>
          <div
            className="text-muted-foreground mt-1"
            style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
          >
            {t('schema.columnsLabel', { defaultValue: 'Columns:' })}{' '}
            {index.columns.join(', ')}
          </div>
          {index.sql && (
            <div className="mt-2">
              <SqlHighlight code={index.sql} className="bg-muted rounded p-2" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

interface ForeignKeysListProps {
  foreignKeys: ForeignKeySchema[];
}

function ForeignKeysList({ foreignKeys }: ForeignKeysListProps) {
  return (
    <div className="space-y-2">
      {foreignKeys.map((fk) => (
        <div
          key={`${fk.column}-${fk.referencedTable}-${fk.referencedColumn}`}
          className="bg-background rounded border p-2"
        >
          <div
            className="flex items-center gap-2"
            style={{ fontSize: 'var(--font-ui-size, 13px)' }}
          >
            <span
              className="font-mono"
              style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
            >
              {fk.column}
            </span>
            <span className="text-muted-foreground">&rarr;</span>
            <span
              className="font-mono"
              style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
            >
              {fk.referencedTable}.{fk.referencedColumn}
            </span>
          </div>
          <div
            className="text-muted-foreground mt-1 flex gap-3"
            style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
          >
            {fk.onDelete && (
              <span>
                ON DELETE: <span className="font-medium">{fk.onDelete}</span>
              </span>
            )}
            {fk.onUpdate && (
              <span>
                ON UPDATE: <span className="font-medium">{fk.onUpdate}</span>
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

interface TriggersListProps {
  triggers: TriggerSchema[];
}

function TriggersList({ triggers }: TriggersListProps) {
  return (
    <div className="space-y-2">
      {triggers.map((trigger) => (
        <div key={trigger.name} className="bg-background rounded border p-2">
          <div className="flex items-center gap-2">
            <span
              className="font-mono font-medium"
              style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
            >
              {trigger.name}
            </span>
            <span
              className="rounded-md bg-purple-100 px-1.5 py-0.5 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
              style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
            >
              {trigger.timing}
            </span>
            <span
              className="rounded-md bg-green-100 px-1.5 py-0.5 text-green-700 dark:bg-green-950 dark:text-green-300"
              style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
            >
              {trigger.event}
            </span>
          </div>
          {trigger.sql && (
            <div className="mt-2">
              <SqlHighlight
                code={trigger.sql}
                className="bg-muted rounded p-2"
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

interface SqlBlockProps {
  sql: string;
}

function SqlBlock({ sql }: SqlBlockProps) {
  return <SqlHighlight code={sql} className="bg-muted rounded p-3" />;
}
