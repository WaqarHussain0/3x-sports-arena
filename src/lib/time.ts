import { TZDate } from '@date-fns/tz';
import { format } from 'date-fns';
import { MAX_BOOKING_MINUTES, TIME_STEP_MINUTES, TIMEZONE } from './constants';

/*
 * Two kinds of values live here:
 *  - Instants (`Date`), always stored as UTC and converted to PKT at the edges.
 *  - Calendar date strings ('YYYY-MM-DD') and times ('HH:mm') that are always PKT wall-clock values.
 * Calendar-string arithmetic is done in UTC so the host machine's timezone never leaks in.
 */

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MONTH_RE = /^(\d{4})-(\d{2})$/;
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const MINUTES_PER_DAY = 24 * 60;

// ---------- validation ----------

export function isValidDateString(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const m = DATE_RE.exec(value);
  if (!m) return false;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return d.getUTCFullYear() === +m[1] && d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3];
}

export function isValidMonthString(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const m = MONTH_RE.exec(value);
  return !!m && +m[2] >= 1 && +m[2] <= 12;
}

export function isValidTimeString(value: unknown): value is string {
  return typeof value === 'string' && TIME_RE.test(value);
}

/** True when an 'HH:mm' time falls on a 15-minute step. */
export function isOnTimeStep(value: string): boolean {
  return timeToMinutes(value) % TIME_STEP_MINUTES === 0;
}

// ---------- 'HH:mm' helpers ----------

export function timeToMinutes(value: string): number {
  const [h, m] = value.split(':').map(Number);
  return h * 60 + m;
}

export function minutesToTime(minutes: number): string {
  const normalized = ((minutes % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** All 'HH:mm' values of the day in 15-minute steps. */
export function timeSteps(): string[] {
  const steps: string[] = [];
  for (let m = 0; m < MINUTES_PER_DAY; m += TIME_STEP_MINUTES) steps.push(minutesToTime(m));
  return steps;
}

/**
 * Duration between two wall-clock times. An end time earlier than the start means the next day.
 * Returns 0 when start === end (invalid booking — see plan §14).
 */
export function durationBetweenTimes(startTime: string, endTime: string): number {
  const diff = timeToMinutes(endTime) - timeToMinutes(startTime);
  if (diff === 0) return 0;
  return diff > 0 ? diff : diff + MINUTES_PER_DAY;
}

export function endsNextDay(startTime: string, endTime: string): boolean {
  return timeToMinutes(endTime) < timeToMinutes(startTime);
}

// ---------- calendar date-string arithmetic ----------

function parts(dateStr: string): [number, number, number] {
  const [y, m, d] = dateStr.split('-').map(Number);
  return [y, m, d];
}

function utcDateToStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function addDaysStr(dateStr: string, days: number): string {
  const [y, m, d] = parts(dateStr);
  return utcDateToStr(new Date(Date.UTC(y, m - 1, d + days)));
}

export function addMonthsStr(monthStr: string, months: number): string {
  const [y, m] = monthStr.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + months, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

/** Inclusive number of days between two date strings (from ≤ to). */
export function daysBetweenInclusive(fromStr: string, toStr: string): number {
  const [y1, m1, d1] = parts(fromStr);
  const [y2, m2, d2] = parts(toStr);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86_400_000) + 1;
}

/** 0 = Monday … 6 = Sunday. */
export function weekdayIndexMonFirst(dateStr: string): number {
  const [y, m, d] = parts(dateStr);
  return (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7;
}

/** Monday of the week containing the date. */
export function getWeekStart(dateStr: string): string {
  return addDaysStr(dateStr, -weekdayIndexMonFirst(dateStr));
}

export function lastDayOfMonth(monthStr: string): string {
  const [y, m] = monthStr.split('-').map(Number);
  return utcDateToStr(new Date(Date.UTC(y, m, 0)));
}

export function eachDateStr(fromStr: string, toStr: string): string[] {
  const days = daysBetweenInclusive(fromStr, toStr);
  return Array.from({ length: Math.max(days, 0) }, (_, i) => addDaysStr(fromStr, i));
}

export function eachMonthStr(fromStr: string, toStr: string): string[] {
  const months: string[] = [];
  let cur = fromStr.slice(0, 7);
  const end = toStr.slice(0, 7);
  while (cur <= end) {
    months.push(cur);
    cur = addMonthsStr(cur, 1);
  }
  return months;
}

/** Formats a calendar date string with a date-fns pattern (no timezone shift). */
export function formatDateStr(dateStr: string, pattern = 'dd MMM yyyy'): string {
  const [y, m, d] = parts(dateStr);
  return format(new Date(y, m - 1, d), pattern);
}

/** Date-picker bridge: calendar date string → local-midnight Date (what react-day-picker expects). */
export function dateStrToLocalDate(dateStr: string): Date {
  const [y, m, d] = parts(dateStr);
  return new Date(y, m - 1, d);
}

/** Date-picker bridge: local Date → calendar date string. */
export function localDateToStr(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/** `6 – 12 Oct 2026`,`29 Sep – 5 Oct 2026`, `29 Dec 2025 – 4 Jan 2026` */
export function formatRangeLabel(fromStr: string, toStr: string): string {
  const [y1, m1] = parts(fromStr);
  const [y2, m2] = parts(toStr);
  if (fromStr === toStr) return formatDateStr(fromStr, 'd MMM yyyy');
  if (y1 !== y2) return `${formatDateStr(fromStr, 'd MMM yyyy')} – ${formatDateStr(toStr, 'd MMM yyyy')}`;
  if (m1 !== m2) return `${formatDateStr(fromStr, 'd MMM')} – ${formatDateStr(toStr, 'd MMM yyyy')}`;
  return `${formatDateStr(fromStr, 'd')} – ${formatDateStr(toStr, 'd MMM yyyy')}`;
}

// ---------- PKT ↔ UTC instants ----------

/** PKT wall-clock date + time → UTC instant. */
export function pktToUtc(dateStr: string, time = '00:00'): Date {
  const [y, m, d] = parts(dateStr);
  const [hh, mm] = time.split(':').map(Number);
  return new Date(new TZDate(y, m - 1, d, hh, mm, TIMEZONE).getTime());
}

function inPkt(date: Date | string): TZDate {
  return new TZDate(new Date(date).getTime(), TIMEZONE);
}

/** UTC instant → PKT 'YYYY-MM-DD'. */
export function toPktDateString(date: Date | string): string {
  return format(inPkt(date), 'yyyy-MM-dd');
}

/** UTC instant → PKT 'HH:mm'. */
export function toPktTimeString(date: Date | string): string {
  return format(inPkt(date), 'HH:mm');
}

/** Minutes since PKT midnight for an instant. */
export function minutesSincePktMidnight(date: Date | string): number {
  const z = inPkt(date);
  return z.getHours() * 60 + z.getMinutes();
}

export function todayPkt(): string {
  return toPktDateString(new Date());
}

export function currentMonthPkt(): string {
  return todayPkt().slice(0, 7);
}

/** UTC range [start, end) covering the PKT calendar days fromStr..toStr inclusive. */
export function pktDayRange(fromStr: string, toStr: string): { from: Date; to: Date } {
  return { from: pktToUtc(fromStr), to: pktToUtc(addDaysStr(toStr, 1)) };
}

// ---------- booking times ----------

export interface StartEnd {
  startAt: Date;
  endAt: Date;
  durationMinutes: number;
  endsNextDay: boolean;
}

/**
 * Builds booking instants from a PKT date and 'HH:mm' times.
 * End ≤ start rolls to the next day; equal times are rejected.
 */
export function buildStartEnd(
  dateStr: string,
  startTime: string,
  endTime: string,
): { ok: true; value: StartEnd } | { ok: false; error: string; field: string } {
  if (!isValidDateString(dateStr)) return { ok: false, error: 'Enter a valid date', field: 'bookingDate' };
  if (!isValidTimeString(startTime) || !isOnTimeStep(startTime)) {
    return { ok: false, error: 'Start time must be on a 15-minute step', field: 'startTime' };
  }
  if (!isValidTimeString(endTime) || !isOnTimeStep(endTime)) {
    return { ok: false, error: 'End time must be on a 15-minute step', field: 'endTime' };
  }
  const durationMinutes = durationBetweenTimes(startTime, endTime);
  if (durationMinutes === 0) {
    return { ok: false, error: 'End time must differ from start time.', field: 'endTime' };
  }
  if (durationMinutes > MAX_BOOKING_MINUTES) {
    return { ok: false, error: 'A booking cannot be longer than 24 hours', field: 'endTime' };
  }
  const nextDay = endsNextDay(startTime, endTime);
  const startAt = pktToUtc(dateStr, startTime);
  const endAt = pktToUtc(nextDay ? addDaysStr(dateStr, 1) : dateStr, endTime);
  return { ok: true, value: { startAt, endAt, durationMinutes, endsNextDay: nextDay } };
}

// ---------- dashboard ranges ----------

export type DateRangeQuery =
  | { range: 'monthly'; month: string }
  | { range: 'yearly'; year: number }
  | { range: 'custom'; from: string; to: string };

export interface ResolvedRange {
  fromStr: string; // inclusive, PKT
  toStr: string; // inclusive, PKT
  from: Date; // UTC instant, inclusive
  to: Date; // UTC instant, exclusive
  days: number;
  bucket: 'day' | 'month';
}

export const DAY_BUCKET_MAX_DAYS = 62;

function makeRange(fromStr: string, toStr: string, forceMonth = false): ResolvedRange {
  const days = daysBetweenInclusive(fromStr, toStr);
  const { from, to } = pktDayRange(fromStr, toStr);
  const bucket = forceMonth || days > DAY_BUCKET_MAX_DAYS ? 'month' : 'day';
  return { fromStr, toStr, from, to, days, bucket };
}

/** Resolves a dashboard filter into the current range and the previous equivalent period. */
export function resolveDashboardRange(q: DateRangeQuery): { current: ResolvedRange; previous: ResolvedRange } {
  if (q.range === 'monthly') {
    const prevMonth = addMonthsStr(q.month, -1);
    return {
      current: makeRange(`${q.month}-01`, lastDayOfMonth(q.month)),
      previous: makeRange(`${prevMonth}-01`, lastDayOfMonth(prevMonth)),
    };
  }
  if (q.range === 'yearly') {
    return {
      current: makeRange(`${q.year}-01-01`, `${q.year}-12-31`, true),
      previous: makeRange(`${q.year - 1}-01-01`, `${q.year - 1}-12-31`, true),
    };
  }
  const days = daysBetweenInclusive(q.from, q.to);
  return {
    current: makeRange(q.from, q.to),
    previous: makeRange(addDaysStr(q.from, -days), addDaysStr(q.from, -1)),
  };
}
