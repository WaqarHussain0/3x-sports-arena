import { Badge } from '@/components/ui/badge';
import { label, type BookingStatus, type PaymentStatus } from '@/lib/constants';
import { cn } from '@/lib/utils';

const BOOKING_STYLES: Record<BookingStatus, string> = {
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
  confirmed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300',
};

const PAYMENT_STYLES: Record<PaymentStatus, string> = {
  unpaid: 'bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300',
  partial: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
  paid: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300',
};

/** Dot colors for compact payment indicators (calendar blocks). */
export const PAYMENT_DOT: Record<PaymentStatus, string> = {
  unpaid: 'bg-red-500',
  partial: 'bg-amber-400',
  paid: 'bg-emerald-500',
};

export function BookingStatusBadge({ status, className }: { status: BookingStatus; className?: string }) {
  return (
    <Badge variant="secondary" className={cn(BOOKING_STYLES[status], className)}>
      {label(status)}
    </Badge>
  );
}

export function PaymentStatusBadge({ status, className }: { status: PaymentStatus; className?: string }) {
  return (
    <Badge variant="secondary" className={cn(PAYMENT_STYLES[status], className)}>
      {label(status)}
    </Badge>
  );
}

export function ArchivedBadge({ archived }: { archived: boolean }) {
  return archived ? (
    <Badge variant="outline" className="text-muted-foreground">
      Archived
    </Badge>
  ) : (
    <Badge variant="secondary" className={BOOKING_STYLES.confirmed}>
      Active
    </Badge>
  );
}
