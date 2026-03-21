'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { GlassButton } from '@/components/ui/GlassButton';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('username', email);
      formData.append('password', password);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/login`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Ошибка входа. Проверьте логин и пароль.');
      }

      const data = await res.json();

      // Сохраняем токен в куки (для Edge Middleware) и localStorage (как фолбек для клиента)
      Cookies.set('access_token', data.access_token, { expires: 7, path: '/' });
      localStorage.setItem('access_token', data.access_token);

      // Декодируем JWT payload для получения роли
      const base64Url = data.access_token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(decodeURIComponent(atob(base64).split('').map(
        (c: string) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      ).join('')));

      // Редирект по роли
      if (payload.role === 'admin') {
        router.replace('/admin');
      } else {
        router.replace('/dashboard');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Произошла ошибка');
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
        <h1 className="text-3xl font-bold text-center mb-8">Вход в систему</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
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
            <label className="block text-sm font-medium mb-2">Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-black/50 border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50 backdrop-blur-sm transition-all"
              required
            />
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-xl">
              <p className="text-red-400 text-sm text-center break-words font-medium">{error}</p>
            </div>
          )}

          <GlassButton type="submit" className="w-full mt-4" disabled={loading}>
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="animate-spin" size={20} /> Вход...
              </span>
            ) : 'Войти'}
          </GlassButton>
        </form>
        <div className="mt-6 text-center">
          <Link href="/register" className="text-sm opacity-80 hover:opacity-100 underline decoration-white/30 underline-offset-4">
            Впервые у нас? Подать заявку
          </Link>
        </div>
      </div>
    </main>
  );
}
