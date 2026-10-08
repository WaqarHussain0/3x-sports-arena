import { Types, type PipelineStage } from 'mongoose';
import { Expense } from '@/models/Expense';
import { ExpenseCategory } from '@/models/ExpenseCategory';
import { Admin } from '@/models/Admin';
import { badRequest, notFound } from '@/lib/api';
import { EXPENSES_PAGE_SIZE, type ExpenseSportType } from '@/lib/constants';
import { addDaysStr, pktToUtc } from '@/lib/time';
import type { ExpenseInput } from '@/lib/validators';
import type { ExpenseDTO, ExpenseListResult } from '@/types';

export interface ExpenseFilters {
  from?: string;
  to?: string;
  categories?: string[];
  sportType?: ExpenseSportType;
  page: number;
  limit: number;
}

function buildMatch(filters: Omit<ExpenseFilters, 'page' | 'limit'>) {
  const match: Record<string, unknown> = {};
  const date: Record<string, Date> = {};
  if (filters.from) date.$gte = pktToUtc(filters.from);
  if (filters.to) date.$lt = pktToUtc(addDaysStr(filters.to, 1));
  if (Object.keys(date).length) match.date = date;
  if (filters.categories?.length) {
    match.category = { $in: filters.categories.map((id) => new Types.ObjectId(id)) };
  }
  if (filters.sportType) match.sportType = filters.sportType;
  return match;
}

const populateStages: PipelineStage[] = [
  {
    $lookup: {
      from: ExpenseCategory.collection.name,
      localField: 'category',
      foreignField: '_id',
      pipeline: [{ $project: { name: 1, isArchived: 1 } }],
      as: 'category',
    },
  },
  {
    $lookup: {
      from: Admin.collection.name,
      localField: 'createdBy',
      foreignField: '_id',
      pipeline: [{ $project: { name: 1 } }],
      as: 'createdBy',
    },
  },
  {
    $addFields: {
      category: { $ifNull: [{ $first: '$category' }, null] },
      createdBy: { $ifNull: [{ $first: '$createdBy' }, null] },
    },
  },
  { $project: { __v: 0 } },
];

export async function listExpenses(filters: ExpenseFilters): Promise<ExpenseListResult> {
  const page = Math.max(1, filters.page);
  const limit = Math.min(Math.max(1, filters.limit || EXPENSES_PAGE_SIZE), 100);

  const [result] = await Expense.aggregate<{
    items: ExpenseDTO[];
    totals: { total: number; sumAmount: number }[];
  }>([
    { $match: buildMatch(filters) },
    {
      $facet: {
        items: [
          { $sort: { date: -1, createdAt: -1 } },
          { $skip: (page - 1) * limit },
          { $limit: limit },
          ...(populateStages as PipelineStage.FacetPipelineStage[]),
        ],
        totals: [{ $group: { _id: null, total: { $sum: 1 }, sumAmount: { $sum: '$amount' } } }],
      },
    },
  ]);

  return {
    items: result?.items ?? [],
    page,
    limit,
    total: result?.totals[0]?.total ?? 0,
    sumAmount: result?.totals[0]?.sumAmount ?? 0,
  };
}

export async function getExpense(id: string): Promise<ExpenseDTO> {
  const [expense] = await Expense.aggregate<ExpenseDTO>([
    { $match: { _id: new Types.ObjectId(id) } },
    ...populateStages,
  ]);
  if (!expense) throw notFound('Expense');
  return expense;
}

async function resolveCategory(categoryId: string, allowArchivedId?: string) {
  const category = await ExpenseCategory.findById(categoryId);
  if (!category) throw badRequest('Please fix the highlighted fields.', { category: 'Category not found' });
  // Archived categories are hidden from new expenses, but an existing expense may keep its own.
  if (category.isArchived && category._id.toString() !== allowArchivedId) {
    throw badRequest('Please fix the highlighted fields.', { category: 'This category is archived' });
  }
  return category;
}

export async function createExpense(data: ExpenseInput, adminId: string) {
  const category = await resolveCategory(data.category);
  const expense = await Expense.create({
    category: category._id,
    sportType: category.sportType,
    date: pktToUtc(data.date),
    amount: data.amount,
    notes: data.notes || undefined,
    createdBy: adminId,
  });
  return getExpense(expense._id.toString());
}

export async function updateExpense(id: string, data: Partial<ExpenseInput>, adminId: string) {
  const expense = await Expense.findById(id);
  if (!expense) throw notFound('Expense');

  if (data.category !== undefined) {
    const category = await resolveCategory(data.category, expense.category.toString());
    expense.category = category._id;
    expense.sportType = category.sportType;
  }
  if (data.date !== undefined) expense.date = pktToUtc(data.date);
  if (data.amount !== undefined) expense.amount = data.amount;
  if (data.notes !== undefined) expense.notes = data.notes || undefined;
  expense.updatedBy = new Types.ObjectId(adminId);

  await expense.save();
  return getExpense(id);
}

export async function deleteExpense(id: string) {
  const expense = await Expense.findByIdAndDelete(id);
  if (!expense) throw notFound('Expense');
}
