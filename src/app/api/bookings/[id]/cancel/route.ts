import { withAuth, ok, readJson, badRequest, assertObjectId } from '@/lib/api';
import { validateCancelInput } from '@/lib/validators';
import { cancelBooking } from '@/services/booking.service';

export const dynamic = 'force-dynamic';

export const POST = withAuth<{ id: string }>(async (req, { params, adminId }) => {
  const id = assertObjectId(params.id);
  const result = validateCancelInput(await readJson(req));
  if (!result.ok) throw badRequest('Please fix the highlighted fields.', result.errors);
  return ok(await cancelBooking(id, result.data, adminId));
});
