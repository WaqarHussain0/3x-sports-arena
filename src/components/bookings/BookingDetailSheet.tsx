'use client';

import Link from 'next/link';
import { useState, type ReactNode } from 'react';
import { skipToken } from '@reduxjs/toolkit/query/react';
import { Ban, Banknote, Pencil, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/shared/EmptyState';
import { SportBadge } from '@/components/shared/SportBadge';
import { BookingStatusBadge, PaymentStatusBadge } from '@/components/shared/StatusBadge';
import { label } from '@/lib/constants';
import { formatCurrency, formatDate, formatDateTime, formatDuration, formatTimeRange } from '@/lib/format';
import { formatPhone } from '@/lib/phone';
import { cn } from '@/lib/utils';
import { getErrorMessage } from '@/store/api/baseApi';
import { useGetBookingQuery } from '@/store/api/bookingsApi';
import type { UserRef } from '@/types';
import { CancelBookingDialog } from './CancelBookingDialog';
import { RecordPaymentDialog } from './RecordPaymentDialog';

function userName(ref: UserRef | string | null | undefined) {
  return ref && typeof ref === 'object' ? ref.name : '—';
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h4 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{title}</h4>
      {children}
    </section>
  );
}

function Row({ label: l, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn('flex justify-between gap-4 text-sm', className)}>
      <span className="text-muted-foreground">{l}</span>
      <span className="text-right">{children}</span>
    </div>
  );
}

export function BookingDetailSheet({
  bookingId,
  onOpenChange,
}: {
  bookingId: string | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: booking, isLoading, isError, error, refetch } = useGetBookingQuery(bookingId ?? skipToken);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const shown = booking && booking._id === bookingId ? booking : undefined;

  return (
    <Sheet open={!!bookingId} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-md">
        <SheetHeader className="border-b">
          <SheetTitle className="flex flex-wrap items-center gap-2">
            {shown?.bookingNumber ?? 'Booking'}
            {shown && <BookingStatusBadge status={shown.status} />}
            {shown && shown.status !== 'cancelled' && <PaymentStatusBadge status={shown.paymentStatus} />}
          </SheetTitle>
          <SheetDescription>
            {shown ? `${formatDate(shown.startAt)} · ${formatTimeRange(shown.startAt, shown.endAt)}` : 'Loading…'}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-6 p-4">
          {isLoading || (!shown && !isError) ? (
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-5" />
              ))}
            </div>
          ) : isError || !shown ? (
            <ErrorState message={getErrorMessage(error)} onRetry={refetch} />
          ) : (
            <>
              <Section title="Customer">
                <p className="font-medium">{shown.customerSnapshot.name}</p>
                <a
                  href={`tel:${shown.customerSnapshot.phone}`}
                  className="flex items-center gap-1.5 text-sm text-primary hover:underline"
                >
                  <Phone className="size-3.5" /> {formatPhone(shown.customerSnapshot.phone)}
                </a>
                {shown.customerSnapshot.email && (
                  <p className="text-sm text-muted-foreground">{shown.customerSnapshot.email}</p>
                )}
              </Section>

              <Separator />

              <Section title="Booking">
                <Row label="Court">{shown.courtNameSnapshot}</Row>
                <Row label="Sport">
                  <SportBadge sport={shown.sportType} />
                </Row>
                <Row label="Date">{formatDate(shown.startAt)}</Row>
                <Row label="Time">{formatTimeRange(shown.startAt, shown.endAt)}</Row>
                <Row label="Duration">{formatDuration(shown.durationMinutes)}</Row>
              </Section>

              <Separator />

              <Section title="Price">
                <Row label="Rate">{formatCurrency(shown.pricePerHourSnapshot)} / hour</Row>
                <Row label="Subtotal">{formatCurrency(shown.grossAmount)}</Row>
                {shown.discountAmount > 0 && (
                  <Row label={shown.discount.type === 'percentage' ? `Discount (${shown.discount.value}%)` : 'Discount'}>
                    − {formatCurrency(shown.discountAmount)}
                  </Row>
                )}
                <Row label="Total" className="font-semibold">
                  {formatCurrency(shown.totalAmount)}
                </Row>
                <Row label="Paid">{formatCurrency(shown.amountPaid)}</Row>
                {shown.status !== 'cancelled' && (
                  <Row label="Remaining" className="font-medium">
                    {formatCurrency(shown.remainingAmount)}
                  </Row>
                )}
              </Section>

              <Separator />

              <Section title="Payment history">
                {shown.payments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No payments yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {shown.payments.map((p) => (
                      <li key={p._id} className="rounded-lg border p-2.5 text-sm">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={cn(
                              'font-medium tabular-nums',
                              p.kind === 'refund' ? 'text-red-600 dark:text-red-400' : 'text-emerald-700 dark:text-emerald-400',
                            )}
                          >
                            {p.kind === 'refund' ? '− ' : '+ '}
                            {formatCurrency(p.amount)}
                          </span>
                          <span className="text-xs text-muted-foreground">{label(p.kind)}</span>
                        </div>
                        <div className="mt-0.5 text-xs text-muted-foreground">
                          {formatDateTime(p.at)} · by {userName(p.recordedBy)}
                        </div>
                        {p.note && <div className="mt-1 text-xs">{p.note}</div>}
                      </li>
                    ))}
                  </ul>
                )}
              </Section>

              {shown.cancellation && (
                <>
                  <Separator />
                  <Section title="Cancellation">
                    <Row label="Cancelled">{formatDateTime(shown.cancellation.at)}</Row>
                    <Row label="By">{userName(shown.cancellation.by)}</Row>
                    {shown.cancellation.advanceHandling && (
                      <Row label="Advance">{label(shown.cancellation.advanceHandling)}</Row>
                    )}
                    {shown.cancellation.reason && <p className="text-sm">{shown.cancellation.reason}</p>}
                  </Section>
                </>
              )}

              {shown.notes && (
                <>
                  <Separator />
                  <Section title="Notes">
                    <p className="text-sm whitespace-pre-wrap">{shown.notes}</p>
                  </Section>
                </>
              )}

              <Separator />
              <Section title="History">
                <Row label="Created">
                  {formatDateTime(shown.createdAt)} · {userName(shown.createdBy)}
                </Row>
                {shown.updatedBy && (
                  <Row label="Last updated">
                    {formatDateTime(shown.updatedAt)} · {userName(shown.updatedBy)}
                  </Row>
                )}
              </Section>
            </>
          )}
        </div>

        {shown && shown.status !== 'cancelled' && (
          <SheetFooter className="flex-row flex-wrap border-t">
            <Button variant="outline" className="flex-1" asChild>
              <Link href={`/bookings/${shown._id}/edit`}>
                <Pencil /> Edit
              </Link>
            </Button>
            {shown.remainingAmount > 0 && (
              <Button className="flex-1" onClick={() => setPaymentOpen(true)}>
                <Banknote /> Record Payment
              </Button>
            )}
            <Button variant="destructive" className="flex-1" onClick={() => setCancelOpen(true)}>
              <Ban /> Cancel Booking
            </Button>
          </SheetFooter>
        )}

        {shown && (
          <>
            <RecordPaymentDialog open={paymentOpen} onOpenChange={setPaymentOpen} booking={shown} />
            <CancelBookingDialog open={cancelOpen} onOpenChange={setCancelOpen} booking={shown} />
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
