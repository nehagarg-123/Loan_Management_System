import mongoose, { Document, Schema, Types } from 'mongoose';

export type LoanStatus = 'applied' | 'sanctioned' | 'rejected' | 'disbursed' | 'closed';
export type EmploymentMode = 'salaried' | 'self-employed' | 'unemployed';

export interface ILoan extends Document {
  borrower: Types.ObjectId;

  // Personal Details
  fullName: string;
  pan: string;
  dateOfBirth: Date;
  monthlySalary: number;
  employmentMode: EmploymentMode;

  // Loan Config
  loanAmount: number;
  tenure: number;
  interestRate: number;
  simpleInterest: number;
  totalRepayment: number;

  // Salary slip
  salarySlipUrl?: string;
  salarySlipOriginalName?: string;

  // Status
  status: LoanStatus;

  // Sanction
  sanctionedBy?: Types.ObjectId;
  sanctionedAt?: Date;
  sanctionNote?: string;

  // Rejection
  rejectedBy?: Types.ObjectId;
  rejectedAt?: Date;
  rejectionReason?: string;

  // Disbursement
  disbursedBy?: Types.ObjectId;
  disbursedAt?: Date;
  utrNumber?: string;

  // Close
  closedAt?: Date;

  // BRE result
  breChecks: {
    ageCheck: boolean;
    salaryCheck: boolean;
    panCheck: boolean;
    employmentCheck: boolean;
    passed: boolean;
  };

  createdAt: Date;
  updatedAt: Date;
}

const LoanSchema = new Schema<ILoan>(
  {
    borrower: { type: Schema.Types.ObjectId, ref: 'User', required: true },

    // Personal Details
    fullName: { type: String, required: true, trim: true },
    pan: { type: String, required: true, uppercase: true, trim: true },
    dateOfBirth: { type: Date, required: true },
    monthlySalary: { type: Number, required: true },
    employmentMode: {
      type: String,
      enum: ['salaried', 'self-employed', 'unemployed'],
      required: true,
    },

    // Loan Config
    loanAmount: { type: Number, required: true, min: 50000, max: 5000000 },
    tenure: { type: Number, required: true, min: 30, max: 365 },
    interestRate: { type: Number, default: 12 },
    simpleInterest: { type: Number, required: true },
    totalRepayment: { type: Number, required: true },

    // Salary Slip
    salarySlipUrl: { type: String },
    salarySlipOriginalName: { type: String },

    // Status
    status: {
      type: String,
      enum: ['applied', 'sanctioned', 'rejected', 'disbursed', 'closed'],
      default: 'applied',
    },

    // Sanction
    sanctionedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    sanctionedAt: { type: Date },
    sanctionNote: { type: String },

    // Rejection
    rejectedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    rejectedAt: { type: Date },
    rejectionReason: { type: String },

    // Disbursement
    disbursedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    disbursedAt: { type: Date },

    // ✅ FIXED (removed duplicate index issue)
    utrNumber: { type: String },

    // Close
    closedAt: { type: Date },

    // BRE Checks
    breChecks: {
      ageCheck: { type: Boolean, required: true },
      salaryCheck: { type: Boolean, required: true },
      panCheck: { type: Boolean, required: true },
      employmentCheck: { type: Boolean, required: true },
      passed: { type: Boolean, required: true },
    },
  },
  { timestamps: true }
);


// 🔥 Indexes (optimized + clean)
LoanSchema.index({ borrower: 1 });
LoanSchema.index({ status: 1 });
LoanSchema.index({ createdAt: -1 });
LoanSchema.index({ pan: 1 });

// ✅ Proper unique sparse index (no duplication warning)
LoanSchema.index({ utrNumber: 1 }, { unique: true, sparse: true });


// 🚀 Export model
export default mongoose.model<ILoan>('Loan', LoanSchema);