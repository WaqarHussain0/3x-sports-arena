import type { Metadata } from "next";
import { BookingFormView } from "@/components/bookings/BookingFormView";
import { prefillFromSearchParams } from "@/components/bookings/form/booking-form-utils";

export const metadata: Metadata = { title: "Create Booking" };

export default async function CreateBookingPage({
  searchParams,
}: PageProps<"/bookings/new">) {
  return (
    <BookingFormView prefill={prefillFromSearchParams(await searchParams)} />
  );
}
