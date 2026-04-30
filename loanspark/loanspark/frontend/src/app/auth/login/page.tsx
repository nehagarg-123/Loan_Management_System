'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { setAuth, roleHomeMap } from '@/lib/auth';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Min 6 characters'),
});
type FormData = z.infer<typeof schema>;

const DEMO_CREDS = [
  { role: 'Borrower',     email: 'borrower@loanspark.com',  password: 'Borro@123' },
  { role: 'Admin',        email: 'admin@loanspark.com',     password: 'Admin@123' },
  { role: 'Sales',        email: 'sales@loanspark.com',     password: 'Sales@123' },
  { role: 'Sanction',     email: 'sanction@loanspark.com',  password: 'Sanct@123' },
  { role: 'Disbursement', email: 'disburse@loanspark.com',  password: 'Disbu@123' },
  { role: 'Collection',   email: 'collect@loanspark.com',   password: 'Colle@123' },
];

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', data);
      const { user, token } = res.data.data;
      setAuth(token, user);
      toast.success(`Welcome back, ${user.name}!`);
      router.replace(roleHomeMap[user.role] || '/auth/login');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-2xl">⚡</div>
          <span className="text-white font-bold text-2xl">LoanSpark</span>
        </div>
        <div>
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Modern Lending,<br />Simplified.
          </h1>
          <p className="text-blue-200 text-lg leading-relaxed">
            Apply for loans in minutes. Track applications in real-time.
            Full operations dashboard for your team.
          </p>
          <div className="mt-10 grid grid-cols-2 gap-4">
            {[['₹50K–₹50L', 'Loan Range'], ['12% p.a.', 'Fixed Rate'], ['30–365d', 'Flexible Tenure'], ['5 Roles', 'RBAC System']].map(([v, l]) => (
              <div key={l} className="bg-white/10 rounded-xl p-4">
                <div className="text-white font-bold text-xl">{v}</div>
                <div className="text-blue-200 text-sm mt-1">{l}</div>
              </div>
            ))}
          </div>
        </div>
        <p className="text-blue-300 text-sm">© 2026 LoanSpark. All rights reserved.</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="lg:hidden flex items-center justify-center gap-2 mb-6">
              <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-xl">⚡</div>
              <span className="font-bold text-2xl text-gray-900">LoanSpark</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Sign in</h2>
            <p className="text-gray-500 mt-2">Enter your credentials to continue</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="label">Email address</label>
              <input {...register('email')} type="email" className="input" placeholder="you@loanspark.com" autoComplete="email" />
              {errors.email && <p className="error-text">{errors.email.message}</p>}
            </div>
            <div>
              <label className="label">Password</label>
              <input {...register('password')} type="password" className="input" placeholder="••••••••" autoComplete="current-password" />
              {errors.password && <p className="error-text">{errors.password.message}</p>}
            </div>
            <button type="submit" disabled={loading} className="btn-primary btn-lg w-full">
              {loading ? 'Signing in...' : 'Sign in →'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-5">
            Don't have an account?{' '}
            <Link href="/auth/register" className="text-blue-600 font-semibold hover:underline">Register here</Link>
          </p>

          {/* Demo credentials */}
          <div className="mt-8 border border-gray-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Quick Demo Login</p>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_CREDS.map((c) => (
                <button
                  key={c.role}
                  type="button"
                  onClick={() => { setValue('email', c.email); setValue('password', c.password); }}
                  className="text-left px-3 py-2 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all"
                >
                  <div className="text-xs font-semibold text-gray-700">{c.role}</div>
                  <div className="text-xs text-gray-400 truncate">{c.email}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
