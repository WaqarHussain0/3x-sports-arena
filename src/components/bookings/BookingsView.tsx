'use client';

import Link from 'next/link';
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
import type { BookingDTO } from '@/types';
import { BookingDetailSheet } from './BookingDetailSheet';
import { BookingFormDialog, type BookingPrefill } from './BookingFormDialog';
import { CalendarHeader } from './CalendarHeader';
import type { SlotClick } from './DayColumn';
import { WeekCalendar } from './WeekCalendar';

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

  const [formOpen, setFormOpen] = useState(false);
  const [prefill, setPrefill] = useState<BookingPrefill | undefined>();
  const [editing, setEditing] = useState<BookingDTO | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

  function openCreate(p?: BookingPrefill) {
    setEditing(null);
    setPrefill(p);
    setFormOpen(true);
  }

  function handleSlotClick(slot: SlotClick) {
    openCreate({ courtId: slot.courtId, date: slot.date, startTime: slot.startTime });
  }

  return (
    <>
      <PageHeader
        title="Bookings"
        description="Weekly calendar for all courts. Click an empty slot to book it."
        actions={
          <Button onClick={() => openCreate(court !== 'all' ? { courtId: court } : undefined)} disabled={!activeCourts.length}>
            <Plus /> Create Booking
          </Button>
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

      <BookingFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        booking={editing}
        prefill={prefill}
      />
      <BookingDetailSheet
        bookingId={detailId}
        onOpenChange={(o) => !o && setDetailId(null)}
        onEdit={(b) => {
          setEditing(b);
          setPrefill(undefined);
          setFormOpen(true);
        }}
      />
    </>
  );
}
