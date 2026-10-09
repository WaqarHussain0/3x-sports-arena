import type { Metadata } from "next";
import { BookingFormView } from "@/components/bookings/BookingFormView";

export const metadata: Metadata = { title: "Edit Booking" };

export default async function EditBookingPage({
  params,
}: PageProps<"/bookings/[id]/edit">) {
  const { id } = await params;
  return <BookingFormView bookingId={id} />;
}
