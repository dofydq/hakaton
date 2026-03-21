'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { GlassButton } from '@/components/ui/GlassButton';
import { api } from '@/lib/api';

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/auth/register', {
        email,
        full_name: fullName,
        phone,
        password,
      });
      router.push('/pending-approval');
    } catch (err: any) {
      console.error('Register error:', err.response?.data || err);
      if (err.response) {
        console.log('Error details:', await err.response.data);
      }
      const detail = err.response?.data?.detail;
      if (typeof detail === 'string') {
        setError(detail);
      } else if (Array.isArray(detail)) {
        setError(detail.map((e: any) => `${e.loc[e.loc.length - 1]}: ${e.msg}`).join('; '));
      } else {
        setError(err.message || 'Произошла ошибка при регистрации');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Link href="/" className="absolute top-6 left-6 text-sm opacity-70 hover:opacity-100 transition-opacity">
        ← На главную
      </Link>
      <div className="w-full max-w-md p-8 rounded-3xl backdrop-blur-xl bg-white/30 dark:bg-black/30 shadow-2xl border border-white/20">
        <h1 className="text-3xl font-bold text-center mb-8">Подать заявку</h1>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1">ФИО <span className="text-red-400">*</span></label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-black/50 border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50 backdrop-blur-sm transition-all"
              placeholder="Иванов Иван Иванович"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email <span className="text-red-400">*</span></label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-black/50 border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50 backdrop-blur-sm transition-all"
              placeholder="example@mail.ru"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Телефон</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-black/50 border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50 backdrop-blur-sm transition-all"
              placeholder="+7 (999) 123-45-67"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Пароль <span className="text-red-400">*</span></label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-black/50 border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50 backdrop-blur-sm transition-all"
              minLength={6}
              required
            />
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-xl">
              <p className="text-red-400 text-sm text-center break-words font-medium">{error}</p>
            </div>
          )}

          <GlassButton type="submit" className="w-full mt-2" disabled={loading}>
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="animate-spin" size={20} /> Отправка...
              </span>
            ) : 'Подать заявку'}
          </GlassButton>
        </form>
        <div className="mt-6 text-center">
          <Link href="/login" className="text-sm opacity-80 hover:opacity-100 underline decoration-white/30 underline-offset-4">
            Уже есть доступ? Войти
          </Link>
        </div>
      </div>
    </main>
  );
}
