export type UserRole = 'borrower' | 'admin' | 'sales' | 'sanction' | 'disbursement' | 'collection';
export type LoanStatus = 'applied' | 'sanctioned' | 'rejected' | 'disbursed' | 'closed';
export type EmploymentMode = 'salaried' | 'self-employed' | 'unemployed';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  isActive: boolean;
  createdAt: string;
}

export interface BREChecks {
  ageCheck: boolean;
  salaryCheck: boolean;
  panCheck: boolean;
  employmentCheck: boolean;
  passed: boolean;
}

export interface Loan {
  _id: string;
  borrower: {
  _id: string;
  name: string;
  email: string;
} | null;
  fullName: string;
  pan: string;
  dateOfBirth: string;
  monthlySalary: number;
  employmentMode: EmploymentMode;
  loanAmount: number;
  tenure: number;
  interestRate: number;
  simpleInterest: number;
  totalRepayment: number;
  salarySlipUrl?: string;
  salarySlipOriginalName?: string;
  status: LoanStatus;
  sanctionedBy?: User;
  sanctionedAt?: string;
  sanctionNote?: string;
  rejectedBy?: User;
  rejectedAt?: string;
  rejectionReason?: string;
  disbursedBy?: User;
  disbursedAt?: string;
  utrNumber?: string;
  closedAt?: string;
  breChecks: BREChecks;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  _id: string;
  loan: string | Loan;
  borrower: string | User;
  recordedBy: string | User;
  utrNumber: string;
  amount: number;
  paymentDate: string;
  notes?: string;
  createdAt: string;
}

export interface DashboardStats {
  loans: {
    total: number;
    applied: number;
    sanctioned: number;
    disbursed: number;
    closed: number;
    rejected: number;
  };
  borrowers: number;
  portfolioValue: number;
  totalCollected: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pages: number;
}
