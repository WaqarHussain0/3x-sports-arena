'use client';

import { useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { CalendarRange } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { dateStrToLocalDate, formatRangeLabel, localDateToStr } from '@/lib/time';
import { cn } from '@/lib/utils';

export interface DateRangeValue {
  from: string;
  to: string;
}

/** Range picker (Calendar in range mode inside a Popover). Apply is disabled until a valid range is chosen. */
export function DateRangeFilter({
  value,
  onChange,
  className,
  maxDate,
}: {
  value: DateRangeValue | undefined;
  onChange: (value: DateRangeValue) => void;
  className?: string;
  maxDate?: string;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DateRange | undefined>();

  function handleOpenChange(next: boolean) {
    if (next) {
      setDraft(value ? { from: dateStrToLocalDate(value.from), to: dateStrToLocalDate(value.to) } : undefined);
    }
    setOpen(next);
  }

  const canApply = !!draft?.from && !!draft?.to && draft.from <= draft.to;

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn('justify-start font-normal', !value && 'text-muted-foreground', className)}
        >
          <CalendarRange />
          {value ? formatRangeLabel(value.from, value.to) : 'Pick a date range'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          weekStartsOn={1}
          numberOfMonths={2}
          selected={draft}
          defaultMonth={draft?.from}
          onSelect={setDraft}
          disabled={maxDate ? { after: dateStrToLocalDate(maxDate) } : undefined}
        />
        <div className="flex items-center justify-end gap-2 border-t p-3">
          <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={!canApply}
            onClick={() => {
              if (!draft?.from || !draft?.to) return;
              onChange({ from: localDateToStr(draft.from), to: localDateToStr(draft.to) });
              setOpen(false);
            }}
          >
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
