'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { LandPlot, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState, ErrorState } from '@/components/shared/EmptyState';
import { addDaysStr } from '@/lib/time';
import { getErrorMessage } from '@/store/api/baseApi';
import { useBookingsPrefetch, useGetBookingsQuery } from '@/store/api/bookingsApi';
import { useGetCourtsQuery } from '@/store/api/courtsApi';
import { useAppSelector } from '@/store/hooks';
import { BookingDetailSheet } from './BookingDetailSheet';
import { CalendarHeader } from './CalendarHeader';
import type { SlotClick } from './DayColumn';
import { WeekCalendar } from './WeekCalendar';
import { prefillToSearchParams } from './form/booking-form-utils';

export function BookingsView() {
  const { weekStart, courtFilter, showCancelled } = useAppSelector((s) => s.calendar);
  const weekEnd = addDaysStr(weekStart, 6);

  const { data: allCourts = [], isLoading: courtsLoading } = useGetCourtsQuery({ includeArchived: true });
  const activeCourts = useMemo(() => allCourts.filter((c) => !c.isArchived), [allCourts]);
  const courtColors = useMemo(() => new Map(allCourts.map((c) => [c._id, c.color])), [allCourts]);

  const court = courtFilter === 'all' || !activeCourts.some((c) => c._id === courtFilter) ? 'all' : courtFilter;
  const visibleCourts = court === 'all' ? activeCourts : activeCourts.filter((c) => c._id === court);

  const query = { from: weekStart, to: weekEnd, court, includeCancelled: showCancelled };
  const { data: bookings = [], isLoading, isFetching, isError, error, refetch } = useGetBookingsQuery(query);
  const prefetch = useBookingsPrefetch('getBookings');

  const router = useRouter();
  const [detailId, setDetailId] = useState<string | null>(null);

  const createHref = `/bookings/new${prefillToSearchParams(court !== 'all' ? { courtId: court } : undefined)}`;

  function handleSlotClick(slot: SlotClick) {
    router.push(
      `/bookings/new${prefillToSearchParams({ courtId: slot.courtId, date: slot.date, startTime: slot.startTime })}`,
    );
  }

  return (
    <>
      <PageHeader
        title="Bookings"
        description="Weekly calendar for all courts. Click an empty slot to book it."
        actions={
          activeCourts.length ? (
            <Button asChild>
              <Link href={createHref}>
                <Plus /> Create Booking
              </Link>
            </Button>
          ) : (
            <Button disabled>
              <Plus /> Create Booking
            </Button>
          )
        }
      />

      <CalendarHeader
        courts={activeCourts}
        isFetching={isFetching && !isLoading}
        onPrefetchWeek={(ws) => prefetch({ ...query, from: ws, to: addDaysStr(ws, 6) })}
      />

      {courtsLoading || isLoading ? (
        <Skeleton className="h-[60svh] rounded-xl" />
      ) : !activeCourts.length ? (
        <EmptyState
          icon={LandPlot}
          title="No active courts"
          description="Add or unarchive a court to start taking bookings."
          action={
            <Button asChild>
              <Link href="/courts">Go to Courts</Link>
            </Button>
          }
        />
      ) : isError ? (
        <ErrorState message={getErrorMessage(error)} onRetry={refetch} />
      ) : (
        <WeekCalendar
          weekStart={weekStart}
          courts={visibleCourts}
          allCourtsView={court === 'all'}
          bookings={bookings}
          courtColors={courtColors}
          onSlotClick={handleSlotClick}
          onBookingClick={setDetailId}
        />
      )}

      <BookingDetailSheet bookingId={detailId} onOpenChange={(o) => !o && setDetailId(null)} />
    </>
  );
}
