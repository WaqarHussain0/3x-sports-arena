import type { ReactNode } from 'react';
import { ArrowDownRight, ArrowUpRight, Minus, type LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/** % change vs the previous period; null when the previous value is 0 (shown as "—"). */
export function percentChange(current: number, previous: number): number | null {
  if (!previous) return null;
  return ((current - previous) / Math.abs(previous)) * 100;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  change,
  subtitle,
  valueClassName,
  /** When true, a decrease is good (e.g. expenses). */
  inverse = false,
}: {
  title: string;
  value: ReactNode;
  icon: LucideIcon;
  change?: number | null;
  subtitle?: ReactNode;
  valueClassName?: string;
  inverse?: boolean;
}) {
  const showChange = change !== undefined;
  const up = (change ?? 0) > 0;
  const flat = change === null || change === 0 || change === undefined;
  const good = flat ? null : inverse ? !up : up;
  const ChangeIcon = flat ? Minus : up ? ArrowUpRight : ArrowDownRight;

  return (
    <Card className="gap-0 py-4">
      <CardContent className="space-y-2 px-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">{title}</p>
          <div className="flex size-8 items-center justify-center rounded-lg bg-muted">
            <Icon className="size-4 text-muted-foreground" />
          </div>
        </div>
        <p className={cn('text-2xl font-semibold tracking-tight tabular-nums', valueClassName)}>{value}</p>
        <div className="flex min-h-5 flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
          {showChange && (
            <span
              className={cn(
                'inline-flex items-center gap-0.5 font-medium',
                good === true && 'text-emerald-700 dark:text-emerald-400',
                good === false && 'text-red-600 dark:text-red-400',
              )}
            >
              <ChangeIcon className="size-3.5" aria-hidden />
              {change === null ? '—' : `${Math.abs(change).toFixed(1)}%`}
              <span className="sr-only">{up ? 'increase' : 'decrease'}</span>
            </span>
          )}
          {showChange && <span>vs previous period</span>}
          {subtitle && <span>{subtitle}</span>}
        </div>
      </CardContent>
    </Card>
  );
}
