"use client";

import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import {
  CalendarClock,
  LandPlot,
  Loader2,
  NotebookPen,
  User,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { applyServerErrors } from "@/lib/form";
import { deriveBookingStatus } from "@/lib/pricing";
import { todayPkt } from "@/lib/time";
import { isNonNegativeInt } from "@/lib/validators";
import { isAppError } from "@/store/api/baseApi";
import {
  useCreateBookingMutation,
  useUpdateBookingMutation,
} from "@/store/api/bookingsApi";
import { useGetCourtsQuery } from "@/store/api/courtsApi";
import type { BookingDTO } from "@/types";
import { PriceSummary } from "../PriceSummary";
import { AvailabilityStatus } from "./AvailabilityStatus";
import {
  defaultsFor,
  preview,
  toPayload,
  type BookingFormValues,
  type BookingPrefill,
} from "./booking-form-utils";
import { CourtSportFields } from "./CourtSportFields";
import { CustomerFields } from "./CustomerFields";
import { DateTimeFields } from "./DateTimeFields";
import { FormSection } from "./FormSection";
import { NotesField } from "./NotesField";
import { PastDateConfirm } from "./PastDateConfirm";
import { PaymentFields } from "./PaymentFields";
import { useCustomerLookup } from "./use-customer-lookup";
import { useSlotAvailability } from "./use-slot-availability";

export interface BookingFormProps {
  booking?: BookingDTO | null;
  prefill?: BookingPrefill;
  onSaved?: (booking: BookingDTO) => void;
  onCancel: () => void;
}

/** Create/edit booking form. Defaults are captured on mount, so mount it once the booking is loaded. */
export function BookingForm({
  booking,
  prefill,
  onSaved,
  onCancel,
}: BookingFormProps) {
  const isEdit = !!booking;
  const { data: allCourts = [] } = useGetCourtsQuery({ includeArchived: true });
  const courts = useMemo(
    () => allCourts.filter((c) => !c.isArchived || c._id === booking?.court),
    [allCourts, booking],
  );
  const [createBooking] = useCreateBookingMutation();
  const [updateBooking] = useUpdateBookingMutation();
  const [pastConfirmed, setPastConfirmed] = useState(false);

  const [defaultValues] = useState(() => defaultsFor(booking, prefill));
  const form = useForm<BookingFormValues>({ mode: "onTouched", defaultValues });

  const values = {
    ...defaultValues,
    ...useWatch({ control: form.control }),
  } as BookingFormValues;
  const { courtChanged, rate, durationMinutes, price } = preview(
    values,
    booking,
    courts,
  );
  const advance =
    !isEdit && isNonNegativeInt(values.advanceAmount)
      ? values.advanceAmount
      : 0;
  const alreadyPaid = booking?.amountPaid ?? 0;
  const statusAfterSave = deriveBookingStatus(
    booking?.status ?? "pending",
    advance + alreadyPaid,
    price.totalAmount,
  );

  const matchedCustomer = useCustomerLookup(form, values.phone, booking);
  const availability = useSlotAvailability(values, booking);
  const isPastDate = !!values.bookingDate && values.bookingDate < todayPkt();

  async function onSubmit(v: BookingFormValues) {
    const payload = toPayload(v, isEdit);
    try {
      const saved = isEdit
        ? await updateBooking({ id: booking._id, ...payload }).unwrap()
        : await createBooking(payload).unwrap();

      toast.success("Request successful", {
        description: isEdit
          ? `Booking ${saved.bookingNumber} updated`
          : `Booking ${saved.bookingNumber} created`,
      });
      
      onSaved?.(saved);
    } catch (error) {
      if (isAppError(error) && error.status === 409) {
        availability.reportConflict(error.message);
        return;
      }
      applyServerErrors(error, form.setError);
    }
  }

  const submitting = form.formState.isSubmitting;
  const submitDisabled =
    submitting || availability.blocked || (isPastDate && !pastConfirmed);

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        noValidate
        className="grid  gap-4 "
      >
        <div className="grid min-w-0 content-start gap-4">
          <FormSection
            icon={User}
            title="Customer"
            description="Returning customers are filled in from their phone number."
          >
            <CustomerFields
              matchedCustomer={matchedCustomer}
              autoFocus={!isEdit}
            />
          </FormSection>

          <div className="grid lg:grid-cols-2 gap-4 ">
            <FormSection
              icon={LandPlot}
              title="Court & sport"
              description="Pick where they'll play. The court sets the hourly rate."
            >
              <CourtSportFields
                courts={courts}
                repriceRate={courtChanged ? rate : null}
              />
            </FormSection>

            <FormSection
              icon={CalendarClock}
              title="Schedule"
              description="We check the slot against other bookings as you type."
            >
              <DateTimeFields
                bookingDate={values.bookingDate}
                startTime={values.startTime}
                endTime={values.endTime}
              />
              <AvailabilityStatus state={availability.state} />
              {isPastDate && (
                <PastDateConfirm
                  confirmed={pastConfirmed}
                  onConfirmedChange={setPastConfirmed}
                />
              )}
            </FormSection>
          </div>

          <FormSection
            icon={Wallet}
            title="Payment"
            description={
              isEdit
                ? "Adjust the discount. Collect money with “Record Payment”."
                : "Optional advance and discount."
            }
          >
            <PaymentFields
              booking={booking}
              courts={courts}
              discountType={values.discountType}
            />
          </FormSection>
          <FormSection icon={NotebookPen} title="Notes">
            <NotesField />
          </FormSection>
        </div>

        <aside className="grid content-start gap-3 md:sticky md:top-20 md:self-start">
          <PriceSummary
            rate={rate}
            durationMinutes={durationMinutes}
            price={price}
            advance={isEdit ? undefined : advance}
            alreadyPaid={isEdit ? alreadyPaid : undefined}
            statusAfterSave={statusAfterSave}
          />
          <Button type="submit" size="lg" disabled={submitDisabled}>
            {submitting && <Loader2 className="animate-spin" />}
            {isEdit ? "Save changes" : "Create booking"}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </aside>
      </form>
    </Form>
  );
}
