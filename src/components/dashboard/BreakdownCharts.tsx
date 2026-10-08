'use client';

import { Bar, BarChart, CartesianGrid, Cell, Label, LabelList, Pie, PieChart, XAxis, YAxis } from 'recharts';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { Progress } from './Progress';
import { label } from '@/lib/constants';
import { formatCurrency, formatHourLabel, formatNumber, formatPercent } from '@/lib/format';
import type { DashboardStats } from '@/types';
import { ChartCard } from './ChartCard';
import { asCount, asCurrency, asHours, compactCurrency, hasAnyValue, tooltipFormatter } from './chart-helpers';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** Booked revenue per court — bars wear each court's own calendar color (color follows the entity). */
export function RevenueByCourtChart({ stats }: { stats: DashboardStats }) {
  const data = stats.revenueByCourt;
  const config: ChartConfig = { revenue: { label: 'Booked revenue' } };
  for (const c of data) config[c.courtName] = { label: c.courtName, color: c.color };

  return (
    <ChartCard title="Revenue by Court" description="Booked revenue (non-cancelled)" empty={!hasAnyValue(data, (d) => d.revenue)}>
      <ChartContainer config={config} className="aspect-auto h-72 w-full">
        <BarChart data={data} margin={{ top: 20, left: 4, right: 8 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="courtName" tickLine={false} axisLine={false} tickMargin={8} interval={0} />
          <YAxis tickLine={false} axisLine={false} width={48} tickFormatter={compactCurrency} />
          <ChartTooltip
            cursor={{ fillOpacity: 0.4 }}
            content={<ChartTooltipContent hideLabel nameKey="courtName" formatter={tooltipFormatter(config, asCurrency)} />}
          />
          <Bar dataKey="revenue" radius={[4, 4, 0, 0]} maxBarSize={64}>
            {data.map((c) => (
              <Cell key={c.courtId} fill={c.color} />
            ))}
            <LabelList
              dataKey="revenue"
              position="top"
              className="fill-foreground text-xs"
              formatter={(v: unknown) => formatCurrency(Number(v))}
            />
          </Bar>
        </BarChart>
      </ChartContainer>
    </ChartCard>
  );
}

const sportConfig = {
  cricket: { label: 'Cricket', color: 'var(--chart-1)' },
  futsal: { label: 'Futsal', color: 'var(--chart-2)' },
} satisfies ChartConfig;

export function RevenueBySportChart({ stats }: { stats: DashboardStats }) {
  const data = stats.revenueBySport.map((s) => ({ ...s, fill: `var(--color-${s.sportType})` }));
  const total = data.reduce((sum, s) => sum + s.revenue, 0);

  return (
    <ChartCard title="Revenue by Sport" description="Booked revenue split" empty={total === 0}>
      <ChartContainer config={sportConfig} className="mx-auto aspect-square h-64">
        <PieChart>
          <ChartTooltip content={<ChartTooltipContent hideLabel nameKey="sportType" formatter={tooltipFormatter(sportConfig, asCurrency)} />} />
          <Pie data={data} dataKey="revenue" nameKey="sportType" innerRadius={62} outerRadius={92} strokeWidth={2} stroke="var(--card)">
            <Label
              content={({ viewBox }) => {
                if (!viewBox || !('cx' in viewBox)) return null;
                return (
                  <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                    <tspan x={viewBox.cx} y={(viewBox.cy ?? 0) - 6} className="fill-foreground text-base font-semibold">
                      {formatCurrency(total)}
                    </tspan>
                    <tspan x={viewBox.cx} y={(viewBox.cy ?? 0) + 14} className="fill-muted-foreground text-xs">
                      {formatNumber(data.reduce((s, d) => s + d.bookings, 0))} bookings
                    </tspan>
                  </text>
                );
              }}
            />
          </Pie>
          <ChartLegend content={<ChartLegendContent nameKey="sportType" />} />
        </PieChart>
      </ChartContainer>
    </ChartCard>
  );
}

const amountConfig = { amount: { label: 'Spent', color: 'var(--chart-2)' } } satisfies ChartConfig;

export function ExpensesByCategoryChart({ stats }: { stats: DashboardStats }) {
  const data = stats.expensesByCategory;
  return (
    <ChartCard title="Expenses by Category" description="Top 8 categories + Other" empty={!data.length}>
      <ChartContainer config={amountConfig} className="aspect-auto w-full" style={{ height: Math.max(data.length * 34 + 24, 160) }}>
        <BarChart data={data} layout="vertical" margin={{ left: 0, right: 56 }}>
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} width={110} tick={{ fontSize: 12 }} />
          <ChartTooltip cursor={{ fillOpacity: 0.4 }} content={<ChartTooltipContent hideLabel nameKey="name" formatter={tooltipFormatter({ ...amountConfig, ...Object.fromEntries(data.map((d) => [d.name, { label: d.name }])) }, asCurrency)} />} />
          <Bar dataKey="amount" fill="var(--color-amount)" radius={[0, 4, 4, 0]} barSize={20}>
            <LabelList
              dataKey="amount"
              position="right"
              className="fill-foreground text-xs"
              formatter={(v: unknown) => compactCurrency(Number(v))}
            />
          </Bar>
        </BarChart>
      </ChartContainer>
    </ChartCard>
  );
}

export function ExpensesBySportChart({ stats }: { stats: DashboardStats }) {
  const data = stats.expensesBySport.map((d) => ({ ...d, name: label(d.sportType) }));
  const config: ChartConfig = { ...amountConfig, ...Object.fromEntries(data.map((d) => [d.name, { label: d.name }])) };
  return (
    <ChartCard title="Expenses by Sport Type" empty={!hasAnyValue(data, (d) => d.amount)}>
      <ChartContainer config={config} className="aspect-auto h-64 w-full">
        <BarChart data={data} margin={{ top: 20, left: 4, right: 8 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
          <YAxis tickLine={false} axisLine={false} width={48} tickFormatter={compactCurrency} />
          <ChartTooltip cursor={{ fillOpacity: 0.4 }} content={<ChartTooltipContent hideLabel nameKey="name" formatter={tooltipFormatter(config, asCurrency)} />} />
          <Bar dataKey="amount" fill="var(--color-amount)" radius={[4, 4, 0, 0]} maxBarSize={56}>
            <LabelList dataKey="amount" position="top" className="fill-foreground text-xs" formatter={(v: unknown) => compactCurrency(Number(v))} />
          </Bar>
        </BarChart>
      </ChartContainer>
    </ChartCard>
  );
}

const hoursConfig = { hours: { label: 'Booked hours', color: 'var(--chart-1)' } } satisfies ChartConfig;

export function PeakHoursChart({ stats }: { stats: DashboardStats }) {
  const data = stats.peakHours;
  return (
    <ChartCard
      title="Peak Hours"
      description="Booked hours by hour of day (PKT)"
      empty={!hasAnyValue(data, (d) => d.hours)}
      className="xl:col-span-2"
    >
      <ChartContainer config={hoursConfig} className="aspect-auto h-64 w-full">
        <BarChart data={data} margin={{ left: 0, right: 8, top: 8 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="hour" tickLine={false} axisLine={false} tickMargin={8} interval={2} tickFormatter={formatHourLabel} />
          <YAxis tickLine={false} axisLine={false} width={32} allowDecimals={false} />
          <ChartTooltip
            cursor={{ fillOpacity: 0.4 }}
            content={
              <ChartTooltipContent
                labelFormatter={(_, p) => {
                  const h = Number(p?.[0]?.payload?.hour ?? 0);
                  return `${formatHourLabel(h)} – ${formatHourLabel((h + 1) % 24)}`;
                }}
                formatter={tooltipFormatter(hoursConfig, asHours)}
              />
            }
          />
          <Bar dataKey="hours" fill="var(--color-hours)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ChartContainer>
    </ChartCard>
  );
}

const countConfig = { count: { label: 'Bookings', color: 'var(--chart-3)' } } satisfies ChartConfig;

export function BookingsByWeekdayChart({ stats }: { stats: DashboardStats }) {
  const data = stats.bookingsByWeekday.map((d) => ({ ...d, day: WEEKDAYS[d.weekday] }));
  return (
    <ChartCard title="Bookings by Day of Week" empty={!hasAnyValue(data, (d) => d.count)}>
      <ChartContainer config={countConfig} className="aspect-auto h-64 w-full">
        <BarChart data={data} margin={{ left: 0, right: 8, top: 20 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} />
          <YAxis tickLine={false} axisLine={false} width={32} allowDecimals={false} />
          <ChartTooltip cursor={{ fillOpacity: 0.4 }} content={<ChartTooltipContent formatter={tooltipFormatter(countConfig, asCount)} />} />
          <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} maxBarSize={40}>
            <LabelList dataKey="count" position="top" className="fill-foreground text-xs" />
          </Bar>
        </BarChart>
      </ChartContainer>
    </ChartCard>
  );
}

/** Court utilization = booked hours ÷ (24 × days in range). */
export function UtilizationCard({ stats }: { stats: DashboardStats }) {
  return (
    <ChartCard title="Court Utilization" description="Booked hours ÷ hours open (24/7)" empty={!stats.utilization.length} emptyMessage="No courts">
      <ul className="space-y-5">
        {stats.utilization.map((u) => (
          <li key={u.courtId} className="space-y-1.5">
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="flex min-w-0 items-center gap-2">
                <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: u.color }} />
                <span className="truncate">{u.courtName}</span>
              </span>
              <span className="font-semibold tabular-nums">{formatPercent(u.percent, 1)}</span>
            </div>
            <Progress value={u.percent} color={u.color} label={`${u.courtName} utilization`} />
            <p className="text-xs text-muted-foreground tabular-nums">
              {formatNumber(u.bookedHours, 1)} of {formatNumber(u.availableHours)} hours
            </p>
          </li>
        ))}
      </ul>
    </ChartCard>
  );
}
