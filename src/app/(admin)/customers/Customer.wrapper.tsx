'use client';

import { useCallback, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/layout/PageHeader';
import { customersHref } from '@/components/customers/customers-url';
import { useDebouncedSearch } from '@/hooks/use-debounced-search';

// Loaded on the first "Add Customer" click, then kept mounted so the close animation still plays.
const CustomerFormDialog = dynamic(
  () => import('@/components/customers/CustomerFormDialog').then((m) => m.CustomerFormDialog),
  { ssr: false },
);

interface ICustomerWrapperProps {
  children: React.ReactNode;
}

const CustomerWrapper: React.FC<ICustomerWrapperProps> = ({ children }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formOpen, setFormOpen] = useState(false);
  const [formEverOpened, setFormEverOpened] = useState(false);

  const updateQueryParams = useCallback(
    (page: number, search?: string) => {
      router.replace(customersHref(search ?? '', page), { scroll: false });
    },
    [router],
  );

  const { searchInput, handleSearchChange, clearSearch } = useDebouncedSearch(
    (value) => updateQueryParams(1, value),
    searchParams.get('search') ?? '',
  );

  const handleCreate = () => {
    setFormOpen(true);
    setFormEverOpened(true);
  };

  const handleClearFilter = () => {
    clearSearch();
    router.push(customersHref(''));
  };

  return (
    <div className="w-full space-y-4">
      <PageHeader
        title="Customers"
        description="Everyone who books courts at the arena."
        actions={
          <Button onClick={handleCreate}>
            <Plus /> Add Customer
          </Button>
        }
      />

      {formEverOpened && (
        <CustomerFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          // The table is server-rendered, so re-run the server render to show the new customer.
          onSaved={() => router.refresh()}
        />
      )}

      <Card className="py-4">
        <CardContent className="flex items-end gap-3">
          <div className="space-y-2">
            <Label htmlFor="customer-search">Search</Label>
            <form onSubmit={(e) => e.preventDefault()} className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="customer-search"
                type="search"
                placeholder="Search name, phone or email…"
                className="w-56 pl-8 md:w-80"
                value={searchInput}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </form>
          </div>

          {searchInput && (
            <Button variant="link" className="px-0" onClick={handleClearFilter}>
              Clear all
            </Button>
          )}
        </CardContent>
      </Card>

      {children}
    </div>
  );
};

export default CustomerWrapper;
