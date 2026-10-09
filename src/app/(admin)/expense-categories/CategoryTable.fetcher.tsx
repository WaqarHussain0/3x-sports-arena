import { Tags } from 'lucide-react';
import { EmptyState } from '@/components/shared/EmptyState';
import { CategoryTable } from '@/components/expense-categories/CategoryTable';
import { connectDB } from '@/lib/db';
import { listCategoriesPage } from '@/services/expense-category.service';

interface ICategoryTableFetcherProps {
  page: number;
  search: string;
  archived: boolean;
}

/** Server Component: loads one page of expense categories from the DB and renders the table. */
const CategoryTableFetcher = async ({ page, search, archived }: ICategoryTableFetcherProps) => {
  await connectDB();
  const { items, limit, total } = await listCategoriesPage({ search, includeArchived: archived, page });

  if (!items.length) {
    return (
      <EmptyState
        icon={Tags}
        title={search ? 'No matches' : total > 0 ? 'This page is empty' : 'No categories yet'}
        description={
          search
            ? `No categories match “${search}”.`
            : total > 0
              ? undefined
              : 'Create categories like Electricity, Cricket Balls or Staff Salaries with “Add Category”.'
        }
      />
    );
  }

  return (
    <CategoryTable
      categories={items}
      filters={{ search, archived }}
      page={page}
      limit={limit}
      total={total}
    />
  );
};

export default CategoryTableFetcher;
