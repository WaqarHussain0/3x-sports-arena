import { withAuth, ok, readJson, badRequest } from '@/lib/api';
import { validateCourtInput, type CourtInput } from '@/lib/validators';
import { createCourt, listCourts } from '@/services/court.service';

export const dynamic = 'force-dynamic';

export const GET = withAuth(async (req) => {
  const includeArchived = req.nextUrl.searchParams.get('includeArchived') === 'true';
  return ok(await listCourts(includeArchived));
});

export const POST = withAuth(async (req, { adminId }) => {
  const result = validateCourtInput(await readJson(req));
  if (!result.ok) throw badRequest('Please fix the highlighted fields.', result.errors);
  return ok(await createCourt(result.data as CourtInput, adminId), { status: 201 });
});
