import type { Metadata } from 'next';
import { CategoryDetailView } from '@/components/expense-categories/CategoryDetailView';

export const metadata: Metadata = { title: 'Expense Category' };

export default async function ExpenseCategoryDetailPage({ params }: PageProps<'/expense-categories/[id]'>) {
  const { id } = await params;
  return <CategoryDetailView id={id} />;
}
