import { baseApi } from './baseApi';
import type { CustomerDTO } from '@/types';

export const customersApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    lookupCustomer: build.query<CustomerDTO | null, string>({
      query: (phone) => ({ url: '/customers/lookup', params: { phone } }),
      providesTags: (_r, _e, phone) => [{ type: 'Customer', id: phone }],
    }),
  }),
});

export const { useLookupCustomerQuery } = customersApi;
