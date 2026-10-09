type QueryValue = string | number | boolean | null | undefined;

/**
 * Builds `path?key=value…` for server-filtered list pages, skipping empty values
 * (`''`, `false`, `null`, `undefined`) and `page=1`, so the default URL stays clean.
 */
export function listHref(path: string, query: Record<string, QueryValue>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === '' || value === false || value === null || value === undefined) continue;
    if (key === 'page' && Number(value) <= 1) continue;
    params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

/** Parses `?page=` into a positive integer, defaulting to 1. */
export function parsePage(raw: string | undefined): number {
  const page = Number.parseInt(raw ?? '', 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

/** Escapes user input for use inside a `RegExp`. */
export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
