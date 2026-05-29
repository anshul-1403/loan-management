export type UserRole = 'Admin' | 'Sales' | 'Sanction' | 'Disbursement' | 'Collection' | 'Borrower';
export type EmploymentType = 'Salaried' | 'Self-Employed' | 'Unemployed';
export type ApplicationStatusType = 'Not_Started' | 'Details_Completed' | 'Slip_Uploaded' | 'Applied' | 'Rejected';
export type LoanStatusType = 'APPLIED' | 'SANCTIONED' | 'DISBURSED' | 'CLOSED' | 'REJECTED';

export interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  role: UserRole;
  applicationStatus: ApplicationStatusType;
  pan?: string;
  dob?: string;
  monthlySalary?: number;
  employmentMode?: EmploymentType;
  salarySlipPath?: string;
}

export interface Loan {
  _id: string;
  borrower: string | User;
  amount: number;
  tenure: number;
  interestRate: number;
  simpleInterest: number;
  totalRepayment: number;
  outstandingBalance: number;
  status: LoanStatusType;
  rejectionReason?: string;
  disbursedAt?: string;
  closedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  _id: string;
  loan: string;
  utrNumber: string;
  amount: number;
  paymentDate: string;
  createdAt: string;
}
