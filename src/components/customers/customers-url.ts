import { listHref } from '@/lib/url';

/** `/customers?search=…&page=…` — the URL is the source of truth for the list's filters. */
export function customersHref(search: string, page = 1): string {
  return listHref('/customers', { search, page });
}
