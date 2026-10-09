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
import { categoriesHref, type CategoryListFilters } from '@/components/expense-categories/categories-url';
import { useDebouncedSearch } from '@/hooks/use-debounced-search';

// Loaded on the first "Add Category" click, then kept mounted so the close animation still plays.
const CategoryFormDialog = dynamic(
  () => import('@/components/expense-categories/CategoryFormDialog').then((m) => m.CategoryFormDialog),
  { ssr: false },
);

interface ICategoryWrapperProps {
  children: React.ReactNode;
}

const CategoryWrapper: React.FC<ICategoryWrapperProps> = ({ children }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const archived = searchParams.get('archived') === 'true';
  const [formOpen, setFormOpen] = useState(false);
  const [formEverOpened, setFormEverOpened] = useState(false);

  const updateQueryParams = useCallback(
    (page: number, filters: CategoryListFilters) => {
      router.replace(categoriesHref(filters, page), { scroll: false });
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
    router.push(categoriesHref({ search: '', archived: false }));
  };

  return (
    <div className="w-full space-y-4">
      <PageHeader
        title="Expense Categories"
        description="Organize expenses by type and sport."
        actions={
          <Button onClick={handleCreate}>
            <Plus /> Add Category
          </Button>
        }
      />

      {formEverOpened && (
        <CategoryFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          category={null}
          // The table is server-rendered, so re-run the server render to show the new category.
          onSaved={() => router.refresh()}
        />
      )}

      <Card className="py-4">
        <CardContent className="flex flex-wrap items-end gap-x-6 gap-y-3">
          <div className="space-y-2">
            <Label htmlFor="category-search">Search</Label>
            <form onSubmit={(e) => e.preventDefault()} className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="category-search"
                type="search"
                placeholder="Search categories…"
                className="w-56 pl-8 md:w-80"
                value={searchInput}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </form>
          </div>

          <div className="flex h-9 items-center gap-2">
            <Switch
              id="show-archived-categories"
              checked={archived}
              onCheckedChange={(checked) => updateQueryParams(1, { search: searchInput.trim(), archived: checked })}
            />
            <Label htmlFor="show-archived-categories" className="font-normal">
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

export default CategoryWrapper;
