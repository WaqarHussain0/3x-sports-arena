'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowLeft, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/layout/PageHeader';
import { ErrorState } from '@/components/shared/EmptyState';
import { LoadingState } from '@/components/shared/LoadingState';
import { CurrencyText } from '@/components/shared/CurrencyText';
import { SportBadge } from '@/components/shared/SportBadge';
import { ArchivedBadge } from '@/components/shared/StatusBadge';
import { ExpensesView } from '@/components/expenses/ExpensesView';
import { getErrorMessage } from '@/store/api/baseApi';
import { useGetExpenseCategoryQuery } from '@/store/api/expenseCategoriesApi';
import { CategoryFormDialog } from './CategoryFormDialog';

export function CategoryDetailView({ id }: { id: string }) {
  const { data: category, isLoading, isError, error, refetch } = useGetExpenseCategoryQuery(id);
  const [editOpen, setEditOpen] = useState(false);

  if (isLoading) return <LoadingState />;
  if (isError || !category) {
    return <ErrorState message={getErrorMessage(error, 'Category not found.')} onRetry={refetch} />;
  }

  return (
    <>
      <div>
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href="/expense-categories">
            <ArrowLeft /> All categories
          </Link>
        </Button>
      </div>
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-2">
            {category.name} <SportBadge sport={category.sportType} /> <ArchivedBadge archived={category.isArchived} />
          </span>
        }
        description={category.description}
        actions={
          <Button variant="outline" onClick={() => setEditOpen(true)}>
            <Pencil /> Edit
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardDescription>All-time spend</CardDescription>
            <CardTitle className="text-2xl">
              <CurrencyText amount={category.totalSpent} />
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">{category.expenseCount} expenses</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>This month</CardDescription>
            <CardTitle className="text-2xl">
              <CurrencyText amount={category.monthSpent} />
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">{category.monthCount} expenses</CardContent>
        </Card>
      </div>

      <ExpensesView fixedCategory={category} embedded />

      <CategoryFormDialog open={editOpen} onOpenChange={setEditOpen} category={category} />
    </>
  );
}
