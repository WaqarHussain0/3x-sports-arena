import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';

const customerSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, unique: true, match: /^03\d{9}$/ },
    email: { type: String, lowercase: true, trim: true },
    totalBookings: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    firstBookingAt: { type: Date },
    lastBookingAt: { type: Date },
  },
  { timestamps: true },
);

export type ICustomer = InferSchemaType<typeof customerSchema>;

export const Customer: Model<ICustomer> =
  (mongoose.models.Customer as Model<ICustomer>) || mongoose.model<ICustomer>('Customer', customerSchema);
