import { Types } from 'mongoose';
import { ExpenseCategory } from '@/models/ExpenseCategory';
import { Expense } from '@/models/Expense';
import { conflict, notFound } from '@/lib/api';
import { EXPENSE_CATEGORIES_PAGE_SIZE } from '@/lib/constants';
import { currentMonthPkt, lastDayOfMonth, pktDayRange } from '@/lib/time';
import { escapeRegex } from '@/lib/url';
import type { CategoryInput } from '@/lib/validators';
import type { ExpenseCategoryDetailDTO, ExpenseCategoryDTO, ExpenseCategoryListResult } from '@/types';

async function aggregateCategories(
  match: Record<string, unknown>,
  paging?: { skip: number; limit: number },
): Promise<ExpenseCategoryDetailDTO[]> {
  const month = currentMonthPkt();
  const { from, to } = pktDayRange(`${month}-01`, lastDayOfMonth(month));

  return ExpenseCategory.aggregate<ExpenseCategoryDetailDTO>([
    { $match: match },
    // Sort/page before the per-category expense lookup so stats are only computed for the rows returned.
    { $sort: { nameLower: 1, name: 1 } },
    ...(paging ? [{ $skip: paging.skip }, { $limit: paging.limit }] : []),
    {
      $lookup: {
        from: Expense.collection.name,
        let: { categoryId: '$_id' },
        pipeline: [
          { $match: { $expr: { $eq: ['$category', '$$categoryId'] } } },
          {
            $group: {
              _id: null,
              expenseCount: { $sum: 1 },
              totalSpent: { $sum: '$amount' },
              monthSpent: {
                $sum: { $cond: [{ $and: [{ $gte: ['$date', from] }, { $lt: ['$date', to] }] }, '$amount', 0] },
              },
              monthCount: {
                $sum: { $cond: [{ $and: [{ $gte: ['$date', from] }, { $lt: ['$date', to] }] }, 1, 0] },
              },
            },
          },
        ],
        as: 'stats',
      },
    },
    {
      $addFields: {
        expenseCount: { $ifNull: [{ $first: '$stats.expenseCount' }, 0] },
        totalSpent: { $ifNull: [{ $first: '$stats.totalSpent' }, 0] },
        monthSpent: { $ifNull: [{ $first: '$stats.monthSpent' }, 0] },
        monthCount: { $ifNull: [{ $first: '$stats.monthCount' }, 0] },
      },
    },
    { $project: { stats: 0, nameLower: 0, __v: 0 } },
  ]);
}

export async function listCategories(includeArchived: boolean): Promise<ExpenseCategoryDTO[]> {
  return aggregateCategories(includeArchived ? {} : { isArchived: false });
}

export interface CategoryPageFilters {
  search?: string;
  includeArchived: boolean;
  page: number;
}

/** Plain, serializable DTO (safe to pass from a Server Component to a Client Component). */
function toCategoryDTO(c: ExpenseCategoryDTO): ExpenseCategoryDTO {
  return {
    _id: String(c._id),
    name: c.name,
    description: c.description || undefined,
    sportType: c.sportType,
    isArchived: c.isArchived,
    expenseCount: c.expenseCount,
    totalSpent: c.totalSpent,
    createdAt: new Date(c.createdAt).toISOString(),
    updatedAt: new Date(c.updatedAt).toISOString(),
  };
}

/** One page of categories (name search, optional archived), for the server-rendered list page. */
export async function listCategoriesPage(filters: CategoryPageFilters): Promise<ExpenseCategoryListResult> {
  const page = Math.max(1, filters.page);
  const limit = EXPENSE_CATEGORIES_PAGE_SIZE;
  const term = filters.search?.trim().toLowerCase();
  const match: Record<string, unknown> = {
    ...(filters.includeArchived ? {} : { isArchived: false }),
    ...(term ? { nameLower: new RegExp(escapeRegex(term)) } : {}),
  };

  const [items, total] = await Promise.all([
    aggregateCategories(match, { skip: (page - 1) * limit, limit }),
    ExpenseCategory.countDocuments(match),
  ]);
  return { items: items.map(toCategoryDTO), page, limit, total };
}

export async function getCategory(id: string): Promise<ExpenseCategoryDetailDTO> {
  const [category] = await aggregateCategories({ _id: new Types.ObjectId(id) });
  if (!category) throw notFound('Category');
  return category;
}

export async function createCategory(data: CategoryInput, adminId: string) {
  const category = await ExpenseCategory.create({ ...data, createdBy: adminId });
  return getCategory(category._id.toString());
}

export async function updateCategory(id: string, data: Partial<CategoryInput>) {
  const category = await ExpenseCategory.findById(id);
  if (!category) throw notFound('Category');
  const sportChanged = data.sportType !== undefined && data.sportType !== category.sportType;
  category.set(data);
  await category.save();
  // Keep the denormalized sport type on this category's expenses in sync.
  if (sportChanged) {
    await Expense.updateMany({ category: category._id }, { $set: { sportType: category.sportType } });
  }
  return getCategory(id);
}

export async function toggleCategoryArchive(id: string) {
  const category = await ExpenseCategory.findById(id);
  if (!category) throw notFound('Category');
  category.isArchived = !category.isArchived;
  await category.save();
  return getCategory(id);
}

export async function deleteCategory(id: string) {
  const category = await ExpenseCategory.findById(id);
  if (!category) throw notFound('Category');
  if (await Expense.exists({ category: category._id })) {
    throw conflict('This category has expenses and cannot be deleted. Archive it instead.');
  }
  await category.deleteOne();
}
