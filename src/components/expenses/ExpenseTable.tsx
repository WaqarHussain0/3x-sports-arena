'use client';

import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { DataTable, Pagination, type Column } from '@/components/shared/DataTable';
import { CurrencyText } from '@/components/shared/CurrencyText';
import { SportBadge } from '@/components/shared/SportBadge';
import { formatDate } from '@/lib/format';
import type { ExpenseDTO } from '@/types';

export function ExpenseTable({
  expenses,
  page,
  limit,
  total,
  onPageChange,
  onEdit,
  onDelete,
}: {
  expenses: ExpenseDTO[];
  page: number;
  limit: number;
  total: number;
  onPageChange: (page: number) => void;
  onEdit: (e: ExpenseDTO) => void;
  onDelete: (e: ExpenseDTO) => void;
}) {
  const columns: Column<ExpenseDTO>[] = [
    { key: 'date', header: 'Date', className: 'whitespace-nowrap', cell: (e) => formatDate(e.date) },
    {
      key: 'category',
      header: 'Category',
      className: 'whitespace-nowrap',
      cell: (e) => (
        <span className="font-medium">
          {e.category?.name ?? 'Unknown'}
          {e.category?.isArchived && <span className="font-normal text-muted-foreground"> (archived)</span>}
        </span>
      ),
    },
    { key: 'sport', header: 'Sport Type', cell: (e) => <SportBadge sport={e.sportType} /> },
    {
      key: 'amount',
      header: 'Amount',
      headerClassName: 'text-right',
      className: 'text-right font-medium',
      cell: (e) => <CurrencyText amount={e.amount} />,
    },
    {
      key: 'notes',
      header: 'Notes',
      className: 'max-w-56',
      cell: (e) =>
        e.notes ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="block cursor-default truncate text-muted-foreground">{e.notes}</span>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs whitespace-pre-wrap">{e.notes}</TooltipContent>
          </Tooltip>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: 'by',
      header: 'Added By',
      className: 'whitespace-nowrap text-muted-foreground',
      cell: (e) => e.createdBy?.name ?? '—',
    },
    {
      key: 'actions',
      header: <span className="sr-only">Actions</span>,
      className: 'w-10 text-right',
      cell: (e) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label="Expense actions">
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => onEdit(e)}>
              <Pencil /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onSelect={() => onDelete(e)}>
              <Trash2 /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={expenses}
      getRowKey={(e) => e._id}
      footer={<Pagination page={page} limit={limit} total={total} onPageChange={onPageChange} />}
    />
  );
}
