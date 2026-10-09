import { baseApi } from './baseApi';
import type { CustomerDTO, CustomerPayload } from '@/types';

export const customersApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    createCustomer: build.mutation<CustomerDTO, CustomerPayload>({
      query: (body) => ({ url: '/customers', method: 'POST', body }),
      invalidatesTags: (r) => (r ? [{ type: 'Customer', id: r.phone }] : []),
    }),
    updateCustomer: build.mutation<CustomerDTO, { id: string } & CustomerPayload>({
      query: ({ id, ...body }) => ({ url: `/customers/${id}`, method: 'PATCH', body }),
      // The phone may have changed, so drop every cached phone lookup.
      invalidatesTags: ['Customer'],
    }),
    lookupCustomer: build.query<CustomerDTO | null, string>({
      query: (phone) => ({ url: '/customers/lookup', params: { phone } }),
      providesTags: (_r, _e, phone) => [{ type: 'Customer', id: phone }],
    }),
  }),
});

export const { useCreateCustomerMutation, useUpdateCustomerMutation, useLookupCustomerQuery } = customersApi;
