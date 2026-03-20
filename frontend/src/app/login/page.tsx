'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import Link from 'next/link';
import { GlassButton } from '@/components/ui/GlassButton';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const formData = new FormData();
      formData.append('username', email);
      formData.append('password', password);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/auth/login`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Ошибка входа. Проверьте логин и пароль.');
      }

      const data = await res.json();
      Cookies.set('access_token', data.access_token);
      router.push('/dashboard');
    } catch (err: any) {
      console.error("Full error details:", err);
      setError(err.message || 'Произошла ошибка');
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
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <GlassButton type="submit" className="w-full mt-4">
            Войти
          </GlassButton>
        </form>
        <div className="mt-6 text-center">
          <Link href="/register" className="text-sm opacity-80 hover:opacity-100 underline decoration-white/30 underline-offset-4">
            Впервые у нас? Зарегистрироваться
          </Link>
        </div>
      </div>
    </main>
  );
}
