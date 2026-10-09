"use client";

import { useFormContext } from "react-hook-form";
import { UserCheck } from "lucide-react";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  customerNameRules,
  optionalEmailRules,
  phoneRules,
} from "@/lib/validators";
import type { CustomerDTO } from "@/types";
import type { BookingFormValues } from "./booking-form-utils";

export function CustomerFields({
  matchedCustomer,
  autoFocus,
}: {
  matchedCustomer: CustomerDTO | null;
  autoFocus?: boolean;
}) {
  const { control } = useFormContext<BookingFormValues>();

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <FormField
        control={control}
        name="phone"
        rules={phoneRules}
        render={({ field }) => (
          <FormItem className="sm:col-span-2">
            <FormLabel>Phone number</FormLabel>
            <FormControl>
              <Input
                type="tel"
                inputMode="tel"
                placeholder="0300 1234567"
                autoFocus={autoFocus}
                {...field}
              />
            </FormControl>
            {matchedCustomer && (
              <p className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400">
                <UserCheck className="size-3.5" />
                Returning customer · {matchedCustomer.totalBookings} booking
                {matchedCustomer.totalBookings === 1 ? "" : "s"}
              </p>
            )}
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="customerName"
        rules={customerNameRules}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Customer name</FormLabel>
            <FormControl>
              <Input autoComplete="off" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="email"
        rules={optionalEmailRules}
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Email{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </FormLabel>
            <FormControl>
              <Input type="email" autoComplete="off" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
