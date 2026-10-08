'use client';

import { useState } from 'react';
import { LandPlot, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { PageHeader } from '@/components/layout/PageHeader';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { EmptyState, ErrorState } from '@/components/shared/EmptyState';
import { CardGridSkeleton } from '@/components/shared/LoadingState';
import { getErrorMessage } from '@/store/api/baseApi';
import { useDeleteCourtMutation, useGetCourtsQuery, useToggleCourtArchiveMutation } from '@/store/api/courtsApi';
import type { CourtDTO } from '@/types';
import { CourtCard } from './CourtCard';
import { CourtFormDialog } from './CourtFormDialog';

export function CourtsView() {
  const [showArchived, setShowArchived] = useState(false);
  const { data: courts, isLoading, isError, error, refetch } = useGetCourtsQuery({ includeArchived: showArchived });
  const [toggleArchive] = useToggleCourtArchiveMutation();
  const [deleteCourt] = useDeleteCourtMutation();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CourtDTO | null>(null);
  const [deleting, setDeleting] = useState<CourtDTO | null>(null);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  async function handleToggleArchive(court: CourtDTO) {
    try {
      await toggleArchive(court._id).unwrap();
      toast.success(court.isArchived ? `${court.name} restored` : `${court.name} archived`);
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    try {
      await deleteCourt(deleting._id).unwrap();
      toast.success('Court deleted');
    } catch (e) {
      toast.error(getErrorMessage(e));
      throw e;
    }
  }

  return (
    <>
      <PageHeader
        title="Courts"
        description="Manage courts, hourly prices and calendar colors."
        actions={
          <>
            <div className="flex items-center gap-2">
              <Switch id="show-archived-courts" checked={showArchived} onCheckedChange={setShowArchived} />
              <Label htmlFor="show-archived-courts" className="text-sm font-normal">
                Show archived
              </Label>
            </div>
            <Button onClick={openCreate}>
              <Plus /> Add Court
            </Button>
          </>
        }
      />

      {isLoading ? (
        <CardGridSkeleton count={2} />
      ) : isError ? (
        <ErrorState message={getErrorMessage(error)} onRetry={refetch} />
      ) : !courts?.length ? (
        <EmptyState
          icon={LandPlot}
          title="No courts yet"
          description="Add your first court to start taking bookings."
          action={
            <Button onClick={openCreate}>
              <Plus /> Add Court
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {courts.map((court) => (
            <CourtCard
              key={court._id}
              court={court}
              onEdit={() => {
                setEditing(court);
                setFormOpen(true);
              }}
              onToggleArchive={() => handleToggleArchive(court)}
              onDelete={() => setDeleting(court)}
            />
          ))}
        </div>
      )}

      <CourtFormDialog open={formOpen} onOpenChange={setFormOpen} court={editing} />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Delete ${deleting?.name ?? 'court'}?`}
        description="This permanently removes the court. This cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
      />
    </>
  );
}
