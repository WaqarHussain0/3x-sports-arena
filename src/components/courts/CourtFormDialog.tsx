'use client';

import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Check, Info, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MoneyInput } from '@/components/shared/MoneyInput';
import { COURT_COLORS, DEFAULT_COURT_COLOR } from '@/lib/constants';
import { applyServerErrors } from '@/lib/form';
import { categoryDescriptionRules, courtNameRules, courtPriceRules } from '@/lib/validators';
import { useCreateCourtMutation, useUpdateCourtMutation } from '@/store/api/courtsApi';
import type { CourtDTO } from '@/types';

interface CourtFormValues {
  name: string;
  pricePerHour: number;
  description: string;
  color: string;
}

export function CourtFormDialog({
  open,
  onOpenChange,
  court,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  court?: CourtDTO | null;
}) {
  const isEdit = !!court;
  const [createCourt] = useCreateCourtMutation();
  const [updateCourt] = useUpdateCourtMutation();

  const form = useForm<CourtFormValues>({
    mode: 'onTouched',
    defaultValues: { name: '', pricePerHour: Number.NaN, description: '', color: DEFAULT_COURT_COLOR },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: court?.name ?? '',
        pricePerHour: court?.pricePerHour ?? Number.NaN,
        description: court?.description ?? '',
        color: court?.color ?? DEFAULT_COURT_COLOR,
      });
    }
  }, [open, court, form]);

  const price = useWatch({ control: form.control, name: 'pricePerHour' });
  const priceChanged = isEdit && Number.isFinite(price) && price !== court?.pricePerHour;

  async function onSubmit(values: CourtFormValues) {
    const payload = {
      name: values.name.trim(),
      pricePerHour: values.pricePerHour,
      description: values.description.trim(),
      color: values.color,
    };
    try {
      if (isEdit) await updateCourt({ id: court._id, ...payload }).unwrap();
      else await createCourt(payload).unwrap();
      toast.success(isEdit ? 'Court updated' : 'Court added');
      onOpenChange(false);
    } catch (error) {
      applyServerErrors(error, form.setError);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit court' : 'Add court'}</DialogTitle>
          <DialogDescription>Courts are priced per hour; bookings can be any length in 15-minute steps.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4" noValidate>
            <FormField
              control={form.control}
              name="name"
              rules={courtNameRules}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Natural Grass Court" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="pricePerHour"
              rules={courtPriceRules}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price per hour</FormLabel>
                  <FormControl>
                    <MoneyInput
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                      placeholder="2000"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {priceChanged && (
              <Alert>
                <Info />
                <AlertDescription>Existing bookings will keep their original price.</AlertDescription>
              </Alert>
            )}
            <FormField
              control={form.control}
              name="description"
              rules={categoryDescriptionRules}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Description <span className="font-normal text-muted-foreground">(optional)</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea rows={2} placeholder="Surface, size, notes…" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="color"
              rules={{ required: 'Pick a color' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Calendar color</FormLabel>
                  <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Calendar color">
                    {COURT_COLORS.map((color) => {
                      const selected = field.value?.toLowerCase() === color;
                      return (
                        <button
                          key={color}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          aria-label={color}
                          onClick={() => field.onChange(color)}
                          className="flex size-8 items-center justify-center rounded-full ring-offset-2 ring-offset-background transition focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none aria-checked:ring-2 aria-checked:ring-foreground"
                          style={{ backgroundColor: color }}
                        >
                          {selected && <Check className="size-4 text-white" />}
                        </button>
                      );
                    })}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="animate-spin" />}
                {isEdit ? 'Save changes' : 'Add court'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
