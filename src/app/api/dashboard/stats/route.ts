import { withAuth, ok, badRequest } from '@/lib/api';
import { isValidDateString, isValidMonthString, type DateRangeQuery } from '@/lib/time';
import { getDashboardStats } from '@/services/dashboard.service';

export const dynamic = 'force-dynamic';

const MAX_CUSTOM_RANGE_DAYS = 366 * 5;

function parseQuery(sp: URLSearchParams): DateRangeQuery {
  const range = sp.get('range') ?? 'monthly';
  if (range === 'monthly') {
    const month = sp.get('month') ?? '';
    if (!isValidMonthString(month)) throw badRequest('month must be YYYY-MM');
    return { range, month };
  }
  if (range === 'yearly') {
    const year = Number(sp.get('year'));
    if (!Number.isInteger(year) || year < 2000 || year > 2100) throw badRequest('year must be a valid year');
    return { range, year };
  }
  if (range === 'custom') {
    const from = sp.get('from') ?? '';
    const to = sp.get('to') ?? '';
    if (!isValidDateString(from) || !isValidDateString(to)) throw badRequest('from and to must be YYYY-MM-DD');
    if (from > to) throw badRequest('"from" must be on or before "to"');
    const days = (Date.parse(to) - Date.parse(from)) / 86_400_000;
    if (days > MAX_CUSTOM_RANGE_DAYS) throw badRequest('Custom range is too long');
    return { range, from, to };
  }
  throw badRequest('range must be monthly, yearly or custom');
}

export const GET = withAuth(async (req) => {
  return ok(await getDashboardStats(parseQuery(req.nextUrl.searchParams)));
});
