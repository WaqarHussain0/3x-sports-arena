'use client';

import { useCallback, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { PageHeader } from '@/components/layout/PageHeader';
import { courtsHref, type CourtListFilters } from '@/components/courts/courts-url';
import { useDebouncedSearch } from '@/hooks/use-debounced-search';

// Loaded on the first "Add Court" click, then kept mounted so the close animation still plays.
const CourtFormDialog = dynamic(
  () => import('@/components/courts/CourtFormDialog').then((m) => m.CourtFormDialog),
  { ssr: false },
);

interface ICourtWrapperProps {
  children: React.ReactNode;
}

const CourtWrapper: React.FC<ICourtWrapperProps> = ({ children }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const archived = searchParams.get('archived') === 'true';
  const [formOpen, setFormOpen] = useState(false);
  const [formEverOpened, setFormEverOpened] = useState(false);

  const updateQueryParams = useCallback(
    (page: number, filters: CourtListFilters) => {
      router.replace(courtsHref(filters, page), { scroll: false });
    },
    [router],
  );

  const { searchInput, handleSearchChange, clearSearch } = useDebouncedSearch(
    (value) => updateQueryParams(1, { search: value, archived }),
    searchParams.get('search') ?? '',
  );

  const handleCreate = () => {
    setFormOpen(true);
    setFormEverOpened(true);
  };

  const handleClearFilter = () => {
    clearSearch();
    router.push(courtsHref({ search: '', archived: false }));
  };

  return (
    <div className="w-full space-y-4">
      <PageHeader
        title="Courts"
        description="Manage courts, hourly prices and calendar colors."
        actions={
          <Button onClick={handleCreate}>
            <Plus /> Add Court
          </Button>
        }
      />

      {formEverOpened && (
        <CourtFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          court={null}
          // The grid is server-rendered, so re-run the server render to show the new court.
          onSaved={() => router.refresh()}
        />
      )}

      <Card className="py-4">
        <CardContent className="flex flex-wrap items-end gap-x-6 gap-y-3">
          <div className="space-y-2">
            <Label htmlFor="court-search">Search</Label>
            <form onSubmit={(e) => e.preventDefault()} className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="court-search"
                type="search"
                placeholder="Search courts…"
                className="w-56 pl-8 md:w-80"
                value={searchInput}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </form>
          </div>

          <div className="flex h-9 items-center gap-2">
            <Switch
              id="show-archived-courts"
              checked={archived}
              onCheckedChange={(checked) => updateQueryParams(1, { search: searchInput.trim(), archived: checked })}
            />
            <Label htmlFor="show-archived-courts" className="font-normal">
              Show archived
            </Label>
          </div>

          {(searchInput || archived) && (
            <Button variant="link" className="h-9 px-0" onClick={handleClearFilter}>
              Clear all
            </Button>
          )}
        </CardContent>
      </Card>

      {children}
    </div>
  );
};

export default CourtWrapper;
