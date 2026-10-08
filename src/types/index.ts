/* Shared API request/response shapes (dates are ISO strings on the wire). */
import type {
  AdvanceHandling,
  BookingStatus,
  DiscountType,
  ExpenseSportType,
  PaymentKind,
  PaymentStatus,
  SportType,
} from '@/lib/constants';

export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiErrorBody {
  message: string;
  code: string;
  fields?: Record<string, string>;
  conflict?: BookingConflict;
}

export interface ApiFailure {
  success: false;
  error: ApiErrorBody;
}

/** Error shape surfaced by RTK Query hooks. */
export interface AppError extends ApiErrorBody {
  status: number | string;
}

export interface UserRef {
  _id: string;
  name: string;
}

// Courts

export interface CourtDTO {
  _id: string;
  name: string;
  pricePerHour: number;
  description?: string;
  color: string;
  isArchived: boolean;
  bookingCount: number;
  bookingsThisMonth: number;
  createdAt: string;
  updatedAt: string;
}

export interface CourtPayload {
  name: string;
  pricePerHour: number;
  description?: string;
  color: string;
}

// Expense categories

export interface ExpenseCategoryDTO {
  _id: string;
  name: string;
  description?: string;
  sportType: ExpenseSportType;
  isArchived: boolean;
  expenseCount: number;
  totalSpent: number;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseCategoryDetailDTO extends ExpenseCategoryDTO {
  monthSpent: number;
  monthCount: number;
}

export interface CategoryPayload {
  name: string;
  sportType: ExpenseSportType;
  description?: string;
}

// Expenses

export interface ExpenseDTO {
  _id: string;
  category: { _id: string; name: string; isArchived: boolean } | null;
  sportType: ExpenseSportType;
  date: string;
  amount: number;
  notes?: string;
  createdBy: UserRef | null;
  updatedBy?: UserRef | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExpensePayload {
  category: string;
  date: string; // YYYY-MM-DD (PKT)
  amount: number;
  notes?: string;
}

export interface ExpenseListQuery {
  from?: string;
  to?: string;
  category?: string; // comma-separated ids
  sportType?: ExpenseSportType | '';
  page?: number;
  limit?: number;
}

export interface ExpenseListResult {
  items: ExpenseDTO[];
  page: number;
  limit: number;
  total: number;
  sumAmount: number;
}

// Customers

export interface CustomerDTO {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  totalBookings: number;
  totalSpent: number;
  firstBookingAt?: string;
  lastBookingAt?: string;
}

// Bookings

export interface PaymentEntryDTO {
  _id: string;
  amount: number;
  kind: PaymentKind;
  at: string;
  note?: string;
  recordedBy: UserRef | string | null;
}

export interface BookingDTO {
  _id: string;
  bookingNumber: string;
  customer: string;
  customerSnapshot: { name: string; phone: string; email?: string };
  court: string;
  courtNameSnapshot: string;
  sportType: SportType;
  startAt: string;
  endAt: string;
  durationMinutes: number;
  pricePerHourSnapshot: number;
  grossAmount: number;
  discount: { type: DiscountType; value: number };
  discountAmount: number;
  totalAmount: number;
  payments: PaymentEntryDTO[];
  amountPaid: number;
  remainingAmount: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  cancellation?: {
    at: string;
    reason?: string;
    advanceHandling?: AdvanceHandling;
    by: UserRef | string | null;
  };
  notes?: string;
  createdBy: UserRef | string | null;
  updatedBy?: UserRef | string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BookingPayload {
  customerName: string;
  phone: string;
  email?: string;
  courtId: string;
  sportType: SportType;
  bookingDate: string; // YYYY-MM-DD (PKT)
  startTime: string; // HH:mm
  endTime: string; // HH:mm — ≤ start means next day
  discountType: DiscountType;
  discountValue?: number;
  advanceAmount?: number;
  notes?: string;
}

export interface BookingConflict {
  bookingId: string;
  bookingNumber: string;
  customerName: string;
  startAt: string;
  endAt: string;
}

export interface AvailabilityDTO {
  available: boolean;
  conflict?: BookingConflict;
}

export interface BookingsQuery {
  from: string; // YYYY-MM-DD (PKT, inclusive)
  to: string; // YYYY-MM-DD (PKT, inclusive)
  court?: string;
  includeCancelled?: boolean;
}

export interface BookingSummary {
  _id: string;
  bookingNumber: string;
  customerName: string;
  phone: string;
  courtName: string;
  courtColor?: string;
  sportType: SportType;
  startAt: string;
  endAt: string;
  totalAmount: number;
  remainingAmount: number;
  paymentStatus: PaymentStatus;
  status: BookingStatus;
}

// Dashboard

export interface DashboardKpis {
  collectedRevenue: number;
  bookedRevenue: number;
  totalExpenses: number;
  netProfit: number;
  outstanding: number;
  totalBookings: number;
  cancelledBookings: number;
  hoursBooked: number;
  discountsGiven: number;
  retainedAdvances: number;
}

export interface ExpenseSummary {
  _id: string;
  date: string;
  amount: number;
  categoryName: string;
  sportType: ExpenseSportType;
  notes?: string;
}

export interface DashboardStats {
  range: { from: string; to: string; bucket: 'day' | 'month' };
  kpis: DashboardKpis;
  previousKpis: DashboardKpis;
  revenueExpenseSeries: { bucket: string; revenue: number; expenses: number }[];
  revenueByCourt: { courtId: string; courtName: string; color: string; revenue: number; hours: number }[];
  revenueBySport: { sportType: SportType; revenue: number; bookings: number }[];
  expensesByCategory: { categoryId: string; name: string; amount: number }[];
  expensesBySport: { sportType: ExpenseSportType; amount: number }[];
  peakHours: { hour: number; hours: number }[];
  bookingsByWeekday: { weekday: number; count: number }[];
  utilization: { courtId: string; courtName: string; color: string; bookedHours: number; availableHours: number; percent: number }[];
  upcomingBookings: BookingSummary[];
  outstandingBookings: BookingSummary[];
  topCustomers: { customerId: string; name: string; phone: string; bookings: number; total: number }[];
  recentExpenses: ExpenseSummary[];
  earliestYear: number;
}

export type DashboardQuery =
  | { range: 'monthly'; month: string }
  | { range: 'yearly'; year: number }
  | { range: 'custom'; from: string; to: string };
