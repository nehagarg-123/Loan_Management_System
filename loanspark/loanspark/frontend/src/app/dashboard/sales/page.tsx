'use client';
import { useState, useEffect } from 'react';
import AppShell from '@/components/layout/AppShell';
import Topbar from '@/components/layout/Topbar';
import Spinner from '@/components/ui/Spinner';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { User, Loan } from '@/types';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatDate } from '@/lib/auth';

export default function SalesPage() {
  const { user, loading } = useAuth(['admin', 'sales']);
  const [leads, setLeads] = useState<User[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [fetching, setFetching] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/users/leads'),
      api.get('/loans')
    ])
      .then(([l, lo]) => {
        setLeads(l?.data?.data?.leads || []);
        setLoans(lo?.data?.data?.loans || []);
      })
      .catch(err => {
        console.error('Error fetching data:', err);
      })
      .finally(() => setFetching(false));
  }, []);

  if (loading || !user) return null;

  const filtered = leads.filter(l =>
    l.name?.toLowerCase().includes(search.toLowerCase()) ||
    l.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppShell user={user}>
      <Topbar
        title="Sales"
        subtitle="Borrower leads and pre-application tracking"
        user={user}
      />

      <div className="p-6 space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            ['Registered Borrowers', leads.length, '👥'],
            ['Total Applications', loans.length, '📋'],
            [
              'Conversion Rate',
              leads.length
                ? Math.round((loans.length / leads.length) * 100) + '%'
                : '0%',
              '📈'
            ]
          ].map(([l, v, i]) => (
            <div key={String(l)} className="card p-4 flex items-center gap-4">
              <span className="text-3xl">{i}</span>
              <div>
                <p className="text-2xl font-bold text-gray-900">{v}</p>
                <p className="text-sm text-gray-500">{l}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="section-title">Registered Borrowers</h2>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input w-56"
              placeholder="Search by name or email..."
            />
          </div>

          {fetching ? (
            <Spinner />
          ) : (
            <div className="table-wrapper rounded-none rounded-b-xl border-0">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Joined</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {filtered.map(lead => {

                    // ✅ FIXED SAFE LOGIC
                    const hasLoan = loans?.some(lo => {
                      if (!lo || !lo.borrower) return false;

                      const borrowerId =
                        typeof lo.borrower === 'object'
                          ? lo.borrower?._id
                          : lo.borrower;

                      return borrowerId === lead?._id;
                    });

                    return (
                      <tr key={lead._id}>
                        <td className="font-medium">{lead.name}</td>
                        <td className="text-gray-500">{lead.email}</td>
                        <td className="text-gray-500">
                          {lead.phone || '—'}
                        </td>
                        <td className="text-gray-400">
                          {formatDate(lead.createdAt)}
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              hasLoan
                                ? 'badge-applied'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {hasLoan ? 'Applied' : 'Registered'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

              </table>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}