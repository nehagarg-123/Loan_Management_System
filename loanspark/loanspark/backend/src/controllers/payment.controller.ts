import { Response } from 'express';
import Payment from '../models/Payment';
import Loan from '../models/Loan';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

export const recordPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  const { loanId, utrNumber, amount, paymentDate, notes } = req.body;
  if (!loanId || !utrNumber || !amount || !paymentDate) {
    throw new AppError('loanId, utrNumber, amount, and paymentDate are required.', 400);
  }

  const loan = await Loan.findById(loanId);
  if (!loan) throw new AppError('Loan not found.', 404);
  if (loan.status !== 'disbursed') throw new AppError('Payments can only be recorded for disbursed loans.', 400);

  // Check duplicate UTR globally
  const existingUTR = await Payment.findOne({ utrNumber });
  if (existingUTR) throw new AppError('UTR number already exists. Each payment must have a unique UTR.', 409);

  // Validate amount
  const existingPayments = await Payment.find({ loan: loanId });
  const totalPaid = existingPayments.reduce((sum, p) => sum + p.amount, 0);
  const outstanding = loan.totalRepayment - totalPaid;
  if (Number(amount) > outstanding) {
    throw new AppError(`Amount exceeds outstanding balance of ₹${outstanding.toLocaleString()}.`, 400);
  }

  const payment = await Payment.create({
    loan: loanId,
    borrower: loan.borrower,
    recordedBy: req.user!.id,
    utrNumber,
    amount: Number(amount),
    paymentDate: new Date(paymentDate),
    notes,
  });

  // Auto-close loan if fully repaid
  const newTotal = totalPaid + Number(amount);
  if (newTotal >= loan.totalRepayment) {
    loan.status = 'closed';
    loan.closedAt = new Date();
    await loan.save();
  }

  const remaining = Math.max(0, loan.totalRepayment - newTotal);
  res.status(201).json({
    success: true,
    message: remaining === 0 ? 'Payment recorded and loan closed!' : 'Payment recorded successfully.',
    data: { payment, totalPaid: newTotal, outstanding: remaining, loanClosed: remaining === 0 },
  });
};

export const getLoanPayments = async (req: AuthRequest, res: Response): Promise<void> => {
  const loan = await Loan.findById(req.params.loanId);
  if (!loan) throw new AppError('Loan not found.', 404);

  const payments = await Payment.find({ loan: req.params.loanId })
    .populate('recordedBy', 'name')
    .sort({ paymentDate: -1 });

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const outstanding = Math.max(0, loan.totalRepayment - totalPaid);

  res.json({ success: true, data: { payments, totalPaid, outstanding, totalRepayment: loan.totalRepayment } });
};
