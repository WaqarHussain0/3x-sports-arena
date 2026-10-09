"use client";

import { useFormContext } from "react-hook-form";
import { Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { SPORT_ICONS } from "@/components/shared/SportBadge";
import { SPORT_TYPES, label } from "@/lib/constants";
import { formatCurrency } from "@/lib/format";
import type { CourtDTO } from "@/types";
import type { BookingFormValues } from "./booking-form-utils";

export function CourtSportFields({
  courts,
  repriceRate,
}: {
  courts: CourtDTO[];
  /** Set when editing and the court changed: the new hourly rate the booking will use. */
  repriceRate: number | null;
}) {
  const { control } = useFormContext<BookingFormValues>();

  return (
    <>
      <div className="grid gap-4 ">
        <FormField
          control={control}
          name="courtId"
          rules={{ required: "Court is required" }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Court</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full" onBlur={field.onBlur}>
                    <SelectValue placeholder="Select a court" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {courts.map((c) => (
                    <SelectItem key={c._id} value={c._id}>
                      <span
                        className="size-2 rounded-full"
                        style={{ backgroundColor: c.color }}
                      />
                      {c.name} · {formatCurrency(c.pricePerHour)}/h
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="sportType"
          rules={{ required: "Sport is required" }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sport</FormLabel>
              <FormControl>
                <ToggleGroup
                  type="single"
                  variant="outline"
                  spacing={0}
                  value={field.value}
                  onValueChange={(v) => v && field.onChange(v)}
                  className="w-full"
                >
                  {SPORT_TYPES.map((s) => {
                    const Icon = SPORT_ICONS[s];
                    return (
                      <ToggleGroupItem key={s} value={s} className="flex-1">
                        <Icon /> {label(s)}
                      </ToggleGroupItem>
                    );
                  })}
                </ToggleGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      {repriceRate !== null && (
        <Alert>
          <Info />
          <AlertDescription>
            Changing the court will re-price this booking at{" "}
            {formatCurrency(repriceRate)}/hour.
          </AlertDescription>
        </Alert>
      )}
    </>
  );
}
