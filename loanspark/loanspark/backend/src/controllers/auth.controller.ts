import { Request, Response } from 'express';
import User from '../models/User';
import { generateToken } from '../utils/jwt';
import { AppError } from '../middleware/errorHandler';

export const register = async (req: Request, res: Response): Promise<void> => {
  const { name, email, password, phone } = req.body;
  if (!name || !email || !password) throw new AppError('Name, email and password are required.', 400);

  const existing = await User.findOne({ email });
  if (existing) throw new AppError('Email already registered.', 409);

  const user = await User.create({ name, email, password, phone, role: 'borrower' });
  const token = generateToken(user);

  res.status(201).json({ success: true, message: 'Account created successfully.', data: { user, token } });
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;
  if (!email || !password) throw new AppError('Email and password are required.', 400);

  const user = await User.findOne({ email }).select('+password');
  if (!user || !user.isActive) throw new AppError('Invalid credentials.', 401);

  const match = await user.comparePassword(password);
  if (!match) throw new AppError('Invalid credentials.', 401);

  const token = generateToken(user);
  const userData = user.toJSON();

  res.json({ success: true, message: 'Logged in successfully.', data: { user: userData, token } });
};

export const getMe = async (req: any, res: Response): Promise<void> => {
  const user = await User.findById(req.user.id);
  if (!user) throw new AppError('User not found.', 404);
  res.json({ success: true, data: { user } });
};

export const updateProfile = async (req: any, res: Response): Promise<void> => {
  const { name, phone } = req.body;
  const user = await User.findByIdAndUpdate(req.user.id, { name, phone }, { new: true, runValidators: true });
  res.json({ success: true, message: 'Profile updated.', data: { user } });
};

export const changePassword = async (req: any, res: Response): Promise<void> => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) throw new AppError('Both passwords are required.', 400);
  if (newPassword.length < 6) throw new AppError('New password must be at least 6 characters.', 400);

  const user = await User.findById(req.user.id).select('+password');
  if (!user) throw new AppError('User not found.', 404);

  const match = await user.comparePassword(currentPassword);
  if (!match) throw new AppError('Current password is incorrect.', 400);

  user.password = newPassword;
  await user.save();
  res.json({ success: true, message: 'Password changed successfully.' });
};
