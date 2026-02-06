import { PRESET_TAG_COLORS } from '@shared/types/tag';
import { Button } from '@sqlpro/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@sqlpro/ui/popover';
import { useState } from 'react';
import { HexColorPicker } from 'react-colorful';
import { cn } from '@/lib/utils';

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  className?: string;
}

export function ColorPicker({ color, onChange, className }: ColorPickerProps) {
  const [showCustom, setShowCustom] = useState(false);

  return (
    <Popover>
      <PopoverTrigger
        className={cn(
          'border-border focus:ring-primary/50 rounded-base h-6 w-6 border-2 transition-all focus:ring-2 focus:outline-none',
          className
        )}
        style={{ backgroundColor: color }}
        aria-label="Pick color"
      />
      <PopoverContent className="w-auto p-3" align="start">
        <div className="space-y-3">
          {/* Preset colors grid */}
          <div className="grid grid-cols-4 gap-2">
            {PRESET_TAG_COLORS.map((preset) => (
              <button
                key={preset}
                className={cn(
                  'rounded-base h-6 w-6 transition-all',
                  color === preset &&
                    'ring-primary ring-offset-background ring-2 ring-offset-2'
                )}
                style={{ backgroundColor: preset }}
                onClick={() => onChange(preset)}
                aria-label={`Select color ${preset}`}
              />
            ))}
          </div>

          {/* Custom color picker toggle */}
          {showCustom ? (
            <div className="space-y-2">
              <HexColorPicker color={color} onChange={onChange} />
              <div className="flex items-center gap-2">
                <span
                  className="text-muted-foreground"
                  style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.75)' }}
                >
                  Hex:
                </span>
                <input
                  type="text"
                  value={color}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (/^#[0-9A-F]{0,6}$/i.test(val)) {
                      onChange(val);
                    }
                  }}
                  className="bg-background h-6 w-20 rounded border px-1.5 font-mono"
                  style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.75)' }}
                />
              </div>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.75)' }}
              onClick={() => setShowCustom(true)}
            >
              Custom color...
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
