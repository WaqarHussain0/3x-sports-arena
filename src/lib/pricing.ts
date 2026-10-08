import type { BookingStatus, DiscountType, PaymentKind, PaymentStatus } from './constants';

export interface PriceInput {
  pricePerHour: number;
  durationMinutes: number;
  discountType: DiscountType;
  discountValue?: number | null;
}

export interface PriceResult {
  grossAmount: number;
  discountAmount: number;
  totalAmount: number;
  discount: { type: DiscountType; value: number };
}

/**
 * Single source of truth for booking pricing (plan §5.1).
 * Pure: used by the booking dialog for live preview and by the server (authoritative).
 */
export function calculateBookingPrice(input: PriceInput): PriceResult {
  const pricePerHour = Math.max(0, Math.round(input.pricePerHour || 0));
  const durationMinutes = Math.max(0, Math.round(input.durationMinutes || 0));
  const grossAmount = Math.round((pricePerHour * durationMinutes) / 60);

  const type: DiscountType = input.discountType ?? 'none';
  const value = type === 'none' ? 0 : Math.max(0, Number(input.discountValue) || 0);

  let discountAmount = 0;
  if (type === 'percentage') discountAmount = Math.round((grossAmount * value) / 100);
  else if (type === 'fixed') discountAmount = Math.round(value);

  discountAmount = Math.min(Math.max(discountAmount, 0), grossAmount);

  return {
    grossAmount,
    discountAmount,
    totalAmount: grossAmount - discountAmount,
    discount: { type, value },
  };
}

/** Returns an error message when the discount is invalid for the given gross amount, else null. */
export function validateDiscount(
  type: DiscountType,
  value: number | null | undefined,
  grossAmount: number,
): string | null {
  if (type === 'none') return null;
  if (value === null || value === undefined || !Number.isInteger(value)) {
    return 'Discount must be a whole number';
  }
  if (type === 'percentage' && (value <= 0 || value > 100)) {
    return 'Percentage discount must be between 1 and 100';
  }
  if (type === 'fixed') {
    if (value <= 0) return 'Fixed discount must be greater than 0';
    if (value > grossAmount) return 'Fixed discount cannot exceed the subtotal';
  }
  return null;
}

export interface PaymentEntryLike {
  amount: number;
  kind: PaymentKind;
}

export interface PaymentState {
  amountPaid: number;
  remainingAmount: number;
  paymentStatus: PaymentStatus;
}

/** amountPaid = Σ payments − Σ refunds; remaining = max(total − paid, 0). A zero total counts as paid. */
export function computePaymentState(totalAmount: number, payments: PaymentEntryLike[]): PaymentState {
  const amountPaid = payments.reduce(
    (sum, p) => sum + (p.kind === 'refund' ? -p.amount : p.amount),
    0,
  );
  const remainingAmount = Math.max(totalAmount - amountPaid, 0);
  let paymentStatus: PaymentStatus;
  if (totalAmount === 0 || amountPaid >= totalAmount) paymentStatus = 'paid';
  else if (amountPaid > 0) paymentStatus = 'partial';
  else paymentStatus = 'unpaid';
  return { amountPaid, remainingAmount, paymentStatus };
}

/** Status after save: any payment (or a zero total, see plan §14) confirms a pending booking. */
export function deriveBookingStatus(
  current: BookingStatus,
  amountPaid: number,
  totalAmount: number,
): BookingStatus {
  if (current === 'cancelled') return 'cancelled';
  if (amountPaid > 0 || totalAmount === 0) return 'confirmed';
  return current;
}
