import { withAuth, ok, readJson, badRequest, assertObjectId } from '@/lib/api';
import { validateCourtInput } from '@/lib/validators';
import { deleteCourt, getCourt, updateCourt } from '@/services/court.service';

export const dynamic = 'force-dynamic';

type Params = { id: string };

export const GET = withAuth<Params>(async (_req, { params }) => {
  return ok(await getCourt(assertObjectId(params.id)));
});

export const PATCH = withAuth<Params>(async (req, { params }) => {
  const id = assertObjectId(params.id);
  const result = validateCourtInput(await readJson(req), true);
  if (!result.ok) throw badRequest('Please fix the highlighted fields.', result.errors);
  return ok(await updateCourt(id, result.data));
});

export const DELETE = withAuth<Params>(async (_req, { params }) => {
  await deleteCourt(assertObjectId(params.id));
  return ok({ deleted: true });
});
