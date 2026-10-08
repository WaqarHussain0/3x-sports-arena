import { HOUR_HEIGHT_PX, TIME_STEP_MINUTES } from '@/lib/constants';
import { addDaysStr, pktToUtc } from '@/lib/time';
import type { BookingDTO } from '@/types';

export const PX_PER_MINUTE = HOUR_HEIGHT_PX / 60;
export const STEP_HEIGHT_PX = TIME_STEP_MINUTES * PX_PER_MINUTE;
export const DAY_HEIGHT_PX = 24 * HOUR_HEIGHT_PX;
const MS_PER_MINUTE = 60_000;

export interface BookingSegment {
  booking: BookingDTO;
  /** Minutes from PKT midnight of this day. */
  startMinute: number;
  durationMinutes: number;
  top: number;
  height: number;
  /** True when this piece is the continuation of a booking that started the day before. */
  continuesFromPrevDay: boolean;
  continuesToNextDay: boolean;
}

/**
 * Clips a booking to one PKT day. A midnight-crossing booking yields one segment on each day
 * it touches, all pointing to the same booking (plan §5.4).
 */
export function segmentForDay(booking: BookingDTO, dateStr: string): BookingSegment | null {
  const dayStart = pktToUtc(dateStr).getTime();
  const dayEnd = pktToUtc(addDaysStr(dateStr, 1)).getTime();
  const start = new Date(booking.startAt).getTime();
  const end = new Date(booking.endAt).getTime();

  const segStart = Math.max(start, dayStart);
  const segEnd = Math.min(end, dayEnd);
  if (segEnd <= segStart) return null;

  const startMinute = (segStart - dayStart) / MS_PER_MINUTE;
  const durationMinutes = (segEnd - segStart) / MS_PER_MINUTE;
  return {
    booking,
    startMinute,
    durationMinutes,
    top: startMinute * PX_PER_MINUTE,
    // Keep 15-minute pieces clickable (plan §14).
    height: Math.max(durationMinutes * PX_PER_MINUTE, STEP_HEIGHT_PX),
    continuesFromPrevDay: start < dayStart,
    continuesToNextDay: end > dayEnd,
  };
}

/** Snaps a y-offset inside a day column to a 15-minute step, as minutes from midnight. */
export function minuteFromOffset(offsetY: number): number {
  const minutes = Math.floor(offsetY / STEP_HEIGHT_PX) * TIME_STEP_MINUTES;
  return Math.min(Math.max(minutes, 0), 24 * 60 - TIME_STEP_MINUTES);
}
