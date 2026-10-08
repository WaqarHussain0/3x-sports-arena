'use client';

import { useMemo, useState } from 'react';
import { Plus, Search, Tags } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { PageHeader } from '@/components/layout/PageHeader';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { EmptyState, ErrorState } from '@/components/shared/EmptyState';
import { TableSkeleton } from '@/components/shared/LoadingState';
import { getErrorMessage } from '@/store/api/baseApi';
import {
  useDeleteExpenseCategoryMutation,
  useGetExpenseCategoriesQuery,
  useToggleExpenseCategoryArchiveMutation,
} from '@/store/api/expenseCategoriesApi';
import type { ExpenseCategoryDTO } from '@/types';
import { CategoryFormDialog } from './CategoryFormDialog';
import { CategoryTable } from './CategoryTable';

export function CategoriesView() {
  const [showArchived, setShowArchived] = useState(false);
  const [search, setSearch] = useState('');
  const { data, isLoading, isError, error, refetch } = useGetExpenseCategoriesQuery({ includeArchived: showArchived });
  const [toggleArchive] = useToggleExpenseCategoryArchiveMutation();
  const [deleteCategory] = useDeleteExpenseCategoryMutation();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ExpenseCategoryDTO | null>(null);
  const [deleting, setDeleting] = useState<ExpenseCategoryDTO | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data ?? []).filter((c) => !q || c.name.toLowerCase().includes(q));
  }, [data, search]);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  async function handleToggleArchive(c: ExpenseCategoryDTO) {
    try {
      await toggleArchive(c._id).unwrap();
      toast.success(c.isArchived ? `${c.name} restored` : `${c.name} archived`);
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    try {
      await deleteCategory(deleting._id).unwrap();
      toast.success('Category deleted');
    } catch (e) {
      toast.error(getErrorMessage(e));
      throw e;
    }
  }

  return (
    <>
      <PageHeader
        title="Expense Categories"
        description="Organize expenses by type and sport."
        actions={
          <Button onClick={openCreate}>
            <Plus /> Add Category
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search categories…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
            aria-label="Search categories"
          />
        </div>
        <div className="flex items-center gap-2">
          <Switch id="show-archived-categories" checked={showArchived} onCheckedChange={setShowArchived} />
          <Label htmlFor="show-archived-categories" className="font-normal">
            Show archived
          </Label>
        </div>
      </div>

      {isLoading ? (
        <TableSkeleton columns={6} />
      ) : isError ? (
        <ErrorState message={getErrorMessage(error)} onRetry={refetch} />
      ) : !data?.length ? (
        <EmptyState
          icon={Tags}
          title="No categories yet"
          description="Create categories like Electricity, Cricket Balls or Staff Salaries."
          action={
            <Button onClick={openCreate}>
              <Plus /> Add Category
            </Button>
          }
        />
      ) : !filtered.length ? (
        <EmptyState icon={Search} title="No matches" description={`No categories match “${search}”.`} />
      ) : (
        <CategoryTable
          categories={filtered}
          onEdit={(c) => {
            setEditing(c);
            setFormOpen(true);
          }}
          onToggleArchive={handleToggleArchive}
          onDelete={setDeleting}
        />
      )}

      <CategoryFormDialog open={formOpen} onOpenChange={setFormOpen} category={editing} />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Delete ${deleting?.name ?? 'category'}?`}
        description="This permanently removes the category. This cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
      />
    </>
  );
}
