import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';

export function CurrencyText({
  amount,
  className,
  colorize = false,
}: {
  amount: number;
  className?: string;
  /** Green for positive, red for negative. */
  colorize?: boolean;
}) {
  return (
    <span
      className={cn(
        'tabular-nums',
        colorize && amount > 0 && 'text-emerald-600 dark:text-emerald-400',
        colorize && amount < 0 && 'text-red-600 dark:text-red-400',
        className,
      )}
    >
      {formatCurrency(amount)}
    </span>
  );
}
