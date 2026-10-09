'use client';

import { useState } from 'react';
import {
  BadgePercent,
  CalendarCheck,
  Clock,
  HandCoins,
  Hourglass,
  Receipt,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/layout/PageHeader';
import { ErrorState } from '@/components/shared/EmptyState';
import { BookingDetailSheet } from '@/components/bookings/BookingDetailSheet';
import { formatCurrency, formatNumber } from '@/lib/format';
import { todayPkt } from '@/lib/time';
import { getErrorMessage } from '@/store/api/baseApi';
import { useGetDashboardStatsQuery } from '@/store/api/dashboardApi';
import { useAppSelector } from '@/store/hooks';
import { selectDashboardQuery } from '@/store/slices/dashboardSlice';
import {
  BookingsByWeekdayChart,
  ExpensesByCategoryChart,
  ExpensesBySportChart,
  PeakHoursChart,
  RevenueByCourtChart,
  RevenueBySportChart,
  UtilizationCard,
} from './BreakdownCharts';
import { DashboardFilterBar } from './DashboardFilterBar';
import { OutstandingTable, RecentExpensesTable, TopCustomersTable, UpcomingBookingsTable } from './DashboardTables';
import { RevenueExpenseChart } from './RevenueExpenseChart';
import { StatCard, percentChange } from './StatCard';

export function DashboardView() {
  const filter = useAppSelector((s) => s.dashboard);
  const query = selectDashboardQuery(filter);
  const { data: stats, isLoading, isFetching, isError, error, refetch } = useGetDashboardStatsQuery(query);

  const [detailId, setDetailId] = useState<string | null>(null);

  const k = stats?.kpis;
  const p = stats?.previousKpis;

  return (
    <>
      <PageHeader title="Dashboard" description="Business overview for 3X Sports Arena." />
      <DashboardFilterBar
        earliestYear={stats?.earliestYear ?? Number(todayPkt().slice(0, 4))}
        rangeLabel={stats ? stats.range : undefined}
      />

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-80 rounded-xl" />
        </div>
      ) : isError || !stats || !k || !p ? (
        <ErrorState message={getErrorMessage(error)} onRetry={refetch} />
      ) : (
        <div className={isFetching ? 'space-y-6 opacity-70 transition-opacity' : 'space-y-6 transition-opacity'}>
          {/* Row 1 — KPIs */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard title="Collected Revenue" icon={Wallet} value={formatCurrency(k.collectedRevenue)} change={percentChange(k.collectedRevenue, p.collectedRevenue)} />
            <StatCard title="Booked Revenue" icon={TrendingUp} value={formatCurrency(k.bookedRevenue)} change={percentChange(k.bookedRevenue, p.bookedRevenue)} />
            <StatCard title="Total Expenses" icon={Receipt} value={formatCurrency(k.totalExpenses)} change={percentChange(k.totalExpenses, p.totalExpenses)} inverse />
            <StatCard
              title="Net Profit"
              icon={HandCoins}
              value={formatCurrency(k.netProfit)}
              change={percentChange(k.netProfit, p.netProfit)}
              valueClassName={k.netProfit > 0 ? 'text-emerald-600 dark:text-emerald-400' : k.netProfit < 0 ? 'text-red-600 dark:text-red-400' : undefined}
            />
            <StatCard
              title="Outstanding Balance"
              icon={Hourglass}
              value={formatCurrency(k.outstanding)}
              subtitle={k.retainedAdvances > 0 ? `Retained advances: ${formatCurrency(k.retainedAdvances)}` : undefined}
            />
            <StatCard
              title="Total Bookings"
              icon={CalendarCheck}
              value={formatNumber(k.totalBookings)}
              change={percentChange(k.totalBookings, p.totalBookings)}
              subtitle={`${k.cancelledBookings} cancelled`}
            />
            <StatCard title="Hours Booked" icon={Clock} value={`${formatNumber(k.hoursBooked, 1)} h`} change={percentChange(k.hoursBooked, p.hoursBooked)} />
            <StatCard title="Discounts Given" icon={BadgePercent} value={formatCurrency(k.discountsGiven)} change={percentChange(k.discountsGiven, p.discountsGiven)} inverse />
          </div>

          {/* Row 2 */}
          <div className="grid gap-4 xl:grid-cols-3">
            <RevenueExpenseChart stats={stats} />
            <RevenueByCourtChart stats={stats} />
          </div>

          {/* Row 3 */}
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            <RevenueBySportChart stats={stats} />
            <ExpensesByCategoryChart stats={stats} />
            <ExpensesBySportChart stats={stats} />
          </div>

          {/* Row 4 */}
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
            <PeakHoursChart stats={stats} />
            <BookingsByWeekdayChart stats={stats} />
            <UtilizationCard stats={stats} />
          </div>

          {/* Row 5 */}
          <div className="grid gap-4 xl:grid-cols-2">
            <UpcomingBookingsTable stats={stats} onOpen={setDetailId} />
            <OutstandingTable stats={stats} onOpen={setDetailId} />
            <TopCustomersTable stats={stats} />
            <RecentExpensesTable stats={stats} />
          </div>
        </div>
      )}

      <BookingDetailSheet bookingId={detailId} onOpenChange={(o) => !o && setDetailId(null)} />
    </>
  );
}
