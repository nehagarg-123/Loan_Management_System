'use client';
import Sidebar from './Sidebar';
import { User } from '@/types';

export default function AppShell({ user, children }: { user: User; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar user={user} />
      <main className="flex-1 flex flex-col min-w-0 bg-gray-50">{children}</main>
    </div>
  );
}
