'use client';

import { useState, useEffect } from 'react';
import AppShell from '@/components/layout/AppShell';
import Topbar from '@/components/layout/Topbar';
import StatCard from '@/components/ui/StatCard';
import Spinner from '@/components/ui/Spinner';
import StatusBadge from '@/components/ui/StatusBadge';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { DashboardStats, Loan } from '@/types';
import { formatCurrency, formatDate } from '@/lib/auth';

export default function OverviewPage() {
  const { user, loading } = useAuth(['admin']);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recent, setRecent] = useState<Loan[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/dashboard/stats'),
      api.get('/dashboard/activity')
    ])
      .then(([s, a]) => {
        setStats(s.data.data);
        setRecent(a.data.data.recentLoans);
      })
      .catch((err) => {
        console.error('Dashboard fetch error:', err);
      })
      .finally(() => setFetching(false));
  }, []);

  if (loading || !user) return null;

  return (
    <AppShell user={user}>
      <Topbar
        title="Dashboard Overview"
        subtitle="Real-time view of the loan portfolio"
        user={user}
      />

      <div className="p-6 space-y-6">
        {fetching ? (
          <Spinner />
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="Total Portfolio"
                value={formatCurrency(stats?.portfolioValue || 0)}
                icon="💼"
                color="text-blue-700"
              />
              <StatCard
                label="Total Collected"
                value={formatCurrency(stats?.totalCollected || 0)}
                icon="💰"
                color="text-green-700"
              />
              <StatCard
                label="Total Borrowers"
                value={stats?.borrowers || 0}
                icon="👥"
                color="text-purple-700"
              />
              <StatCard
                label="Total Loans"
                value={stats?.loans?.total || 0}
                icon="📋"
                color="text-gray-700"
              />
            </div>

            {/* Loan Status Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              {[
                { label: 'Applied', value: stats?.loans?.applied, icon: '📝', color: 'text-blue-600' },
                { label: 'Sanctioned', value: stats?.loans?.sanctioned, icon: '✅', color: 'text-green-600' },
                { label: 'Disbursed', value: stats?.loans?.disbursed, icon: '💸', color: 'text-yellow-600' },
                { label: 'Closed', value: stats?.loans?.closed, icon: '🔒', color: 'text-gray-600' },
                { label: 'Rejected', value: stats?.loans?.rejected, icon: '❌', color: 'text-red-600' },
              ].map((s) => (
                <StatCard
                  key={s.label}
                  label={s.label}
                  value={s.value || 0}
                  icon={s.icon}
                  color={s.color}
                />
              ))}
            </div>

            {/* Recent Applications */}
            <div className="card">
              <div className="card-header">
                <h2 className="section-title">Recent Applications</h2>
              </div>

              <div className="table-wrapper rounded-none rounded-b-xl border-0">
                <table>
                  <thead>
                    <tr>
                      <th>Borrower</th>
                      <th>PAN</th>
                      <th>Amount</th>
                      <th>Tenure</th>
                      <th>Status</th>
                      <th>Applied</th>
                    </tr>
                  </thead>

                  <tbody>
                    {recent.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center text-gray-400 py-4">
                          No recent applications
                        </td>
                      </tr>
                    ) : (
                      recent.map((loan) => (
                        <tr key={loan._id}>
                          {/* ✅ FIXED (safe access) */}
                          <td className="font-medium">
                            {loan.borrower?.name || loan.fullName || 'N/A'}
                          </td>

                          <td className="font-mono text-xs">{loan.pan}</td>
                          <td className="font-semibold">
                            {formatCurrency(loan.loanAmount)}
                          </td>
                          <td>{loan.tenure}d</td>
                          <td>
                            <StatusBadge status={loan.status} />
                          </td>
                          <td className="text-gray-400">
                            {formatDate(loan.createdAt)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}