'use client';

import { useState } from 'react';
import { Plus, Receipt } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/PageHeader';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { EmptyState, ErrorState } from '@/components/shared/EmptyState';
import { TableSkeleton } from '@/components/shared/LoadingState';
import { EXPENSES_PAGE_SIZE } from '@/lib/constants';
import { formatCurrency, formatDate } from '@/lib/format';
import { currentMonthPkt, formatDateStr, todayPkt } from '@/lib/time';
import { getErrorMessage } from '@/store/api/baseApi';
import { useGetExpenseCategoriesQuery } from '@/store/api/expenseCategoriesApi';
import { useDeleteExpenseMutation, useGetExpensesQuery } from '@/store/api/expensesApi';
import type { ExpenseCategoryDTO, ExpenseDTO } from '@/types';
import { ExpenseFilters, type ExpenseFilterValues } from './ExpenseFilters';
import { ExpenseFormDialog } from './ExpenseFormDialog';
import { ExpenseTable } from './ExpenseTable';

function defaultFilters(): ExpenseFilterValues {
  return { range: { from: `${currentMonthPkt()}-01`, to: todayPkt() }, category: '', sportType: '' };
}

/** Expenses list. With `fixedCategory` it's embedded on a category detail page and filtered to it. */
export function ExpensesView({ fixedCategory, embedded }: { fixedCategory?: ExpenseCategoryDTO; embedded?: boolean }) {
  const [filters, setFilters] = useState<ExpenseFilterValues>(defaultFilters);
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ExpenseDTO | null>(null);
  const [deleting, setDeleting] = useState<ExpenseDTO | null>(null);

  const { data: categories = [] } = useGetExpenseCategoriesQuery({ includeArchived: true });
  const category = fixedCategory?._id ?? filters.category;
  const { data, isLoading, isFetching, isError, error, refetch } = useGetExpensesQuery({
    from: filters.range.from,
    to: filters.range.to,
    category: category || undefined,
    sportType: filters.sportType || undefined,
    page,
    limit: EXPENSES_PAGE_SIZE,
  });
  const [deleteExpense] = useDeleteExpenseMutation();

  function updateFilters(next: ExpenseFilterValues) {
    setFilters(next);
    setPage(1);
  }

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  async function handleDelete() {
    if (!deleting) return;
    try {
      await deleteExpense(deleting._id).unwrap();
      toast.success('Expense deleted');
    } catch (e) {
      toast.error(getErrorMessage(e));
      throw e;
    }
  }

  const addButton = (
    <Button onClick={openCreate}>
      <Plus /> Add Expense
    </Button>
  );

  return (
    <>
      {embedded ? (
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-lg font-semibold">Expenses</h3>
          {addButton}
        </div>
      ) : (
        <PageHeader title="Expenses" description="Record and review arena expenses." actions={addButton} />
      )}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <ExpenseFilters
          value={filters}
          onChange={updateFilters}
          onReset={() => updateFilters(defaultFilters())}
          categories={categories}
          hideCategory={!!fixedCategory}
        />
        {data && (
          <p className="text-sm text-muted-foreground" aria-live="polite">
            <span className="font-medium text-foreground">{data.total}</span> expense{data.total === 1 ? '' : 's'} ·{' '}
            <span className="font-medium text-foreground">{formatCurrency(data.sumAmount)}</span>
          </p>
        )}
      </div>

      {isLoading ? (
        <TableSkeleton columns={7} />
      ) : isError ? (
        <ErrorState message={getErrorMessage(error)} onRetry={refetch} />
      ) : !data?.items.length ? (
        <EmptyState
          icon={Receipt}
          title="No expenses found"
          description={`Nothing recorded between ${formatDateStr(filters.range.from)} and ${formatDateStr(filters.range.to)} for these filters.`}
          action={addButton}
        />
      ) : (
        <div className={isFetching ? 'opacity-70 transition-opacity' : undefined}>
          <ExpenseTable
            expenses={data.items}
            page={data.page}
            limit={data.limit}
            total={data.total}
            onPageChange={setPage}
            onEdit={(e) => {
              setEditing(e);
              setFormOpen(true);
            }}
            onDelete={setDeleting}
          />
        </div>
      )}

      <ExpenseFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        expense={editing}
        defaultCategoryId={fixedCategory && !fixedCategory.isArchived ? fixedCategory._id : undefined}
      />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete this expense?"
        description={
          deleting &&
          `${deleting.category?.name ?? 'Expense'} · ${formatCurrency(deleting.amount)} on ${formatDate(deleting.date)}. This cannot be undone.`
        }
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
      />
    </>
  );
}
