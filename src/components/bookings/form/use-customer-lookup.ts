import { useEffect, useRef } from "react";
import type { UseFormReturn } from "react-hook-form";
import { skipToken } from "@reduxjs/toolkit/query/react";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { AVAILABILITY_DEBOUNCE_MS } from "@/lib/constants";
import { normalizePhone } from "@/lib/phone";
import { useLookupCustomerQuery } from "@/store/api/customersApi";
import type { BookingDTO } from "@/types";
import type { BookingFormValues } from "./booking-form-utils";

/** Looks up a returning customer by phone and autofills name/email once per matched number. */
export function useCustomerLookup(
  form: UseFormReturn<BookingFormValues>,
  phone: string,
  booking: BookingDTO | null | undefined,
) {
  const lastAutofilledPhone = useRef<string | null>(
    booking?.customerSnapshot.phone ?? null,
  );

  const normalizedPhone = normalizePhone(phone);
  const lookupPhone = useDebouncedValue(
    normalizedPhone,
    AVAILABILITY_DEBOUNCE_MS,
  );
  const { data: customer } = useLookupCustomerQuery(lookupPhone ?? skipToken);
  const matchedCustomer =
    customer && customer.phone === normalizedPhone ? customer : null;

  useEffect(() => {
    if (
      !matchedCustomer ||
      lastAutofilledPhone.current === matchedCustomer.phone
    )
      return;
    lastAutofilledPhone.current = matchedCustomer.phone;
    form.setValue("customerName", matchedCustomer.name, {
      shouldValidate: true,
    });
    form.setValue("email", matchedCustomer.email ?? "", {
      shouldValidate: true,
    });
  }, [matchedCustomer, form]);

  return matchedCustomer;
}
