import mongoose, { Types, type ClientSession } from 'mongoose';
import { Booking, type BookingDocument } from '@/models/Booking';
import { Court } from '@/models/Court';
import { Counter } from '@/models/Counter';
import { ApiError, badRequest, notFound } from '@/lib/api';
import { formatCurrency, formatDate, formatTimeRange } from '@/lib/format';
import {
  calculateBookingPrice,
  computePaymentState,
  deriveBookingStatus,
  validateDiscount,
  type PriceResult,
} from '@/lib/pricing';
import { addDaysStr, pktToUtc, toPktDateString } from '@/lib/time';
import type { BookingInput, CancelInput, PaymentInput } from '@/lib/validators';
import type { BookingConflict, BookingDTO } from '@/types';
import { recomputeCustomerStats, upsertCustomer } from './customer.service';

// ---------- helpers ----------

/** Recomputes amountPaid / remainingAmount / paymentStatus and auto-confirms on first payment. */
export function applyDerivedFields(booking: BookingDocument) {
  const state = computePaymentState(booking.totalAmount, booking.payments);
  booking.amountPaid = state.amountPaid;
  booking.remainingAmount = state.remainingAmount;
  booking.paymentStatus = state.paymentStatus;
  booking.status = deriveBookingStatus(booking.status, state.amountPaid, booking.totalAmount);
}

/**
 * Half-open interval overlap on the same court, ignoring cancelled bookings (plan §5.3).
 * 8–9 PM and 9–10 PM do not overlap.
 */
export async function findConflict(
  courtId: string,
  startAt: Date,
  endAt: Date,
  excludeId?: string,
  session?: ClientSession,
): Promise<BookingConflict | null> {
  const filter: Record<string, unknown> = {
    court: new Types.ObjectId(courtId),
    status: { $ne: 'cancelled' },
    startAt: { $lt: endAt },
    endAt: { $gt: startAt },
  };
  if (excludeId) filter._id = { $ne: new Types.ObjectId(excludeId) };

  const existing = await Booking.findOne(filter)
    .select('bookingNumber customerSnapshot startAt endAt')
    .sort({ startAt: 1 })
    .session(session ?? null)
    .lean();
  if (!existing) return null;

  return {
    bookingId: existing._id.toString(),
    bookingNumber: existing.bookingNumber,
    customerName: existing.customerSnapshot?.name ?? 'another customer',
    startAt: existing.startAt.toISOString(),
    endAt: existing.endAt.toISOString(),
  };
}

export function conflictMessage(conflict: BookingConflict, requestedStart?: Date): string {
  const sameDay = !requestedStart || toPktDateString(conflict.startAt) === toPktDateString(requestedStart);
  const when = formatTimeRange(conflict.startAt, conflict.endAt);
  return `Overlaps with ${conflict.customerName}'s booking, ${sameDay ? when : `${formatDate(conflict.startAt)} ${when}`}.`;
}

function overlapError(conflict: BookingConflict, requestedStart: Date) {
  return new ApiError(409, conflictMessage(conflict, requestedStart), 'OVERLAP', undefined, { conflict });
}

/**
 * Bumps the court's lock version inside the transaction. Two concurrent transactions booking the
 * same court both write this document, so one gets a write conflict and is retried — on retry it
 * sees the other's booking and fails the overlap check cleanly.
 */
async function lockCourt(courtId: string, session: ClientSession, requireActive: boolean) {
  const court = await Court.findOneAndUpdate(
    { _id: courtId },
    { $inc: { bookingLockVersion: 1 } },
    { returnDocument: 'after', session },
  );
  if (!court) throw badRequest('Please fix the highlighted fields.', { courtId: 'Court not found' });
  if (requireActive && court.isArchived) {
    throw badRequest('Please fix the highlighted fields.', { courtId: 'This court is archived' });
  }
  return court;
}

async function nextBookingNumber(session: ClientSession): Promise<string> {
  const counter = await Counter.findOneAndUpdate(
    { _id: 'booking' },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: 'after', session },
  );
  return `3X-${String(counter!.seq).padStart(6, '0')}`;
}

function priceFor(input: BookingInput, pricePerHour: number): PriceResult {
  const price = calculateBookingPrice({
    pricePerHour,
    durationMinutes: input.durationMinutes,
    discountType: input.discountType,
    discountValue: input.discountValue,
  });
  const discountError = validateDiscount(input.discountType, input.discountValue, price.grossAmount);
  if (discountError) throw badRequest('Please fix the highlighted fields.', { discountValue: discountError });
  return price;
}

function bookingFields(input: BookingInput, price: PriceResult) {
  return {
    customerSnapshot: { name: input.customerName, phone: input.phone, email: input.email },
    sportType: input.sportType,
    startAt: input.startAt,
    endAt: input.endAt,
    durationMinutes: input.durationMinutes,
    grossAmount: price.grossAmount,
    discount: price.discount,
    discountAmount: price.discountAmount,
    totalAmount: price.totalAmount,
    notes: input.notes || undefined,
  };
}

// ---------- queries ----------

const populateRefs = [
  { path: 'payments.recordedBy', select: 'name' },
  { path: 'createdBy', select: 'name' },
  { path: 'updatedBy', select: 'name' },
  { path: 'cancellation.by', select: 'name' },
];

export async function getBookingById(id: string): Promise<BookingDTO> {
  const booking = await Booking.findById(id).populate(populateRefs).select('-__v').lean();
  if (!booking) throw notFound('Booking');
  return booking as unknown as BookingDTO;
}

/** Bookings overlapping the PKT date range [from, to] (inclusive days). */
export async function listBookings(params: {
  from: string;
  to: string;
  court?: string;
  includeCancelled?: boolean;
}): Promise<BookingDTO[]> {
  const rangeStart = pktToUtc(params.from);
  const rangeEnd = pktToUtc(addDaysStr(params.to, 1));
  const filter: Record<string, unknown> = { startAt: { $lt: rangeEnd }, endAt: { $gt: rangeStart } };
  if (params.court) filter.court = new Types.ObjectId(params.court);
  if (!params.includeCancelled) filter.status = { $ne: 'cancelled' };

  const bookings = await Booking.find(filter).sort({ startAt: 1 }).select('-__v -payments').lean();
  return bookings as unknown as BookingDTO[];
}

export async function checkAvailability(courtId: string, startAt: Date, endAt: Date, excludeId?: string) {
  const conflict = await findConflict(courtId, startAt, endAt, excludeId);
  return conflict
    ? { available: false, conflict, message: conflictMessage(conflict, startAt) }
    : { available: true };
}

// ---------- mutations ----------

export async function createBooking(input: BookingInput, adminId: string): Promise<BookingDTO> {
  let bookingId = '';

  await mongoose.connection.transaction(async (session) => {
    const court = await lockCourt(input.courtId, session, true);
    const price = priceFor(input, court.pricePerHour);

    if (input.advanceAmount > price.totalAmount) {
      throw badRequest('Please fix the highlighted fields.', {
        advanceAmount: `Advance cannot exceed the total (${formatCurrency(price.totalAmount)})`,
      });
    }

    const conflict = await findConflict(input.courtId, input.startAt, input.endAt, undefined, session);
    if (conflict) throw overlapError(conflict, input.startAt);

    const customer = await upsertCustomer(
      { name: input.customerName, phone: input.phone, email: input.email },
      session,
    );
    const bookingNumber = await nextBookingNumber(session);

    const booking = new Booking({
      ...bookingFields(input, price),
      bookingNumber,
      customer: customer._id,
      court: court._id,
      courtNameSnapshot: court.name,
      pricePerHourSnapshot: court.pricePerHour,
      payments:
        input.advanceAmount > 0
          ? [{ amount: input.advanceAmount, kind: 'payment', at: new Date(), note: 'Advance', recordedBy: adminId }]
          : [],
      status: 'pending',
      createdBy: adminId,
    });
    applyDerivedFields(booking);
    await booking.save({ session });
    await recomputeCustomerStats(customer._id, session);

    bookingId = booking._id.toString();
  });

  return getBookingById(bookingId);
}

/**
 * Edit rules (plan §5.2): times change → re-price with the original snapshot rate;
 * court change → snapshot replaced with the new court's current price.
 */
export async function updateBooking(id: string, input: BookingInput, adminId: string): Promise<BookingDTO> {
  await mongoose.connection.transaction(async (session) => {
    const booking = await Booking.findById(id).session(session);
    if (!booking) throw notFound('Booking');
    if (booking.status === 'cancelled') throw badRequest('Cancelled bookings cannot be edited.');

    const courtChanged = booking.court.toString() !== input.courtId;
    const court = await lockCourt(input.courtId, session, courtChanged);
    const rate = courtChanged ? court.pricePerHour : booking.pricePerHourSnapshot;
    const price = priceFor(input, rate);

    if (price.totalAmount < booking.amountPaid) {
      throw badRequest(
        `Amount already paid (${formatCurrency(booking.amountPaid)}) exceeds the new total (${formatCurrency(price.totalAmount)}).`,
      );
    }

    const conflict = await findConflict(input.courtId, input.startAt, input.endAt, id, session);
    if (conflict) throw overlapError(conflict, input.startAt);

    const previousCustomerId = booking.customer;
    const customer = await upsertCustomer(
      { name: input.customerName, phone: input.phone, email: input.email },
      session,
    );

    booking.set({
      ...bookingFields(input, price),
      customer: customer._id,
      court: court._id,
      courtNameSnapshot: court.name,
      pricePerHourSnapshot: rate,
      updatedBy: adminId,
    });
    if (!input.notes) booking.set('notes', undefined);
    applyDerivedFields(booking);
    await booking.save({ session });

    await recomputeCustomerStats(customer._id, session);
    if (!previousCustomerId.equals(customer._id)) await recomputeCustomerStats(previousCustomerId, session);
  });

  return getBookingById(id);
}

export async function recordPayment(id: string, input: PaymentInput, adminId: string): Promise<BookingDTO> {
  const booking = await Booking.findById(id);
  if (!booking) throw notFound('Booking');
  if (booking.status === 'cancelled') throw badRequest('Payments cannot be recorded on a cancelled booking.');
  if (booking.remainingAmount <= 0) throw badRequest('This booking is already fully paid.');
  if (input.amount > booking.remainingAmount) {
    throw badRequest('Please fix the highlighted fields.', {
      amount: `Payment cannot exceed the remaining balance (${formatCurrency(booking.remainingAmount)})`,
    });
  }

  booking.payments.push({
    amount: input.amount,
    kind: 'payment',
    at: new Date(),
    note: input.note,
    recordedBy: new Types.ObjectId(adminId),
  });
  booking.updatedBy = new Types.ObjectId(adminId);
  applyDerivedFields(booking);
  await booking.save();

  return getBookingById(id);
}

export async function cancelBooking(id: string, input: CancelInput, adminId: string): Promise<BookingDTO> {
  const booking = await Booking.findById(id);
  if (!booking) throw notFound('Booking');
  if (booking.status === 'cancelled') throw badRequest('This booking is already cancelled.');

  const paid = booking.amountPaid;
  if (paid > 0 && !input.advanceHandling) {
    throw badRequest('Please fix the highlighted fields.', {
      advanceHandling: 'Choose whether to refund or keep the advance',
    });
  }

  const now = new Date();
  const advanceHandling = paid > 0 ? input.advanceHandling : undefined;
  if (advanceHandling === 'refunded') {
    booking.payments.push({
      amount: paid,
      kind: 'refund',
      at: now,
      note: 'Refund on cancellation',
      recordedBy: new Types.ObjectId(adminId),
    });
  }

  booking.status = 'cancelled';
  booking.set('cancellation', { at: now, reason: input.reason, advanceHandling, by: adminId });
  booking.updatedBy = new Types.ObjectId(adminId);
  applyDerivedFields(booking);
  await booking.save();
  await recomputeCustomerStats(booking.customer);

  return getBookingById(id);
}
