import Cookies from 'js-cookie';
import { User } from '@/types';

export const getToken = (): string | undefined => Cookies.get('token');

export const getUser = (): User | null => {
  try {
    const u = Cookies.get('user');
    return u ? JSON.parse(u) : null;
  } catch { return null; }
};

export const setAuth = (token: string, user: User) => {
  Cookies.set('token', token, { expires: 7, sameSite: 'lax' });
  Cookies.set('user', JSON.stringify(user), { expires: 7, sameSite: 'lax' });
};

export const clearAuth = () => {
  Cookies.remove('token');
  Cookies.remove('user');
};

export const isAuthenticated = (): boolean => !!getToken();

export const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

export const formatDate = (date: string): string =>
  new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

export const calcLoan = (principal: number, tenure: number, rate = 12) => {
  const si = Math.round((principal * rate * tenure) / (365 * 100));
  return { simpleInterest: si, totalRepayment: principal + si };
};

export const statusColor: Record<string, string> = {
  applied:    'bg-blue-100 text-blue-800',
  sanctioned: 'bg-green-100 text-green-800',
  disbursed:  'bg-yellow-100 text-yellow-800',
  closed:     'bg-gray-100 text-gray-600',
  rejected:   'bg-red-100 text-red-800',
};

export const roleHomeMap: Record<string, string> = {
  borrower:     '/borrower/apply',
  admin:        '/dashboard/overview',
  sales:        '/dashboard/sales',
  sanction:     '/dashboard/sanction',
  disbursement: '/dashboard/disbursement',
  collection:   '/dashboard/collection',
};
