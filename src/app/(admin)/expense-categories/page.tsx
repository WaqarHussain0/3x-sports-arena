import { Suspense } from "react";
import type { Metadata } from "next";
import { TableSkeleton } from "@/components/shared/LoadingState";
import { EXPENSE_CATEGORIES_PAGE_SIZE } from "@/lib/constants";
import { parsePage } from "@/lib/url";
import CategoryWrapper from "./Category.wrapper";
import CategoryTableFetcher from "./CategoryTable.fetcher";

export const metadata: Metadata = { title: "Expense Categories" };

interface PageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    archived?: string;
  }>;
}

const Page = async ({ searchParams }: PageProps) => {
  const { page = "1", search = "", archived } = await searchParams;

  return (
    <CategoryWrapper>
      <Suspense
        fallback={
          <TableSkeleton rows={EXPENSE_CATEGORIES_PAGE_SIZE} columns={7} />
        }
      >
        <CategoryTableFetcher
          page={parsePage(page)}
          search={search.trim()}
          archived={archived === "true"}
        />
      </Suspense>
    </CategoryWrapper>
  );
};

export default Page;
