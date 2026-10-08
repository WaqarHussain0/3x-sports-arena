import { Booking } from '@/models/Booking';
import { Court } from '@/models/Court';
import { Customer } from '@/models/Customer';
import { Expense } from '@/models/Expense';
import { ExpenseCategory } from '@/models/ExpenseCategory';
import { EXPENSE_SPORT_TYPES, SPORT_TYPES, TIMEZONE, type ExpenseSportType, type SportType } from '@/lib/constants';
import {
  eachDateStr,
  eachMonthStr,
  minutesSincePktMidnight,
  resolveDashboardRange,
  todayPkt,
  toPktDateString,
  type DateRangeQuery,
  type ResolvedRange,
} from '@/lib/time';
import type { BookingSummary, DashboardKpis, DashboardStats, ExpenseSummary } from '@/types';

const ACTIVE = { status: { $ne: 'cancelled' as const } };
const TOP_CATEGORIES = 8;
const MS_PER_MINUTE = 60_000;

const round1 = (n: number) => Math.round(n * 10) / 10;

// ---------- KPIs ----------

async function computeKpis(range: ResolvedRange): Promise<DashboardKpis> {
  const { from, to } = range;

  const [bookingAgg, collectedAgg, retainedAgg, expenseAgg] = await Promise.all([
    Booking.aggregate<{
      bookedRevenue: number;
      outstanding: number;
      discountsGiven: number;
      totalBookings: number;
      cancelledBookings: number;
      minutesBooked: number;
    }>([
      { $match: { startAt: { $gte: from, $lt: to } } },
      {
        $group: {
          _id: null,
          bookedRevenue: { $sum: { $cond: [{ $ne: ['$status', 'cancelled'] }, '$totalAmount', 0] } },
          outstanding: { $sum: { $cond: [{ $ne: ['$status', 'cancelled'] }, '$remainingAmount', 0] } },
          discountsGiven: { $sum: { $cond: [{ $ne: ['$status', 'cancelled'] }, '$discountAmount', 0] } },
          totalBookings: { $sum: { $cond: [{ $ne: ['$status', 'cancelled'] }, 1, 0] } },
          cancelledBookings: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
          minutesBooked: { $sum: { $cond: [{ $ne: ['$status', 'cancelled'] }, '$durationMinutes', 0] } },
        },
      },
    ]),
    // Cash actually received in range, across all bookings (including cancelled with retained advances).
    Booking.aggregate<{ total: number }>([
      { $match: { payments: { $elemMatch: { at: { $gte: from, $lt: to } } } } },
      { $unwind: '$payments' },
      { $match: { 'payments.at': { $gte: from, $lt: to } } },
      {
        $group: {
          _id: null,
          total: {
            $sum: {
              $cond: [{ $eq: ['$payments.kind', 'refund'] }, { $multiply: ['$payments.amount', -1] }, '$payments.amount'],
            },
          },
        },
      },
    ]),
    Booking.aggregate<{ total: number }>([
      {
        $match: {
          status: 'cancelled',
          'cancellation.advanceHandling': 'retained',
          'cancellation.at': { $gte: from, $lt: to },
        },
      },
      { $group: { _id: null, total: { $sum: '$amountPaid' } } },
    ]),
    Expense.aggregate<{ total: number }>([
      { $match: { date: { $gte: from, $lt: to } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
  ]);

  const b = bookingAgg[0];
  const collectedRevenue = collectedAgg[0]?.total ?? 0;
  const totalExpenses = expenseAgg[0]?.total ?? 0;

  return {
    collectedRevenue,
    bookedRevenue: b?.bookedRevenue ?? 0,
    totalExpenses,
    netProfit: collectedRevenue - totalExpenses,
    outstanding: b?.outstanding ?? 0,
    totalBookings: b?.totalBookings ?? 0,
    cancelledBookings: b?.cancelledBookings ?? 0,
    hoursBooked: round1((b?.minutesBooked ?? 0) / 60),
    discountsGiven: b?.discountsGiven ?? 0,
    retainedAdvances: retainedAgg[0]?.total ?? 0,
  };
}

// ---------- series ----------

async function revenueExpenseSeries(range: ResolvedRange) {
  const { from, to } = range;
  const fmt = range.bucket === 'day' ? '%Y-%m-%d' : '%Y-%m';

  const [revenue, expenses] = await Promise.all([
    Booking.aggregate<{ _id: string; total: number }>([
      { $match: { payments: { $elemMatch: { at: { $gte: from, $lt: to } } } } },
      { $unwind: '$payments' },
      { $match: { 'payments.at': { $gte: from, $lt: to } } },
      {
        $group: {
          _id: { $dateToString: { date: '$payments.at', format: fmt, timezone: TIMEZONE } },
          total: {
            $sum: {
              $cond: [{ $eq: ['$payments.kind', 'refund'] }, { $multiply: ['$payments.amount', -1] }, '$payments.amount'],
            },
          },
        },
      },
    ]),
    Expense.aggregate<{ _id: string; total: number }>([
      { $match: { date: { $gte: from, $lt: to } } },
      {
        $group: {
          _id: { $dateToString: { date: '$date', format: fmt, timezone: TIMEZONE } },
          total: { $sum: '$amount' },
        },
      },
    ]),
  ]);

  const revenueMap = new Map(revenue.map((r) => [r._id, r.total]));
  const expenseMap = new Map(expenses.map((e) => [e._id, e.total]));
  const buckets =
    range.bucket === 'day' ? eachDateStr(range.fromStr, range.toStr) : eachMonthStr(range.fromStr, range.toStr);

  // Zero-filled so charts get a continuous axis.
  return buckets.map((bucket) => ({
    bucket,
    revenue: revenueMap.get(bucket) ?? 0,
    expenses: expenseMap.get(bucket) ?? 0,
  }));
}

// ---------- breakdowns ----------

async function bookingBreakdowns(range: ResolvedRange) {
  const match = { ...ACTIVE, startAt: { $gte: range.from, $lt: range.to } };

  const [byCourt, bySport, byWeekday] = await Promise.all([
    Booking.aggregate<{ _id: string; revenue: number; minutes: number; name: string }>([
      { $match: match },
      {
        $group: {
          _id: '$court',
          revenue: { $sum: '$totalAmount' },
          minutes: { $sum: '$durationMinutes' },
          name: { $last: '$courtNameSnapshot' },
        },
      },
    ]),
    Booking.aggregate<{ _id: SportType; revenue: number; bookings: number }>([
      { $match: match },
      { $group: { _id: '$sportType', revenue: { $sum: '$totalAmount' }, bookings: { $sum: 1 } } },
    ]),
    Booking.aggregate<{ _id: number; count: number }>([
      { $match: match },
      // ISO day of week: 1 = Monday … 7 = Sunday.
      { $group: { _id: { $isoDayOfWeek: { date: '$startAt', timezone: TIMEZONE } }, count: { $sum: 1 } } },
    ]),
  ]);

  const weekdayMap = new Map(byWeekday.map((w) => [w._id, w.count]));
  const sportMap = new Map(bySport.map((s) => [s._id, s]));

  return {
    byCourt,
    revenueBySport: SPORT_TYPES.map((sportType) => ({
      sportType,
      revenue: sportMap.get(sportType)?.revenue ?? 0,
      bookings: sportMap.get(sportType)?.bookings ?? 0,
    })),
    bookingsByWeekday: Array.from({ length: 7 }, (_, i) => ({ weekday: i, count: weekdayMap.get(i + 1) ?? 0 })),
  };
}

/**
 * Peak hours and utilization from bookings overlapping the range, clipped to it.
 * Midnight-crossing bookings are split across every PKT hour they cover.
 */
async function hourlyUsage(range: ResolvedRange) {
  const bookings = await Booking.find({ ...ACTIVE, startAt: { $lt: range.to }, endAt: { $gt: range.from } })
    .select('court startAt endAt')
    .lean();

  const minutesByHour = new Array<number>(24).fill(0);
  const minutesByCourt = new Map<string, number>();

  for (const booking of bookings) {
    const start = Math.max(booking.startAt.getTime(), range.from.getTime());
    const end = Math.min(booking.endAt.getTime(), range.to.getTime());
    if (end <= start) continue;

    const courtId = booking.court.toString();
    minutesByCourt.set(courtId, (minutesByCourt.get(courtId) ?? 0) + (end - start) / MS_PER_MINUTE);

    let cursor = start;
    while (cursor < end) {
      const minuteOfDay = minutesSincePktMidnight(new Date(cursor));
      const hour = Math.floor(minuteOfDay / 60);
      const minutesLeftInHour = 60 - (minuteOfDay % 60);
      const segmentEnd = Math.min(end, cursor + minutesLeftInHour * MS_PER_MINUTE);
      minutesByHour[hour] += (segmentEnd - cursor) / MS_PER_MINUTE;
      cursor = segmentEnd;
    }
  }

  return {
    peakHours: minutesByHour.map((minutes, hour) => ({ hour, hours: round1(minutes / 60) })),
    minutesByCourt,
  };
}

async function expenseBreakdowns(range: ResolvedRange) {
  const match = { date: { $gte: range.from, $lt: range.to } };

  const [byCategory, bySport, recent] = await Promise.all([
    Expense.aggregate<{ _id: string; amount: number; name: string }>([
      { $match: match },
      { $group: { _id: '$category', amount: { $sum: '$amount' } } },
      { $sort: { amount: -1 } },
      {
        $lookup: {
          from: ExpenseCategory.collection.name,
          localField: '_id',
          foreignField: '_id',
          pipeline: [{ $project: { name: 1 } }],
          as: 'category',
        },
      },
      { $addFields: { name: { $ifNull: [{ $first: '$category.name' }, 'Unknown'] } } },
      { $project: { category: 0 } },
    ]),
    Expense.aggregate<{ _id: ExpenseSportType; amount: number }>([
      { $match: match },
      { $group: { _id: '$sportType', amount: { $sum: '$amount' } } },
    ]),
    Expense.find(match)
      .sort({ date: -1, createdAt: -1 })
      .limit(5)
      .populate<{ category: { name: string } | null }>('category', 'name')
      .lean(),
  ]);

  const top = byCategory.slice(0, TOP_CATEGORIES).map((c) => ({
    categoryId: String(c._id),
    name: c.name,
    amount: c.amount,
  }));
  const otherAmount = byCategory.slice(TOP_CATEGORIES).reduce((sum, c) => sum + c.amount, 0);
  if (otherAmount > 0) top.push({ categoryId: 'other', name: 'Other', amount: otherAmount });

  const sportMap = new Map(bySport.map((s) => [s._id, s.amount]));

  const recentExpenses: ExpenseSummary[] = recent.map((e) => ({
    _id: e._id.toString(),
    date: e.date.toISOString(),
    amount: e.amount,
    categoryName: e.category?.name ?? 'Unknown',
    sportType: e.sportType,
    notes: e.notes ?? undefined,
  }));

  return {
    expensesByCategory: top,
    expensesBySport: EXPENSE_SPORT_TYPES.map((sportType) => ({ sportType, amount: sportMap.get(sportType) ?? 0 })),
    recentExpenses,
  };
}

// ---------- tables ----------

interface SummarySource {
  _id: { toString(): string };
  bookingNumber: string;
  customerSnapshot: { name: string; phone: string };
  court: { toString(): string };
  courtNameSnapshot: string;
  sportType: SportType;
  startAt: Date;
  endAt: Date;
  totalAmount: number;
  remainingAmount: number;
  paymentStatus: BookingSummary['paymentStatus'];
  status: BookingSummary['status'];
}

const SUMMARY_FIELDS =
  'bookingNumber customerSnapshot court courtNameSnapshot sportType startAt endAt totalAmount remainingAmount paymentStatus status';

function toSummary(b: SummarySource, colors: Map<string, string>): BookingSummary {
  return {
    _id: b._id.toString(),
    bookingNumber: b.bookingNumber,
    customerName: b.customerSnapshot.name,
    phone: b.customerSnapshot.phone,
    courtName: b.courtNameSnapshot,
    courtColor: colors.get(b.court.toString()),
    sportType: b.sportType,
    startAt: b.startAt.toISOString(),
    endAt: b.endAt.toISOString(),
    totalAmount: b.totalAmount,
    remainingAmount: b.remainingAmount,
    paymentStatus: b.paymentStatus,
    status: b.status,
  };
}

async function bookingTables(range: ResolvedRange, colors: Map<string, string>) {
  const [upcoming, outstanding, top] = await Promise.all([
    // Next 7 bookings from now, regardless of filter.
    Booking.find({ ...ACTIVE, startAt: { $gte: new Date() } })
      .sort({ startAt: 1 })
      .limit(7)
      .select(SUMMARY_FIELDS)
      .lean<SummarySource[]>(),
    Booking.find({ ...ACTIVE, startAt: { $gte: range.from, $lt: range.to }, remainingAmount: { $gt: 0 } })
      .sort({ startAt: 1 })
      .limit(20)
      .select(SUMMARY_FIELDS)
      .lean<SummarySource[]>(),
    Booking.aggregate<{ _id: string; bookings: number; total: number; name: string; phone: string }>([
      { $match: { ...ACTIVE, startAt: { $gte: range.from, $lt: range.to } } },
      { $group: { _id: '$customer', bookings: { $sum: 1 }, total: { $sum: '$totalAmount' } } },
      { $sort: { total: -1, bookings: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: Customer.collection.name,
          localField: '_id',
          foreignField: '_id',
          pipeline: [{ $project: { name: 1, phone: 1 } }],
          as: 'customer',
        },
      },
      {
        $addFields: {
          name: { $ifNull: [{ $first: '$customer.name' }, 'Unknown'] },
          phone: { $ifNull: [{ $first: '$customer.phone' }, ''] },
        },
      },
      { $project: { customer: 0 } },
    ]),
  ]);

  return {
    upcomingBookings: upcoming.map((b) => toSummary(b, colors)),
    outstandingBookings: outstanding.map((b) => toSummary(b, colors)),
    topCustomers: top.map((c) => ({
      customerId: String(c._id),
      name: c.name,
      phone: c.phone,
      bookings: c.bookings,
      total: c.total,
    })),
  };
}

async function earliestDataYear(): Promise<number> {
  const [firstBooking, firstExpense] = await Promise.all([
    Booking.findOne().sort({ startAt: 1 }).select('startAt').lean(),
    Expense.findOne().sort({ date: 1 }).select('date').lean(),
  ]);
  const years = [
    Number(todayPkt().slice(0, 4)),
    firstBooking ? Number(toPktDateString(firstBooking.startAt).slice(0, 4)) : Infinity,
    firstExpense ? Number(toPktDateString(firstExpense.date).slice(0, 4)) : Infinity,
  ];
  return Math.min(...years);
}

// ---------- entry point ----------

export async function getDashboardStats(query: DateRangeQuery): Promise<DashboardStats> {
  const { current, previous } = resolveDashboardRange(query);
  const courts = await Court.find().select('name color isArchived').sort({ name: 1 }).lean();
  const colors = new Map(courts.map((c) => [c._id.toString(), c.color]));

  const [kpis, previousKpis, series, bookingStats, usage, expenseStats, tables, earliestYear] = await Promise.all([
    computeKpis(current),
    computeKpis(previous),
    revenueExpenseSeries(current),
    bookingBreakdowns(current),
    hourlyUsage(current),
    expenseBreakdowns(current),
    bookingTables(current, colors),
    earliestDataYear(),
  ]);

  // Active courts always appear (zero-filled); archived courts only if they have data in range.
  const courtStats = new Map(bookingStats.byCourt.map((c) => [String(c._id), c]));
  const visibleCourts = courts.filter(
    (c) => !c.isArchived || courtStats.has(c._id.toString()) || usage.minutesByCourt.has(c._id.toString()),
  );

  const availableHours = 24 * current.days;

  return {
    range: { from: current.fromStr, to: current.toStr, bucket: current.bucket },
    kpis,
    previousKpis,
    revenueExpenseSeries: series,
    revenueByCourt: visibleCourts.map((c) => {
      const stat = courtStats.get(c._id.toString());
      return {
        courtId: c._id.toString(),
        courtName: c.name,
        color: c.color,
        revenue: stat?.revenue ?? 0,
        hours: round1((stat?.minutes ?? 0) / 60),
      };
    }),
    revenueBySport: bookingStats.revenueBySport,
    expensesByCategory: expenseStats.expensesByCategory,
    expensesBySport: expenseStats.expensesBySport,
    peakHours: usage.peakHours,
    bookingsByWeekday: bookingStats.bookingsByWeekday,
    utilization: visibleCourts.map((c) => {
      const bookedHours = round1((usage.minutesByCourt.get(c._id.toString()) ?? 0) / 60);
      return {
        courtId: c._id.toString(),
        courtName: c.name,
        color: c.color,
        bookedHours,
        availableHours,
        percent: availableHours > 0 ? round1((bookedHours / availableHours) * 100) : 0,
      };
    }),
    ...tables,
    recentExpenses: expenseStats.recentExpenses,
    earliestYear,
  };
}
