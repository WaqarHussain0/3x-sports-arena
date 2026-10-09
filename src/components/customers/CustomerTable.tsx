'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MoreHorizontal, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DataTable, Pagination, type Column } from '@/components/shared/DataTable';
import { formatDate } from '@/lib/format';
import { formatPhone } from '@/lib/phone';
import type { CustomerDTO } from '@/types';
import { CustomerFormDialog } from './CustomerFormDialog';
import { customersHref } from './customers-url';

/**
 * Server-fed customers table. Paging navigates to `?page=`; after an edit, `router.refresh()`
 * re-runs the page's server render so the row shows the new details.
 */
export function CustomerTable({
  customers,
  search,
  page,
  limit,
  total,
}: {
  customers: CustomerDTO[];
  search: string;
  page: number;
  limit: number;
  total: number;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<CustomerDTO | null>(null);

  const columns: Column<CustomerDTO>[] = [
    { key: 'name', header: 'Name', className: 'font-medium', cell: (c) => c.name },
    { key: 'phone', header: 'Phone', className: 'whitespace-nowrap tabular-nums', cell: (c) => formatPhone(c.phone) },
    {
      key: 'email',
      header: 'Email',
      cell: (c) => c.email ?? <span className="text-muted-foreground">—</span>,
    },
    {
      key: 'firstBookingAt',
      header: 'First Booking',
      className: 'whitespace-nowrap',
      cell: (c) => (c.firstBookingAt ? formatDate(c.firstBookingAt) : <span className="text-muted-foreground">—</span>),
    },
    {
      key: 'actions',
      header: <span className="sr-only">Actions</span>,
      className: 'w-10 text-right',
      cell: (c) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${c.name}`}>
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => setEditing(c)}>
              <Pencil /> Edit
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        data={customers}
        getRowKey={(c) => c._id}
        footer={
          <Pagination
            page={page}
            limit={limit}
            total={total}
            onPageChange={(p) => router.push(customersHref(search, p), { scroll: false })}
          />
        }
      />

      <CustomerFormDialog
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        customer={editing}
        onSaved={() => router.refresh()}
      />
    </>
  );
}
