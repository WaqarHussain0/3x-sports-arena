'use client';

import { useForm } from 'react-hook-form';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { MoneyInput } from '@/components/shared/MoneyInput';
import { applyServerErrors } from '@/lib/form';
import { formatCurrency } from '@/lib/format';
import { isPositiveInt } from '@/lib/validators';
import { useRecordPaymentMutation } from '@/store/api/bookingsApi';
import type { BookingDTO } from '@/types';

interface PaymentFormValues {
  amount: number;
  note: string;
}

export function RecordPaymentDialog({
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
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Record payment</DialogTitle>
          <DialogDescription>
            {booking.bookingNumber} · Remaining {formatCurrency(booking.remainingAmount)}
          </DialogDescription>
        </DialogHeader>
        <PaymentForm booking={booking} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function PaymentForm({ booking, onDone }: { booking: BookingDTO; onDone: () => void }) {
  const [recordPayment] = useRecordPaymentMutation();
  const form = useForm<PaymentFormValues>({
    mode: 'onTouched',
    defaultValues: { amount: booking.remainingAmount, note: '' },
  });

  async function onSubmit(values: PaymentFormValues) {
    try {
      await recordPayment({ id: booking._id, amount: values.amount, note: values.note.trim() || undefined }).unwrap();
      toast.success(`Payment of ${formatCurrency(values.amount)} recorded`);
      onDone();
    } catch (error) {
      applyServerErrors(error, form.setError);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4" noValidate>
        <FormField
          control={form.control}
          name="amount"
          rules={{
            validate: (v) =>
              !isPositiveInt(v)
                ? 'Enter a whole number of rupees (at least 1)'
                : v <= booking.remainingAmount ||
                  `Payment cannot exceed the remaining balance (${formatCurrency(booking.remainingAmount)})`,
          }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount</FormLabel>
              <FormControl>
                <MoneyInput
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                  min={1}
                  max={booking.remainingAmount}
                  autoFocus
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="note"
          rules={{ maxLength: { value: 200, message: 'Note must be at most 200 characters' } }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Note <span className="font-normal text-muted-foreground">(optional)</span>
              </FormLabel>
              <FormControl>
                <Input placeholder="e.g. Paid after match" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onDone}>
            Cancel
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting && <Loader2 className="animate-spin" />}
            Record payment
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
