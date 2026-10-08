/*
 * Plain validation functions shared by React Hook Form (client) and route handlers (server).
 * No schema library by design (plan §2 / §12).
 */
import {
  CANCELLATION_ADVANCE_HANDLING,
  COURT_COLORS,
  DISCOUNT_TYPES,
  EXPENSE_SPORT_TYPES,
  SPORT_TYPES,
  type AdvanceHandling,
  type DiscountType,
  type ExpenseSportType,
  type SportType,
} from './constants';
import { normalizePhone, isValidPakPhone } from './phone';
import { buildStartEnd, isValidDateString, todayPkt } from './time';

export { isValidPakPhone };

// ---------- pure checks ----------

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const HEX_COLOR_RE = /^#[0-9a-f]{6}$/i;
const OBJECT_ID_RE = /^[a-f\d]{24}$/i;

export const isNonEmptyString = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;
export const isValidEmail = (v: unknown): boolean => typeof v === 'string' && EMAIL_RE.test(v.trim());
export const isInt = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v);
export const isNonNegativeInt = (v: unknown): v is number => isInt(v) && v >= 0;
export const isPositiveInt = (v: unknown): v is number => isInt(v) && v >= 1;
export const isValidObjectId = (v: unknown): v is string => typeof v === 'string' && OBJECT_ID_RE.test(v);
export const isHexColor = (v: unknown): v is string => typeof v === 'string' && HEX_COLOR_RE.test(v);
export const lengthBetween = (v: string, min: number, max: number) => v.trim().length >= min && v.trim().length <= max;
export const isOneOf = <T extends string>(list: readonly T[], v: unknown): v is T =>
  typeof v === 'string' && (list as readonly string[]).includes(v);
/** 'YYYY-MM-DD' that is not after today (PKT). */
export const isNotFutureDate = (v: string) => isValidDateString(v) && v <= todayPkt();

// ---------- React Hook Form rule objects ----------

export const phoneRules = {
  required: 'Phone number is required',
  validate: (v: string) => isValidPakPhone(v) || 'Enter a valid Pakistani mobile number (03XXXXXXXXX)',
};

export const customerNameRules = {
  required: 'Customer name is required',
  validate: (v: string) => lengthBetween(v, 2, 60) || 'Name must be 2–60 characters',
};

export const optionalEmailRules = {
  validate: (v: string | undefined) => !v || isValidEmail(v) || 'Enter a valid email address',
};

export const notesRules = {
  maxLength: { value: 500, message: 'Notes must be at most 500 characters' },
};

export const categoryNameRules = {
  required: 'Name is required',
  validate: (v: string) => lengthBetween(v, 2, 50) || 'Name must be 2–50 characters',
};

export const categoryDescriptionRules = {
  maxLength: { value: 200, message: 'Description must be at most 200 characters' },
};

export const courtNameRules = {
  required: 'Name is required',
  validate: (v: string) => lengthBetween(v, 2, 50) || 'Name must be 2–50 characters',
};

export const courtPriceRules = {
  validate: (v: number) => isNonNegativeInt(v) || 'Enter a whole number of rupees (0 or more)',
};

export const expenseAmountRules = {
  validate: (v: number) => isPositiveInt(v) || 'Enter a whole number of rupees (at least 1)',
};

export const expenseDateRules = {
  required: 'Date is required',
  validate: (v: string) => isNotFutureDate(v) || 'Date cannot be in the future',
};

export const requiredRule = (message: string) => ({ required: message });

// ---------- server-side validators ----------

export type FieldErrors = Record<string, string>;
export type Validated<T> = { ok: true; data: T } | { ok: false; errors: FieldErrors };

type Body = Record<string, unknown>;

export function asBody(value: unknown): Body {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Body) : {};
}

function optionalTrimmed(v: unknown): string | undefined {
  if (typeof v !== 'string') return undefined;
  const t = v.trim();
  return t.length ? t : undefined;
}

function done<T>(errors: FieldErrors, data: T): Validated<T> {
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, data };
}

// Courts

export interface CourtInput {
  name: string;
  pricePerHour: number;
  description?: string;
  color: string;
}

export function validateCourtInput(raw: unknown, partial = false): Validated<Partial<CourtInput>> {
  const b = asBody(raw);
  const errors: FieldErrors = {};
  const data: Partial<CourtInput> = {};

  if (!partial || b.name !== undefined) {
    if (!isNonEmptyString(b.name) || !lengthBetween(b.name, 2, 50)) errors.name = 'Name must be 2–50 characters';
    else data.name = b.name.trim();
  }
  if (!partial || b.pricePerHour !== undefined) {
    if (!isNonNegativeInt(b.pricePerHour)) errors.pricePerHour = 'Price must be a whole number of rupees (0 or more)';
    else data.pricePerHour = b.pricePerHour;
  }
  if (b.description !== undefined) {
    const d = optionalTrimmed(b.description);
    if (d && d.length > 200) errors.description = 'Description must be at most 200 characters';
    else data.description = d ?? '';
  }
  if (!partial || b.color !== undefined) {
    if (b.color === undefined && !partial) data.color = COURT_COLORS[0];
    else if (!isHexColor(b.color)) errors.color = 'Pick a valid color';
    else data.color = b.color.toLowerCase();
  }
  return done(errors, data);
}

// Expense categories

export interface CategoryInput {
  name: string;
  description?: string;
  sportType: ExpenseSportType;
}

export function validateCategoryInput(raw: unknown, partial = false): Validated<Partial<CategoryInput>> {
  const b = asBody(raw);
  const errors: FieldErrors = {};
  const data: Partial<CategoryInput> = {};

  if (!partial || b.name !== undefined) {
    if (!isNonEmptyString(b.name) || !lengthBetween(b.name, 2, 50)) errors.name = 'Name must be 2–50 characters';
    else data.name = b.name.trim();
  }
  if (!partial || b.sportType !== undefined) {
    const sport = b.sportType ?? 'general';
    if (!isOneOf(EXPENSE_SPORT_TYPES, sport)) errors.sportType = 'Choose Cricket, Futsal or General';
    else data.sportType = sport;
  }
  if (b.description !== undefined) {
    const d = optionalTrimmed(b.description);
    if (d && d.length > 200) errors.description = 'Description must be at most 200 characters';
    else data.description = d ?? '';
  }
  return done(errors, data);
}

// Expenses

export interface ExpenseInput {
  category: string;
  date: string;
  amount: number;
  notes?: string;
}

export function validateExpenseInput(raw: unknown, partial = false): Validated<Partial<ExpenseInput>> {
  const b = asBody(raw);
  const errors: FieldErrors = {};
  const data: Partial<ExpenseInput> = {};

  if (!partial || b.category !== undefined) {
    if (!isValidObjectId(b.category)) errors.category = 'Choose a category';
    else data.category = b.category;
  }
  if (!partial || b.date !== undefined) {
    if (!isValidDateString(b.date)) errors.date = 'Enter a valid date';
    else if (!isNotFutureDate(b.date)) errors.date = 'Date cannot be in the future';
    else data.date = b.date;
  }
  if (!partial || b.amount !== undefined) {
    if (!isPositiveInt(b.amount)) errors.amount = 'Amount must be a whole number of rupees (at least 1)';
    else data.amount = b.amount;
  }
  if (b.notes !== undefined) {
    const n = optionalTrimmed(b.notes);
    if (n && n.length > 500) errors.notes = 'Notes must be at most 500 characters';
    else data.notes = n ?? '';
  }
  return done(errors, data);
}

// Bookings

export interface BookingInput {
  customerName: string;
  phone: string; // normalized
  email?: string;
  courtId: string;
  sportType: SportType;
  bookingDate: string;
  startTime: string;
  endTime: string;
  startAt: Date;
  endAt: Date;
  durationMinutes: number;
  discountType: DiscountType;
  discountValue: number;
  advanceAmount: number;
  notes?: string;
}

/** Validates the shape of a booking create/edit body (price-dependent rules are checked in the service). */
export function validateBookingInput(raw: unknown): Validated<BookingInput> {
  const b = asBody(raw);
  const errors: FieldErrors = {};

  const customerName = typeof b.customerName === 'string' ? b.customerName.trim() : '';
  if (!lengthBetween(customerName, 2, 60)) errors.customerName = 'Name must be 2–60 characters';

  const phone = normalizePhone(typeof b.phone === 'string' ? b.phone : '');
  if (!phone) errors.phone = 'Enter a valid Pakistani mobile number (03XXXXXXXXX)';

  const email = optionalTrimmed(b.email)?.toLowerCase();
  if (email && !isValidEmail(email)) errors.email = 'Enter a valid email address';

  if (!isValidObjectId(b.courtId)) errors.courtId = 'Choose a court';
  if (!isOneOf(SPORT_TYPES, b.sportType)) errors.sportType = 'Choose Cricket or Futsal';

  const times = buildStartEnd(String(b.bookingDate ?? ''), String(b.startTime ?? ''), String(b.endTime ?? ''));
  if (!times.ok) errors[times.field] = times.error;

  const discountType = b.discountType ?? 'none';
  let discountValue = 0;
  if (!isOneOf(DISCOUNT_TYPES, discountType)) errors.discountType = 'Invalid discount type';
  else if (discountType !== 'none') {
    if (!isPositiveInt(b.discountValue)) errors.discountValue = 'Discount must be a whole number greater than 0';
    else if (discountType === 'percentage' && b.discountValue > 100) {
      errors.discountValue = 'Percentage discount must be between 1 and 100';
    } else discountValue = b.discountValue;
  }

  let advanceAmount = 0;
  if (b.advanceAmount !== undefined && b.advanceAmount !== null) {
    if (!isNonNegativeInt(b.advanceAmount)) errors.advanceAmount = 'Advance must be a whole number of rupees';
    else advanceAmount = b.advanceAmount;
  }

  const notes = optionalTrimmed(b.notes);
  if (notes && notes.length > 500) errors.notes = 'Notes must be at most 500 characters';

  if (Object.keys(errors).length || !times.ok) return { ok: false, errors };

  return {
    ok: true,
    data: {
      customerName,
      phone: phone as string,
      email,
      courtId: b.courtId as string,
      sportType: b.sportType as SportType,
      bookingDate: b.bookingDate as string,
      startTime: b.startTime as string,
      endTime: b.endTime as string,
      startAt: times.value.startAt,
      endAt: times.value.endAt,
      durationMinutes: times.value.durationMinutes,
      discountType: discountType as DiscountType,
      discountValue,
      advanceAmount,
      notes,
    },
  };
}

export interface PaymentInput {
  amount: number;
  note?: string;
}

export function validatePaymentInput(raw: unknown): Validated<PaymentInput> {
  const b = asBody(raw);
  const errors: FieldErrors = {};
  if (!isPositiveInt(b.amount)) errors.amount = 'Amount must be a whole number of rupees (at least 1)';
  const note = optionalTrimmed(b.note);
  if (note && note.length > 200) errors.note = 'Note must be at most 200 characters';
  return done(errors, { amount: b.amount as number, note });
}

export interface CancelInput {
  reason?: string;
  advanceHandling?: AdvanceHandling;
}

export function validateCancelInput(raw: unknown): Validated<CancelInput> {
  const b = asBody(raw);
  const errors: FieldErrors = {};
  const reason = optionalTrimmed(b.reason);
  if (reason && reason.length > 500) errors.reason = 'Reason must be at most 500 characters';
  if (b.advanceHandling !== undefined && b.advanceHandling !== null && !isOneOf(CANCELLATION_ADVANCE_HANDLING, b.advanceHandling)) {
    errors.advanceHandling = 'Choose whether to refund or keep the advance';
  }
  return done(errors, {
    reason,
    advanceHandling: (b.advanceHandling ?? undefined) as AdvanceHandling | undefined,
  });
}
