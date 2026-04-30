'use client';
import { useState, useEffect } from 'react';
import AppShell from '@/components/layout/AppShell';
import Topbar from '@/components/layout/Topbar';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { Loan } from '@/types';
import StatusBadge from '@/components/ui/StatusBadge';
import Spinner from '@/components/ui/Spinner';
import Modal from '@/components/ui/Modal';
import { formatCurrency, formatDate } from '@/lib/auth';

export default function MyLoansPage() {
  const { user, loading } = useAuth(['borrower']);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [fetching, setFetching] = useState(true);
  const [selected, setSelected] = useState<Loan | null>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [totalPaid, setTotalPaid] = useState(0);

  useEffect(() => {
    api.get('/loans/my').then(r => setLoans(r.data.data.loans)).finally(() => setFetching(false));
  }, []);

  const openDetail = async (loan: Loan) => {
    setSelected(loan);
    const r = await api.get(`/payments/loan/${loan._id}`);
    setPayments(r.data.data.payments);
    setTotalPaid(r.data.data.totalPaid);
  };

  if (loading || !user) return null;

  const TIMELINE: Loan['status'][] = ['applied', 'sanctioned', 'disbursed', 'closed'];

  return (
    <AppShell user={user}>
      <Topbar title="My Loans" subtitle="Track all your loan applications" user={user} />
      <div className="p-6">
        {fetching ? <Spinner /> : loans.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <div className="text-5xl mb-4">📋</div>
            <p className="text-lg font-medium">No loans yet</p>
            <a href="/borrower/apply" className="btn-primary mt-4 inline-flex">Apply Now →</a>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {loans.map(loan => (
              <div key={loan._id} className="card p-5 cursor-pointer hover:shadow-md transition-shadow" onClick={() => openDetail(loan)}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="font-bold text-gray-900 text-lg">{formatCurrency(loan.loanAmount)}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Applied {formatDate(loan.createdAt)}</p>
                  </div>
                  <StatusBadge status={loan.status} />
                </div>
                {/* mini timeline */}
                <div className="flex items-center gap-0 mt-3">
                  {TIMELINE.map((s, i) => {
                    const idx = TIMELINE.indexOf(loan.status === 'rejected' ? 'applied' : loan.status);
                    const done = i <= idx;
                    return (
                      <div key={s} className="flex items-center flex-1 last:flex-none">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs font-bold ${done ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-200 text-gray-300'}`}>
                          {done ? '✓' : i + 1}
                        </div>
                        {i < TIMELINE.length - 1 && <div className={`flex-1 h-0.5 ${i < idx ? 'bg-blue-600' : 'bg-gray-200'}`} />}
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-1.5">
                  {TIMELINE.map(s => <span key={s} className="capitalize">{s}</span>)}
                </div>
                {loan.status === 'rejected' && (
                  <p className="mt-3 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">Rejected: {loan.rejectionReason}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title="Loan Details" width="max-w-2xl">
        {selected && (
          <div>
            <div className="grid grid-cols-2 gap-3 text-sm mb-6">
              {[
                ['Loan Amount', formatCurrency(selected.loanAmount)],
                ['Tenure', `${selected.tenure} days`],
                ['Interest', formatCurrency(selected.simpleInterest)],
                ['Total Repayment', formatCurrency(selected.totalRepayment)],
                ['Applied', formatDate(selected.createdAt)],
                ['Status', <StatusBadge key="s" status={selected.status} />],
                ...(selected.utrNumber ? [['Disburse UTR', selected.utrNumber]] : []),
                ...(selected.sanctionNote ? [['Sanction Note', selected.sanctionNote]] : []),
              ].map(([k, v]) => (
                <div key={String(k)} className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">{String(k)}</p>
                  <p className="font-semibold mt-0.5">{v as any}</p>
                </div>
              ))}
            </div>

            {payments.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Payment History</h3>
                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-1"><span>Paid: {formatCurrency(totalPaid)}</span><span>Remaining: {formatCurrency(selected.totalRepayment - totalPaid)}</span></div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: `${Math.min(100, (totalPaid / selected.totalRepayment) * 100)}%` }} />
                  </div>
                </div>
                <div className="space-y-2">
                  {payments.map(p => (
                    <div key={p._id} className="flex justify-between text-sm bg-gray-50 rounded-lg px-3 py-2.5">
                      <span className="font-mono text-xs text-gray-500">{p.utrNumber}</span>
                      <span className="font-semibold">{formatCurrency(p.amount)}</span>
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
