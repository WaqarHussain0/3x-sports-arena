import { baseApi } from './baseApi';
import type { ExpenseDTO, ExpenseListQuery, ExpenseListResult, ExpensePayload } from '@/types';

const EXPENSE_MUTATION_TAGS = ['Expense', 'ExpenseCategory', 'Dashboard'] as const;

export const expensesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getExpenses: build.query<ExpenseListResult, ExpenseListQuery>({
      query: (params) => ({
        url: '/expenses',
        params: Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== '')),
      }),
      transformResponse: (items: ExpenseDTO[], meta) => {
        const m = (meta?.apiMeta ?? {}) as Partial<ExpenseListResult>;
        return {
          items,
          page: m.page ?? 1,
          limit: m.limit ?? 20,
          total: m.total ?? items.length,
          sumAmount: m.sumAmount ?? 0,
        };
      },
      providesTags: [{ type: 'Expense', id: 'LIST' }],
    }),
    createExpense: build.mutation<ExpenseDTO, ExpensePayload>({
      query: (body) => ({ url: '/expenses', method: 'POST', body }),
      invalidatesTags: [...EXPENSE_MUTATION_TAGS],
    }),
    updateExpense: build.mutation<ExpenseDTO, { id: string } & Partial<ExpensePayload>>({
      query: ({ id, ...body }) => ({ url: `/expenses/${id}`, method: 'PATCH', body }),
      invalidatesTags: [...EXPENSE_MUTATION_TAGS],
    }),
    deleteExpense: build.mutation<{ deleted: boolean }, string>({
      query: (id) => ({ url: `/expenses/${id}`, method: 'DELETE' }),
      invalidatesTags: [...EXPENSE_MUTATION_TAGS],
    }),
  }),
});

export const { useGetExpensesQuery, useCreateExpenseMutation, useUpdateExpenseMutation, useDeleteExpenseMutation } =
  expensesApi;
