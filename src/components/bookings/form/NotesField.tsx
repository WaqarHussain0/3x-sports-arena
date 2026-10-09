"use client";

import { useFormContext } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { notesRules } from "@/lib/validators";
import type { BookingFormValues } from "./booking-form-utils";

export function NotesField() {
  const { control } = useFormContext<BookingFormValues>();

  return (
    <FormField
      control={control}
      name="notes"
      rules={notesRules}
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            Notes{" "}
            <span className="font-normal text-muted-foreground">
              (optional)
            </span>
          </FormLabel>
          <FormControl>
            <Textarea rows={2} maxLength={500} {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
