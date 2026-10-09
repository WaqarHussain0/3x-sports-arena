import { listHref } from '@/lib/url';

export interface CourtListFilters {
  search: string;
  archived: boolean;
}

/** `/courts?search=…&archived=true&page=…` — the URL is the source of truth for the list's filters. */
export function courtsHref({ search, archived }: CourtListFilters, page = 1): string {
  return listHref('/courts', { search, archived, page });
}
