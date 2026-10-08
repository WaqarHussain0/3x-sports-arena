'use client';

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { formatDateStr } from '@/lib/time';
import type { DashboardStats } from '@/types';
import { ChartCard } from './ChartCard';
import { asCurrency, compactCurrency, hasAnyValue, tooltipFormatter } from './chart-helpers';

const config = {
  revenue: { label: 'Collected revenue', color: 'var(--chart-1)' },
  expenses: { label: 'Expenses', color: 'var(--chart-2)' },
} satisfies ChartConfig;

function bucketLabel(bucket: string, kind: 'day' | 'month', long = false) {
  return kind === 'day'
    ? formatDateStr(bucket, long ? 'EEE, dd MMM yyyy' : 'd MMM')
    : formatDateStr(`${bucket}-01`, long ? 'MMMM yyyy' : 'MMM yy');
}

export function RevenueExpenseChart({ stats }: { stats: DashboardStats }) {
  const data = stats.revenueExpenseSeries;
  const kind = stats.range.bucket;
  const empty = !hasAnyValue(data, (d) => d.revenue + d.expenses);

  return (
    <ChartCard
      title="Revenue vs Expenses"
      description={`Cash collected and money spent per ${kind}`}
      empty={empty}
      className="xl:col-span-2"
    >
      <ChartContainer config={config} className="aspect-auto h-72 w-full">
        <AreaChart data={data} margin={{ left: 4, right: 8, top: 8 }}>
          <defs>
            {(['revenue', 'expenses'] as const).map((k) => (
              <linearGradient key={k} id={`fill-${k}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={`var(--color-${k})`} stopOpacity={0.25} />
                <stop offset="95%" stopColor={`var(--color-${k})`} stopOpacity={0.02} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="bucket"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={24}
            tickFormatter={(b: string) => bucketLabel(b, kind)}
          />
          <YAxis tickLine={false} axisLine={false} width={48} tickFormatter={compactCurrency} />
          <ChartTooltip
            cursor
            content={
              <ChartTooltipContent
                labelFormatter={(_, payload) => bucketLabel(String(payload?.[0]?.payload?.bucket ?? ''), kind, true)}
                formatter={tooltipFormatter(config, asCurrency)}
              />
            }
          />
          <Area
            dataKey="revenue"
            type="monotone"
            stroke="var(--color-revenue)"
            strokeWidth={2}
            fill="url(#fill-revenue)"
            activeDot={{ r: 4 }}
          />
          <Area
            dataKey="expenses"
            type="monotone"
            stroke="var(--color-expenses)"
            strokeWidth={2}
            fill="url(#fill-expenses)"
            activeDot={{ r: 4 }}
          />
          <ChartLegend content={<ChartLegendContent />} />
        </AreaChart>
      </ChartContainer>
    </ChartCard>
  );
}
