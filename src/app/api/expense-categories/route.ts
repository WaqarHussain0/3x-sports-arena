import { withAuth, ok, readJson, badRequest } from '@/lib/api';
import { validateCategoryInput, type CategoryInput } from '@/lib/validators';
import { createCategory, listCategories } from '@/services/expense-category.service';

export const dynamic = 'force-dynamic';

export const GET = withAuth(async (req) => {
  const includeArchived = req.nextUrl.searchParams.get('includeArchived') === 'true';
  return ok(await listCategories(includeArchived));
});

export const POST = withAuth(async (req, { adminId }) => {
  const result = validateCategoryInput(await readJson(req));
  if (!result.ok) throw badRequest('Please fix the highlighted fields.', result.errors);
  return ok(await createCategory(result.data as CategoryInput, adminId), { status: 201 });
});
