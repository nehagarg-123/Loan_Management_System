'use client';
import { useState, useEffect } from 'react';
import AppShell from '@/components/layout/AppShell';
import Topbar from '@/components/layout/Topbar';
import Spinner from '@/components/ui/Spinner';
import Modal from '@/components/ui/Modal';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { Loan } from '@/types';
import { formatCurrency, formatDate } from '@/lib/auth';
import toast from 'react-hot-toast';

export default function SanctionPage() {
  const { user, loading } = useAuth(['admin', 'sanction']);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [fetching, setFetching] = useState(true);
  const [selected, setSelected] = useState<Loan | null>(null);
  const [note, setNote] = useState('');
  const [reason, setReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const load = () => api.get('/loans?status=applied').then(r => setLoans(r.data.data.loans)).finally(() => setFetching(false));
  useEffect(() => { load(); }, []);

  const approve = async () => {
    if (!selected) return;
    setProcessing(true);
    try {
      await api.patch(`/loans/${selected._id}/sanction`, { note });
      toast.success('Loan sanctioned!');
      setSelected(null); setNote('');
      load();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed'); }
    finally { setProcessing(false); }
  };

  const reject = async () => {
    if (!selected || !reason.trim()) { toast.error('Rejection reason required'); return; }
    setProcessing(true);
    try {
      await api.patch(`/loans/${selected._id}/reject`, { reason });
      toast.success('Loan rejected.');
      setSelected(null); setReason('');
      load();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed'); }
    finally { setProcessing(false); }
  };

  if (loading || !user) return null;

  return (
    <AppShell user={user}>
      <Topbar title="Sanction" subtitle="Review and approve or reject loan applications" user={user} />
      <div className="p-6">
        {fetching ? <Spinner /> : loans.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <div className="text-5xl mb-4">✅</div>
            <p className="text-lg font-medium">All loans reviewed!</p>
            <p className="text-sm mt-1">No pending applications.</p>
          </div>
        ) : (
          <div className="card">
            <div className="card-header">
              <h2 className="section-title">Applied Loans <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-sm">{loans.length}</span></h2>
            </div>
            <div className="table-wrapper rounded-none rounded-b-xl border-0">
              <table>
                <thead><tr><th>Borrower</th><th>PAN</th><th>Salary</th><th>Amount</th><th>Tenure</th><th>Applied</th><th>BRE</th><th>Action</th></tr></thead>
                <tbody>
                  {loans.map(loan => (
                    <tr key={loan._id}>
                      <td className="font-medium">{loan.fullName}</td>
                      <td className="font-mono text-xs">{loan.pan}</td>
                      <td>{formatCurrency(loan.monthlySalary)}</td>
                      <td className="font-semibold">{formatCurrency(loan.loanAmount)}</td>
                      <td>{loan.tenure}d</td>
                      <td className="text-gray-400">{formatDate(loan.createdAt)}</td>
                      <td>
                        <span className={`badge ${loan.breChecks.passed ? 'badge-sanctioned' : 'badge-rejected'}`}>
                          {loan.breChecks.passed ? 'Pass' : 'Fail'}
                        </span>
                      </td>
                      <td>
                        <button onClick={() => { setSelected(loan); setNote(''); setReason(''); }} className="btn-secondary btn-sm">Review</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <Modal open={!!selected} onClose={() => setSelected(null)} title={`Review Loan — ${selected?.fullName}`}>
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[['Amount', formatCurrency(selected.loanAmount)], ['Tenure', `${selected.tenure}d`],
                ['Salary', formatCurrency(selected.monthlySalary)], ['Employment', selected.employmentMode],
                ['Total Repayment', formatCurrency(selected.totalRepayment)], ['PAN', selected.pan],
              ].map(([k, v]) => (
                <div key={k} className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">{k}</p>
                  <p className="font-semibold mt-0.5">{v}</p>
                </div>
              ))}
            </div>

            {/* BRE checks */}
            <div className="rounded-lg border border-gray-200 p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">BRE Checks</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {[['Age (23–50)', selected.breChecks.ageCheck], ['Salary (≥₹75K)', selected.breChecks.salaryCheck],
                  ['PAN Format', selected.breChecks.panCheck], ['Employment', selected.breChecks.employmentCheck]].map(([l, v]) => (
                  <div key={String(l)} className={`flex items-center gap-2 px-3 py-2 rounded-lg ${v ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    <span>{v ? '✓' : '✗'}</span> {l}
                  </div>
                ))}
              </div>
            </div>

            {selected.salarySlipUrl && (
              <a href={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}${selected.salarySlipUrl}`} target="_blank" rel="noreferrer" className="btn-secondary w-full">📄 View Salary Slip</a>
            )}

            <div>
              <label className="label">Sanction Note (optional)</label>
              <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} className="input" placeholder="Add any notes for this sanction..." />
            </div>
            <div>
              <label className="label">Rejection Reason</label>
              <textarea value={reason} onChange={e => setReason(e.target.value)} rows={2} className="input" placeholder="Required if rejecting..." />
            </div>
            <div className="flex gap-3">
              <button onClick={reject} disabled={processing} className="btn-danger flex-1">✗ Reject</button>
              <button onClick={approve} disabled={processing} className="btn-success flex-1">✓ Sanction</button>
            </div>
          </div>
        )}
      </Modal>
    </AppShell>
  );
}
