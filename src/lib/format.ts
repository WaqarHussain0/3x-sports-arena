import { TZDate } from '@date-fns/tz';
import { format } from 'date-fns';
import { LOCALE, TIMEZONE } from './constants';

const numberFormatter = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 });

/** Formats integer rupees as `Rs 2,000`. */
export function formatCurrency(amount: number | null | undefined): string {
  const value = Number.isFinite(amount) ? Math.round(amount as number) : 0;
  const formatted = numberFormatter.format(Math.abs(value));
  return value < 0 ? `-Rs ${formatted}` : `Rs ${formatted}`;
}

export function formatNumber(value: number, maximumFractionDigits = 0): string {
  return new Intl.NumberFormat(LOCALE, { maximumFractionDigits }).format(value);
}

function toPkt(date: Date | string): TZDate {
  return new TZDate(new Date(date).getTime(), TIMEZONE);
}

/** `08 Oct 2026` (in PKT). */
export function formatDate(date: Date | string): string {
  return format(toPkt(date), 'dd MMM yyyy');
}

/** `Thu, 08 Oct` (in PKT). */
export function formatShortDay(date: Date | string): string {
  return format(toPkt(date), 'EEE, dd MMM');
}

/** `8:00 PM` (in PKT). */
export function formatTime(date: Date | string): string {
  return format(toPkt(date), 'h:mm a');
}

/** `08 Oct 2026, 8:00 PM` (in PKT). */
export function formatDateTime(date: Date | string): string {
  return format(toPkt(date), 'dd MMM yyyy, h:mm a');
}

/** `8:00 PM – 9:30 PM` */
export function formatTimeRange(start: Date | string, end: Date | string): string {
  return `${formatTime(start)} – ${formatTime(end)}`;
}

/** Formats a 'HH:mm' 24h string as `8:00 PM`. */
export function formatTimeOfDay(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

/** `1 h 30 min`, `45 min`, `2 h` */
export function formatDuration(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes <= 0) return '0 min';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h && m) return `${h} h ${m} min`;
  if (h) return `${h} h`;
  return `${m} min`;
}

/** `12 AM`, `1 PM` for hour-of-day axes. */
export function formatHourLabel(hour: number): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12} ${period}`;
}

export function formatPercent(value: number | null | undefined, digits = 0): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  return `${value.toFixed(digits)}%`;
}
