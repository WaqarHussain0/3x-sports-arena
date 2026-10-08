'use client';

import type { MouseEvent } from 'react';
import { HOUR_HEIGHT_PX } from '@/lib/constants';
import { minutesToTime } from '@/lib/time';
import { cn } from '@/lib/utils';
import type { BookingDTO, CourtDTO } from '@/types';
import { BookingBlock } from './BookingBlock';
import { DAY_HEIGHT_PX, PX_PER_MINUTE, minuteFromOffset, segmentForDay } from './calendar-utils';

export interface SlotClick {
  courtId: string;
  date: string;
  startTime: string;
}

/** One day: a sub-column per visible court, booking blocks positioned absolutely, and the "now" line. */
export function DayColumn({
  date,
  courts,
  bookings,
  isToday,
  nowMinute,
  nowMs,
  courtColors,
  onSlotClick,
  onBookingClick,
}: {
  date: string;
  courts: CourtDTO[];
  bookings: BookingDTO[];
  isToday: boolean;
  nowMinute: number | null;
  nowMs: number | null;
  courtColors: Map<string, string>;
  onSlotClick: (slot: SlotClick) => void;
  onBookingClick: (bookingId: string) => void;
}) {
  function handleEmptyClick(event: MouseEvent<HTMLDivElement>, courtId: string) {
    const rect = event.currentTarget.getBoundingClientRect();
    const minute = minuteFromOffset(event.clientY - rect.top);
    onSlotClick({ courtId, date, startTime: minutesToTime(minute) });
  }

  return (
    <div
      className={cn('relative flex border-l', isToday && 'bg-primary/[0.04]')}
      style={{
        height: DAY_HEIGHT_PX,
        backgroundImage: 'linear-gradient(to bottom, var(--border) 1px, transparent 1px)',
        backgroundSize: `100% ${HOUR_HEIGHT_PX}px`,
      }}
    >
      {courts.map((court, i) => {
        const segments = bookings
          .filter((b) => b.court === court._id)
          .map((b) => segmentForDay(b, date))
          .filter((s) => s !== null)
          // Cancelled first so active bookings paint on top.
          .sort((a, b) => Number(b.booking.status === 'cancelled') - Number(a.booking.status === 'cancelled'));

        return (
          <div
            key={court._id}
            className={cn(
              'relative min-w-0 flex-1 cursor-pointer transition-colors hover:bg-muted/40',
              i > 0 && 'border-l border-dashed',
            )}
            onClick={(e) => handleEmptyClick(e, court._id)}
            aria-label={`${court.name} on ${date}: click an empty area to book`}
          >
            {segments.map((segment) => (
              <BookingBlock
                key={`${segment.booking._id}-${date}`}
                segment={segment}
                color={courtColors.get(segment.booking.court) ?? court.color}
                isPast={nowMs !== null && new Date(segment.booking.endAt).getTime() < nowMs}
                onClick={onBookingClick}
              />
            ))}
          </div>
        );
      })}

      {isToday && nowMinute !== null && (
        <div
          className="pointer-events-none absolute inset-x-0 z-30 flex items-center"
          style={{ top: nowMinute * PX_PER_MINUTE }}
          aria-hidden
        >
          <span className="-ml-1 size-2 rounded-full bg-red-500" />
          <span className="h-0.5 flex-1 bg-red-500" />
        </div>
      )}
    </div>
  );
}
