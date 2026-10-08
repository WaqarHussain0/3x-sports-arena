import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';

const adminSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
  },
  { timestamps: true },
);

export type IAdmin = InferSchemaType<typeof adminSchema>;

export const Admin: Model<IAdmin> =
  (mongoose.models.Admin as Model<IAdmin>) || mongoose.model<IAdmin>('Admin', adminSchema);
