import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';
import { DEFAULT_COURT_COLOR } from '@/lib/constants';

const courtSchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    pricePerHour: {
      type: Number,
      required: true,
      min: 0,
      validate: { validator: Number.isInteger, message: 'Price must be a whole number' },
    },
    description: { type: String, trim: true, maxlength: 200 },
    color: { type: String, required: true, default: DEFAULT_COURT_COLOR },
    isArchived: { type: Boolean, default: false },
    /** Incremented inside booking transactions to force write conflicts on concurrent bookings (plan §5.3). */
    bookingLockVersion: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'Admin' },
  },
  { timestamps: true },
);

export type ICourt = InferSchemaType<typeof courtSchema>;

export const Court: Model<ICourt> =
  (mongoose.models.Court as Model<ICourt>) || mongoose.model<ICourt>('Court', courtSchema);
