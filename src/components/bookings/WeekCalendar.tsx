'use client';

import { useEffect, useMemo, useRef } from 'react';
import { CALENDAR_DEFAULT_SCROLL_HOUR, HOUR_HEIGHT_PX } from '@/lib/constants';
import { formatHourLabel } from '@/lib/format';
import { addDaysStr, formatDateStr, minutesSincePktMidnight, toPktDateString } from '@/lib/time';
import { cn } from '@/lib/utils';
import { useNow } from '@/hooks/use-now';
import type { BookingDTO, CourtDTO } from '@/types';
import { DayColumn, type SlotClick } from './DayColumn';
import { DAY_HEIGHT_PX } from './calendar-utils';

const TIME_COL_PX = 56;

/**
 * Custom weekly grid (no calendar library): 7 day columns (Mon–Sun) × 24 hour rows.
 * In "all courts" mode each day is split into one sub-column per court.
 */
export function WeekCalendar({
  weekStart,
  courts,
  allCourtsView,
  bookings,
  courtColors,
  onSlotClick,
  onBookingClick,
}: {
  weekStart: string;
  courts: CourtDTO[];
  allCourtsView: boolean;
  bookings: BookingDTO[];
  courtColors: Map<string, string>;
  onSlotClick: (slot: SlotClick) => void;
  onBookingClick: (bookingId: string) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const nowMs = useNow();
  const today = nowMs !== null ? toPktDateString(new Date(nowMs)) : null;
  const nowMinute = nowMs !== null ? minutesSincePktMidnight(new Date(nowMs)) : null;

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDaysStr(weekStart, i)), [weekStart]);
  const weekHasToday = today !== null && days.includes(today);

  // Scroll to the current hour (or 4 PM) when the week changes.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || nowMs === null) return;
    const hour = weekHasToday && nowMinute !== null ? Math.floor(nowMinute / 60) : CALENDAR_DEFAULT_SCROLL_HOUR;
    el.scrollTo({ top: Math.max(hour - 1, 0) * HOUR_HEIGHT_PX });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on week change / first client render
  }, [weekStart, nowMs === null]);

  const dayMinWidth = allCourtsView ? Math.max(courts.length, 1) * 96 : 128;
  const gridTemplateColumns = `${TIME_COL_PX}px repeat(7, minmax(${dayMinWidth}px, 1fr))`;
  const minWidth = TIME_COL_PX + 7 * dayMinWidth;

  return (
    <div
      ref={scrollRef}
      className="relative max-h-[calc(100svh-17rem)] min-h-96 overflow-auto rounded-xl border bg-card"
    >
      <div style={{ minWidth }}>
        {/* Sticky day header */}
        <div className="sticky top-0 z-40 grid border-b bg-card" style={{ gridTemplateColumns }}>
          <div className="sticky left-0 z-10 bg-card" />
          {days.map((day) => {
            const isToday = day === today;
            return (
              <div key={day} className="border-l px-1 pt-2 pb-1 text-center">
                <div className={cn('text-xs text-muted-foreground', isToday && 'font-medium text-primary')}>
                  {formatDateStr(day, 'EEE')}
                </div>
                <div
                  className={cn(
                    'mx-auto mt-0.5 flex size-7 items-center justify-center rounded-full text-sm font-semibold',
                    isToday && 'bg-primary text-primary-foreground',
                  )}
                >
                  {formatDateStr(day, 'd')}
                </div>
                {allCourtsView && courts.length > 0 && (
                  <div className="mt-1 flex">
                    {courts.map((c, i) => (
                      <div
                        key={c._id}
                        className={cn(
                          'flex min-w-0 flex-1 items-center justify-center gap-1 px-0.5 text-[10px] text-muted-foreground',
                          i > 0 && 'border-l border-dashed',
                        )}
                        title={c.name}
                      >
                        <span className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: c.color }} />
                        <span className="truncate">{c.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Body */}
        <div className="grid" style={{ gridTemplateColumns }}>
          <div className="sticky left-0 z-30 border-r bg-card" style={{ height: DAY_HEIGHT_PX }}>
            {Array.from({ length: 24 }, (_, hour) => (
              <div
                key={hour}
                className="relative pr-1.5 text-right text-[10px] text-muted-foreground"
                style={{ height: HOUR_HEIGHT_PX }}
              >
                {hour > 0 && <span className="absolute -top-1.5 right-1.5">{formatHourLabel(hour)}</span>}
              </div>
            ))}
          </div>
          {days.map((day) => (
            <DayColumn
              key={day}
              date={day}
              courts={courts}
              bookings={bookings}
              isToday={day === today}
              nowMinute={nowMinute}
              nowMs={nowMs}
              courtColors={courtColors}
              onSlotClick={onSlotClick}
              onBookingClick={onBookingClick}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
