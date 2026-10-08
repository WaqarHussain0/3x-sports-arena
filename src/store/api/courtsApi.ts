import { baseApi } from './baseApi';
import type { CourtDTO, CourtPayload } from '@/types';

const COURT_MUTATION_TAGS = ['Court', 'Booking', 'Dashboard'] as const;

export const courtsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getCourts: build.query<CourtDTO[], { includeArchived?: boolean } | void>({
      query: (args) => ({ url: '/courts', params: { includeArchived: args?.includeArchived ? 'true' : undefined } }),
      providesTags: (result) => [
        { type: 'Court', id: 'LIST' },
        ...(result ?? []).map((c) => ({ type: 'Court' as const, id: c._id })),
      ],
    }),
    createCourt: build.mutation<CourtDTO, CourtPayload>({
      query: (body) => ({ url: '/courts', method: 'POST', body }),
      invalidatesTags: [...COURT_MUTATION_TAGS],
    }),
    updateCourt: build.mutation<CourtDTO, { id: string } & Partial<CourtPayload>>({
      query: ({ id, ...body }) => ({ url: `/courts/${id}`, method: 'PATCH', body }),
      invalidatesTags: [...COURT_MUTATION_TAGS],
    }),
    toggleCourtArchive: build.mutation<CourtDTO, string>({
      query: (id) => ({ url: `/courts/${id}/archive`, method: 'PATCH' }),
      invalidatesTags: [...COURT_MUTATION_TAGS],
    }),
    deleteCourt: build.mutation<{ deleted: boolean }, string>({
      query: (id) => ({ url: `/courts/${id}`, method: 'DELETE' }),
      invalidatesTags: [...COURT_MUTATION_TAGS],
    }),
  }),
});

export const {
  useGetCourtsQuery,
  useCreateCourtMutation,
  useUpdateCourtMutation,
  useToggleCourtArchiveMutation,
  useDeleteCourtMutation,
} = courtsApi;
