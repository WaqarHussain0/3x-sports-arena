import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';
import { EXPENSE_SPORT_TYPES } from '@/lib/constants';

const expenseCategorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 50 },
    nameLower: { type: String, unique: true },
    description: { type: String, trim: true, maxlength: 200 },
    sportType: { type: String, enum: EXPENSE_SPORT_TYPES, required: true, default: 'general' },
    isArchived: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: 'Admin' },
  },
  { timestamps: true },
);

expenseCategorySchema.pre('validate', function () {
  if (this.name) this.nameLower = this.name.trim().toLowerCase();
});

export type IExpenseCategory = InferSchemaType<typeof expenseCategorySchema>;

export const ExpenseCategory: Model<IExpenseCategory> =
  (mongoose.models.ExpenseCategory as Model<IExpenseCategory>) ||
  mongoose.model<IExpenseCategory>('ExpenseCategory', expenseCategorySchema);
