"use client";

import { useFormContext } from "react-hook-form";
import { Badge } from "@/components/ui/badge";
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
import { DatePicker } from "@/components/shared/DatePicker";
import { formatTimeOfDay } from "@/lib/format";
import { addDaysStr, endsNextDay, formatDateStr } from "@/lib/time";
import { TIME_OPTIONS, type BookingFormValues } from "./booking-form-utils";

export function DateTimeFields({
  bookingDate,
  startTime,
  endTime,
}: Pick<BookingFormValues, "bookingDate" | "startTime" | "endTime">) {
  const form = useFormContext<BookingFormValues>();
  const nextDay = startTime && endTime && endsNextDay(startTime, endTime);

  return (
    <>
      <div className="grid gap-4 grid-cols-2">
        <FormField
          control={form.control}
          name="bookingDate"
          rules={{ required: "Date is required" }}
          render={({ field, fieldState }) => (
            <FormItem className="col-span-2">
              <FormLabel>Date</FormLabel>
              <FormControl>
                <DatePicker
                  value={field.value}
                  onChange={field.onChange}
                  aria-invalid={!!fieldState.error}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="startTime"
          rules={{ required: "Start time is required" }}
          render={({ field }) => (
            <FormItem className="col-span-2 md:col-span-1">
              <FormLabel>Start time</FormLabel>
              <Select
                value={field.value}
                onValueChange={(v) => {
                  field.onChange(v);
                  if (form.getFieldState("endTime").isTouched)
                    form.trigger("endTime");
                }}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="max-h-72">
                  {TIME_OPTIONS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {formatTimeOfDay(t)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="endTime"
          rules={{
            required: "End time is required",
            validate: (v, fv) =>
              v !== fv.startTime || "End time must differ from start time.",
          }}
          render={({ field }) => (
            <FormItem className="col-span-2 md:col-span-1">
              <FormLabel>End time</FormLabel>
              <Select
                value={field.value}
                onValueChange={(v) => {
                  field.onChange(v);
                  form.trigger("endTime");
                }}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="max-h-72">
                  {TIME_OPTIONS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {formatTimeOfDay(t)}
                      {startTime && endsNextDay(startTime, t) && (
                        <span className="text-xs text-muted-foreground">
                          (next day)
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      {nextDay && bookingDate && (
        <div>
          <Badge variant="secondary">
            Ends next day ({formatDateStr(addDaysStr(bookingDate, 1), "dd MMM")}
            )
          </Badge>
        </div>
      )}
    </>
  );
}
