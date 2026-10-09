"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { skipToken } from "@reduxjs/toolkit/query/react";
import { ArrowLeft, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState, ErrorState } from "@/components/shared/EmptyState";
import { LoadingState } from "@/components/shared/LoadingState";
import { toPktDateString } from "@/lib/time";
import { getErrorMessage } from "@/store/api/baseApi";
import { useGetBookingQuery } from "@/store/api/bookingsApi";
import { useAppDispatch } from "@/store/hooks";
import { goToDate } from "@/store/slices/calendarSlice";
import type { BookingDTO } from "@/types";
import { BookingForm } from "./form/BookingForm";
import type { BookingPrefill } from "./form/booking-form-utils";

/** Create (`/bookings/new`) or edit (`/bookings/[id]/edit`) a booking on its own page. */
export function BookingFormView({
  bookingId,
  prefill,
}: {
  bookingId?: string;
  prefill?: BookingPrefill;
}) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const isEdit = !!bookingId;
  const {
    data: booking,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetBookingQuery(bookingId ?? skipToken);

  function backToCalendar(saved?: BookingDTO) {
    // Land on the week that contains the saved booking.
    if (saved) dispatch(goToDate(toPktDateString(saved.startAt)));
    router.push("/bookings");
  }

  let content;
  if (!isEdit) {
    content = (
      <BookingForm
        prefill={prefill}
        onCancel={() => backToCalendar()}
        onSaved={backToCalendar}
      />
    );
  } else if (isLoading) {
    content = <LoadingState />;
  } else if (isError || !booking) {
    content = <ErrorState message={getErrorMessage(error)} onRetry={refetch} />;
  } else if (booking.status === "cancelled") {
    content = (
      <EmptyState
        icon={Ban}
        title="This booking is cancelled"
        description="Cancelled bookings can't be edited."
      />
    );
  } else {
    content = (
      <BookingForm
        booking={booking}
        onCancel={() => backToCalendar()}
        onSaved={backToCalendar}
      />
    );
  }

  return (
    <>
      <PageHeader
        title={
          isEdit
            ? `Edit booking${booking ? ` ${booking.bookingNumber}` : ""}`
            : "Create Booking"
        }
        description="Times are in Pakistan time (PKT). An end time earlier than the start ends on the next day."
        actions={
          <Button variant="outline" asChild>
            <Link href="/bookings">
              <ArrowLeft /> Back to calendar
            </Link>
          </Button>
        }
      />
      {content}
    </>
  );
}
