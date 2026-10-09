import { listHref } from '@/lib/url';

export interface CategoryListFilters {
  search: string;
  archived: boolean;
}

/** `/expense-categories?search=…&archived=true&page=…` — the URL is the source of truth for the list's filters. */
export function categoriesHref({ search, archived }: CategoryListFilters, page = 1): string {
  return listHref('/expense-categories', { search, archived, page });
}
