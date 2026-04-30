export interface BREInput {
  dateOfBirth: Date;
  monthlySalary: number;
  pan: string;
  employmentMode: string;
}

export interface BREResult {
  ageCheck: boolean;
  salaryCheck: boolean;
  panCheck: boolean;
  employmentCheck: boolean;
  passed: boolean;
  errors: string[];
}

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

export function runBRE(input: BREInput): BREResult {
  const errors: string[] = [];

  // Age check: 23–50
  const age = Math.floor((Date.now() - new Date(input.dateOfBirth).getTime()) / (365.25 * 24 * 3600 * 1000));
  const ageCheck = age >= 23 && age <= 50;
  if (!ageCheck) errors.push(`Age must be between 23 and 50 (yours: ${age})`);

  // Salary check: >= 25,000
  const salaryCheck = input.monthlySalary >= 25000;
  if (!salaryCheck) errors.push(`Monthly salary must be ≥ ₹25,000 (yours: ₹${input.monthlySalary.toLocaleString()})`);

  // PAN check
  const panCheck = PAN_REGEX.test(input.pan.toUpperCase());
  if (!panCheck) errors.push('PAN must match format: ABCDE1234F');

  // Employment check
  const employmentCheck = input.employmentMode !== 'unemployed';
  if (!employmentCheck) errors.push('Unemployed applicants are not eligible');

  const passed = ageCheck && salaryCheck && panCheck && employmentCheck;

  return { ageCheck, salaryCheck, panCheck, employmentCheck, passed, errors };
}

export function calculateLoan(principal: number, tenure: number, rate = 12): {
  simpleInterest: number;
  totalRepayment: number;
} {
  const simpleInterest = Math.round((principal * rate * tenure) / (365 * 100));
  const totalRepayment = principal + simpleInterest;
  return { simpleInterest, totalRepayment };
}
