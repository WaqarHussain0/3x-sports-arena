'use client';

import type { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SportBadge } from '@/components/shared/SportBadge';
import { PaymentStatusBadge } from '@/components/shared/StatusBadge';
import { formatCurrency, formatDate, formatShortDay, formatTimeRange } from '@/lib/format';
import { formatPhone } from '@/lib/phone';
import { cn } from '@/lib/utils';
import type { DashboardStats } from '@/types';

function TableCard({
  title,
  description,
  emptyMessage,
  isEmpty,
  head,
  children,
}: {
  title: string;
  description?: string;
  emptyMessage: string;
  isEmpty: boolean;
  head: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="px-0">
        {isEmpty ? (
          <p className="px-6 py-8 text-center text-sm text-muted-foreground">{emptyMessage}</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>{head}</TableRow>
            </TableHeader>
            <TableBody>{children}</TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function clickableRow(onClick: () => void) {
  return {
    className: 'cursor-pointer',
    tabIndex: 0,
    onClick,
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick();
      }
    },
  };
}

export function UpcomingBookingsTable({ stats, onOpen }: { stats: DashboardStats; onOpen: (id: string) => void }) {
  return (
    <TableCard
      title="Upcoming bookings"
      description="Next 7 from now"
      emptyMessage="No upcoming bookings."
      isEmpty={!stats.upcomingBookings.length}
      head={
        <>
          <TableHead className="pl-6">When</TableHead>
          <TableHead>Court</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>Sport</TableHead>
          <TableHead className="pr-6">Payment</TableHead>
        </>
      }
    >
      {stats.upcomingBookings.map((b) => (
        <TableRow key={b._id} {...clickableRow(() => onOpen(b._id))}>
          <TableCell className="pl-6 whitespace-nowrap">
            <div className="font-medium">{formatShortDay(b.startAt)}</div>
            <div className="text-xs text-muted-foreground">{formatTimeRange(b.startAt, b.endAt)}</div>
          </TableCell>
          <TableCell className="whitespace-nowrap">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full" style={{ backgroundColor: b.courtColor }} />
              {b.courtName}
            </span>
          </TableCell>
          <TableCell className="whitespace-nowrap">{b.customerName}</TableCell>
          <TableCell>
            <SportBadge sport={b.sportType} />
          </TableCell>
          <TableCell className="pr-6">
            <PaymentStatusBadge status={b.paymentStatus} />
          </TableCell>
        </TableRow>
      ))}
    </TableCard>
  );
}

export function OutstandingTable({ stats, onOpen }: { stats: DashboardStats; onOpen: (id: string) => void }) {
  return (
    <TableCard
      title="Outstanding payments"
      description="Bookings in range with a remaining balance"
      emptyMessage="Nothing outstanding — all settled."
      isEmpty={!stats.outstandingBookings.length}
      head={
        <>
          <TableHead className="pl-6">Customer</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>Date</TableHead>
          <TableHead className="pr-6 text-right">Remaining</TableHead>
        </>
      }
    >
      {stats.outstandingBookings.map((b) => (
        <TableRow key={b._id} {...clickableRow(() => onOpen(b._id))}>
          <TableCell className="pl-6 font-medium whitespace-nowrap">{b.customerName}</TableCell>
          <TableCell className="whitespace-nowrap">{formatPhone(b.phone)}</TableCell>
          <TableCell className="whitespace-nowrap">{formatDate(b.startAt)}</TableCell>
          <TableCell className="pr-6 text-right font-medium tabular-nums">{formatCurrency(b.remainingAmount)}</TableCell>
        </TableRow>
      ))}
    </TableCard>
  );
}

export function TopCustomersTable({ stats }: { stats: DashboardStats }) {
  return (
    <TableCard
      title="Top customers"
      description="By booked spend in range"
      emptyMessage="No customers in this period."
      isEmpty={!stats.topCustomers.length}
      head={
        <>
          <TableHead className="pl-6">Name</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead className="text-right">Bookings</TableHead>
          <TableHead className="pr-6 text-right">Total</TableHead>
        </>
      }
    >
      {stats.topCustomers.map((c) => (
        <TableRow key={c.customerId}>
          <TableCell className="pl-6 font-medium whitespace-nowrap">{c.name}</TableCell>
          <TableCell className="whitespace-nowrap">
            <a href={`tel:${c.phone}`} className="hover:underline">
              {formatPhone(c.phone)}
            </a>
          </TableCell>
          <TableCell className="text-right tabular-nums">{c.bookings}</TableCell>
          <TableCell className="pr-6 text-right font-medium tabular-nums">{formatCurrency(c.total)}</TableCell>
        </TableRow>
      ))}
    </TableCard>
  );
}

export function RecentExpensesTable({ stats }: { stats: DashboardStats }) {
  return (
    <TableCard
      title="Recent expenses"
      description="Latest 5 in range"
      emptyMessage="No expenses in this period."
      isEmpty={!stats.recentExpenses.length}
      head={
        <>
          <TableHead className="pl-6">Date</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Sport</TableHead>
          <TableHead className="pr-6 text-right">Amount</TableHead>
        </>
      }
    >
      {stats.recentExpenses.map((e) => (
        <TableRow key={e._id}>
          <TableCell className="pl-6 whitespace-nowrap">{formatDate(e.date)}</TableCell>
          <TableCell className={cn('max-w-40 truncate font-medium')} title={e.notes}>
            {e.categoryName}
          </TableCell>
          <TableCell>
            <SportBadge sport={e.sportType} />
          </TableCell>
          <TableCell className="pr-6 text-right tabular-nums">{formatCurrency(e.amount)}</TableCell>
        </TableRow>
      ))}
    </TableCard>
  );
}
