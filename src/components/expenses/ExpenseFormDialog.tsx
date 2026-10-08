'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/shared/DatePicker';
import { MoneyInput } from '@/components/shared/MoneyInput';
import { SportBadge } from '@/components/shared/SportBadge';
import { CategoryFormDialog } from '@/components/expense-categories/CategoryFormDialog';
import { applyServerErrors } from '@/lib/form';
import { toPktDateString, todayPkt } from '@/lib/time';
import { expenseAmountRules, expenseDateRules, notesRules } from '@/lib/validators';
import { useGetExpenseCategoriesQuery } from '@/store/api/expenseCategoriesApi';
import { useCreateExpenseMutation, useUpdateExpenseMutation } from '@/store/api/expensesApi';
import type { ExpenseDTO } from '@/types';

interface ExpenseFormValues {
  category: string;
  date: string;
  amount: number;
  notes: string;
}

export function ExpenseFormDialog({
  open,
  onOpenChange,
  expense,
  defaultCategoryId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense?: ExpenseDTO | null;
  defaultCategoryId?: string;
}) {
  const isEdit = !!expense;
  const { data: categories = [] } = useGetExpenseCategoriesQuery({ includeArchived: true });
  const [createExpense] = useCreateExpenseMutation();
  const [updateExpense] = useUpdateExpenseMutation();
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);

  const form = useForm<ExpenseFormValues>({
    mode: 'onTouched',
    defaultValues: { category: '', date: todayPkt(), amount: Number.NaN, notes: '' },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        category: expense?.category?._id ?? defaultCategoryId ?? '',
        date: expense ? toPktDateString(expense.date) : todayPkt(),
        amount: expense?.amount ?? Number.NaN,
        notes: expense?.notes ?? '',
      });
    }
  }, [open, expense, defaultCategoryId, form]);

  const selectedId = useWatch({ control: form.control, name: 'category' });
  // Archived categories are hidden, except the one an edited expense already uses.
  const options = useMemo(
    () => categories.filter((c) => !c.isArchived || c._id === expense?.category?._id),
    [categories, expense],
  );
  const selected = categories.find((c) => c._id === selectedId);

  async function onSubmit(values: ExpenseFormValues) {
    const payload = {
      category: values.category,
      date: values.date,
      amount: values.amount,
      notes: values.notes.trim(),
    };
    try {
      if (isEdit) await updateExpense({ id: expense._id, ...payload }).unwrap();
      else await createExpense(payload).unwrap();
      toast.success(isEdit ? 'Expense updated' : 'Expense added');
      onOpenChange(false);
    } catch (error) {
      applyServerErrors(error, form.setError);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit expense' : 'Add expense'}</DialogTitle>
          <DialogDescription>Amounts are whole rupees.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4" noValidate>
            <FormField
              control={form.control}
              name="category"
              rules={{ required: 'Category is required' }}
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Category</FormLabel>
                    <Button
                      type="button"
                      variant="link"
                      size="xs"
                      className="h-auto p-0"
                      onClick={() => setCategoryDialogOpen(true)}
                    >
                      <Plus /> New category
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full min-w-0 flex-1" onBlur={field.onBlur}>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {options.length === 0 && (
                          <div className="px-2 py-1.5 text-sm text-muted-foreground">No categories yet</div>
                        )}
                        {options.map((c) => (
                          <SelectItem key={c._id} value={c._id}>
                            {c.name}
                            {c.isArchived && ' (archived)'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selected && <SportBadge sport={selected.sportType} />}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="date"
                rules={expenseDateRules}
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <DatePicker
                        value={field.value}
                        onChange={(v) => {
                          field.onChange(v);
                          field.onBlur();
                        }}
                        maxDate={todayPkt()}
                        aria-invalid={!!fieldState.error}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="amount"
                rules={expenseAmountRules}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <MoneyInput
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                        min={1}
                        placeholder="0"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="notes"
              rules={notesRules}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Notes <span className="font-normal text-muted-foreground">(optional)</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea rows={3} maxLength={500} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="animate-spin" />}
                {isEdit ? 'Save changes' : 'Add expense'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
        <CategoryFormDialog
          open={categoryDialogOpen}
          onOpenChange={setCategoryDialogOpen}
          onSaved={(c) => form.setValue('category', c._id, { shouldValidate: true })}
        />
      </DialogContent>
    </Dialog>
  );
}
