"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Archive,
  ArchiveRestore,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import {
  DataTable,
  Pagination,
  type Column,
} from "@/components/shared/DataTable";
import { CurrencyText } from "@/components/shared/CurrencyText";
import { SportBadge } from "@/components/shared/SportBadge";
import { ArchivedBadge } from "@/components/shared/StatusBadge";
import { cn } from "@/lib/utils";
import { getErrorMessage } from "@/store/api/baseApi";
import {
  useDeleteExpenseCategoryMutation,
  useToggleExpenseCategoryArchiveMutation,
} from "@/store/api/expenseCategoriesApi";
import type { ExpenseCategoryDTO } from "@/types";
import { categoriesHref, type CategoryListFilters } from "./categories-url";
import { CategoryFormDialog } from "./CategoryFormDialog";

/**
 * Server-fed categories table. Row actions call the API, then `router.refresh()` re-runs the
 * page's server render so the list reflects the change. Paging navigates to `?page=`.
 */
export function CategoryTable({
  categories,
  filters,
  page,
  limit,
  total,
}: {
  categories: ExpenseCategoryDTO[];
  filters: CategoryListFilters;
  page: number;
  limit: number;
  total: number;
}) {
  const router = useRouter();
  const [toggleArchive] = useToggleExpenseCategoryArchiveMutation();
  const [deleteCategory] = useDeleteExpenseCategoryMutation();
  const [editing, setEditing] = useState<ExpenseCategoryDTO | null>(null);
  const [deleting, setDeleting] = useState<ExpenseCategoryDTO | null>(null);

  async function handleToggleArchive(c: ExpenseCategoryDTO) {
    try {
      await toggleArchive(c._id).unwrap();
      toast.success("Request successful", {
        description: c.isArchived ? `${c.name} restored` : `${c.name} archived`,
      });
      router.refresh();
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    try {
      await deleteCategory(deleting._id).unwrap();
      toast.success("Request successful", { description: "Category deleted" });
      router.refresh();
    } catch (e) {
      toast.error(getErrorMessage(e));
      throw e;
    }
  }

  const columns: Column<ExpenseCategoryDTO>[] = [
    {
      key: "name",
      header: "Name",
      cell: (c) => <span className="font-medium">{c.name}</span>,
    },
    {
      key: "sport",
      header: "Sport Type",
      cell: (c) => <SportBadge sport={c.sportType} />,
    },
    {
      key: "description",
      header: "Description",
      className: "max-w-64",
      cell: (c) => (
        <span className="block truncate text-muted-foreground">
          {c.description || "—"}
        </span>
      ),
    },
    {
      key: "count",
      header: "# Expenses",
      headerClassName: "text-right",
      className: "text-right tabular-nums",
      cell: (c) => c.expenseCount,
    },
    {
      key: "total",
      header: "Total Spent",
      headerClassName: "text-right",
      className: "text-right",
      cell: (c) => <CurrencyText amount={c.totalSpent} />,
    },
    {
      key: "status",
      header: "Status",
      cell: (c) => <ArchivedBadge archived={c.isArchived} />,
    },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      className: "w-10 text-right",
      cell: (c) => (
        // Stop row navigation when using the menu.
        <div
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Actions for ${c.name}`}
              >
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setEditing(c)}>
                <Pencil /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => handleToggleArchive(c)}>
                {c.isArchived ? <ArchiveRestore /> : <Archive />}
                {c.isArchived ? "Unarchive" : "Archive"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {c.expenseCount === 0 ? (
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() => setDeleting(c)}
                >
                  <Trash2 /> Delete
                </DropdownMenuItem>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <DropdownMenuItem disabled>
                        <Trash2 /> Delete
                      </DropdownMenuItem>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="left">
                    Categories with expenses can only be archived
                  </TooltipContent>
                </Tooltip>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        data={categories}
        getRowKey={(c) => c._id}
        onRowClick={(c) => router.push(`/expense-categories/${c._id}`)}
        rowClassName={(c) => cn(c.isArchived && "text-muted-foreground")}
        footer={
          <Pagination
            page={page}
            limit={limit}
            total={total}
            onPageChange={(p) =>
              router.push(categoriesHref(filters, p), { scroll: false })
            }
          />
        }
      />

      <CategoryFormDialog
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        category={editing}
        onSaved={() => router.refresh()}
      />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Delete ${deleting?.name ?? "category"}?`}
        description="This permanently removes the category. This cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
      />
    </>
  );
}
