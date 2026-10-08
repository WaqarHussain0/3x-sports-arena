import { Types, type ClientSession, type UpdateQuery } from 'mongoose';
import { Customer, type ICustomer } from '@/models/Customer';
import { Booking } from '@/models/Booking';
import { normalizePhone } from '@/lib/phone';
import type { CustomerDTO } from '@/types';

/** Upserts a customer by normalized phone, keeping name/email at their latest values (plan §5.8). */
export async function upsertCustomer(
  input: { name: string; phone: string; email?: string },
  session?: ClientSession,
) {
  const update: UpdateQuery<ICustomer> = {
    $set: { name: input.name, ...(input.email ? { email: input.email } : {}) },
    $setOnInsert: { phone: input.phone },
  };
  if (!input.email) update.$unset = { email: 1 };

  const customer = await Customer.findOneAndUpdate({ phone: input.phone }, update, {
    upsert: true,
    returnDocument: 'after',
    setDefaultsOnInsert: true,
    session,
  });
  return customer!;
}

/** Recomputes totals from non-cancelled bookings. */
export async function recomputeCustomerStats(customerId: Types.ObjectId | string, session?: ClientSession) {
  const id = new Types.ObjectId(String(customerId));
  const [stats] = await Booking.aggregate<{
    totalBookings: number;
    totalSpent: number;
    firstBookingAt: Date;
    lastBookingAt: Date;
  }>([
    { $match: { customer: id, status: { $ne: 'cancelled' } } },
    {
      $group: {
        _id: null,
        totalBookings: { $sum: 1 },
        totalSpent: { $sum: '$totalAmount' },
        firstBookingAt: { $min: '$startAt' },
        lastBookingAt: { $max: '$startAt' },
      },
    },
  ]).session(session ?? null);

  await Customer.updateOne(
    { _id: id },
    stats
      ? {
          $set: {
            totalBookings: stats.totalBookings,
            totalSpent: stats.totalSpent,
            firstBookingAt: stats.firstBookingAt,
            lastBookingAt: stats.lastBookingAt,
          },
        }
      : { $set: { totalBookings: 0, totalSpent: 0 }, $unset: { firstBookingAt: 1, lastBookingAt: 1 } },
    { session },
  );
}

export async function lookupCustomerByPhone(phone: string): Promise<CustomerDTO | null> {
  const normalized = normalizePhone(phone);
  if (!normalized) return null;
  return Customer.findOne({ phone: normalized }).select('-__v').lean<CustomerDTO>();
}
