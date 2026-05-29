import { Schema, model, Document } from 'mongoose';

export type UserRole = 'Admin' | 'Sales' | 'Sanction' | 'Disbursement' | 'Collection' | 'Borrower';
export type EmploymentType = 'Salaried' | 'Self-Employed' | 'Unemployed';
export type ApplicationStatusType = 'Not_Started' | 'Details_Completed' | 'Slip_Uploaded' | 'Applied' | 'Rejected';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  pan?: string;
  dob?: Date;
  monthlySalary?: number;
  employmentMode?: EmploymentType;
  applicationStatus: ApplicationStatusType;
  salarySlipPath?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['Admin', 'Sales', 'Sanction', 'Disbursement', 'Collection', 'Borrower'],
      default: 'Borrower',
    },
    pan: {
      type: String,
      trim: true,
      uppercase: true,
    },
    dob: {
      type: Date,
    },
    monthlySalary: {
      type: Number,
    },
    employmentMode: {
      type: String,
      enum: ['Salaried', 'Self-Employed', 'Unemployed'],
    },
    applicationStatus: {
      type: String,
      enum: ['Not_Started', 'Details_Completed', 'Slip_Uploaded', 'Applied', 'Rejected'],
      default: 'Not_Started',
    },
    salarySlipPath: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Remove password from JSON representation
UserSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.password;
    return ret;
  },
});

export const User = model<IUser>('User', UserSchema);
