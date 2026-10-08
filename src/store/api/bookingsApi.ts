import { baseApi } from './baseApi';
import type { AdvanceHandling } from '@/lib/constants';
import type { AvailabilityDTO, BookingDTO, BookingPayload, BookingsQuery } from '@/types';

const BOOKING_MUTATION_TAGS = ['Booking', 'Customer', 'Dashboard', 'Court'] as const;

export const bookingsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getBookings: build.query<BookingDTO[], BookingsQuery>({
      query: ({ from, to, court, includeCancelled }) => ({
        url: '/bookings',
        params: {
          from,
          to,
          court: court && court !== 'all' ? court : undefined,
          includeCancelled: includeCancelled ? 'true' : undefined,
        },
      }),
      providesTags: [{ type: 'Booking', id: 'LIST' }],
    }),
    getBooking: build.query<BookingDTO, string>({
      query: (id) => `/bookings/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Booking', id }],
    }),
    checkAvailability: build.query<
      AvailabilityDTO & { message?: string },
      { court: string; startAt: string; endAt: string; excludeId?: string }
    >({
      query: (params) => ({ url: '/bookings/check-availability', params }),
      providesTags: [{ type: 'Booking', id: 'AVAILABILITY' }],
      keepUnusedDataFor: 5,
    }),
    createBooking: build.mutation<BookingDTO, BookingPayload>({
      query: (body) => ({ url: '/bookings', method: 'POST', body }),
      invalidatesTags: [...BOOKING_MUTATION_TAGS],
    }),
    updateBooking: build.mutation<BookingDTO, { id: string } & BookingPayload>({
      query: ({ id, ...body }) => ({ url: `/bookings/${id}`, method: 'PATCH', body }),
      invalidatesTags: (_r, _e, { id }) => [...BOOKING_MUTATION_TAGS, { type: 'Booking', id }],
    }),
    recordPayment: build.mutation<BookingDTO, { id: string; amount: number; note?: string }>({
      query: ({ id, ...body }) => ({ url: `/bookings/${id}/payments`, method: 'POST', body }),
      invalidatesTags: (_r, _e, { id }) => [...BOOKING_MUTATION_TAGS, { type: 'Booking', id }],
    }),
    cancelBooking: build.mutation<
      BookingDTO,
      { id: string; reason?: string; advanceHandling?: AdvanceHandling }
    >({
      query: ({ id, ...body }) => ({ url: `/bookings/${id}/cancel`, method: 'POST', body }),
      invalidatesTags: (_r, _e, { id }) => [...BOOKING_MUTATION_TAGS, { type: 'Booking', id }],
    }),
  }),
});

export const {
  useGetBookingsQuery,
  useGetBookingQuery,
  useCheckAvailabilityQuery,
  useCreateBookingMutation,
  useUpdateBookingMutation,
  useRecordPaymentMutation,
  useCancelBookingMutation,
  usePrefetch: useBookingsPrefetch,
} = bookingsApi;
