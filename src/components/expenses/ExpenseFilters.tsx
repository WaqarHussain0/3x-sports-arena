'use client';

import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRangeFilter, type DateRangeValue } from '@/components/shared/DateRangeFilter';
import { EXPENSE_SPORT_TYPES, label, type ExpenseSportType } from '@/lib/constants';
import type { ExpenseCategoryDTO } from '@/types';

export interface ExpenseFilterValues {
  range: DateRangeValue;
  category: string; // '' = all
  sportType: ExpenseSportType | '';
}

const ALL = '__all__';

export function ExpenseFilters({
  value,
  onChange,
  onReset,
  categories,
  hideCategory,
}: {
  value: ExpenseFilterValues;
  onChange: (value: ExpenseFilterValues) => void;
  onReset: () => void;
  categories: ExpenseCategoryDTO[];
  hideCategory?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <DateRangeFilter value={value.range} onChange={(range) => onChange({ ...value, range })} />
      {!hideCategory && (
        <Select
          value={value.category || ALL}
          onValueChange={(v) => onChange({ ...value, category: v === ALL ? '' : v })}
        >
          <SelectTrigger className="w-full sm:w-48" aria-label="Filter by category">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c._id} value={c._id}>
                {c.name}
                {c.isArchived && ' (archived)'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      <Select
        value={value.sportType || ALL}
        onValueChange={(v) => onChange({ ...value, sportType: v === ALL ? '' : (v as ExpenseSportType) })}
      >
        <SelectTrigger className="w-full sm:w-40" aria-label="Filter by sport type">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All sport types</SelectItem>
          {EXPENSE_SPORT_TYPES.map((s) => (
            <SelectItem key={s} value={s}>
              {label(s)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button variant="ghost" size="sm" onClick={onReset}>
        <X /> Reset
      </Button>
    </div>
  );
}
