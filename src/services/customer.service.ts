import { Types, type ClientSession, type UpdateQuery } from 'mongoose';
import { Customer, type ICustomer } from '@/models/Customer';
import { Booking } from '@/models/Booking';
import { ApiError, notFound } from '@/lib/api';
import { CUSTOMERS_PAGE_SIZE } from '@/lib/constants';
import type { CustomerInput } from '@/lib/validators';
import { normalizePhone } from '@/lib/phone';
import { escapeRegex } from '@/lib/url';
import type { CustomerDTO, CustomerListResult } from '@/types';

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

export interface CustomerFilters {
  search?: string;
  page: number;
}

type CustomerDoc = ICustomer & { _id: Types.ObjectId };

/** Plain, serializable DTO (safe to pass from a Server Component to a Client Component). */
function toCustomerDTO(c: CustomerDoc): CustomerDTO {
  return {
    _id: c._id.toString(),
    name: c.name,
    phone: c.phone,
    email: c.email ?? undefined,
    totalBookings: c.totalBookings ?? 0,
    totalSpent: c.totalSpent ?? 0,
    firstBookingAt: c.firstBookingAt?.toISOString(),
    lastBookingAt: c.lastBookingAt?.toISOString(),
  };
}

/** Matches name/email by substring, and phone by its digits (so `0300-123` finds `03001234567`). */
function buildSearchMatch(search?: string) {
  const term = search?.trim();
  if (!term) return {};
  const pattern = new RegExp(escapeRegex(term), 'i');
  const or: Record<string, unknown>[] = [{ name: pattern }, { email: pattern }];
  const digits = term.replace(/\D/g, '');
  if (digits.length >= 3) or.push({ phone: new RegExp(digits) });
  return { $or: or };
}

export async function listCustomers(filters: CustomerFilters): Promise<CustomerListResult> {
  const page = Math.max(1, filters.page);
  const limit = CUSTOMERS_PAGE_SIZE;
  const match = buildSearchMatch(filters.search);

  const [docs, total] = await Promise.all([
    Customer.find(match)
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean<CustomerDoc[]>(),
    Customer.countDocuments(match),
  ]);

  return { items: docs.map(toCustomerDTO), page, limit, total };
}

const DUPLICATE_PHONE = 'A customer with this phone number already exists.';

/** Creates a customer without a booking. Phone is unique, so a taken number is a field error. */
export async function createCustomer(data: CustomerInput): Promise<CustomerDTO> {
  if (await Customer.exists({ phone: data.phone })) {
    throw new ApiError(409, DUPLICATE_PHONE, 'DUPLICATE', { phone: DUPLICATE_PHONE });
  }
  const customer = await Customer.create({ name: data.name, phone: data.phone, email: data.email });
  return toCustomerDTO(customer.toObject());
}

/**
 * Updates name, phone and email. The phone must not belong to another customer.
 * Existing bookings keep their `customerSnapshot`, so past records are unchanged.
 */
export async function updateCustomer(id: string, data: CustomerInput): Promise<CustomerDTO> {
  if (await Customer.exists({ phone: data.phone, _id: { $ne: new Types.ObjectId(id) } })) {
    throw new ApiError(409, DUPLICATE_PHONE, 'DUPLICATE', { phone: DUPLICATE_PHONE });
  }
  const update: UpdateQuery<ICustomer> = {
    $set: { name: data.name, phone: data.phone, ...(data.email ? { email: data.email } : {}) },
  };
  if (!data.email) update.$unset = { email: 1 };

  const customer = await Customer.findByIdAndUpdate(id, update, { returnDocument: 'after', runValidators: true });
  if (!customer) throw notFound('Customer');
  return toCustomerDTO(customer.toObject());
}

export async function lookupCustomerByPhone(phone: string): Promise<CustomerDTO | null> {
  const normalized = normalizePhone(phone);
  if (!normalized) return null;
  return Customer.findOne({ phone: normalized }).select('-__v').lean<CustomerDTO>();
}
