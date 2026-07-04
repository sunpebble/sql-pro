import type {
  ColumnTypeCategory,
  FilterErrorField,
  OperatorDefinition,
  UIFilterState,
  UIOperator,
} from '@/lib/filter-utils';
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
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  generateFilterId,
  getOperatorsForColumnType,
  validateFilterValue,
} from '@/lib/filter-utils';
import { cn } from '@/lib/utils';

interface ColumnFilterPopoverProps {
  /** Column name to filter */
  columnName: string;
  /** Column type category for determining available operators */
  columnType: ColumnTypeCategory;
  /** Existing filter for this column (if any) */
  existingFilter?: UIFilterState;
  /** Callback when filter is applied */
  onApply: (filter: UIFilterState) => void;
  /** Callback when filter is cleared */
  onClear: () => void;
  /** Whether the popover is open (controlled) */
  open?: boolean;
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void;
  /** Trigger element */
  children: React.ReactNode;
}

/**
 * A popover component for configuring column filters.
 * Displays operator selector, value input(s), and apply/clear buttons.
 * Handles special cases like 'is null' (no value input) and 'between' (two inputs).
 */
export function ColumnFilterPopover({
  columnName,
  columnType,
  existingFilter,
  onApply,
  onClear,
  open,
  onOpenChange,
  children,
}: ColumnFilterPopoverProps) {
  const { t } = useTranslation('common');
  const operators = getOperatorsForColumnType(columnType);
  const defaultOperator = operators[0]?.value || 'equals';

  // Local state for filter configuration
  const [selectedOperator, setSelectedOperator] = useState<UIOperator>(
    existingFilter?.uiOperator || defaultOperator
  );
  const [value, setValue] = useState(existingFilter?.value || '');
  const [secondValue, setSecondValue] = useState(
    existingFilter?.secondValue || ''
  );
  const [error, setError] = useState<string | undefined>();
  const [errorField, setErrorField] = useState<FilterErrorField>(null);

  // Get current operator definition
  const currentOperator = operators.find(
    (op) => op.value === selectedOperator
  ) as OperatorDefinition | undefined;

  // Reset state when popover opens or existing filter changes
  useEffect(() => {
    /* eslint-disable react/set-state-in-effect -- Intentionally sync state with props */
    if (existingFilter) {
      setSelectedOperator(existingFilter.uiOperator);
      setValue(existingFilter.value);
      setSecondValue(existingFilter.secondValue || '');
    } else {
      setSelectedOperator(defaultOperator);
      setValue('');
      setSecondValue('');
    }
    setError(undefined);
    setErrorField(null);
    /* eslint-enable react/set-state-in-effect */
  }, [existingFilter, defaultOperator, open]);

  // Clear values when operator changes if the new operator doesn't require values
  const handleOperatorChange = useCallback(
    (newOperator: string | null) => {
      if (!newOperator) return;
      setSelectedOperator(newOperator as UIOperator);
      setError(undefined);
      setErrorField(null);

      const newOpDef = operators.find((op) => op.value === newOperator);
      if (!newOpDef?.requiresValue) {
        setValue('');
        setSecondValue('');
      } else if (!newOpDef?.requiresSecondValue) {
        setSecondValue('');
      }
    },
    [operators]
  );

  // Handle apply button click
  const handleApply = useCallback(() => {
    // Validate the filter
    const validation = validateFilterValue(
      selectedOperator,
      value,
      secondValue,
      columnType
    );

    if (!validation.isValid) {
      setError(validation.error);
      setErrorField(validation.errorField || null);
      return;
    }

    // Create the filter
    const filter: UIFilterState = {
      id: existingFilter?.id || generateFilterId(),
      column: columnName,
      columnType,
      uiOperator: selectedOperator,
      value: value.trim(),
      secondValue: currentOperator?.requiresSecondValue
        ? secondValue.trim()
        : undefined,
    };

    onApply(filter);
    onOpenChange?.(false);
  }, [
    selectedOperator,
    value,
    secondValue,
    columnType,
    columnName,
    existingFilter,
    currentOperator,
    onApply,
    onOpenChange,
  ]);

  // Handle clear button click
  const handleClear = useCallback(() => {
    setValue('');
    setSecondValue('');
    setSelectedOperator(defaultOperator);
    setError(undefined);
    setErrorField(null);
    onClear();
    onOpenChange?.(false);
  }, [defaultOperator, onClear, onOpenChange]);

  // Handle Enter key in input
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleApply();
      }
    },
    [handleApply]
  );

  const showValueInput = currentOperator?.requiresValue ?? true;
  const showSecondValueInput = currentOperator?.requiresSecondValue ?? false;

  // Determine which inputs should show error styling
  const hasValueError = errorField === 'value' || errorField === 'both';
  const hasSecondValueError =
    errorField === 'secondValue' || errorField === 'both';

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger>{children}</PopoverTrigger>
      <PopoverContent
        className="w-72 p-3"
        align="start"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onPointerDownCapture={(e) => e.stopPropagation()}
      >
        <div
          className="flex flex-col gap-3"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className="font-medium"
            style={{ fontSize: 'var(--font-ui-size, 13px)' }}
          >
            {t('filter.title')}{' '}
            <span className="text-muted-foreground">{columnName}</span>
          </div>

          {/* Operator selector */}
          <div className="flex flex-col gap-1.5">
            <label
              className="text-muted-foreground"
              style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
            >
              {t('filter.operator')}
            </label>
            <Select
              value={selectedOperator}
              onValueChange={handleOperatorChange}
            >
              <SelectTrigger
                className="h-9"
                onPointerDown={(e) => e.stopPropagation()}
              >
                <SelectValue placeholder={t('filter.selectOperator')} />
              </SelectTrigger>
              <SelectContent>
                {operators.map((op) => (
                  <SelectItem key={op.value} value={op.value}>
                    {t(`filter.operators.${op.value}`, {
                      defaultValue: op.label,
                    })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Value input(s) */}
          {showValueInput && (
            <div className="flex flex-col gap-1.5">
              <label
                className="text-muted-foreground"
                style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
              >
                {showSecondValueInput ? t('filter.from') : t('filter.value')}
              </label>
              <Input
                className={cn('h-9', hasValueError && 'border-destructive')}
                type={columnType === 'numeric' ? 'number' : 'text'}
                placeholder={
                  columnType === 'numeric'
                    ? t('filter.enterNumber')
                    : t('filter.enterValue')
                }
                value={value}
                onChange={(e) => {
                  setValue(e.target.value);
                  setError(undefined);
                  setErrorField(null);
                }}
                onKeyDown={handleKeyDown}
                autoFocus
              />
            </div>
          )}

          {/* Second value input for 'between' */}
          {showSecondValueInput && (
            <div className="flex flex-col gap-1.5">
              <label
                className="text-muted-foreground"
                style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
              >
                {t('filter.to')}
              </label>
              <Input
                className={cn(
                  'h-9',
                  hasSecondValueError && 'border-destructive'
                )}
                type={columnType === 'numeric' ? 'number' : 'text'}
                placeholder={
                  columnType === 'numeric'
                    ? t('filter.enterNumber')
                    : t('filter.enterValue')
                }
                value={secondValue}
                onChange={(e) => {
                  setSecondValue(e.target.value);
                  setError(undefined);
                  setErrorField(null);
                }}
                onKeyDown={handleKeyDown}
              />
            </div>
          )}

          {/* Validation error */}
          {error && (
            <div
              className="text-destructive"
              style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
            >
              {error}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-2 pt-1">
            <Button
              variant="accent"
              size="sm"
              className="flex-1"
              onClick={handleApply}
            >
              {t('filter.apply')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={handleClear}
              disabled={!existingFilter && !value && !secondValue}
            >
              {t('filter.clear')}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
