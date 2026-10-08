import { withAuth, ok, readJson, badRequest } from '@/lib/api';
import { daysBetweenInclusive, isValidDateString } from '@/lib/time';
import { isValidObjectId, validateBookingInput } from '@/lib/validators';
import { createBooking, listBookings } from '@/services/booking.service';

export const dynamic = 'force-dynamic';

const MAX_RANGE_DAYS = 62;

export const GET = withAuth(async (req) => {
  const sp = req.nextUrl.searchParams;
  const from = sp.get('from') ?? '';
  const to = sp.get('to') ?? '';
  const court = sp.get('court') || undefined;

  if (!isValidDateString(from) || !isValidDateString(to)) throw badRequest('"from" and "to" must be YYYY-MM-DD');
  if (from > to) throw badRequest('"from" must be before "to"');
  if (daysBetweenInclusive(from, to) > MAX_RANGE_DAYS) throw badRequest(`Range cannot exceed ${MAX_RANGE_DAYS} days`);
  if (court && court !== 'all' && !isValidObjectId(court)) throw badRequest('Invalid court');

  const bookings = await listBookings({
    from,
    to,
    court: court === 'all' ? undefined : court,
    includeCancelled: sp.get('includeCancelled') === 'true',
  });
  return ok(bookings);
});

export const POST = withAuth(async (req, { adminId }) => {
  const result = validateBookingInput(await readJson(req));
  if (!result.ok) throw badRequest('Please fix the highlighted fields.', result.errors);
  return ok(await createBooking(result.data, adminId), { status: 201 });
});
