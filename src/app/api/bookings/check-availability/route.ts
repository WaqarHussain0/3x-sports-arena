import { withAuth, ok, badRequest } from '@/lib/api';
import { isValidObjectId } from '@/lib/validators';
import { checkAvailability } from '@/services/booking.service';

export const dynamic = 'force-dynamic';

export const GET = withAuth(async (req) => {
  const sp = req.nextUrl.searchParams;
  const court = sp.get('court') ?? '';
  const excludeId = sp.get('excludeId') || undefined;
  const startAt = new Date(sp.get('startAt') ?? '');
  const endAt = new Date(sp.get('endAt') ?? '');

  if (!isValidObjectId(court)) throw badRequest('Invalid court');
  if (excludeId && !isValidObjectId(excludeId)) throw badRequest('Invalid excludeId');
  if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
    throw badRequest('startAt and endAt must be ISO date-times');
  }
  if (endAt <= startAt) throw badRequest('endAt must be after startAt');

  return ok(await checkAvailability(court, startAt, endAt, excludeId));
});
