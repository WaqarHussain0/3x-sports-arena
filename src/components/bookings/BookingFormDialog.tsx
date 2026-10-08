'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { skipToken } from '@reduxjs/toolkit/query/react';
import { AlertTriangle, CheckCircle2, Info, Loader2, UserCheck, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { DatePicker } from '@/components/shared/DatePicker';
import { MoneyInput } from '@/components/shared/MoneyInput';
import { SPORT_ICONS } from '@/components/shared/SportBadge';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import {
  AVAILABILITY_DEBOUNCE_MS,
  SPORT_TYPES,
  TIME_STEP_MINUTES,
  label,
  type DiscountType,
  type SportType,
} from '@/lib/constants';
import { applyServerErrors } from '@/lib/form';
import { formatCurrency, formatTimeOfDay } from '@/lib/format';
import { normalizePhone } from '@/lib/phone';
import { calculateBookingPrice, deriveBookingStatus, validateDiscount } from '@/lib/pricing';
import {
  addDaysStr,
  buildStartEnd,
  durationBetweenTimes,
  endsNextDay,
  formatDateStr,
  minutesSincePktMidnight,
  minutesToTime,
  timeSteps,
  timeToMinutes,
  todayPkt,
  toPktDateString,
  toPktTimeString,
} from '@/lib/time';
import { customerNameRules, isNonNegativeInt, notesRules, optionalEmailRules, phoneRules } from '@/lib/validators';
import { isAppError } from '@/store/api/baseApi';
import { useCheckAvailabilityQuery, useCreateBookingMutation, useUpdateBookingMutation } from '@/store/api/bookingsApi';
import { useGetCourtsQuery } from '@/store/api/courtsApi';
import { useLookupCustomerQuery } from '@/store/api/customersApi';
import type { BookingDTO, BookingPayload, CourtDTO } from '@/types';
import { PriceSummary } from './PriceSummary';

interface BookingFormValues {
  phone: string;
  customerName: string;
  email: string;
  courtId: string;
  sportType: SportType;
  bookingDate: string;
  startTime: string;
  endTime: string;
  discountType: DiscountType;
  discountValue: number;
  advanceAmount: number;
  notes: string;
}

export interface BookingPrefill {
  courtId?: string;
  date?: string;
  startTime?: string;
}

const TIME_OPTIONS = timeSteps();

function nextStepTime(): string {
  const minute = minutesSincePktMidnight(new Date());
  return minutesToTime(Math.ceil((minute + 1) / TIME_STEP_MINUTES) * TIME_STEP_MINUTES);
}

function defaultsFor(booking: BookingDTO | null | undefined, prefill: BookingPrefill | undefined): BookingFormValues {
  if (booking) {
    return {
      phone: booking.customerSnapshot.phone,
      customerName: booking.customerSnapshot.name,
      email: booking.customerSnapshot.email ?? '',
      courtId: booking.court,
      sportType: booking.sportType,
      bookingDate: toPktDateString(booking.startAt),
      startTime: toPktTimeString(booking.startAt),
      endTime: toPktTimeString(booking.endAt),
      discountType: booking.discount.type,
      discountValue: booking.discount.type === 'none' ? Number.NaN : booking.discount.value,
      advanceAmount: Number.NaN,
      notes: booking.notes ?? '',
    };
  }
  const startTime = prefill?.startTime ?? nextStepTime();
  return {
    phone: '',
    customerName: '',
    email: '',
    courtId: prefill?.courtId ?? '',
    sportType: 'cricket',
    bookingDate: prefill?.date ?? todayPkt(),
    startTime,
    endTime: minutesToTime(timeToMinutes(startTime) + 60),
    discountType: 'none',
    discountValue: Number.NaN,
    advanceAmount: Number.NaN,
    notes: '',
  };
}

/** Pricing preview for the given form values (shared by render and cross-field validators). */
function preview(values: BookingFormValues, booking: BookingDTO | null | undefined, courts: CourtDTO[]) {
  const court = courts.find((c) => c._id === values.courtId);
  const courtChanged = !!booking && values.courtId !== booking.court;
  const rate = booking && !courtChanged ? booking.pricePerHourSnapshot : (court?.pricePerHour ?? null);
  const durationMinutes =
    values.startTime && values.endTime ? durationBetweenTimes(values.startTime, values.endTime) : 0;
  const price = calculateBookingPrice({
    pricePerHour: rate ?? 0,
    durationMinutes,
    discountType: values.discountType,
    discountValue: Number.isFinite(values.discountValue) ? values.discountValue : 0,
  });
  return { court, courtChanged, rate, durationMinutes, price };
}

interface BookingFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking?: BookingDTO | null;
  prefill?: BookingPrefill;
  onSaved?: (booking: BookingDTO) => void;
}

export function BookingFormDialog(props: BookingFormDialogProps) {
  const { open, onOpenChange, booking } = props;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92svh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{booking ? `Edit booking ${booking.bookingNumber}` : 'Create booking'}</DialogTitle>
          <DialogDescription>
            Times are in Pakistan time (PKT). An end time earlier than the start ends on the next day.
          </DialogDescription>
        </DialogHeader>
        {/* Mounted only while open, so every opening starts from fresh defaults. */}
        <BookingFormBody {...props} />
      </DialogContent>
    </Dialog>
  );
}

function BookingFormBody({ onOpenChange, booking, prefill, onSaved }: BookingFormDialogProps) {
  const isEdit = !!booking;
  const { data: allCourts = [] } = useGetCourtsQuery({ includeArchived: true });
  const courts = useMemo(
    () => allCourts.filter((c) => !c.isArchived || c._id === booking?.court),
    [allCourts, booking],
  );
  const [createBooking] = useCreateBookingMutation();
  const [updateBooking] = useUpdateBookingMutation();

  /** Server-side 409 message, tied to the slot it was reported for. */
  const [serverConflict, setServerConflict] = useState<{ key: string | null; message: string } | null>(null);
  const [pastConfirmed, setPastConfirmed] = useState(false);
  const lastAutofilledPhone = useRef<string | null>(booking?.customerSnapshot.phone ?? null);

  const [defaultValues] = useState(() => defaultsFor(booking, prefill));
  const form = useForm<BookingFormValues>({ mode: 'onTouched', defaultValues });

  const values = { ...defaultValues, ...useWatch({ control: form.control }) } as BookingFormValues;
  const { courtChanged, rate, durationMinutes, price } = preview(values, booking, courts);
  const advance = !isEdit && isNonNegativeInt(values.advanceAmount) ? values.advanceAmount : 0;
  const alreadyPaid = booking?.amountPaid ?? 0;
  const statusAfterSave = deriveBookingStatus(booking?.status ?? 'pending', advance + alreadyPaid, price.totalAmount);

  // ----- returning-customer lookup -----
  const normalizedPhone = normalizePhone(values.phone);
  const lookupPhone = useDebouncedValue(normalizedPhone, AVAILABILITY_DEBOUNCE_MS);
  const { data: customer } = useLookupCustomerQuery(lookupPhone ?? skipToken);
  const matchedCustomer = customer && customer.phone === normalizedPhone ? customer : null;

  useEffect(() => {
    if (!matchedCustomer || lastAutofilledPhone.current === matchedCustomer.phone) return;
    lastAutofilledPhone.current = matchedCustomer.phone;
    form.setValue('customerName', matchedCustomer.name, { shouldValidate: true });
    form.setValue('email', matchedCustomer.email ?? '', { shouldValidate: true });
  }, [matchedCustomer, form]);

  // ----- live availability -----
  const times = buildStartEnd(values.bookingDate, values.startTime, values.endTime);
  const availabilityKey =
    values.courtId && times.ok
      ? JSON.stringify({
          court: values.courtId,
          startAt: times.value.startAt.toISOString(),
          endAt: times.value.endAt.toISOString(),
          ...(booking ? { excludeId: booking._id } : {}),
        })
      : null;
  const debouncedKey = useDebouncedValue(availabilityKey, AVAILABILITY_DEBOUNCE_MS);
  const availabilityArgs = debouncedKey ? JSON.parse(debouncedKey) : null;
  const availability = useCheckAvailabilityQuery(availabilityArgs ?? skipToken, {
    refetchOnMountOrArgChange: true,
  });
  const availabilitySettled =
    !!availabilityKey && debouncedKey === availabilityKey && !availability.isFetching && !!availability.data;
  const hasConflict = availabilitySettled && availability.data?.available === false;

  const conflictMessage = serverConflict && serverConflict.key === availabilityKey ? serverConflict.message : null;

  const isPastDate = !!values.bookingDate && values.bookingDate < todayPkt();
  const nextDay = values.startTime && values.endTime && endsNextDay(values.startTime, values.endTime);

  async function onSubmit(v: BookingFormValues) {
    const payload: BookingPayload = {
      customerName: v.customerName.trim(),
      phone: normalizePhone(v.phone) ?? v.phone,
      email: v.email.trim() || undefined,
      courtId: v.courtId,
      sportType: v.sportType,
      bookingDate: v.bookingDate,
      startTime: v.startTime,
      endTime: v.endTime,
      discountType: v.discountType,
      discountValue: v.discountType === 'none' ? undefined : v.discountValue,
      advanceAmount: isEdit ? undefined : isNonNegativeInt(v.advanceAmount) ? v.advanceAmount : 0,
      notes: v.notes.trim(),
    };
    try {
      const saved = isEdit
        ? await updateBooking({ id: booking._id, ...payload }).unwrap()
        : await createBooking(payload).unwrap();
      toast.success(isEdit ? `Booking ${saved.bookingNumber} updated` : `Booking ${saved.bookingNumber} created`);
      onSaved?.(saved);
      onOpenChange(false);
    } catch (error) {
      if (isAppError(error) && error.status === 409) {
        setServerConflict({ key: availabilityKey, message: error.message });
        availability.refetch();
        return;
      }
      applyServerErrors(error, form.setError);
    }
  }

  const submitting = form.formState.isSubmitting;
  const submitDisabled = submitting || hasConflict || !!conflictMessage || (isPastDate && !pastConfirmed);

  return (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="grid gap-6 md:grid-cols-[1fr_280px]">
            <div className="grid content-start gap-4">
              {/* Customer */}
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="phone"
                  rules={phoneRules}
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Phone number</FormLabel>
                      <FormControl>
                        <Input type="tel" inputMode="tel" placeholder="0300 1234567" autoFocus={!isEdit} {...field} />
                      </FormControl>
                      {matchedCustomer && (
                        <p className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400">
                          <UserCheck className="size-3.5" />
                          Returning customer · {matchedCustomer.totalBookings} booking
                          {matchedCustomer.totalBookings === 1 ? '' : 's'}
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
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
                  control={form.control}
                  name="email"
                  rules={optionalEmailRules}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Email <span className="font-normal text-muted-foreground">(optional)</span>
                      </FormLabel>
                      <FormControl>
                        <Input type="email" autoComplete="off" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Court & sport */}
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="courtId"
                  rules={{ required: 'Court is required' }}
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
                              <span className="size-2 rounded-full" style={{ backgroundColor: c.color }} />
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
                  control={form.control}
                  name="sportType"
                  rules={{ required: 'Sport is required' }}
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
              {courtChanged && rate !== null && (
                <Alert>
                  <Info />
                  <AlertDescription>Changing the court will re-price this booking at {formatCurrency(rate)}/hour.</AlertDescription>
                </Alert>
              )}

              {/* Date & time */}
              <div className="grid gap-4 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="bookingDate"
                  rules={{ required: 'Date is required' }}
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <DatePicker value={field.value} onChange={field.onChange} aria-invalid={!!fieldState.error} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="startTime"
                  rules={{ required: 'Start time is required' }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start time</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={(v) => {
                          field.onChange(v);
                          if (form.getFieldState('endTime').isTouched) form.trigger('endTime');
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
                    required: 'End time is required',
                    validate: (v, fv) => v !== fv.startTime || 'End time must differ from start time.',
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End time</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={(v) => {
                          field.onChange(v);
                          form.trigger('endTime');
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
                              {values.startTime && endsNextDay(values.startTime, t) && (
                                <span className="text-xs text-muted-foreground">(next day)</span>
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
              {nextDay && values.bookingDate && (
                <div>
                  <Badge variant="secondary">Ends next day ({formatDateStr(addDaysStr(values.bookingDate, 1), 'dd MMM')})</Badge>
                </div>
              )}

              {/* Availability */}
              {availabilityKey && (
                <div aria-live="polite" className="text-sm">
                  {conflictMessage ? (
                    <p className="flex items-center gap-1.5 text-destructive">
                      <XCircle className="size-4" /> {conflictMessage}
                    </p>
                  ) : !availabilitySettled ? (
                    <p className="flex items-center gap-1.5 text-muted-foreground">
                      <Loader2 className="size-4 animate-spin" /> Checking availability…
                    </p>
                  ) : hasConflict ? (
                    <p className="flex items-center gap-1.5 text-destructive">
                      <XCircle className="size-4" /> {availability.data?.message ?? 'This slot overlaps another booking.'}
                    </p>
                  ) : (
                    <p className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                      <CheckCircle2 className="size-4" /> Slot available
                    </p>
                  )}
                </div>
              )}

              {isPastDate && (
                <Alert className="border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
                  <AlertTriangle />
                  <AlertDescription className="text-inherit">
                    <p>This date is in the past. Only continue if you are back-entering a booking.</p>
                    <div className="mt-2 flex items-center gap-2">
                      <Checkbox
                        id="confirm-past"
                        checked={pastConfirmed}
                        onCheckedChange={(c) => setPastConfirmed(c === true)}
                      />
                      <Label htmlFor="confirm-past" className="font-normal">
                        Yes, record a past booking
                      </Label>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Discount & advance */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
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
                            form.clearErrors('discountValue');
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
                  {values.discountType !== 'none' && (
                    <FormField
                      control={form.control}
                      name="discountValue"
                      rules={{
                        validate: (v, fv) => {
                          if (fv.discountType === 'none') return true;
                          if (!Number.isFinite(v)) return 'Enter a discount value';
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
                              prefix={values.discountType === 'fixed' ? 'Rs' : null}
                              suffix={values.discountType === 'percentage' ? '%' : undefined}
                              min={1}
                              max={values.discountType === 'percentage' ? 100 : undefined}
                              aria-label="Discount value"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
                {!isEdit && (
                  <FormField
                    control={form.control}
                    name="advanceAmount"
                    rules={{
                      validate: (v, fv) => {
                        if (!Number.isFinite(v)) return true;
                        if (!isNonNegativeInt(v)) return 'Advance must be a whole number of rupees';
                        const total = preview(fv, booking, courts).price.totalAmount;
                        return v <= total || `Advance cannot exceed the total (${formatCurrency(total)})`;
                      },
                    }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Advance <span className="font-normal text-muted-foreground">(optional)</span>
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
              </div>

              <FormField
                control={form.control}
                name="notes"
                rules={notesRules}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Notes <span className="font-normal text-muted-foreground">(optional)</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea rows={2} maxLength={500} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="md:sticky md:top-0 md:self-start">
              <PriceSummary
                rate={rate}
                durationMinutes={durationMinutes}
                price={price}
                advance={isEdit ? undefined : advance}
                alreadyPaid={isEdit ? alreadyPaid : undefined}
                statusAfterSave={statusAfterSave}
              />
              {isEdit && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Use “Record Payment” on the booking to collect money.
                </p>
              )}
            </div>

            <DialogFooter className="md:col-span-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitDisabled}>
                {submitting && <Loader2 className="animate-spin" />}
                {isEdit ? 'Save changes' : 'Create booking'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
  );
}
