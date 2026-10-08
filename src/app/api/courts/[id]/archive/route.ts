import { withAuth, ok, assertObjectId } from '@/lib/api';
import { toggleCourtArchive } from '@/services/court.service';

export const dynamic = 'force-dynamic';

export const PATCH = withAuth<{ id: string }>(async (_req, { params }) => {
  return ok(await toggleCourtArchive(assertObjectId(params.id)));
});
