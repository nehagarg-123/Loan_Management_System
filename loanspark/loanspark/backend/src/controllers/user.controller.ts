import { Request, Response } from 'express';
import User from '../models/User';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

export const getAllUsers = async (_req: Request, res: Response): Promise<void> => {
  const users = await User.find().sort({ createdAt: -1 });
  res.json({ success: true, data: { users, count: users.length } });
};

export const getUserById = async (req: Request, res: Response): Promise<void> => {
  const user = await User.findById(req.params.id);
  if (!user) throw new AppError('User not found.', 404);
  res.json({ success: true, data: { user } });
};

export const createExecutive = async (req: Request, res: Response): Promise<void> => {
  const { name, email, password, role, phone } = req.body;
  const validRoles = ['sales', 'sanction', 'disbursement', 'collection', 'admin'];
  if (!validRoles.includes(role)) throw new AppError('Invalid executive role.', 400);

  const user = await User.create({ name, email, password, role, phone });
  res.status(201).json({ success: true, message: 'Executive created.', data: { user } });
};

export const toggleUserStatus = async (req: Request, res: Response): Promise<void> => {
  const user = await User.findById(req.params.id);
  if (!user) throw new AppError('User not found.', 404);
  user.isActive = !user.isActive;
  await user.save();
  res.json({ success: true, message: `User ${user.isActive ? 'activated' : 'deactivated'}.`, data: { user } });
};

export const getSalesLeads = async (_req: AuthRequest, res: Response): Promise<void> => {
  // Sales sees borrowers who registered but haven't applied yet, or all borrowers
  const borrowers = await User.find({ role: 'borrower' }).sort({ createdAt: -1 });
  res.json({ success: true, data: { leads: borrowers, count: borrowers.length } });
};
