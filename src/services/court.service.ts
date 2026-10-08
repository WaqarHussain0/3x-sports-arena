import { Types } from 'mongoose';
import { Court } from '@/models/Court';
import { Booking } from '@/models/Booking';
import { conflict, notFound } from '@/lib/api';
import { currentMonthPkt, lastDayOfMonth, pktDayRange } from '@/lib/time';
import type { CourtInput } from '@/lib/validators';
import type { CourtDTO } from '@/types';

async function aggregateCourts(match: Record<string, unknown>): Promise<CourtDTO[]> {
  const month = currentMonthPkt();
  const { from, to } = pktDayRange(`${month}-01`, lastDayOfMonth(month));

  return Court.aggregate<CourtDTO>([
    { $match: match },
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
    { $sort: { name: 1 } },
  ]);
}

export async function listCourts(includeArchived: boolean): Promise<CourtDTO[]> {
  return aggregateCourts(includeArchived ? {} : { isArchived: false });
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
