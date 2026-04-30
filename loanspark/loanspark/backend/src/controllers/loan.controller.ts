import { Response } from 'express';
import Loan from '../models/Loan';
import Payment from '../models/Payment';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { runBRE, calculateLoan } from '../utils/bre';

// Borrower: Create loan application
export const applyLoan = async (req: AuthRequest, res: Response): Promise<void> => {
  const { fullName, pan, dateOfBirth, monthlySalary, employmentMode, loanAmount, tenure } = req.body;

  if (!fullName || !pan || !dateOfBirth || !monthlySalary || !employmentMode || !loanAmount || !tenure) {
    throw new AppError('All fields are required.', 400);
  }

  // Run BRE
  const breResult = runBRE({ dateOfBirth: new Date(dateOfBirth), monthlySalary: Number(monthlySalary), pan, employmentMode });
  if (!breResult.passed) throw new AppError(`BRE failed: ${breResult.errors.join(', ')}`, 400);

  const { simpleInterest, totalRepayment } = calculateLoan(Number(loanAmount), Number(tenure));

  const loan = await Loan.create({
    borrower: req.user!.id,
    fullName,
    pan: pan.toUpperCase(),
    dateOfBirth: new Date(dateOfBirth),
    monthlySalary: Number(monthlySalary),
    employmentMode,
    loanAmount: Number(loanAmount),
    tenure: Number(tenure),
    simpleInterest,
    totalRepayment,
    breChecks: { ageCheck: breResult.ageCheck, salaryCheck: breResult.salaryCheck, panCheck: breResult.panCheck, employmentCheck: breResult.employmentCheck, passed: breResult.passed },
  });

  res.status(201).json({ success: true, message: 'Loan application submitted successfully.', data: { loan } });
};

// Borrower: Get my loans
export const getMyLoans = async (req: AuthRequest, res: Response): Promise<void> => {
  const loans = await Loan.find({ borrower: req.user!.id }).sort({ createdAt: -1 });
  res.json({ success: true, data: { loans, count: loans.length } });
};

// Borrower: Get single loan + payments
export const getLoanById = async (req: AuthRequest, res: Response): Promise<void> => {
  const loan = await Loan.findById(req.params.id)
    .populate('borrower', 'name email')
    .populate('sanctionedBy', 'name')
    .populate('disbursedBy', 'name');

  if (!loan) throw new AppError('Loan not found.', 404);

  // Borrowers can only see their own
  if (req.user!.role === 'borrower' && loan.borrower._id.toString() !== req.user!.id) {
    throw new AppError('Access denied.', 403);
  }

  const payments = await Payment.find({ loan: loan._id }).sort({ paymentDate: -1 });
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

  res.json({ success: true, data: { loan, payments, totalPaid, outstanding: loan.totalRepayment - totalPaid } });
};

// Ops: Get all loans with filters
export const getAllLoans = async (req: AuthRequest, res: Response): Promise<void> => {
  const { status, page = 1, limit = 20, search } = req.query;
  const filter: any = {};

  if (status) filter.status = status;
  if (search) {
    filter.$or = [
      { fullName: { $regex: search, $options: 'i' } },
      { pan: { $regex: search, $options: 'i' } },
    ];
  }

  // Role-based: sanction sees only applied, disbursement sees only sanctioned, collection sees disbursed
  if (req.user!.role === 'sanction') filter.status = 'applied';
  if (req.user!.role === 'disbursement') filter.status = 'sanctioned';
  if (req.user!.role === 'collection') filter.status = { $in: ['disbursed'] };

  const skip = (Number(page) - 1) * Number(limit);
  const [loans, total] = await Promise.all([
    Loan.find(filter).populate('borrower', 'name email').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Loan.countDocuments(filter),
  ]);

  res.json({ success: true, data: { loans, total, page: Number(page), pages: Math.ceil(total / Number(limit)) } });
};

// Sanction: Approve
export const sanctionLoan = async (req: AuthRequest, res: Response): Promise<void> => {
  const loan = await Loan.findById(req.params.id);
  if (!loan) throw new AppError('Loan not found.', 404);
  if (loan.status !== 'applied') throw new AppError('Only applied loans can be sanctioned.', 400);

  loan.status = 'sanctioned';
  loan.sanctionedBy = req.user!.id as any;
  loan.sanctionedAt = new Date();
  loan.sanctionNote = req.body.note || '';
  await loan.save();

  res.json({ success: true, message: 'Loan sanctioned successfully.', data: { loan } });
};

// Sanction: Reject
export const rejectLoan = async (req: AuthRequest, res: Response): Promise<void> => {
  const { reason } = req.body;
  if (!reason) throw new AppError('Rejection reason is required.', 400);

  const loan = await Loan.findById(req.params.id);
  if (!loan) throw new AppError('Loan not found.', 404);
  if (loan.status !== 'applied') throw new AppError('Only applied loans can be rejected.', 400);

  loan.status = 'rejected';
  loan.rejectedBy = req.user!.id as any;
  loan.rejectedAt = new Date();
  loan.rejectionReason = reason;
  await loan.save();

  res.json({ success: true, message: 'Loan rejected.', data: { loan } });
};

// Disbursement: Disburse
export const disburseLoan = async (req: AuthRequest, res: Response): Promise<void> => {
  const loan = await Loan.findById(req.params.id);
  if (!loan) throw new AppError('Loan not found.', 404);
  if (loan.status !== 'sanctioned') throw new AppError('Only sanctioned loans can be disbursed.', 400);

  const utrNumber = `UTR${Date.now()}${Math.floor(Math.random() * 1000)}`;
  loan.status = 'disbursed';
  loan.disbursedBy = req.user!.id as any;
  loan.disbursedAt = new Date();
  loan.utrNumber = utrNumber;
  await loan.save();

  res.json({ success: true, message: 'Loan disbursed successfully.', data: { loan } });
};

// Upload salary slip
export const uploadSalarySlip = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.file) throw new AppError('No file uploaded.', 400);
  const loan = await Loan.findById(req.params.id);
  if (!loan) throw new AppError('Loan not found.', 404);
  if (loan.borrower.toString() !== req.user!.id) throw new AppError('Access denied.', 403);

  loan.salarySlipUrl = `/uploads/${req.file.filename}`;
  loan.salarySlipOriginalName = req.file.originalname;
  await loan.save();

  res.json({ success: true, message: 'Salary slip uploaded.', data: { url: loan.salarySlipUrl } });
};
