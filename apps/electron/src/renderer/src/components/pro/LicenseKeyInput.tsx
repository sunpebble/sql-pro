/**
 * License Key Input Component
 * OTP-style input for license keys with format: SQLPRO-XXXX-XXXX-XXXX-XXXX
 */

import { Input } from '@sqlpro/ui/input';
import { Check, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface LicenseKeyInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  autoFocus?: boolean;
}

const LICENSE_PREFIX = 'SQLPRO';
const SEGMENT_LENGTH = 4;
const SEGMENT_COUNT = 4; // 4 segments after prefix
const SEGMENT_REGEX = /^[A-Z0-9]+$/;

// Minimum length for a complete license key: SQLPRO-XXXX-XXXX-XXXX-XXXX (26 chars)
export const MIN_LICENSE_KEY_LENGTH =
  LICENSE_PREFIX.length +
  1 +
  SEGMENT_LENGTH * SEGMENT_COUNT +
  (SEGMENT_COUNT - 1);

/**
 * Formats a raw license key string into segments
 */
function formatLicenseKey(raw: string): string[] {
  const cleaned = raw
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .replace(/^SQLPRO/, '');

  const segments: string[] = [];
  for (let i = 0; i < SEGMENT_COUNT; i++) {
    const start = i * SEGMENT_LENGTH;
    segments.push(cleaned.slice(start, start + SEGMENT_LENGTH));
  }
  return segments;
}

/**
 * Validates if the license key format is correct
 */
function isValidFormat(segments: string[]): boolean {
  return segments.every(
    (seg) => seg.length === SEGMENT_LENGTH && SEGMENT_REGEX.test(seg)
  );
}

/**
 * Converts segments back to full license key string
 */
function segmentsToKey(segments: string[]): string {
  const filledSegments = segments.filter((s) => s.length > 0);
  if (filledSegments.length === 0) return '';
  return `${LICENSE_PREFIX}-${segments.join('-')}`;
}

export function LicenseKeyInput({
  value,
  onChange,
  disabled = false,
  className,
  autoFocus = false,
}: LicenseKeyInputProps) {
  const [segments, setSegments] = useState<string[]>(() =>
    formatLicenseKey(value)
  );
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Sync external value changes
  useEffect(() => {
    const newSegments = formatLicenseKey(value);
    // Only update if segments actually changed to avoid unnecessary re-renders
    // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect -- Intentional sync from external prop
    setSegments((prev) => {
      const hasChanged = newSegments.some((seg, i) => seg !== prev[i]);
      return hasChanged ? newSegments : prev;
    });
  }, [value]);

  // Auto-focus first input
  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus]);

  const handleSegmentChange = useCallback(
    (index: number, inputValue: string) => {
      const cleaned = inputValue.toUpperCase().replace(/[^A-Z0-9]/g, '');

      // Handle paste of full license key
      if (cleaned.length > SEGMENT_LENGTH) {
        const pasted = cleaned.replace(/^SQLPRO/, '');
        const newSegments = formatLicenseKey(pasted);
        setSegments(newSegments);
        onChange(segmentsToKey(newSegments));

        // Focus last segment or first incomplete
        const lastIncomplete = newSegments.findIndex(
          (s) => s.length < SEGMENT_LENGTH
        );
        const focusIdx =
          lastIncomplete === -1 ? SEGMENT_COUNT - 1 : lastIncomplete;
        inputRefs.current[focusIdx]?.focus();
        return;
      }

      const newSegments = [...segments];
      newSegments[index] = cleaned.slice(0, SEGMENT_LENGTH);
      setSegments(newSegments);
      onChange(segmentsToKey(newSegments));

      // Auto-advance to next segment
      if (cleaned.length === SEGMENT_LENGTH && index < SEGMENT_COUNT - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    },
    [segments, onChange]
  );

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      // Move to previous segment on backspace at start
      if (e.key === 'Backspace' && segments[index].length === 0 && index > 0) {
        e.preventDefault();
        inputRefs.current[index - 1]?.focus();
      }

      // Move to next segment on right arrow at end
      if (
        e.key === 'ArrowRight' &&
        (e.currentTarget.selectionStart === segments[index].length ||
          segments[index].length === 0) &&
        index < SEGMENT_COUNT - 1
      ) {
        e.preventDefault();
        inputRefs.current[index + 1]?.focus();
      }

      // Move to previous segment on left arrow at start
      if (
        e.key === 'ArrowLeft' &&
        e.currentTarget.selectionStart === 0 &&
        index > 0
      ) {
        e.preventDefault();
        inputRefs.current[index - 1]?.focus();
      }
    },
    [segments]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      e.preventDefault();
      const pasted = e.clipboardData
        .getData('text')
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .replace(/^SQLPRO/, '');

      const newSegments = formatLicenseKey(pasted);
      setSegments(newSegments);
      onChange(segmentsToKey(newSegments));

      // Focus appropriate segment
      const lastIncomplete = newSegments.findIndex(
        (s) => s.length < SEGMENT_LENGTH
      );
      const focusIdx =
        lastIncomplete === -1 ? SEGMENT_COUNT - 1 : lastIncomplete;
      inputRefs.current[focusIdx]?.focus();
    },
    [onChange]
  );

  const isComplete = isValidFormat(segments);
  const hasContent = segments.some((s) => s.length > 0);
  const { t } = useTranslation('common');

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-1.5">
        {/* Prefix label */}
        <div
          className="bg-muted text-muted-foreground flex h-10 items-center rounded-md border px-3 font-mono"
          style={{ fontSize: 'var(--font-ui-size, 13px)' }}
        >
          {LICENSE_PREFIX}
        </div>

        <span className="text-muted-foreground">-</span>

        {/* Segment inputs */}
        {segments.map((segment, index) => (
          // eslint-disable-next-line react/no-array-index-key -- Fixed 4 segments, index is stable
          <div key={index} className="flex items-center gap-1.5">
            <Input
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              type="text"
              inputMode="text"
              autoCapitalize="characters"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              maxLength={SEGMENT_LENGTH}
              value={segment}
              onChange={(e) => handleSegmentChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              onFocus={() => setFocusedIndex(index)}
              onBlur={() => setFocusedIndex(null)}
              disabled={disabled}
              className={cn(
                'h-10 w-16 text-center font-mono tracking-wider',
                focusedIndex === index && 'ring-gold ring-2',
                segment.length === SEGMENT_LENGTH &&
                  'border-green-500/50 bg-green-500/5'
              )}
              style={{ fontSize: 'var(--font-ui-size, 13px)' }}
              placeholder={t('license.segmentPlaceholder')}
              aria-label={t('license.segmentAriaLabel', { index: index + 1 })}
            />
            {index < SEGMENT_COUNT - 1 && (
              <span className="text-muted-foreground">-</span>
            )}
          </div>
        ))}

        {/* Validation indicator */}
        {hasContent && (
          <div
            className={cn(
              'ml-2 flex h-6 w-6 items-center justify-center rounded-full',
              isComplete
                ? 'bg-green-500/10 text-green-500'
                : 'bg-muted text-muted-foreground'
            )}
          >
            {isComplete ? (
              <Check className="h-4 w-4" />
            ) : (
              <X className="h-3 w-3" />
            )}
          </div>
        )}
      </div>

      {/* Helper text */}
      <p
        className="text-muted-foreground"
        style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
      >
        {t('license.formatHint')}
      </p>
    </div>
  );
}
