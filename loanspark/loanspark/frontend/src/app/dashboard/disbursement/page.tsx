'use client';
import { useState, useEffect } from 'react';
import AppShell from '@/components/layout/AppShell';
import Topbar from '@/components/layout/Topbar';
import Spinner from '@/components/ui/Spinner';
import StatusBadge from '@/components/ui/StatusBadge';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { Loan } from '@/types';
import { formatCurrency, formatDate } from '@/lib/auth';
import toast from 'react-hot-toast';

export default function DisbursementPage() {
  const { user, loading } = useAuth(['admin', 'disbursement']);
  const [pending, setPending] = useState<Loan[]>([]);
  const [disbursed, setDisbursed] = useState<Loan[]>([]);
  const [fetching, setFetching] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [tab, setTab] = useState<'pending' | 'disbursed'>('pending');

  const load = async () => {
    const [p, d] = await Promise.all([
      api.get('/loans?status=sanctioned'),
      api.get('/loans?status=disbursed'),
    ]);
    setPending(p.data.data.loans);
    setDisbursed(d.data.data.loans);
    setFetching(false);
  };
  useEffect(() => { load(); }, []);

  const disburse = async (loanId: string) => {
    setProcessing(loanId);
    try {
      await api.patch(`/loans/${loanId}/disburse`);
      toast.success('Loan disbursed! UTR generated.');
      load();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed'); }
    finally { setProcessing(null); }
  };

  if (loading || !user) return null;

  return (
    <AppShell user={user}>
      <Topbar title="Disbursement" subtitle="Release funds for sanctioned loans" user={user} />
      <div className="p-6 space-y-5">
        <div className="flex gap-2">
          <button onClick={() => setTab('pending')} className={`btn ${tab === 'pending' ? 'btn-primary' : 'btn-secondary'}`}>
            Pending ({pending.length})
          </button>
          <button onClick={() => setTab('disbursed')} className={`btn ${tab === 'disbursed' ? 'btn-primary' : 'btn-secondary'}`}>
            Disbursed ({disbursed.length})
          </button>
        </div>

        {fetching ? <Spinner /> : (
          <div className="card">
            {tab === 'pending' && (
              pending.length === 0 ? (
                <div className="text-center py-20 text-gray-400"><div className="text-5xl mb-4">💸</div><p className="text-lg font-medium">No pending disbursements</p></div>
              ) : (
                <div className="table-wrapper rounded-xl border-0">
                  <table>
                    <thead><tr><th>Borrower</th><th>Amount</th><th>Tenure</th><th>Repayment</th><th>Sanctioned</th><th>Note</th><th>Action</th></tr></thead>
                    <tbody>
                      {pending.map(loan => (
                        <tr key={loan._id}>
                          <td className="font-medium">{loan.fullName}</td>
                          <td className="font-semibold text-blue-700">{formatCurrency(loan.loanAmount)}</td>
                          <td>{loan.tenure}d</td>
                          <td>{formatCurrency(loan.totalRepayment)}</td>
                          <td className="text-gray-400">{loan.sanctionedAt ? formatDate(loan.sanctionedAt) : '—'}</td>
                          <td className="text-gray-500 text-xs max-w-32 truncate">{loan.sanctionNote || '—'}</td>
                          <td>
                            <button
                              onClick={() => disburse(loan._id)}
                              disabled={processing === loan._id}
                              className="btn-primary btn-sm"
                            >
                              {processing === loan._id ? '...' : '💸 Disburse'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}

            {tab === 'disbursed' && (
              disbursed.length === 0 ? (
                <div className="text-center py-20 text-gray-400"><div className="text-5xl mb-4">📭</div><p>No disbursed loans yet</p></div>
              ) : (
                <div className="table-wrapper rounded-xl border-0">
                  <table>
                    <thead><tr><th>Borrower</th><th>Amount</th><th>UTR Number</th><th>Disbursed On</th><th>Status</th></tr></thead>
                    <tbody>
                      {disbursed.map(loan => (
                        <tr key={loan._id}>
                          <td className="font-medium">{loan.fullName}</td>
                          <td className="font-semibold">{formatCurrency(loan.loanAmount)}</td>
                          <td className="font-mono text-xs text-gray-600">{loan.utrNumber || '—'}</td>
                          <td className="text-gray-400">{loan.disbursedAt ? formatDate(loan.disbursedAt) : '—'}</td>
                          <td><StatusBadge status={loan.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
