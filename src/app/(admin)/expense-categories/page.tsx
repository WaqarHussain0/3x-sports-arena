import type { Metadata } from 'next';
import { CategoriesView } from '@/components/expense-categories/CategoriesView';

export const metadata: Metadata = { title: 'Expense Categories' };

export default function ExpenseCategoriesPage() {
  return <CategoriesView />;
}
