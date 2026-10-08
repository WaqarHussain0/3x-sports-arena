import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';
import { EXPENSE_SPORT_TYPES } from '@/lib/constants';

const expenseSchema = new Schema(
  {
    category: { type: Schema.Types.ObjectId, ref: 'ExpenseCategory', required: true },
    /** Copied from the category at save time for fast stats. */
    sportType: { type: String, enum: EXPENSE_SPORT_TYPES, required: true },
    /** PKT midnight of the expense day, stored as UTC. */
    date: { type: Date, required: true },
    amount: {
      type: Number,
      required: true,
      min: 1,
      validate: { validator: Number.isInteger, message: 'Amount must be a whole number' },
    },
    notes: { type: String, trim: true, maxlength: 500 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'Admin', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'Admin' },
  },
  { timestamps: true },
);

expenseSchema.index({ date: -1 });
expenseSchema.index({ category: 1, date: -1 });
expenseSchema.index({ sportType: 1, date: -1 });

export type IExpense = InferSchemaType<typeof expenseSchema>;

export const Expense: Model<IExpense> =
  (mongoose.models.Expense as Model<IExpense>) || mongoose.model<IExpense>('Expense', expenseSchema);
