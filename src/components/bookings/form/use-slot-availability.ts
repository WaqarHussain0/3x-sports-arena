import { useState } from "react";
import { skipToken } from "@reduxjs/toolkit/query/react";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { AVAILABILITY_DEBOUNCE_MS } from "@/lib/constants";
import { buildStartEnd } from "@/lib/time";
import { useCheckAvailabilityQuery } from "@/store/api/bookingsApi";
import type { BookingDTO } from "@/types";
import type { BookingFormValues } from "./booking-form-utils";

export type AvailabilityState =
  | { kind: "idle" }
  | { kind: "checking" }
  | { kind: "available" }
  | { kind: "conflict"; message: string };

/** Live, debounced overlap check for the selected court and time slot. */
export function useSlotAvailability(
  values: BookingFormValues,
  booking: BookingDTO | null | undefined,
) {
  /** Server-side 409 message, tied to the slot it was reported for. */
  const [serverConflict, setServerConflict] = useState<{
    key: string | null;
    message: string;
  } | null>(null);

  const times = buildStartEnd(
    values.bookingDate,
    values.startTime,
    values.endTime,
  );
  const availabilityKey =
    values.courtId && times.ok
      ? JSON.stringify({
          court: values.courtId,
          startAt: times.value.startAt.toISOString(),
          endAt: times.value.endAt.toISOString(),
          ...(booking ? { excludeId: booking._id } : {}),
        })
      : null;
  const debouncedKey = useDebouncedValue(
    availabilityKey,
    AVAILABILITY_DEBOUNCE_MS,
  );
  const availabilityArgs = debouncedKey ? JSON.parse(debouncedKey) : null;
  const availability = useCheckAvailabilityQuery(
    availabilityArgs ?? skipToken,
    {
      refetchOnMountOrArgChange: true,
    },
  );
  const availabilitySettled =
    !!availabilityKey &&
    debouncedKey === availabilityKey &&
    !availability.isFetching &&
    !!availability.data;
  const hasConflict =
    availabilitySettled && availability.data?.available === false;

  const conflictMessage =
    serverConflict && serverConflict.key === availabilityKey
      ? serverConflict.message
      : null;

  const state: AvailabilityState = !availabilityKey
    ? { kind: "idle" }
    : conflictMessage
      ? { kind: "conflict", message: conflictMessage }
      : !availabilitySettled
        ? { kind: "checking" }
        : hasConflict
          ? {
              kind: "conflict",
              message:
                availability.data?.message ??
                "This slot overlaps another booking.",
            }
          : { kind: "available" };

  /** Records a 409 from save against the current slot and re-checks it. */
  function reportConflict(message: string) {
    setServerConflict({ key: availabilityKey, message });
    availability.refetch();
  }

  return { state, blocked: hasConflict || !!conflictMessage, reportConflict };
}
