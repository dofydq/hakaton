'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, RefreshCw, Users, Star, FileText, Stethoscope, Loader2, FlaskConical, Calendar } from 'lucide-react';
import { api } from '@/lib/api';
import { GlassButton } from '@/components/ui/GlassButton';
import toast from 'react-hot-toast';

export default function TestResultsPage() {
  const { id } = useParams();
  const router = useRouter();

  const [test, setTest] = useState<any>(null);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchResults = useCallback(async (showToast = false) => {
    try {
      if (showToast) setRefreshing(true);
      const [testRes, resultsRes] = await Promise.all([
        api.get(`/tests/${id}`),
        api.get(`/results/test/${id}`),
      ]);
      setTest(testRes.data);
      setResults(resultsRes.data);
      if (showToast) toast.success('Данные обновлены!');
    } catch (err) {
      console.error(err);
      toast.error('Ошибка при загрузке результатов');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-light dark:bg-gradient-dark">
        <Loader2 className="animate-spin w-12 h-12 text-violet-500 opacity-80" />
      </div>
    );
  }

  return (
    <main className="min-h-screen p-4 sm:p-8 bg-gradient-light dark:bg-gradient-dark pt-10 pb-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-6xl mx-auto space-y-8"
      >
        {/* Шапка */}
        <header className="relative flex flex-col sm:flex-row items-start sm:items-center gap-6 p-8 rounded-[2rem] backdrop-blur-2xl bg-white/30 dark:bg-black/30 shadow-2xl border border-white/40 dark:border-white/10 overflow-hidden">
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-10 bottom-0 w-40 h-40 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

          <GlassButton onClick={() => router.push('/dashboard')} className="!p-4 shrink-0 rounded-2xl hover:scale-105 z-10">
            <ArrowLeft size={24} />
          </GlassButton>

          <div className="z-10 flex-1">
            <div className="flex items-center gap-3 mb-2">
              <FlaskConical size={22} className="text-violet-500" />
              <p className="opacity-60 text-sm font-bold uppercase tracking-widest text-violet-600 dark:text-violet-400">
                Результаты теста
              </p>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black">{test?.title}</h1>
          </div>

          {/* Кнопка обновить */}
          <GlassButton
            onClick={() => fetchResults(true)}
            disabled={refreshing}
            className="!py-3 !px-6 font-bold flex items-center gap-2 shrink-0 z-10 border-violet-500/30 bg-violet-500/10 hover:bg-violet-500/25 text-violet-700 dark:text-violet-300 rounded-2xl"
          >
            <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
            Обновить
          </GlassButton>
        </header>

        {/* Статистика */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { icon: Users, label: 'Всего прошли', value: results.length, color: 'blue' },
            { icon: Star, label: 'Средний балл', value: results.length > 0 ? Math.round(results.reduce((a, r) => a + r.total_points, 0) / results.length) : '—', color: 'amber' },
            { icon: Star, label: 'Макс. балл', value: results.length > 0 ? Math.max(...results.map(r => r.total_points)) : '—', color: 'green' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className={`p-6 rounded-2xl backdrop-blur-xl bg-white/30 dark:bg-black/30 border border-white/30 dark:border-white/10 shadow-lg`}>
              <Icon size={22} className={`text-${color}-500 mb-3`} />
              <p className="text-3xl font-black">{value}</p>
              <p className="text-sm opacity-60 mt-1 font-medium">{label}</p>
            </div>
          ))}
        </div>

        {/* Таблица результатов */}
        <div className="rounded-[2.5rem] backdrop-blur-2xl bg-white/40 dark:bg-black/40 shadow-2xl border border-white/40 dark:border-white/10 overflow-hidden">
          <div className="p-8 border-b-2 border-white/20 dark:border-white/5 flex justify-between items-center bg-white/10 dark:bg-black/20">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <Users size={24} className="text-violet-500" />
              Список прошедших
              <span className="opacity-50 text-xl font-normal ml-1">({results.length})</span>
            </h2>
          </div>

          <div className="overflow-x-auto p-4 sm:p-6">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="text-xs uppercase tracking-widest opacity-50 font-bold border-b-2 border-white/20 dark:border-white/10">
                  <th className="p-4 w-16">#</th>
                  <th className="p-4">Имя клиента</th>
                  <th className="p-4">Дата заполнения</th>
                  <th className="p-4 text-center">Баллы</th>
                  <th className="p-4 text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/15 dark:divide-white/5">
                {results.map((r, i) => (
                  <motion.tr
                    key={r.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="hover:bg-white/30 dark:hover:bg-white/5 transition-all duration-200 group"
                  >
                    <td className="p-4 font-mono text-sm opacity-40 font-bold">#{r.id}</td>
                    <td className="p-4">
                      <p className="font-bold text-lg">{r.client_fio}</p>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 opacity-80">
                        <Calendar size={14} className="shrink-0 opacity-60" />
                        <span className="text-sm font-medium">
                          {r.created_at
                            ? new Date(r.created_at).toLocaleString('ru-RU', {
                                day: 'numeric', month: 'long', year: 'numeric',
                                hour: '2-digit', minute: '2-digit',
                              })
                            : '—'}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className="inline-flex items-center gap-1 px-4 py-2 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 font-bold text-base">
                        <Star size={14} strokeWidth={2.5} />
                        {r.total_points}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <GlassButton
                          onClick={() => toast('Отчёт для клиента — в разработке', { icon: '📄' })}
                          className="!py-2 !px-4 text-xs font-bold flex items-center gap-2 rounded-xl border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/25 text-blue-700 dark:text-blue-300"
                        >
                          <FileText size={14} />
                          Клиент
                        </GlassButton>
                        <GlassButton
                          onClick={() => toast('Профессиональный отчёт — в разработке', { icon: '👨‍⚕️' })}
                          className="!py-2 !px-4 text-xs font-bold flex items-center gap-2 rounded-xl border-violet-500/30 bg-violet-500/10 hover:bg-violet-500/25 text-violet-700 dark:text-violet-300"
                        >
                          <Stethoscope size={14} />
                          Профи
                        </GlassButton>
                      </div>
                    </td>
                  </motion.tr>
                ))}

                {results.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-20 text-center">
                      <div className="flex flex-col items-center gap-4 opacity-50">
                        <Users size={48} />
                        <p className="text-lg font-medium">Пока никто не прошёл этот тест</p>
                        <p className="text-sm">Поделитесь ссылкой с клиентом — и результаты появятся здесь</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
