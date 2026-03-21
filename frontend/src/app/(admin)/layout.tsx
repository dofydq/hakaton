'use client';

import Link from 'next/link';
import { Shield, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const handleLogout = () => {
    Cookies.remove('access_token');
    router.replace('/login');
  };

  return (
    <div className="min-h-screen">
      <div className="fixed top-4 left-4 z-50 flex items-center gap-4">
        <Link href="/admin" className="text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20 px-4 py-2 rounded-2xl backdrop-blur-md flex items-center gap-2 border border-emerald-500/30 transition-all font-medium">
          <Shield size={18} /> Панель Администратора
        </Link>
        <button onClick={handleLogout} className="text-red-400 hover:text-red-300 transition text-sm flex items-center gap-1 font-medium bg-black/20 px-3 py-2 rounded-xl backdrop-blur-md">
          <LogOut size={16} /> Выйти
        </button>
      </div>
      {children}
    </div>
  );
}
