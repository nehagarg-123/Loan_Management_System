import { Router } from 'express';
import {
  applyLoan, getMyLoans, getLoanById, getAllLoans,
  sanctionLoan, rejectLoan, disburseLoan, uploadSalarySlip,
} from '../controllers/loan.controller';
import { protect, authorize } from '../middleware/auth';
import { uploadMiddleware } from '../middleware/upload';

const router = Router();

// Borrower routes
router.post('/', protect, authorize('borrower'), applyLoan);
router.get('/my', protect, authorize('borrower'), getMyLoans);
router.post('/:id/salary-slip', protect, authorize('borrower'), uploadMiddleware.single('salarySlip'), uploadSalarySlip);

// Ops + Admin routes
router.get('/', protect, authorize('admin', 'sales', 'sanction', 'disbursement', 'collection'), getAllLoans);
router.get('/:id', protect, getLoanById);
router.patch('/:id/sanction', protect, authorize('sanction', 'admin'), sanctionLoan);
router.patch('/:id/reject', protect, authorize('sanction', 'admin'), rejectLoan);
router.patch('/:id/disburse', protect, authorize('disbursement', 'admin'), disburseLoan);

export default router;
