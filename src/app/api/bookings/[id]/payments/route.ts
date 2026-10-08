import { withAuth, ok, readJson, badRequest, assertObjectId } from '@/lib/api';
import { validatePaymentInput } from '@/lib/validators';
import { recordPayment } from '@/services/booking.service';

export const dynamic = 'force-dynamic';

export const POST = withAuth<{ id: string }>(async (req, { params, adminId }) => {
  const id = assertObjectId(params.id);
  const result = validatePaymentInput(await readJson(req));
  if (!result.ok) throw badRequest('Please fix the highlighted fields.', result.errors);
  return ok(await recordPayment(id, result.data, adminId), { status: 201 });
});
