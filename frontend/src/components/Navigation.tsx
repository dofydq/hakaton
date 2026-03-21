'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { api } from '@/lib/api';

export function Navigation() {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = Cookies.get('access_token');
        if (!token) {
          setLoading(false);
          return;
        }
        const res = await api.get('/users/me');
        setUser(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [pathname]);

  if (pathname === '/login' || pathname === '/register' || pathname === '/') {
    return null;
  }

  return (
    <div className="fixed top-4 left-4 z-50">
      {!loading && user && user.role === 'admin' && (
        <Link href="/admin" className="text-white/50 hover:text-white text-sm bg-black/20 px-3 py-1 rounded-full backdrop-blur-md transition-colors">
          Панель Администратора
        </Link>
      )}
    </div>
  );
}
