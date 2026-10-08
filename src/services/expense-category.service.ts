import { Types } from 'mongoose';
import { ExpenseCategory } from '@/models/ExpenseCategory';
import { Expense } from '@/models/Expense';
import { conflict, notFound } from '@/lib/api';
import { currentMonthPkt, lastDayOfMonth, pktDayRange } from '@/lib/time';
import type { CategoryInput } from '@/lib/validators';
import type { ExpenseCategoryDetailDTO, ExpenseCategoryDTO } from '@/types';

async function aggregateCategories(match: Record<string, unknown>): Promise<ExpenseCategoryDetailDTO[]> {
  const month = currentMonthPkt();
  const { from, to } = pktDayRange(`${month}-01`, lastDayOfMonth(month));

  return ExpenseCategory.aggregate<ExpenseCategoryDetailDTO>([
    { $match: match },
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
    { $sort: { nameLower: 1, name: 1 } },
  ]);
}

export async function listCategories(includeArchived: boolean): Promise<ExpenseCategoryDTO[]> {
  return aggregateCategories(includeArchived ? {} : { isArchived: false });
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
