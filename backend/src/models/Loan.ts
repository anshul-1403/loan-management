import { Schema, model, Document, Types } from 'mongoose';

export type LoanStatusType = 'APPLIED' | 'SANCTIONED' | 'DISBURSED' | 'CLOSED' | 'REJECTED';

export interface ILoan extends Document {
  borrower: Types.ObjectId;
  amount: number;
  tenure: number;
  interestRate: number; // 12%
  simpleInterest: number;
  totalRepayment: number;
  outstandingBalance: number;
  status: LoanStatusType;
  rejectionReason?: string;
  disbursedAt?: Date;
  closedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const LoanSchema = new Schema<ILoan>(
  {
    borrower: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 50000,
      max: 500000,
    },
    tenure: {
      type: Number,
      required: true,
      min: 30,
      max: 365,
    },
    interestRate: {
      type: Number,
      default: 12, // 12% p.a.
    },
    simpleInterest: {
      type: Number,
      required: true,
    },
    totalRepayment: {
      type: Number,
      required: true,
    },
    outstandingBalance: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['APPLIED', 'SANCTIONED', 'DISBURSED', 'CLOSED', 'REJECTED'],
      default: 'APPLIED',
    },
    rejectionReason: {
      type: String,
    },
    disbursedAt: {
      type: Date,
    },
    closedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export const Loan = model<ILoan>('Loan', LoanSchema);
