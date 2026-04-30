'use client';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import AppShell from '@/components/layout/AppShell';
import Topbar from '@/components/layout/Topbar';
import Spinner from '@/components/ui/Spinner';
import Modal from '@/components/ui/Modal';
import StatusBadge from '@/components/ui/StatusBadge';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { Loan, Payment } from '@/types';
import { formatCurrency, formatDate } from '@/lib/auth';
import toast from 'react-hot-toast';

const schema = z.object({
  utrNumber:   z.string().min(3, 'Required'),
  amount:      z.coerce.number().min(1, 'Must be > 0'),
  paymentDate: z.string().min(1, 'Required'),
  notes:       z.string().optional(),
});
type FormData = z.infer<typeof schema>;

interface LoanWithPayments extends Loan { totalPaid: number; outstanding: number; payments: Payment[]; }

export default function CollectionPage() {
  const { user, loading } = useAuth(['admin', 'collection']);
  const [loans, setLoans] = useState<LoanWithPayments[]>([]);
  const [fetching, setFetching] = useState(true);
  const [selected, setSelected] = useState<LoanWithPayments | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { paymentDate: new Date().toISOString().split('T')[0] },
  });

  const load = async () => {
    setFetching(true);
    const res = await api.get('/loans?status=disbursed');
    const rawLoans: Loan[] = res.data.data.loans;
    const enriched = await Promise.all(rawLoans.map(async (l) => {
      const pr = await api.get(`/payments/loan/${l._id}`);
      return { ...l, payments: pr.data.data.payments, totalPaid: pr.data.data.totalPaid, outstanding: pr.data.data.outstanding };
    }));
    setLoans(enriched);
    setFetching(false);
  };
  useEffect(() => { load(); }, []);

  const openLoan = async (loan: LoanWithPayments) => {
    setSelected(loan);
    reset({ paymentDate: new Date().toISOString().split('T')[0] });
  };

  const onSubmit = async (data: FormData) => {
    if (!selected) return;
    setSubmitting(true);
    try {
      const res = await api.post('/payments', { loanId: selected._id, ...data });
      toast.success(res.data.message);
      await load();
      // refresh selected
      const updated = loans.find(l => l._id === selected._id);
      if (updated) setSelected(updated); else setSelected(null);
      reset({ paymentDate: new Date().toISOString().split('T')[0] });
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed'); }
    finally { setSubmitting(false); }
  };

  if (loading || !user) return null;

  return (
    <AppShell user={user}>
      <Topbar title="Collection" subtitle="Record repayments for disbursed loans" user={user} />
      <div className="p-6">
        {fetching ? <Spinner /> : loans.length === 0 ? (
          <div className="text-center py-20 text-gray-400"><div className="text-5xl mb-4">💰</div><p className="text-lg font-medium">No active disbursed loans</p></div>
        ) : (
          <div className="card">
            <div className="card-header"><h2 className="section-title">Active Loans — {loans.length}</h2></div>
            <div className="table-wrapper rounded-none rounded-b-xl border-0">
              <table>
                <thead><tr><th>Borrower</th><th>Loan Amt</th><th>Total Repayment</th><th>Paid</th><th>Outstanding</th><th>Progress</th><th>Action</th></tr></thead>
                <tbody>
                  {loans.map(loan => {
                    const pct = Math.min(100, Math.round((loan.totalPaid / loan.totalRepayment) * 100));
                    return (
                      <tr key={loan._id}>
                        <td className="font-medium">{loan.fullName}</td>
                        <td>{formatCurrency(loan.loanAmount)}</td>
                        <td>{formatCurrency(loan.totalRepayment)}</td>
                        <td className="text-green-700 font-semibold">{formatCurrency(loan.totalPaid)}</td>
                        <td className="text-red-600 font-semibold">{formatCurrency(loan.outstanding)}</td>
                        <td className="w-28">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-xs text-gray-500 w-8">{pct}%</span>
                          </div>
                        </td>
                        <td>
                          <button onClick={() => openLoan(loan)} className="btn-secondary btn-sm">Record</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <Modal open={!!selected} onClose={() => setSelected(null)} title={`Record Payment — ${selected?.fullName}`} width="max-w-xl">
        {selected && (
          <div className="space-y-5">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-3 text-sm">
              {[['Loan Amt', formatCurrency(selected.loanAmount)], ['Paid', formatCurrency(selected.totalPaid)], ['Outstanding', formatCurrency(selected.outstanding)]].map(([k, v]) => (
                <div key={k} className="bg-gray-50 rounded-lg p-3 text-center"><p className="text-xs text-gray-500">{k}</p><p className="font-bold mt-1">{v}</p></div>
              ))}
            </div>
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Repayment progress</span>
                <span>{Math.round((selected.totalPaid / selected.totalRepayment) * 100)}%</span>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full" style={{ width: `${Math.min(100, (selected.totalPaid / selected.totalRepayment) * 100)}%` }} />
              </div>
            </div>

            {/* Payment form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">UTR Number</label>
                  <input {...register('utrNumber')} className="input" placeholder="Unique UTR" />
                  {errors.utrNumber && <p className="error-text">{errors.utrNumber.message}</p>}
                </div>
                <div>
                  <label className="label">Amount (₹)</label>
                  <input {...register('amount')} type="number" className="input" placeholder="5000" />
                  {errors.amount && <p className="error-text">{errors.amount.message}</p>}
                </div>
              </div>
              <div>
                <label className="label">Payment Date</label>
                <input {...register('paymentDate')} type="date" className="input" />
                {errors.paymentDate && <p className="error-text">{errors.paymentDate.message}</p>}
              </div>
              <div>
                <label className="label">Notes (optional)</label>
                <input {...register('notes')} className="input" placeholder="e.g. NEFT transfer" />
              </div>
              <button type="submit" disabled={submitting} className="btn-primary w-full">
                {submitting ? 'Recording...' : 'Record Payment'}
              </button>
            </form>

            {/* Payment history */}
            {selected.payments.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">Payment History</p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selected.payments.map(p => (
                    <div key={p._id} className="flex justify-between items-center text-sm bg-gray-50 rounded-lg px-3 py-2">
                      <span className="font-mono text-xs text-gray-500">{p.utrNumber}</span>
                      <span className="font-semibold text-green-700">{formatCurrency(p.amount)}</span>
                      <span className="text-gray-400">{formatDate(p.paymentDate)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </AppShell>
  );
}
