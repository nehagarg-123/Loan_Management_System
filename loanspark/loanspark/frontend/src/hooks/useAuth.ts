'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, UserRole } from '@/types';
import { getUser, clearAuth, roleHomeMap } from '@/lib/auth';

export function useAuth(requiredRoles?: UserRole[]) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const u = getUser();
    if (!u) { router.replace('/auth/login'); return; }
    if (requiredRoles && !requiredRoles.includes(u.role)) {
      router.replace(roleHomeMap[u.role] || '/auth/login');
      return;
    }
    setUser(u);
    setLoading(false);
  }, []);

  const logout = () => { clearAuth(); router.replace('/auth/login'); };

  return { user, loading, logout };
}
