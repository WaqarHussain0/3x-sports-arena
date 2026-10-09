"use client";

import { useFormContext } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MoneyInput } from "@/components/shared/MoneyInput";
import type { DiscountType } from "@/lib/constants";
import { formatCurrency } from "@/lib/format";
import { validateDiscount } from "@/lib/pricing";
import { isNonNegativeInt } from "@/lib/validators";
import type { BookingDTO, CourtDTO } from "@/types";
import { preview, type BookingFormValues } from "./booking-form-utils";

/** Advance (create only) and discount fields. Cross-field rules re-price from the live form values. */
export function PaymentFields({
  booking,
  courts,
  discountType,
}: {
  booking: BookingDTO | null | undefined;
  courts: CourtDTO[];
  discountType: DiscountType;
}) {
  const form = useFormContext<BookingFormValues>();
  const isEdit = !!booking;

  return (
    <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-3">
      {!isEdit && (
        <FormField
          control={form.control}
          name="advanceAmount"
          rules={{
            validate: (v, fv) => {
              if (!Number.isFinite(v)) return true;
              if (!isNonNegativeInt(v))
                return "Advance must be a whole number of rupees";
              const total = preview(fv, booking, courts).price.totalAmount;
              return (
                v <= total ||
                `Advance cannot exceed the total (${formatCurrency(total)})`
              );
            },
          }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Advance{" "}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </FormLabel>
              <FormControl>
                <MoneyInput
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                  placeholder="0"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      <FormField
        control={form.control}
        name="discountType"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Discount</FormLabel>
            <Select
              value={field.value}
              onValueChange={(v) => {
                field.onChange(v);
                form.clearErrors("discountValue");
              }}
            >
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="percentage">Percentage</SelectItem>
                <SelectItem value="fixed">Fixed amount</SelectItem>
              </SelectContent>
            </Select>
          </FormItem>
        )}
      />
      {discountType !== "none" && (
        <FormField
          control={form.control}
          name="discountValue"
          rules={{
            validate: (v, fv) => {
              if (fv.discountType === "none") return true;
              if (!Number.isFinite(v)) return "Enter a discount value";
              const gross = preview(fv, booking, courts).price.grossAmount;
              return validateDiscount(fv.discountType, v, gross) ?? true;
            },
          }}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <MoneyInput
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                  prefix={discountType === "fixed" ? "Rs" : null}
                  suffix={discountType === "percentage" ? "%" : undefined}
                  min={1}
                  max={discountType === "percentage" ? 100 : undefined}
                  aria-label="Discount value"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </div>
  );
}
