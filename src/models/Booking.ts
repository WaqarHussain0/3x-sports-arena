import mongoose, { Schema, type InferSchemaType, type Model, type HydratedDocument } from 'mongoose';
import {
  BOOKING_STATUSES,
  CANCELLATION_ADVANCE_HANDLING,
  DISCOUNT_TYPES,
  PAYMENT_KINDS,
  PAYMENT_STATUSES,
  SPORT_TYPES,
} from '@/lib/constants';

const intValidator = { validator: Number.isInteger, message: 'Must be a whole number' };

const paymentSchema = new Schema(
  {
    amount: { type: Number, required: true, min: 1, validate: intValidator },
    kind: { type: String, enum: PAYMENT_KINDS, required: true },
    at: { type: Date, required: true },
    note: { type: String, trim: true, maxlength: 200 },
    recordedBy: { type: Schema.Types.ObjectId, ref: 'Admin', required: true },
  },
  { _id: true },
);

const bookingSchema = new Schema(
  {
    bookingNumber: { type: String, required: true, unique: true },
    customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    customerSnapshot: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      email: { type: String },
    },
    court: { type: Schema.Types.ObjectId, ref: 'Court', required: true },
    courtNameSnapshot: { type: String, required: true },
    sportType: { type: String, enum: SPORT_TYPES, required: true },
    startAt: { type: Date, required: true },
    endAt: { type: Date, required: true },
    durationMinutes: { type: Number, required: true, min: 15, max: 24 * 60 },
    pricePerHourSnapshot: { type: Number, required: true, min: 0 },
    grossAmount: { type: Number, required: true, min: 0, validate: intValidator },
    discount: {
      type: { type: String, enum: DISCOUNT_TYPES, default: 'none' },
      value: { type: Number, default: 0, min: 0 },
    },
    discountAmount: { type: Number, default: 0, min: 0, validate: intValidator },
    totalAmount: { type: Number, required: true, min: 0, validate: intValidator },
    payments: { type: [paymentSchema], default: [] },
    amountPaid: { type: Number, default: 0 },
    remainingAmount: { type: Number, default: 0 },
    status: { type: String, enum: BOOKING_STATUSES, default: 'pending' },
    paymentStatus: { type: String, enum: PAYMENT_STATUSES, default: 'unpaid' },
    cancellation: {
      type: new Schema(
        {
          at: { type: Date, required: true },
          reason: { type: String, trim: true, maxlength: 500 },
          advanceHandling: { type: String, enum: CANCELLATION_ADVANCE_HANDLING },
          by: { type: Schema.Types.ObjectId, ref: 'Admin', required: true },
        },
        { _id: false },
      ),
      required: false,
    },
    notes: { type: String, trim: true, maxlength: 500 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'Admin', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'Admin' },
  },
  // optimisticConcurrency guards payment/cancel races on the same booking.
  { timestamps: true, optimisticConcurrency: true },
);

bookingSchema.path('endAt').validate(function (this: { startAt: Date }, endAt: Date) {
  return !this.startAt || endAt > this.startAt;
}, 'End must be after start');

bookingSchema.index({ court: 1, startAt: 1, endAt: 1 });
bookingSchema.index({ startAt: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ 'payments.at': 1 });
bookingSchema.index({ customer: 1 });

export type IBooking = InferSchemaType<typeof bookingSchema>;
export type BookingDocument = HydratedDocument<IBooking>;

export const Booking: Model<IBooking> =
  (mongoose.models.Booking as Model<IBooking>) || mongoose.model<IBooking>('Booking', bookingSchema);
