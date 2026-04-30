import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IPayment extends Document {
  loan: Types.ObjectId;
  borrower: Types.ObjectId;
  recordedBy: Types.ObjectId;
  utrNumber: string;
  amount: number;
  paymentDate: Date;
  notes?: string;
  createdAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    loan: { type: Schema.Types.ObjectId, ref: 'Loan', required: true },
    borrower: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    recordedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    utrNumber: { type: String, required: true, unique: true, trim: true },
    amount: { type: Number, required: true, min: 1 },
    paymentDate: { type: Date, required: true },
    notes: { type: String },
  },
  { timestamps: true }
);

PaymentSchema.index({ loan: 1 });
PaymentSchema.index({ borrower: 1 });
PaymentSchema.index({ utrNumber: 1 }, { unique: true });

export default mongoose.model<IPayment>('Payment', PaymentSchema);
