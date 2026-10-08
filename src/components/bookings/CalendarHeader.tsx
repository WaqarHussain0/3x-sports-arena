'use client';

import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DatePicker } from '@/components/shared/DatePicker';
import { PAYMENT_DOT } from '@/components/shared/StatusBadge';
import { addDaysStr, formatRangeLabel } from '@/lib/time';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { goToDate, goToToday, nextWeek, prevWeek, setCourtFilter, setShowCancelled } from '@/store/slices/calendarSlice';
import type { CourtDTO } from '@/types';

export function CalendarHeader({
  courts,
  isFetching,
  onPrefetchWeek,
}: {
  courts: CourtDTO[];
  isFetching: boolean;
  onPrefetchWeek: (weekStart: string) => void;
}) {
  const dispatch = useAppDispatch();
  const { weekStart, courtFilter, showCancelled } = useAppSelector((s) => s.calendar);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => dispatch(prevWeek())}
            onMouseEnter={() => onPrefetchWeek(addDaysStr(weekStart, -7))}
            aria-label="Previous week"
          >
            <ChevronLeft /> Prev
          </Button>
          <Button variant="outline" size="sm" onClick={() => dispatch(goToToday())}>
            Today
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => dispatch(nextWeek())}
            onMouseEnter={() => onPrefetchWeek(addDaysStr(weekStart, 7))}
            aria-label="Next week"
          >
            Next <ChevronRight />
          </Button>
        </div>
        <h3 className="flex items-center gap-2 text-base font-semibold" aria-live="polite">
          {formatRangeLabel(weekStart, addDaysStr(weekStart, 6))}
          {isFetching && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
        </h3>
        <div className="ml-auto w-44">
          <DatePicker value={weekStart} onChange={(d) => dispatch(goToDate(d))} placeholder="Jump to date" />
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="-mx-1 overflow-x-auto px-1">
          <Tabs value={courtFilter} onValueChange={(v) => dispatch(setCourtFilter(v))}>
            <TabsList>
              <TabsTrigger value="all">All Courts</TabsTrigger>
              {courts.map((c) => (
                <TabsTrigger key={c._id} value={c._id}>
                  <span className="size-2 rounded-full" style={{ backgroundColor: c.color }} />
                  {c.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="bg-stripes h-3 w-5 rounded-sm border border-dashed border-foreground/40 bg-muted" /> Pending
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-5 rounded-sm border border-foreground/40 bg-muted" /> Confirmed
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-5 rounded-sm border bg-muted opacity-50" /> Past
          </span>
          <span className="flex items-center gap-1.5">
            {(['unpaid', 'partial', 'paid'] as const).map((s) => (
              <span key={s} className={`size-2 rounded-full ${PAYMENT_DOT[s]}`} title={s} />
            ))}
            Unpaid / Partial / Paid
          </span>
          <span className="flex items-center gap-2">
            <Switch
              id="show-cancelled"
              checked={showCancelled}
              onCheckedChange={(v) => dispatch(setShowCancelled(v))}
            />
            <Label htmlFor="show-cancelled" className="text-xs font-normal">
              Show cancelled
            </Label>
          </span>
        </div>
      </div>
    </div>
  );
}
