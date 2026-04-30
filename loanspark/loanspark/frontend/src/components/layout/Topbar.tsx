'use client';
import { User } from '@/types';

interface Props { title: string; subtitle?: string; user: User; actions?: React.ReactNode; }

export default function Topbar({ title, subtitle, actions }: Props) {
  return (
    <header className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between flex-shrink-0">
      <div>
        <h1 className="text-xl font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </header>
  );
}
