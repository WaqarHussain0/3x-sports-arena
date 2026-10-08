import { withAuth, ok } from '@/lib/api';
import { lookupCustomerByPhone } from '@/services/customer.service';

export const dynamic = 'force-dynamic';

export const GET = withAuth(async (req) => {
  const phone = req.nextUrl.searchParams.get('phone') ?? '';
  return ok(await lookupCustomerByPhone(phone));
});
