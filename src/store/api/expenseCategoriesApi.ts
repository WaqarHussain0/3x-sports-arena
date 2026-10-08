import { baseApi } from './baseApi';
import type { CategoryPayload, ExpenseCategoryDetailDTO, ExpenseCategoryDTO } from '@/types';

const CATEGORY_MUTATION_TAGS = ['ExpenseCategory', 'Expense'] as const;

export const expenseCategoriesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getExpenseCategories: build.query<ExpenseCategoryDTO[], { includeArchived?: boolean } | void>({
      query: (args) => ({
        url: '/expense-categories',
        params: { includeArchived: args?.includeArchived ? 'true' : undefined },
      }),
      providesTags: [{ type: 'ExpenseCategory', id: 'LIST' }],
    }),
    getExpenseCategory: build.query<ExpenseCategoryDetailDTO, string>({
      query: (id) => `/expense-categories/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'ExpenseCategory', id }],
    }),
    createExpenseCategory: build.mutation<ExpenseCategoryDetailDTO, CategoryPayload>({
      query: (body) => ({ url: '/expense-categories', method: 'POST', body }),
      invalidatesTags: [...CATEGORY_MUTATION_TAGS],
    }),
    updateExpenseCategory: build.mutation<ExpenseCategoryDetailDTO, { id: string } & Partial<CategoryPayload>>({
      query: ({ id, ...body }) => ({ url: `/expense-categories/${id}`, method: 'PATCH', body }),
      // Sport type changes cascade to expenses and dashboard stats.
      invalidatesTags: [...CATEGORY_MUTATION_TAGS, 'Dashboard'],
    }),
    toggleExpenseCategoryArchive: build.mutation<ExpenseCategoryDetailDTO, string>({
      query: (id) => ({ url: `/expense-categories/${id}/archive`, method: 'PATCH' }),
      invalidatesTags: [...CATEGORY_MUTATION_TAGS],
    }),
    deleteExpenseCategory: build.mutation<{ deleted: boolean }, string>({
      query: (id) => ({ url: `/expense-categories/${id}`, method: 'DELETE' }),
      invalidatesTags: [...CATEGORY_MUTATION_TAGS],
    }),
  }),
});

export const {
  useGetExpenseCategoriesQuery,
  useGetExpenseCategoryQuery,
  useCreateExpenseCategoryMutation,
  useUpdateExpenseCategoryMutation,
  useToggleExpenseCategoryArchiveMutation,
  useDeleteExpenseCategoryMutation,
} = expenseCategoriesApi;
