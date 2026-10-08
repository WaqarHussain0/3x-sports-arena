import { baseApi } from './baseApi';
import type { DashboardQuery, DashboardStats } from '@/types';

export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getDashboardStats: build.query<DashboardStats, DashboardQuery>({
      query: (q) => ({
        url: '/dashboard/stats',
        params:
          q.range === 'monthly'
            ? { range: q.range, month: q.month }
            : q.range === 'yearly'
              ? { range: q.range, year: q.year }
              : { range: q.range, from: q.from, to: q.to },
      }),
      providesTags: ['Dashboard'],
    }),
  }),
});

export const { useGetDashboardStatsQuery } = dashboardApi;
