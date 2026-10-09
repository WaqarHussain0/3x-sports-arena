import {
  TIME_STEP_MINUTES,
  type DiscountType,
  type SportType,
} from "@/lib/constants";
import { normalizePhone } from "@/lib/phone";
import { calculateBookingPrice } from "@/lib/pricing";
import {
  durationBetweenTimes,
  isValidDateString,
  minutesSincePktMidnight,
  minutesToTime,
  timeSteps,
  timeToMinutes,
  todayPkt,
  toPktDateString,
  toPktTimeString,
} from "@/lib/time";
import { isNonNegativeInt } from "@/lib/validators";
import type { BookingDTO, BookingPayload, CourtDTO } from "@/types";

export interface BookingFormValues {
  phone: string;
  customerName: string;
  email: string;
  courtId: string;
  sportType: SportType;
  bookingDate: string;
  startTime: string;
  endTime: string;
  discountType: DiscountType;
  discountValue: number;
  advanceAmount: number;
  notes: string;
}

export interface BookingPrefill {
  courtId?: string;
  date?: string;
  startTime?: string;
}

export const TIME_OPTIONS = timeSteps();

/** Query-string form of a prefill, used to link to `/bookings/new`. */
export function prefillToSearchParams(prefill?: BookingPrefill): string {
  const params = new URLSearchParams();
  if (prefill?.courtId) params.set("court", prefill.courtId);
  if (prefill?.date) params.set("date", prefill.date);
  if (prefill?.startTime) params.set("start", prefill.startTime);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

/** Reads a prefill from `/bookings/new` search params, dropping anything malformed. */
export function prefillFromSearchParams(
  sp: Record<string, string | string[] | undefined>,
): BookingPrefill {
  const first = (v: string | string[] | undefined) =>
    Array.isArray(v) ? v[0] : v;
  const court = first(sp.court);
  const date = first(sp.date);
  const start = first(sp.start);
  return {
    courtId: court || undefined,
    date: isValidDateString(date) ? date : undefined,
    startTime: start && TIME_OPTIONS.includes(start) ? start : undefined,
  };
}

function nextStepTime(): string {
  const minute = minutesSincePktMidnight(new Date());
  return minutesToTime(
    Math.ceil((minute + 1) / TIME_STEP_MINUTES) * TIME_STEP_MINUTES,
  );
}

export function defaultsFor(
  booking: BookingDTO | null | undefined,
  prefill: BookingPrefill | undefined,
): BookingFormValues {
  if (booking) {
    return {
      phone: booking.customerSnapshot.phone,
      customerName: booking.customerSnapshot.name,
      email: booking.customerSnapshot.email ?? "",
      courtId: booking.court,
      sportType: booking.sportType,
      bookingDate: toPktDateString(booking.startAt),
      startTime: toPktTimeString(booking.startAt),
      endTime: toPktTimeString(booking.endAt),
      discountType: booking.discount.type,
      discountValue:
        booking.discount.type === "none" ? Number.NaN : booking.discount.value,
      advanceAmount: Number.NaN,
      notes: booking.notes ?? "",
    };
  }
  const startTime = prefill?.startTime ?? nextStepTime();
  return {
    phone: "",
    customerName: "",
    email: "",
    courtId: prefill?.courtId ?? "",
    sportType: "cricket",
    bookingDate: prefill?.date ?? todayPkt(),
    startTime,
    endTime: minutesToTime(timeToMinutes(startTime) + 60),
    discountType: "none",
    discountValue: Number.NaN,
    advanceAmount: Number.NaN,
    notes: "",
  };
}

/** Pricing preview for the given form values (shared by render and cross-field validators). */
export function preview(
  values: BookingFormValues,
  booking: BookingDTO | null | undefined,
  courts: CourtDTO[],
) {
  const court = courts.find((c) => c._id === values.courtId);
  const courtChanged = !!booking && values.courtId !== booking.court;
  const rate =
    booking && !courtChanged
      ? booking.pricePerHourSnapshot
      : (court?.pricePerHour ?? null);
  const durationMinutes =
    values.startTime && values.endTime
      ? durationBetweenTimes(values.startTime, values.endTime)
      : 0;
  const price = calculateBookingPrice({
    pricePerHour: rate ?? 0,
    durationMinutes,
    discountType: values.discountType,
    discountValue: Number.isFinite(values.discountValue)
      ? values.discountValue
      : 0,
  });
  return { court, courtChanged, rate, durationMinutes, price };
}

export function toPayload(
  v: BookingFormValues,
  isEdit: boolean,
): BookingPayload {
  return {
    customerName: v.customerName.trim(),
    phone: normalizePhone(v.phone) ?? v.phone,
    email: v.email.trim() || undefined,
    courtId: v.courtId,
    sportType: v.sportType,
    bookingDate: v.bookingDate,
    startTime: v.startTime,
    endTime: v.endTime,
    discountType: v.discountType,
    discountValue: v.discountType === "none" ? undefined : v.discountValue,
    advanceAmount: isEdit
      ? undefined
      : isNonNegativeInt(v.advanceAmount)
        ? v.advanceAmount
        : 0,
    notes: v.notes.trim(),
  };
}
