import { Response } from 'express';
import Loan from '../models/Loan';
import User from '../models/User';
import Payment from '../models/Payment';
import { AuthRequest } from '../middleware/auth';


// 📊 Dashboard Stats
export const getDashboardStats = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [
      totalLoans,
      applied,
      sanctioned,
      disbursed,
      closed,
      rejected,
      totalUsers,
      totalPayments,
    ] = await Promise.all([
      Loan.countDocuments(),
      Loan.countDocuments({ status: 'applied' }),
      Loan.countDocuments({ status: 'sanctioned' }),
      Loan.countDocuments({ status: 'disbursed' }),
      Loan.countDocuments({ status: 'closed' }),
      Loan.countDocuments({ status: 'rejected' }),
      User.countDocuments({ role: 'borrower' }),
      Payment.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]),
    ]);

    const portfolioValue = await Loan.aggregate([
      { $group: { _id: null, total: { $sum: '$loanAmount' } } },
    ]);

    res.json({
      success: true,
      data: {
        loans: {
          total: totalLoans,
          applied,
          sanctioned,
          disbursed,
          closed,
          rejected,
        },
        borrowers: totalUsers,
        portfolioValue: portfolioValue[0]?.total || 0,
        totalCollected: totalPayments[0]?.total || 0,
      },
    });
  } catch (error) {
    console.error('Dashboard Stats Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch stats' });
  }
};


// 📌 Recent Activity (FIXED + SAFE)
export const getRecentActivity = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const recentLoans = await Loan.find()
      .populate('borrower', 'name email') // ✅ important
      .sort({ updatedAt: -1 })
      .limit(10)
      .lean(); // ✅ better performance

    const recentPayments = await Payment.find()
      .populate('loan', 'fullName loanAmount')
      .populate('recordedBy', 'name')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    res.json({
      success: true,
      data: {
        recentLoans,
        recentPayments,
      },
    });
  } catch (error) {
    console.error('Dashboard Activity Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch activity' });
  }
};