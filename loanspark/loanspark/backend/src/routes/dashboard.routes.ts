import { Router } from 'express';
import { getDashboardStats, getRecentActivity } from '../controllers/dashboard.controller';
import { protect, authorize } from '../middleware/auth';

const router = Router();

router.get('/stats', protect, authorize('admin', 'sales', 'sanction', 'disbursement', 'collection'), getDashboardStats);
router.get('/activity', protect, authorize('admin', 'sales', 'sanction', 'disbursement', 'collection'), getRecentActivity);

export default router;
