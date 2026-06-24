import type { QdrantFilterCondition, QdrantSearchFilter } from '@shared/types';
import { Button } from '@sqlpro/ui/button';
import { Input } from '@sqlpro/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@sqlpro/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@sqlpro/ui/select';
import { Filter, Plus, Trash2, X } from 'lucide-react';
import { memo, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

type OperatorType = 'match' | 'gt' | 'gte' | 'lt' | 'lte';

interface FilterConditionRow {
  id: string;
  key: string;
  operator: OperatorType;
  value: string;
}

interface VectorSearchFilterProps {
  onFilterChange: (filter: QdrantSearchFilter | undefined) => void;
  payloadFields?: string[];
  className?: string;
}

/**
 * VectorSearchFilter component for building Qdrant filter conditions.
 * Supports must/should/must_not filter groups with match and range operators.
 */
export const VectorSearchFilter = memo(
  ({
    onFilterChange,
    payloadFields = [],
    className,
  }: VectorSearchFilterProps) => {
    const { t } = useTranslation('common');
    const [isOpen, setIsOpen] = useState(false);
    const [conditions, setConditions] = useState<FilterConditionRow[]>([]);

    const operators: { value: OperatorType; label: string }[] = [
      { value: 'match', label: t('vectorSearch.filter.operators.equals', '=') },
      { value: 'gt', label: '>' },
      { value: 'gte', label: '>=' },
      { value: 'lt', label: '<' },
      { value: 'lte', label: '<=' },
    ];

    const generateId = () => crypto.randomUUID();

    const addCondition = useCallback(() => {
      setConditions((prev) => [
        ...prev,
        {
          id: generateId(),
          key: payloadFields[0] || '',
          operator: 'match',
          value: '',
        },
      ]);
    }, [payloadFields]);

    const removeCondition = useCallback((id: string) => {
      setConditions((prev) => prev.filter((c) => c.id !== id));
    }, []);

    const updateCondition = useCallback(
      (id: string, field: keyof FilterConditionRow, value: string) => {
        setConditions((prev) =>
          prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
        );
      },
      []
    );

    const parseValue = (value: string): string | number | boolean => {
      const num = Number(value);
      if (!Number.isNaN(num)) return num;
      if (value.toLowerCase() === 'true') return true;
      if (value.toLowerCase() === 'false') return false;
      return value;
    };

    const buildFilter = useCallback((): QdrantSearchFilter | undefined => {
      const validConditions = conditions.filter(
        (c) => c.key.trim() && c.value.trim()
      );

      if (validConditions.length === 0) return undefined;

      const must: QdrantFilterCondition[] = validConditions.map((c) => {
        const parsedValue = parseValue(c.value);

        if (c.operator === 'match') {
          return { key: c.key, match: { value: parsedValue } };
        }

        // Range operators
        const rangeKey = c.operator as 'gt' | 'gte' | 'lt' | 'lte';
        return {
          key: c.key,
          range: {
            [rangeKey]:
              typeof parsedValue === 'number'
                ? parsedValue
                : Number(parsedValue),
          },
        };
      });

      return { must };
    }, [conditions]);

    const applyFilter = useCallback(() => {
      const filter = buildFilter();
      onFilterChange(filter);
      setIsOpen(false);
    }, [buildFilter, onFilterChange]);

    const clearFilter = useCallback(() => {
      setConditions([]);
      onFilterChange(undefined);
    }, [onFilterChange]);

    return (
      <div className={cn('flex items-center gap-1', className)}>
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                'h-9 gap-1.5',
                conditions.length > 0 && 'border-primary text-primary'
              )}
            >
              <Filter className="h-3.5 w-3.5" />
              {t('vectorSearch.filter.title', 'Filters')}
              {conditions.length > 0 && (
                <span
                  className="bg-primary text-primary-foreground ml-1 rounded-full px-1.5 py-0.5"
                  style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
                >
                  {conditions.length}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[400px] p-3" align="start">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span
                  className="font-medium"
                  style={{ fontSize: 'var(--font-ui-size, 13px)' }}
                >
                  {t('vectorSearch.filter.title', 'Filters')}
                </span>
                {conditions.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilter}
                    className="text-muted-foreground hover:text-destructive h-7 px-2"
                    style={{
                      fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)',
                    }}
                  >
                    {t('vectorSearch.filter.clearAll', 'Clear all')}
                  </Button>
                )}
              </div>

              {conditions.length === 0 ? (
                <p
                  className="text-muted-foreground py-4 text-center"
                  style={{ fontSize: 'var(--font-ui-size, 13px)' }}
                >
                  {t(
                    'vectorSearch.filter.noConditions',
                    'No filter conditions'
                  )}
                </p>
              ) : (
                <div className="space-y-2">
                  {conditions.map((condition) => (
                    <div key={condition.id} className="flex items-center gap-2">
                      {/* Field selector */}
                      {payloadFields.length > 0 ? (
                        <Select
                          value={condition.key}
                          onValueChange={(v) =>
                            updateCondition(condition.id, 'key', v)
                          }
                        >
                          <SelectTrigger className="h-8 w-28">
                            <SelectValue
                              placeholder={t(
                                'vectorSearch.filter.selectField',
                                'Field'
                              )}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {payloadFields.map((field) => (
                              <SelectItem key={field} value={field}>
                                {field}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          value={condition.key}
                          onChange={(e) =>
                            updateCondition(condition.id, 'key', e.target.value)
                          }
                          placeholder={t(
                            'vectorSearch.filter.fieldName',
                            'Field'
                          )}
                          className="h-8 w-28"
                        />
                      )}

                      {/* Operator selector */}
                      <Select
                        value={condition.operator}
                        onValueChange={(v) =>
                          updateCondition(
                            condition.id,
                            'operator',
                            v as OperatorType
                          )
                        }
                      >
                        <SelectTrigger className="h-8 w-16">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {operators.map((op) => (
                            <SelectItem key={op.value} value={op.value}>
                              {op.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {/* Value input */}
                      <Input
                        value={condition.value}
                        onChange={(e) =>
                          updateCondition(condition.id, 'value', e.target.value)
                        }
                        placeholder={t('vectorSearch.filter.value', 'Value')}
                        className="h-8 flex-1"
                      />

                      {/* Remove button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeCondition(condition.id)}
                        className="text-muted-foreground hover:text-destructive h-8 w-8 shrink-0"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between border-t pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addCondition}
                  className="h-8 gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {t('vectorSearch.filter.addCondition', 'Add')}
                </Button>
                <Button size="sm" onClick={applyFilter} className="h-8">
                  {t('vectorSearch.filter.apply', 'Apply')}
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {conditions.length > 0 && (
          <Button
            variant="ghost"
            size="icon"
            onClick={clearFilter}
            className="text-muted-foreground hover:text-destructive h-9 w-9"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    );
  }
);

VectorSearchFilter.displayName = 'VectorSearchFilter';
