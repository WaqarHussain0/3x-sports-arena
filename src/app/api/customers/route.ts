import { withAuth, ok, readJson, badRequest } from '@/lib/api';
import { validateCustomerInput } from '@/lib/validators';
import { createCustomer } from '@/services/customer.service';

export const dynamic = 'force-dynamic';

export const POST = withAuth(async (req) => {
  const result = validateCustomerInput(await readJson(req));
  if (!result.ok) throw badRequest('Please fix the highlighted fields.', result.errors);
  return ok(await createCustomer(result.data), { status: 201 });
});
