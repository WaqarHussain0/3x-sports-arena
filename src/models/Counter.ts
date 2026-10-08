import mongoose, { Schema, type Model } from 'mongoose';

export interface ICounter {
  _id: string; // e.g. 'booking'
  seq: number;
}

const counterSchema = new Schema<ICounter>(
  {
    _id: { type: String, required: true },
    seq: { type: Number, default: 0 },
  },
  { timestamps: true, versionKey: false },
);

export const Counter: Model<ICounter> =
  (mongoose.models.Counter as Model<ICounter>) || mongoose.model<ICounter>('Counter', counterSchema);
