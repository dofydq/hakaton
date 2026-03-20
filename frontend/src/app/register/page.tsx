'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { GlassButton } from '@/components/ui/GlassButton';

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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: 'psychologist',
          email,
          full_name: fullName,
          phone,
          password
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Ошибка регистрации');
      }

      router.push('/login');
    } catch (err: any) {
      console.error("Full error details:", err);
      setError(err.message || 'Произошла ошибка при регистрации');
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
        <h1 className="text-3xl font-bold text-center mb-8">Регистрация</h1>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1">ФИО</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-black/50 border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50 backdrop-blur-sm transition-all"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-black/50 border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50 backdrop-blur-sm transition-all"
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
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-black/50 border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50 backdrop-blur-sm transition-all"
              required
            />
          </div>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <GlassButton type="submit" className="w-full mt-2" disabled={loading}>
            {loading ? 'Создание...' : 'Создать аккаунт'}
          </GlassButton>
        </form>
        <div className="mt-6 text-center">
          <Link href="/login" className="text-sm opacity-80 hover:opacity-100 underline decoration-white/30 underline-offset-4">
            Уже есть аккаунт? Войти
          </Link>
        </div>
      </div>
    </main>
  );
}
