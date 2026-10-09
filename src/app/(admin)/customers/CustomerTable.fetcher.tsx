import { Users } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { CustomerTable } from "@/components/customers/CustomerTable";
import { connectDB } from "@/lib/db";
import { listCustomers } from "@/services/customer.service";

interface ICustomerTableFetcherProps {
  page: number;
  search: string;
}

/** Server Component: loads one page of customers from the DB and renders the table. */
const CustomerTableFetcher = async ({
  page,
  search,
}: ICustomerTableFetcherProps) => {
  await connectDB();
  const { items, limit, total } = await listCustomers({ search, page });

  if (!items.length) {
    return (
      <EmptyState
        icon={Users}
        title="No customers found"
        description={
          search
            ? `No customers match “${search}”.`
            : total > 0
              ? "This page is empty."
              : "Customers are added automatically when a booking is made, or with “Add Customer”."
        }
      />
    );
  }

  return (
    <CustomerTable
      customers={items}
      search={search}
      page={page}
      limit={limit}
      total={total}
    />
  );
};

export default CustomerTableFetcher;
