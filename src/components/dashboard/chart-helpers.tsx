import type { ReactNode } from 'react';
import { formatCurrency, formatNumber } from '@/lib/format';
import type { ChartConfig } from '@/components/ui/chart';

/**
 * Builds a ChartTooltipContent `formatter` that keeps the color indicator + label
 * and formats the value (currency, hours, counts…). Text stays in text ink; the swatch carries identity.
 */
export function tooltipFormatter(config: ChartConfig, format: (v: number) => string) {
  return function TooltipRow(
    value: unknown,
    name: unknown,
    item: { color?: string; payload?: { fill?: string } },
  ): ReactNode {
    const key = String(name);
    const color = item.payload?.fill ?? item.color;
    return (
      <div className="flex w-full items-center gap-2">
        <span className="size-2.5 shrink-0 rounded-[2px]" style={{ backgroundColor: color }} />
        <span className="text-muted-foreground">{config[key]?.label ?? key}</span>
        <span className="ml-auto pl-3 font-mono font-medium text-foreground tabular-nums">{format(Number(value))}</span>
      </div>
    );
  };
}

export const asCurrency = (v: number) => formatCurrency(v);
export const asHours = (v: number) => `${formatNumber(v, 1)} h`;
export const asCount = (v: number) => formatNumber(v);

/** Compact axis ticks: Rs 12k, Rs 1.2M. */
export function compactCurrency(v: number): string {
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return `${(v / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (abs >= 1_000) return `${(v / 1_000).toFixed(abs >= 10_000 ? 0 : 1).replace(/\.0$/, '')}k`;
  return String(v);
}

export function hasAnyValue<T>(rows: T[], pick: (row: T) => number): boolean {
  return rows.some((r) => pick(r) !== 0);
}
