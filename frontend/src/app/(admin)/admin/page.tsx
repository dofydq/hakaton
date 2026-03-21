'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, LogOut, Sun, Moon, RefreshCw } from 'lucide-react';
import { useTheme } from 'next-themes';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';
import { GlassButton } from '@/components/ui/GlassButton';
import { api } from '@/lib/api';

interface AdminUser {
  id: number;
  full_name: string | null;
  email: string;
  phone: string | null;
  is_active: boolean;
  access_until: string | null;
  role: string;
}

export default function AdminPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [dates, setDates] = useState<Record<number, string>>({});

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data);
      // Инициализируем даты из БД
      const initDates: Record<number, string> = {};
      res.data.forEach((u: AdminUser) => {
        initDates[u.id] = u.access_until ? u.access_until.split('T')[0] : '';
      });
      setDates(initDates);
    } catch (err) {
      console.error(err);
      toast.error('Ошибка загрузки пользователей');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleLogout = () => {
    Cookies.remove('access_token');
    router.replace('/login');
  };

  const handleApprove = async (user: AdminUser) => {
    const accessUntil = dates[user.id];
    if (!accessUntil) {
      toast.error('Выберите дату окончания доступа');
      return;
    }
    try {
      await api.patch(`/admin/users/${user.id}`, {
        role: 'psychologist',
        is_active: true,
        access_until: accessUntil,
      });
      toast.success(`${user.full_name || user.email} — заявка одобрена!`);
      fetchUsers();
    } catch (err) {
      console.error(err);
      toast.error('Ошибка при одобрении');
    }
  };

  const handleToggleBlock = async (user: AdminUser) => {
    try {
      await api.patch(`/admin/users/${user.id}`, { is_active: !user.is_active });
      toast.success(user.is_active ? 'Пользователь заблокирован' : 'Пользователь разблокирован');
      fetchUsers();
    } catch (err) {
      console.error(err);
      toast.error('Ошибка при смене статуса');
    }
  };

  const handleDateUpdate = async (user: AdminUser) => {
    const accessUntil = dates[user.id];
    try {
      await api.patch(`/admin/users/${user.id}`, { access_until: accessUntil || null });
      toast.success('Дата доступа обновлена');
      fetchUsers();
    } catch (err) {
      console.error(err);
      toast.error('Ошибка при обновлении даты');
    }
  };

  const roleBadge = (role: string) => {
    const map: Record<string, string> = {
      admin: 'bg-purple-500/20 text-purple-700 dark:text-purple-300',
      psychologist: 'bg-blue-500/20 text-blue-700 dark:text-blue-300',
      pending: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300',
    };
    const labels: Record<string, string> = {
      admin: 'Администратор',
      psychologist: 'Психолог',
      pending: 'На модерации',
    };
    return (
      <span className={`px-2 py-1 rounded-md text-xs font-semibold ${map[role] ?? 'bg-gray-500/20'}`}>
        {labels[role] ?? role}
      </span>
    );
  };

  return (
    <main className="min-h-screen p-6 pt-10">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8 flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <Shield size={26} className="text-emerald-500" />
          Панель управления пользователями
        </h1>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchUsers}
            className="p-3 rounded-full hover:bg-white/10 transition-colors text-white/60 hover:text-white"
            title="Обновить"
          >
            <RefreshCw size={18} />
          </button>
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-3 rounded-full hover:bg-white/10 transition-colors text-white/60 hover:text-white"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <GlassButton onClick={handleLogout} className="!py-2 !px-4 flex gap-2 items-center text-sm">
            <LogOut size={16} /> Выйти
          </GlassButton>
        </div>
      </div>

      {/* Table */}
      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20 gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
            <span className="opacity-60">Загрузка...</span>
          </div>
        ) : (
          <div className="bg-white/30 dark:bg-black/30 backdrop-blur-xl rounded-3xl border border-white/20 shadow-xl overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-black/10 dark:border-white/10">
                  <th className="p-4 font-semibold">ФИО</th>
                  <th className="p-4 font-semibold">Email</th>
                  <th className="p-4 font-semibold">Телефон</th>
                  <th className="p-4 font-semibold">Роль</th>
                  <th className="p-4 font-semibold">Статус</th>
                  <th className="p-4 font-semibold">Доступ до</th>
                  <th className="p-4 font-semibold text-right">Действия</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b border-black/5 dark:border-white/5 last:border-0 hover:bg-white/10 dark:hover:bg-white/5 transition-colors">
                    <td className="p-4 font-medium">{u.full_name || '—'}</td>
                    <td className="p-4 opacity-70">{u.email}</td>
                    <td className="p-4 opacity-70">{u.phone || '—'}</td>
                    <td className="p-4">{roleBadge(u.role)}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-md text-xs font-semibold ${u.is_active ? 'bg-green-500/20 text-green-700 dark:text-green-300' : 'bg-red-500/20 text-red-700 dark:text-red-300'}`}>
                        {u.is_active ? 'Активен' : 'Заблокирован'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="date"
                          value={dates[u.id] ?? ''}
                          onChange={(e) => setDates(prev => ({ ...prev, [u.id]: e.target.value }))}
                          className="bg-transparent border border-black/20 dark:border-white/20 rounded-lg px-2 py-1 text-xs outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30"
                        />
                        {u.role === 'psychologist' && (
                          <button
                            onClick={() => handleDateUpdate(u)}
                            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                            title="Сохранить дату"
                          >
                            ✓
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        {u.role === 'pending' && (
                          <GlassButton
                            onClick={() => handleApprove(u)}
                            className="!py-1 !px-3 !text-xs text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20"
                          >
                            ✓ Одобрить
                          </GlassButton>
                        )}
                        {(u.role === 'psychologist' || u.role === 'pending') && (
                          <GlassButton
                            onClick={() => handleToggleBlock(u)}
                            className={`!py-1 !px-3 !text-xs ${u.is_active
                              ? 'text-red-600 dark:text-red-400 border-red-500/30 bg-red-500/10 hover:bg-red-500/20'
                              : 'text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20'
                            }`}
                          >
                            {u.is_active ? 'Заблокировать' : 'Разблокировать'}
                          </GlassButton>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-12 text-center opacity-40">
                      Пользователей пока нет
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
