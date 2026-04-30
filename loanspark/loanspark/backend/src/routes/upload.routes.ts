import { Router, Response } from 'express';
import { protect, authorize, AuthRequest } from '../middleware/auth';
import { uploadMiddleware } from '../middleware/upload';

const router = Router();

router.post('/salary-slip', protect, authorize('borrower'), uploadMiddleware.single('file'), (req: AuthRequest, res: Response) => {
  if (!req.file) { res.status(400).json({ success: false, message: 'No file uploaded.' }); return; }
  res.json({ success: true, message: 'File uploaded.', data: { filename: req.file.filename, url: `/uploads/${req.file.filename}`, originalName: req.file.originalname, size: req.file.size } });
});

export default router;
