'use client';

import { SPORT_ICONS } from '@/components/shared/SportBadge';
import { PAYMENT_DOT } from '@/components/shared/StatusBadge';
import { label } from '@/lib/constants';
import { formatTimeRange } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { BookingSegment } from './calendar-utils';

export function BookingBlock({
  segment,
  color,
  isPast,
  onClick,
}: {
  segment: BookingSegment;
  color: string;
  isPast: boolean;
  onClick: (bookingId: string) => void;
}) {
  const { booking, top, height } = segment;
  const cancelled = booking.status === 'cancelled';
  const pending = booking.status === 'pending';
  const SportIcon = SPORT_ICONS[booking.sportType];
  const compact = height <= 32;
  const timeRange = formatTimeRange(booking.startAt, booking.endAt);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick(booking._id);
      }}
      title={`${booking.customerSnapshot.name} · ${timeRange} · ${label(booking.sportType)} · ${label(booking.paymentStatus)}`}
      aria-label={`${booking.customerSnapshot.name}, ${timeRange}, ${label(booking.status)}, ${label(booking.paymentStatus)}`}
      className={cn(
        'group/block absolute inset-x-0.5 z-10 flex flex-col overflow-hidden rounded-md border border-l-[3px] px-1.5 text-left text-xs leading-tight text-foreground shadow-xs transition',
        'hover:z-20 hover:shadow-md focus-visible:z-20 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
        compact ? 'justify-center py-0' : 'py-1',
        pending && 'border-dashed bg-stripes',
        isPast && !cancelled && 'opacity-55 saturate-50',
        cancelled && 'z-0 opacity-45 line-through',
        segment.continuesFromPrevDay && 'rounded-t-none border-t-0',
        segment.continuesToNextDay && 'rounded-b-none border-b-0',
      )}
      style={{
        top,
        height,
        backgroundColor: `color-mix(in oklch, ${color} 22%, var(--background))`,
        borderColor: color,
      }}
    >
      <span className="flex items-center gap-1">
        <span className={cn('size-1.5 shrink-0 rounded-full', PAYMENT_DOT[booking.paymentStatus])} />
        <span className="truncate font-medium">{booking.customerSnapshot.name}</span>
      </span>
      {!compact && (
        <>
          <span className="truncate text-[11px] text-muted-foreground">{timeRange}</span>
          {height > 52 && (
            <span className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-muted-foreground">
              <SportIcon className="size-3 shrink-0" /> {label(booking.sportType)}
            </span>
          )}
        </>
      )}
    </button>
  );
}
