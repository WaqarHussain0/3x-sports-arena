import { withAuth, ok, readJson, badRequest, assertObjectId } from "@/lib/api";
import { validateCustomerInput } from "@/lib/validators";
import { updateCustomer } from "@/services/customer.service";

export const dynamic = "force-dynamic";

type Params = { id: string };

export const PATCH = withAuth<Params>(async (req, { params }) => {
  const id = assertObjectId(params.id);
  const result = validateCustomerInput(await readJson(req));

  if (!result.ok)
    throw badRequest("Please fix the highlighted fields.", result.errors);

  return ok(await updateCustomer(id, result.data));
});
