import type { ReactNode } from 'react';
import { Separator } from '@/components/ui/separator';
import { BookingStatusBadge } from '@/components/shared/StatusBadge';
import type { BookingStatus } from '@/lib/constants';
import { formatCurrency, formatDuration } from '@/lib/format';
import type { PriceResult } from '@/lib/pricing';
import { cn } from '@/lib/utils';

function Row({ label, value, className }: { label: ReactNode; value: ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-center justify-between gap-4', className)}>
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right tabular-nums">{value}</span>
    </div>
  );
}

/** Live price breakdown, driven by the shared `calculateBookingPrice()`. */
export function PriceSummary({
  rate,
  durationMinutes,
  price,
  advance,
  alreadyPaid,
  statusAfterSave,
}: {
  rate: number | null;
  durationMinutes: number;
  price: PriceResult;
  advance?: number;
  alreadyPaid?: number;
  statusAfterSave: BookingStatus;
}) {
  const paid = (advance ?? 0) + (alreadyPaid ?? 0);
  const remaining = Math.max(price.totalAmount - paid, 0);
  const discountLabel =
    price.discount.type === 'percentage'
      ? `Discount (${price.discount.value}%)`
      : price.discount.type === 'fixed'
        ? 'Discount'
        : null;

  return (
    <div className="space-y-2 rounded-xl border bg-muted/30 p-4 text-sm">
      <p className="font-medium">Price summary</p>
      <Row label="Rate" value={rate === null ? '—' : `${formatCurrency(rate)} / hour`} />
      <Row label="Duration" value={durationMinutes > 0 ? formatDuration(durationMinutes) : '—'} />
      <Row label="Subtotal" value={formatCurrency(price.grossAmount)} />
      {discountLabel && price.discountAmount > 0 && (
        <Row label={discountLabel} value={`− ${formatCurrency(price.discountAmount)}`} className="text-emerald-700 dark:text-emerald-400" />
      )}
      <Separator />
      <Row label={<span className="font-medium text-foreground">Total</span>} value={<span className="text-base font-semibold">{formatCurrency(price.totalAmount)}</span>} />
      {alreadyPaid !== undefined && alreadyPaid > 0 && <Row label="Already paid" value={`− ${formatCurrency(alreadyPaid)}`} />}
      {advance !== undefined && advance > 0 && <Row label="Advance" value={`− ${formatCurrency(advance)}`} />}
      <Row label="Remaining" value={<span className="font-medium">{formatCurrency(remaining)}</span>} />
      <Separator />
      <Row label="Status after save" value={<BookingStatusBadge status={statusAfterSave} />} />
    </div>
  );
}
