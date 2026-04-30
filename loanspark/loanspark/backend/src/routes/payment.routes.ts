import { Router } from 'express';
import { recordPayment, getLoanPayments } from '../controllers/payment.controller';
import { protect, authorize } from '../middleware/auth';

const router = Router();

router.post('/', protect, authorize('collection', 'admin'), recordPayment);
router.get('/loan/:loanId', protect, authorize('collection', 'admin', 'disbursement'), getLoanPayments);

export default router;
