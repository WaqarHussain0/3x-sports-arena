import { Types } from 'mongoose';
import { Court } from '@/models/Court';
import { Booking } from '@/models/Booking';
import { conflict, notFound } from '@/lib/api';
import { COURTS_PAGE_SIZE } from '@/lib/constants';
import { currentMonthPkt, lastDayOfMonth, pktDayRange } from '@/lib/time';
import { escapeRegex } from '@/lib/url';
import type { CourtInput } from '@/lib/validators';
import type { CourtDTO, CourtListResult } from '@/types';

async function aggregateCourts(
  match: Record<string, unknown>,
  paging?: { skip: number; limit: number },
): Promise<CourtDTO[]> {
  const month = currentMonthPkt();
  const { from, to } = pktDayRange(`${month}-01`, lastDayOfMonth(month));

  return Court.aggregate<CourtDTO>([
    { $match: match },
    // Sort/page before the per-court booking lookup so stats are only computed for the courts returned.
    { $sort: { name: 1 } },
    ...(paging ? [{ $skip: paging.skip }, { $limit: paging.limit }] : []),
    {
      $lookup: {
        from: Booking.collection.name,
        let: { courtId: '$_id' },
        pipeline: [
          { $match: { $expr: { $eq: ['$court', '$$courtId'] } } },
          {
            $group: {
              _id: null,
              bookingCount: { $sum: 1 },
              bookingsThisMonth: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        { $ne: ['$status', 'cancelled'] },
                        { $gte: ['$startAt', from] },
                        { $lt: ['$startAt', to] },
                      ],
                    },
                    1,
                    0,
                  ],
                },
              },
            },
          },
        ],
        as: 'stats',
      },
    },
    {
      $addFields: {
        bookingCount: { $ifNull: [{ $first: '$stats.bookingCount' }, 0] },
        bookingsThisMonth: { $ifNull: [{ $first: '$stats.bookingsThisMonth' }, 0] },
      },
    },
    { $project: { stats: 0, bookingLockVersion: 0, __v: 0 } },
  ]);
}

export async function listCourts(includeArchived: boolean): Promise<CourtDTO[]> {
  return aggregateCourts(includeArchived ? {} : { isArchived: false });
}

export interface CourtPageFilters {
  search?: string;
  includeArchived: boolean;
  page: number;
}

/** Plain, serializable DTO (safe to pass from a Server Component to a Client Component). */
function toCourtDTO(c: CourtDTO): CourtDTO {
  return {
    _id: String(c._id),
    name: c.name,
    pricePerHour: c.pricePerHour,
    description: c.description || undefined,
    color: c.color,
    isArchived: c.isArchived,
    bookingCount: c.bookingCount,
    bookingsThisMonth: c.bookingsThisMonth,
    createdAt: new Date(c.createdAt).toISOString(),
    updatedAt: new Date(c.updatedAt).toISOString(),
  };
}

/** One page of courts (name search, optional archived), for the server-rendered list page. */
export async function listCourtsPage(filters: CourtPageFilters): Promise<CourtListResult> {
  const page = Math.max(1, filters.page);
  const limit = COURTS_PAGE_SIZE;
  const term = filters.search?.trim();
  const match: Record<string, unknown> = {
    ...(filters.includeArchived ? {} : { isArchived: false }),
    ...(term ? { name: new RegExp(escapeRegex(term), 'i') } : {}),
  };

  const [items, total] = await Promise.all([
    aggregateCourts(match, { skip: (page - 1) * limit, limit }),
    Court.countDocuments(match),
  ]);
  return { items: items.map(toCourtDTO), page, limit, total };
}

export async function getCourt(id: string): Promise<CourtDTO> {
  const [court] = await aggregateCourts({ _id: new Types.ObjectId(id) });
  if (!court) throw notFound('Court');
  return court;
}

export async function createCourt(data: CourtInput, adminId: string): Promise<CourtDTO> {
  const court = await Court.create({ ...data, createdBy: adminId });
  return getCourt(court._id.toString());
}

/** Price changes never touch existing bookings — they keep `pricePerHourSnapshot` (plan §5.2). */
export async function updateCourt(id: string, data: Partial<CourtInput>): Promise<CourtDTO> {
  const court = await Court.findByIdAndUpdate(id, { $set: data }, { returnDocument: 'after', runValidators: true });
  if (!court) throw notFound('Court');
  return getCourt(id);
}

export async function toggleCourtArchive(id: string): Promise<CourtDTO> {
  const court = await Court.findById(id);
  if (!court) throw notFound('Court');
  court.isArchived = !court.isArchived;
  await court.save();
  return getCourt(id);
}

export async function deleteCourt(id: string): Promise<void> {
  const court = await Court.findById(id);
  if (!court) throw notFound('Court');
  if (await Booking.exists({ court: court._id })) {
    throw conflict('This court has bookings and cannot be deleted. Archive it instead.');
  }
  await court.deleteOne();
}
