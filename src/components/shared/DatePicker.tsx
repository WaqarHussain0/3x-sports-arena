'use client';

import { useState } from 'react';
import { CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { dateStrToLocalDate, formatDateStr, localDateToStr } from '@/lib/time';
import { cn } from '@/lib/utils';

/** Single-date picker working in 'YYYY-MM-DD' (PKT calendar date) strings. */
export function DatePicker({
  value,
  onChange,
  placeholder = 'Pick a date',
  maxDate,
  disabled,
  className,
  id,
  'aria-invalid': ariaInvalid,
}: {
  value: string | undefined;
  onChange: (value: string) => void;
  placeholder?: string;
  maxDate?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  'aria-invalid'?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selected = value ? dateStrToLocalDate(value) : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          aria-invalid={ariaInvalid}
          className={cn('w-full justify-start font-normal', !value && 'text-muted-foreground', className)}
        >
          <CalendarIcon />
          {value ? formatDateStr(value, 'EEE, dd MMM yyyy') : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          weekStartsOn={1}
          selected={selected}
          defaultMonth={selected}
          disabled={maxDate ? { after: dateStrToLocalDate(maxDate) } : undefined}
          onSelect={(date) => {
            if (date) {
              onChange(localDateToStr(date));
              setOpen(false);
            }
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
