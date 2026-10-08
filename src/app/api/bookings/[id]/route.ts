import { withAuth, ok, readJson, badRequest, assertObjectId } from '@/lib/api';
import { validateBookingInput } from '@/lib/validators';
import { getBookingById, updateBooking } from '@/services/booking.service';

export const dynamic = 'force-dynamic';

type Params = { id: string };

export const GET = withAuth<Params>(async (_req, { params }) => {
  return ok(await getBookingById(assertObjectId(params.id)));
});

export const PATCH = withAuth<Params>(async (req, { params, adminId }) => {
  const id = assertObjectId(params.id);
  const result = validateBookingInput(await readJson(req));
  if (!result.ok) throw badRequest('Please fix the highlighted fields.', result.errors);
  return ok(await updateBooking(id, result.data, adminId));
});
