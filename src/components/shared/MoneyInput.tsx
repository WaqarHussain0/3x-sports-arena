'use client';

import type { ComponentProps } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

/**
 * Integer rupee input with an "Rs" prefix (or a custom suffix like "%").
 * Emits a number (NaN when empty) so RHF validators can reject blanks and decimals.
 */
export function MoneyInput({
  value,
  onChange,
  prefix = 'Rs',
  suffix,
  className,
  ...props
}: Omit<ComponentProps<typeof Input>, 'value' | 'onChange' | 'type' | 'prefix'> & {
  value: number | undefined;
  onChange: (value: number) => void;
  prefix?: string | null;
  suffix?: string;
}) {
  return (
    <div className="relative">
      {prefix && (
        <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-sm text-muted-foreground">
          {prefix}
        </span>
      )}
      <Input
        type="number"
        inputMode="numeric"
        step={1}
        min={0}
        className={cn(prefix && 'pl-9', suffix && 'pr-8', 'tabular-nums', className)}
        value={value === undefined || Number.isNaN(value) ? '' : value}
        onChange={(e) => onChange(e.target.value === '' ? Number.NaN : e.target.valueAsNumber)}
        onWheel={(e) => (e.target as HTMLInputElement).blur()}
        {...props}
      />
      {suffix && (
        <span className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-sm text-muted-foreground">
          {suffix}
        </span>
      )}
    </div>
  );
}
