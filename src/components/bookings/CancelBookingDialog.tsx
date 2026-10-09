"use client";

import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import type { AdvanceHandling } from "@/lib/constants";
import { applyServerErrors } from "@/lib/form";
import { formatCurrency, formatDate, formatTimeRange } from "@/lib/format";
import { useCancelBookingMutation } from "@/store/api/bookingsApi";
import type { BookingDTO } from "@/types";

interface CancelFormValues {
  reason: string;
  advanceHandling: AdvanceHandling | "";
}

export function CancelBookingDialog({
  open,
  onOpenChange,
  booking,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: BookingDTO;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cancel booking {booking.bookingNumber}?</DialogTitle>
          <DialogDescription>
            {booking.customerSnapshot.name} · {formatDate(booking.startAt)},{" "}
            {formatTimeRange(booking.startAt, booking.endAt)}. The slot will be
            released immediately.
          </DialogDescription>
        </DialogHeader>
        <CancelForm booking={booking} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function CancelForm({
  booking,
  onDone,
}: {
  booking: BookingDTO;
  onDone: () => void;
}) {
  const [cancelBooking] = useCancelBookingMutation();
  const paid = booking.amountPaid;
  const form = useForm<CancelFormValues>({
    mode: "onTouched",
    defaultValues: { reason: "", advanceHandling: "" },
  });

  async function onSubmit(values: CancelFormValues) {
    try {
      await cancelBooking({
        id: booking._id,
        reason: values.reason.trim() || undefined,
        advanceHandling:
          paid > 0 && values.advanceHandling
            ? values.advanceHandling
            : undefined,
      }).unwrap();

      toast.success("Request successful", {
        description: `Booking ${booking.bookingNumber} cancelled`,
      });
      onDone();
    } catch (error) {
      applyServerErrors(error, form.setError);
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="grid gap-4"
        noValidate
      >
        <FormField
          control={form.control}
          name="reason"
          rules={{
            maxLength: {
              value: 500,
              message: "Reason must be at most 500 characters",
            },
          }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Reason{" "}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </FormLabel>
              <FormControl>
                <Textarea
                  rows={2}
                  placeholder="e.g. Customer called to cancel"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {paid > 0 && (
          <FormField
            control={form.control}
            name="advanceHandling"
            rules={{ required: "Choose whether to refund or keep the advance" }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Advance of {formatCurrency(paid)}</FormLabel>
                <FormControl>
                  <RadioGroup
                    value={field.value}
                    onValueChange={field.onChange}
                    className="gap-2"
                  >
                    <Label className="flex items-center gap-2 rounded-lg border p-3 font-normal has-data-[state=checked]:border-primary">
                      <RadioGroupItem value="refunded" /> Refund{" "}
                      {formatCurrency(paid)} to customer
                    </Label>
                    <Label className="flex items-center gap-2 rounded-lg border p-3 font-normal has-data-[state=checked]:border-primary">
                      <RadioGroupItem value="retained" /> Keep{" "}
                      {formatCurrency(paid)} advance
                    </Label>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onDone}>
            Keep booking
          </Button>
          <Button
            type="submit"
            variant="destructive"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting && (
              <Loader2 className="animate-spin" />
            )}
            Cancel booking
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
