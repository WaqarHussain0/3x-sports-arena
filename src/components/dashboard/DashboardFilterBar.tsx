'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { DateRangeFilter } from '@/components/shared/DateRangeFilter';
import { DASHBOARD_RANGE_TYPES, label, type DashboardRangeType } from '@/lib/constants';
import { formatRangeLabel, todayPkt } from '@/lib/time';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setCustomRange, setMonth, setRangeType, setYear } from '@/store/slices/dashboardSlice';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function DashboardFilterBar({
  earliestYear,
  rangeLabel,
}: {
  earliestYear: number;
  rangeLabel?: { from: string; to: string };
}) {
  const dispatch = useAppDispatch();
  const filter = useAppSelector((s) => s.dashboard);
  const currentYear = Number(todayPkt().slice(0, 4));
  const years: number[] = [];
  for (let y = currentYear; y >= Math.min(earliestYear, currentYear); y--) years.push(y);

  const [monthYear, monthNum] = filter.month.split('-');

  return (
    <div className="sticky top-14 z-20 -mx-4 flex flex-wrap items-center gap-2 border-b bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:-mx-6 md:px-6">
      <ToggleGroup
        type="single"
        variant="outline"
        spacing={0}
        value={filter.rangeType}
        onValueChange={(v) => v && dispatch(setRangeType(v as DashboardRangeType))}
        aria-label="Range type"
      >
        {DASHBOARD_RANGE_TYPES.map((t) => (
          <ToggleGroupItem key={t} value={t} className="px-3">
            {label(t)}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      {filter.rangeType === 'monthly' && (
        <>
          <Select value={monthNum} onValueChange={(m) => dispatch(setMonth(`${monthYear}-${m}`))}>
            <SelectTrigger className="w-24" aria-label="Month">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((name, i) => (
                <SelectItem key={name} value={String(i + 1).padStart(2, '0')}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={monthYear} onValueChange={(y) => dispatch(setMonth(`${y}-${monthNum}`))}>
            <SelectTrigger className="w-24" aria-label="Year">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </>
      )}

      {filter.rangeType === 'yearly' && (
        <Select value={String(filter.year)} onValueChange={(y) => dispatch(setYear(Number(y)))}>
          <SelectTrigger className="w-24" aria-label="Year">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map((y) => (
              <SelectItem key={y} value={String(y)}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {filter.rangeType === 'custom' && (
        <DateRangeFilter
          value={{ from: filter.from, to: filter.to }}
          onChange={(r) => dispatch(setCustomRange(r))}
        />
      )}

      {rangeLabel && (
        <span className="ml-auto text-sm text-muted-foreground">{formatRangeLabel(rangeLabel.from, rangeLabel.to)}</span>
      )}
    </div>
  );
}
