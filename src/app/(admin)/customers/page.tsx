import { Suspense } from "react";
import type { Metadata } from "next";
import { TableSkeleton } from "@/components/shared/LoadingState";
import { parsePage } from "@/lib/url";
import { CUSTOMERS_PAGE_SIZE } from "@/lib/constants";
import CustomerWrapper from "./Customer.wrapper";
import CustomerTableFetcher from "./CustomerTable.fetcher";

export const metadata: Metadata = { title: "Customers" };

interface PageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
  }>;
}

const Page = async ({ searchParams }: PageProps) => {
  const { page = "1", search = "" } = await searchParams;

  return (
    <CustomerWrapper>
      <Suspense
        fallback={<TableSkeleton rows={CUSTOMERS_PAGE_SIZE} columns={4} />}
      >
        <CustomerTableFetcher page={parsePage(page)} search={search.trim()} />
      </Suspense>
    </CustomerWrapper>
  );
};

export default Page;
