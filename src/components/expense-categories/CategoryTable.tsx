'use client';

import { useRouter } from 'next/navigation';
import { Archive, ArchiveRestore, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { CurrencyText } from '@/components/shared/CurrencyText';
import { SportBadge } from '@/components/shared/SportBadge';
import { ArchivedBadge } from '@/components/shared/StatusBadge';
import { cn } from '@/lib/utils';
import type { ExpenseCategoryDTO } from '@/types';

export function CategoryTable({
  categories,
  onEdit,
  onToggleArchive,
  onDelete,
}: {
  categories: ExpenseCategoryDTO[];
  onEdit: (c: ExpenseCategoryDTO) => void;
  onToggleArchive: (c: ExpenseCategoryDTO) => void;
  onDelete: (c: ExpenseCategoryDTO) => void;
}) {
  const router = useRouter();

  const columns: Column<ExpenseCategoryDTO>[] = [
    { key: 'name', header: 'Name', cell: (c) => <span className="font-medium">{c.name}</span> },
    { key: 'sport', header: 'Sport Type', cell: (c) => <SportBadge sport={c.sportType} /> },
    {
      key: 'description',
      header: 'Description',
      className: 'max-w-64',
      cell: (c) => <span className="block truncate text-muted-foreground">{c.description || '—'}</span>,
    },
    {
      key: 'count',
      header: '# Expenses',
      headerClassName: 'text-right',
      className: 'text-right tabular-nums',
      cell: (c) => c.expenseCount,
    },
    {
      key: 'total',
      header: 'Total Spent',
      headerClassName: 'text-right',
      className: 'text-right',
      cell: (c) => <CurrencyText amount={c.totalSpent} />,
    },
    { key: 'status', header: 'Status', cell: (c) => <ArchivedBadge archived={c.isArchived} /> },
    {
      key: 'actions',
      header: <span className="sr-only">Actions</span>,
      className: 'w-10 text-right',
      cell: (c) => (
        // Stop row navigation when using the menu.
        <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${c.name}`}>
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => onEdit(c)}>
                <Pencil /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onToggleArchive(c)}>
                {c.isArchived ? <ArchiveRestore /> : <Archive />}
                {c.isArchived ? 'Unarchive' : 'Archive'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {c.expenseCount === 0 ? (
                <DropdownMenuItem variant="destructive" onSelect={() => onDelete(c)}>
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
                  <TooltipContent side="left">Categories with expenses can only be archived</TooltipContent>
                </Tooltip>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={categories}
      getRowKey={(c) => c._id}
      onRowClick={(c) => router.push(`/expense-categories/${c._id}`)}
      rowClassName={(c) => cn(c.isArchived && 'text-muted-foreground')}
    />
  );
}
