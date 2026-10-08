import { withAuth, ok, assertObjectId } from '@/lib/api';
import { toggleCategoryArchive } from '@/services/expense-category.service';

export const dynamic = 'force-dynamic';

export const PATCH = withAuth<{ id: string }>(async (_req, { params }) => {
  return ok(await toggleCategoryArchive(assertObjectId(params.id)));
});
