import { withAuth, ok, readJson, badRequest, assertObjectId } from '@/lib/api';
import { validateCategoryInput } from '@/lib/validators';
import { deleteCategory, getCategory, updateCategory } from '@/services/expense-category.service';

export const dynamic = 'force-dynamic';

type Params = { id: string };

export const GET = withAuth<Params>(async (_req, { params }) => {
  return ok(await getCategory(assertObjectId(params.id)));
});

export const PATCH = withAuth<Params>(async (req, { params }) => {
  const id = assertObjectId(params.id);
  const result = validateCategoryInput(await readJson(req), true);
  if (!result.ok) throw badRequest('Please fix the highlighted fields.', result.errors);
  return ok(await updateCategory(id, result.data));
});

export const DELETE = withAuth<Params>(async (_req, { params }) => {
  await deleteCategory(assertObjectId(params.id));
  return ok({ deleted: true });
});
