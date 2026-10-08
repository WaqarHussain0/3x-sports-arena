export const APP_NAME = '3X Sports Arena';
export const TIMEZONE = 'Asia/Karachi';
export const CURRENCY = 'PKR';
export const LOCALE = 'en-PK';
export const TIME_STEP_MINUTES = 15;
export const MAX_BOOKING_MINUTES = 24 * 60;
export const EXPENSES_PAGE_SIZE = 20;
export const AVAILABILITY_DEBOUNCE_MS = 400;

export const SPORT_TYPES = ['cricket', 'futsal'] as const; // used by bookings
export type SportType = (typeof SPORT_TYPES)[number];

export const EXPENSE_SPORT_TYPES = ['cricket', 'futsal', 'general'] as const; // used by expenses
export type ExpenseSportType = (typeof EXPENSE_SPORT_TYPES)[number];

export const BOOKING_STATUSES = ['pending', 'confirmed', 'cancelled'] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const PAYMENT_STATUSES = ['unpaid', 'partial', 'paid'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const DISCOUNT_TYPES = ['none', 'percentage', 'fixed'] as const;
export type DiscountType = (typeof DISCOUNT_TYPES)[number];

export const PAYMENT_KINDS = ['payment', 'refund'] as const;
export type PaymentKind = (typeof PAYMENT_KINDS)[number];

export const CANCELLATION_ADVANCE_HANDLING = ['refunded', 'retained'] as const;
export type AdvanceHandling = (typeof CANCELLATION_ADVANCE_HANDLING)[number];

export const DASHBOARD_RANGE_TYPES = ['monthly', 'yearly', 'custom'] as const;
export type DashboardRangeType = (typeof DASHBOARD_RANGE_TYPES)[number];

export const LABELS: Record<string, string> = {
  cricket: 'Cricket',
  futsal: 'Futsal',
  general: 'General',
  pending: 'Pending',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
  unpaid: 'Unpaid',
  partial: 'Partial',
  paid: 'Paid',
  none: 'None',
  percentage: 'Percentage',
  fixed: 'Fixed',
  payment: 'Payment',
  refund: 'Refund',
  refunded: 'Refunded',
  retained: 'Retained',
  monthly: 'Monthly',
  yearly: 'Yearly',
  custom: 'Custom',
};

export function label(value: string | undefined | null): string {
  if (!value) return '';
  return LABELS[value] ?? value;
}

/** Preset swatches offered in the court form. */
export const COURT_COLORS = [
  '#16a34a', // green
  '#0ea5e9', // sky
  '#8b5cf6', // violet
  '#f59e0b', // amber
  '#ef4444', // red
  '#ec4899', // pink
  '#14b8a6', // teal
  '#6366f1', // indigo
] as const;

export const DEFAULT_COURT_COLOR = COURT_COLORS[0];

/** Calendar geometry: 1 hour = 64px, so each 15-minute step = 16px. */
export const HOUR_HEIGHT_PX = 64;

/** Hour the calendar scrolls to when the current week isn't shown. */
export const CALENDAR_DEFAULT_SCROLL_HOUR = 16;
