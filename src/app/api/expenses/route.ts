import { withAuth, ok, readJson, badRequest } from '@/lib/api';
import { EXPENSES_PAGE_SIZE, EXPENSE_SPORT_TYPES, type ExpenseSportType } from '@/lib/constants';
import { isValidDateString } from '@/lib/time';
import { isOneOf, isValidObjectId, validateExpenseInput, type ExpenseInput } from '@/lib/validators';
import { createExpense, listExpenses } from '@/services/expense.service';

export const dynamic = 'force-dynamic';

export const GET = withAuth(async (req) => {
  const sp = req.nextUrl.searchParams;
  const from = sp.get('from') || undefined;
  const to = sp.get('to') || undefined;
  const rawSportType = sp.get('sportType') || undefined;
  if (rawSportType && !isOneOf(EXPENSE_SPORT_TYPES, rawSportType)) throw badRequest('Invalid sport type');
  const sportType = rawSportType as ExpenseSportType | undefined;
  const categories = (sp.get('category') ?? '').split(',').filter(Boolean);

  if (from && !isValidDateString(from)) throw badRequest('Invalid "from" date');
  if (to && !isValidDateString(to)) throw badRequest('Invalid "to" date');
  if (from && to && from > to) throw badRequest('"from" must be before "to"');
  if (!categories.every(isValidObjectId)) throw badRequest('Invalid category');

  const page = Math.max(1, Number.parseInt(sp.get('page') ?? '1', 10) || 1);
  const limit = Number.parseInt(sp.get('limit') ?? '', 10) || EXPENSES_PAGE_SIZE;

  const result = await listExpenses({ from, to, categories, sportType, page, limit });
  return ok(result.items, {
    meta: { page: result.page, limit: result.limit, total: result.total, sumAmount: result.sumAmount },
  });
});

export const POST = withAuth(async (req, { adminId }) => {
  const result = validateExpenseInput(await readJson(req));
  if (!result.ok) throw badRequest('Please fix the highlighted fields.', result.errors);
  return ok(await createExpense(result.data as ExpenseInput, adminId), { status: 201 });
});
