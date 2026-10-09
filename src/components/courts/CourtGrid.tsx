"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Pagination } from "@/components/shared/DataTable";
import { getErrorMessage } from "@/store/api/baseApi";
import {
  useDeleteCourtMutation,
  useToggleCourtArchiveMutation,
} from "@/store/api/courtsApi";
import type { CourtDTO } from "@/types";
import { CourtCard } from "./CourtCard";
import { CourtFormDialog } from "./CourtFormDialog";
import { courtsHref, type CourtListFilters } from "./courts-url";

/**
 * Server-fed court cards. Card actions call the API, then `router.refresh()` re-runs the
 * page's server render so the grid reflects the change. Paging navigates to `?page=`.
 */
export function CourtGrid({
  courts,
  filters,
  page,
  limit,
  total,
}: {
  courts: CourtDTO[];
  filters: CourtListFilters;
  page: number;
  limit: number;
  total: number;
}) {
  const router = useRouter();
  const [toggleArchive] = useToggleCourtArchiveMutation();
  const [deleteCourt] = useDeleteCourtMutation();
  const [editing, setEditing] = useState<CourtDTO | null>(null);
  const [deleting, setDeleting] = useState<CourtDTO | null>(null);

  async function handleToggleArchive(court: CourtDTO) {
    try {
      await toggleArchive(court._id).unwrap();
      toast.success("Request successful", {
        description: court.isArchived
          ? `${court.name} restored`
          : `${court.name} archived`,
      });
      router.refresh();
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    try {
      await deleteCourt(deleting._id).unwrap();
      toast.success("Request successful", {
        description: "Court deleted",
      });
      router.refresh();
    } catch (e) {
      toast.error(getErrorMessage(e));
      throw e;
    }
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {courts.map((court) => (
          <CourtCard
            key={court._id}
            court={court}
            onEdit={() => setEditing(court)}
            onToggleArchive={() => handleToggleArchive(court)}
            onDelete={() => setDeleting(court)}
          />
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border bg-card [&>div]:border-t-0">
        <Pagination
          page={page}
          limit={limit}
          total={total}
          onPageChange={(p) =>
            router.push(courtsHref(filters, p), { scroll: false })
          }
        />
      </div>

      <CourtFormDialog
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        court={editing}
        onSaved={() => router.refresh()}
      />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Delete ${deleting?.name ?? "court"}?`}
        description="This permanently removes the court. This cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
      />
    </>
  );
}
