import { createApi, fetchBaseQuery, type BaseQueryFn, type FetchArgs } from '@reduxjs/toolkit/query/react';
import type { ApiFailure, ApiSuccess, AppError } from '@/types';

export interface ApiMeta {
  apiMeta?: Record<string, unknown>;
}

const rawBaseQuery = fetchBaseQuery({ baseUrl: '/api' });

/**
 * Unwraps `{ success, data }` envelopes and normalizes `{ success: false }` into a typed `AppError`.
 * The envelope's `meta` (pagination, sums) is exposed to `transformResponse` as `meta.apiMeta`.
 */
const baseQuery: BaseQueryFn<string | FetchArgs, unknown, AppError, object, ApiMeta> = async (
  args,
  api,
  extraOptions,
) => {
  const result = await rawBaseQuery(args, api, extraOptions);

  if (result.error) {
    const { status } = result.error;
    const body = ('data' in result.error ? result.error.data : undefined) as ApiFailure | undefined;

    if (status === 401 && typeof window !== 'undefined') {
      const callbackUrl = encodeURIComponent(window.location.pathname + window.location.search);
      // Session expired mid-use: a full reload to /login also clears client caches.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = `/login?callbackUrl=${callbackUrl}`;
    }

    return {
      error: {
        status,
        message:
          body?.error?.message ??
          (status === 'FETCH_ERROR' ? 'Network error. Check your connection.' : 'Something went wrong.'),
        code: body?.error?.code ?? 'UNKNOWN',
        fields: body?.error?.fields,
        conflict: body?.error?.conflict,
      },
    };
  }

  const body = result.data as ApiSuccess<unknown>;
  return { data: body?.data, meta: { apiMeta: body?.meta } };
};

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery,
  tagTypes: ['Court', 'ExpenseCategory', 'Expense', 'Booking', 'Customer', 'Dashboard'],
  refetchOnReconnect: true,
  endpoints: () => ({}),
});

/** Extracts a user-facing message from an RTK Query / unwrap() error. */
export function getErrorMessage(error: unknown, fallback = 'Something went wrong.'): string {
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }
  return fallback;
}

export function isAppError(error: unknown): error is AppError {
  return !!error && typeof error === 'object' && 'status' in error && 'message' in error;
}
