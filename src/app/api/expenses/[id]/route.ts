import { withAuth, ok, readJson, badRequest, assertObjectId } from '@/lib/api';
import { validateExpenseInput } from '@/lib/validators';
import { deleteExpense, getExpense, updateExpense } from '@/services/expense.service';

export const dynamic = 'force-dynamic';

type Params = { id: string };

export const GET = withAuth<Params>(async (_req, { params }) => {
  return ok(await getExpense(assertObjectId(params.id)));
});

export const PATCH = withAuth<Params>(async (req, { params, adminId }) => {
  const id = assertObjectId(params.id);
  const result = validateExpenseInput(await readJson(req), true);
  if (!result.ok) throw badRequest('Please fix the highlighted fields.', result.errors);
  return ok(await updateExpense(id, result.data, adminId));
});

export const DELETE = withAuth<Params>(async (_req, { params }) => {
  await deleteExpense(assertObjectId(params.id));
  return ok({ deleted: true });
});
