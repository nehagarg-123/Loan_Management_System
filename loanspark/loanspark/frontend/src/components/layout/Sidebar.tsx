'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, UserRole } from '@/types';
import { clearAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';

interface NavItem { label: string; href: string; icon: string; }

const NAV_MAP: Record<UserRole, NavItem[]> = {
  borrower: [
    { label: 'Apply for Loan', href: '/borrower/apply', icon: '📝' },
    { label: 'My Loans',       href: '/borrower/loans', icon: '📋' },
  ],
  admin: [
    { label: 'Overview',      href: '/dashboard/overview',     icon: '📊' },
    { label: 'Sales',         href: '/dashboard/sales',        icon: '👥' },
    { label: 'Sanction',      href: '/dashboard/sanction',     icon: '✅' },
    { label: 'Disbursement',  href: '/dashboard/disbursement', icon: '💸' },
    { label: 'Collection',    href: '/dashboard/collection',   icon: '💰' },
    { label: 'Users',         href: '/dashboard/users',        icon: '🛡️' },
  ],
  sales:        [{ label: 'Sales Leads',   href: '/dashboard/sales',        icon: '👥' }],
  sanction:     [{ label: 'Sanction',      href: '/dashboard/sanction',     icon: '✅' }],
  disbursement: [{ label: 'Disbursement',  href: '/dashboard/disbursement', icon: '💸' }],
  collection:   [{ label: 'Collection',    href: '/dashboard/collection',   icon: '💰' }],
};

export default function Sidebar({ user }: { user: User }) {
  const pathname = usePathname();
  const router = useRouter();
  const items = NAV_MAP[user.role] || [];

  const logout = () => { clearAuth(); router.replace('/auth/login'); };
  const initials = user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <aside className="w-60 flex-shrink-0 bg-gray-900 text-white flex flex-col min-h-screen">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-white/10">
        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-base">⚡</div>
        <span className="font-bold text-lg">LoanSpark</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          {user.role === 'borrower' ? 'Borrower Portal' : 'Operations'}
        </p>
        {items.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                active ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="p-3 border-t border-white/10">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-8 h-8 rounded-full bg-blue-500/30 text-blue-300 flex items-center justify-center text-xs font-bold flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user.name}</p>
            <p className="text-xs text-gray-500 capitalize">{user.role}</p>
          </div>
          <button onClick={logout} title="Logout" className="text-gray-500 hover:text-white transition-colors text-lg">↩</button>
        </div>
      </div>
    </aside>
  );
}
