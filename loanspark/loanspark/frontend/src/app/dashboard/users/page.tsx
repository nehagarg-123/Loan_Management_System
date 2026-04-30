'use client';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import AppShell from '@/components/layout/AppShell';
import Topbar from '@/components/layout/Topbar';
import Spinner from '@/components/ui/Spinner';
import Modal from '@/components/ui/Modal';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { User } from '@/types';
import { formatDate } from '@/lib/auth';
import toast from 'react-hot-toast';

export default function UsersPage() {
  const { user, loading } = useAuth(['admin']);
  const [users, setUsers] = useState<User[]>([]);
  const [fetching, setFetching] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const { register, handleSubmit, reset } = useForm<any>();

  const load = () => api.get('/users').then(r => setUsers(r.data.data.users)).finally(() => setFetching(false));
  useEffect(() => { load(); }, []);

  const toggle = async (id: string) => {
    await api.patch(`/users/${id}/toggle`);
    toast.success('Status updated');
    load();
  };

  const onCreate = async (data: any) => {
    setCreating(true);
    try {
      await api.post('/users/executive', data);
      toast.success('Executive created');
      setShowCreate(false); reset(); load();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed'); }
    finally { setCreating(false); }
  };

  const roleColor: Record<string, string> = {
    admin: 'bg-purple-100 text-purple-800', sales: 'bg-blue-100 text-blue-800',
    sanction: 'bg-green-100 text-green-800', disbursement: 'bg-yellow-100 text-yellow-800',
    collection: 'bg-orange-100 text-orange-800', borrower: 'bg-gray-100 text-gray-700',
  };

  if (loading || !user) return null;

  return (
    <AppShell user={user}>
      <Topbar title="User Management" subtitle="Manage borrowers and executives" user={user}
        actions={<button onClick={() => setShowCreate(true)} className="btn-primary btn-sm">+ Add Executive</button>} />
      <div className="p-6">
        {fetching ? <Spinner /> : (
          <div className="card">
            <div className="card-header"><h2 className="section-title">All Users ({users.length})</h2></div>
            <div className="table-wrapper rounded-none rounded-b-xl border-0">
              <table>
                <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Phone</th><th>Joined</th><th>Status</th><th>Action</th></tr></thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u._id}>
                      <td className="font-medium">{u.name}</td>
                      <td className="text-gray-500">{u.email}</td>
                      <td><span className={`badge ${roleColor[u.role]}`}>{u.role}</span></td>
                      <td className="text-gray-400">{u.phone || '—'}</td>
                      <td className="text-gray-400">{formatDate(u.createdAt)}</td>
                      <td><span className={`badge ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{u.isActive ? 'Active' : 'Inactive'}</span></td>
                      <td>
                        {u._id !== user._id && (
                          <button onClick={() => toggle(u._id)} className={`btn-sm ${u.isActive ? 'btn-danger' : 'btn-success'}`}>
                            {u.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Executive Account">
        <form onSubmit={handleSubmit(onCreate)} className="space-y-4">
          <div><label className="label">Full Name</label><input {...register('name')} required className="input" placeholder="Name" /></div>
          <div><label className="label">Email</label><input {...register('email')} type="email" required className="input" placeholder="email@loanspark.com" /></div>
          <div><label className="label">Role</label>
            <select {...register('role')} required className="input">
              <option value="sales">Sales</option>
              <option value="sanction">Sanction</option>
              <option value="disbursement">Disbursement</option>
              <option value="collection">Collection</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div><label className="label">Password</label><input {...register('password')} type="password" required minLength={6} className="input" placeholder="Min 6 chars" /></div>
          <div><label className="label">Phone (optional)</label><input {...register('phone')} className="input" placeholder="+91 ..." /></div>
          <button type="submit" disabled={creating} className="btn-primary w-full">{creating ? 'Creating...' : 'Create Executive'}</button>
        </form>
      </Modal>
    </AppShell>
  );
}
