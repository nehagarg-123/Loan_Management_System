import { Router } from 'express';
import { getAllUsers, getUserById, createExecutive, toggleUserStatus, getSalesLeads } from '../controllers/user.controller';
import { protect, authorize } from '../middleware/auth';

const router = Router();

router.get('/leads', protect, authorize('sales', 'admin'), getSalesLeads);
router.get('/', protect, authorize('admin'), getAllUsers);
router.get('/:id', protect, authorize('admin'), getUserById);
router.post('/executive', protect, authorize('admin'), createExecutive);
router.patch('/:id/toggle', protect, authorize('admin'), toggleUserStatus);

export default router;
