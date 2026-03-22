'use client'

import { useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'
import { FileText, Users, TrendingUp, Plus, ArrowRight, Shield, Brain, Calendar, Clock, UserPlus } from 'lucide-react'
import useSWR from 'swr'
import { testsApi, resultsApi, adminApi, TestResult } from '@/lib/api/client'
import { useAuthStore } from '@/lib/store/auth-store'

export default function DashboardPage() {
  const router = useRouter()
  const { user, isSubscriptionActive, isAuthenticated, isLoading: authLoading } = useAuthStore()

  // Psychologist data
  const { data: tests, isLoading: testsLoading } = useSWR(
    user?.role === 'psychologist' ? 'tests' : null, 
    () => testsApi.list()
  )
  const { data: results, isLoading: resultsLoading } = useSWR(
    user?.role === 'psychologist' ? 'results' : null, 
    () => resultsApi.list()
  )
  const { data: resultsCounts } = useSWR(
    user?.role === 'psychologist' ? 'results-counts' : null, 
    () => resultsApi.counts()
  )

  // Admin data
  const { data: adminStats, isLoading: adminStatsLoading } = useSWR(
    user?.role === 'admin' ? 'admin-stats' : null,
    () => adminApi.stats()
  )

  const isLoading = authLoading || testsLoading || (user?.role === 'psychologist' && resultsLoading) || adminStatsLoading

  if (authLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  const isAdmin = user?.role === 'admin'

  const stats = isAdmin ? [
    {
      name: 'Всего пользователей',
      value: adminStats?.total_users ?? 0,
      icon: Users,
      href: '/admin',
      color: 'text-chart-1',
      bg: 'bg-chart-1/10',
    },
    {
      name: 'Активные специалисты',
      value: adminStats?.active_users ?? 0,
      icon: Shield,
      href: '/admin',
      color: 'text-chart-2',
      bg: 'bg-chart-2/10',
    },
    {
      name: 'Всего тестов в системе',
      value: adminStats?.total_tests ?? 0,
      icon: FileText,
      href: '/dashboard/analytics',
      color: 'text-chart-3',
      bg: 'bg-chart-3/10',
    },
    {
      name: 'Всего прохождений',
      value: adminStats?.total_sessions ?? 0,
      icon: TrendingUp,
      href: '/dashboard/analytics',
      color: 'text-chart-4',
      bg: 'bg-chart-4/10',
    },
  ] : [
    {
      name: 'Моих тестов',
      value: tests?.length ?? 0,
      icon: FileText,
      href: '/dashboard/tests',
      color: 'text-chart-1',
      bg: 'bg-chart-1/10',
    },
    {
      name: 'Сессий клиентов',
      value: resultsCounts?.total ?? 0,
      icon: Users,
      href: '/dashboard/results',
      color: 'text-chart-2',
      bg: 'bg-chart-2/10',
    },
    {
      name: 'Результаты за неделю',
      value: results?.filter(r => new Date(r.completed_at).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000).length ?? 0,
      icon: TrendingUp,
      href: '/dashboard/results',
      color: 'text-chart-3',
      bg: 'bg-chart-3/10',
    },
    {
      name: 'Средний балл',
      value: results && results.length > 0 
        ? `${Math.round(results.reduce((acc, r) => acc + (r.total_points || 0), 0) / results.length)}%` 
        : '0%',
      icon: Brain,
      href: '/dashboard/results',
      color: 'text-chart-4',
      bg: 'bg-chart-4/10',
    },
  ]

  const recentSubmissions = useMemo(() => {
    if (!results) return []
    return [...results]
      .sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())
      .slice(0, 5)
  }, [results])

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-outfit text-2xl font-bold text-foreground sm:text-3xl">
            {isAdmin ? 'Обзор платформы' : `С возвращением, ${user?.name?.split(' ')[0]}!`}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {isAdmin ? 'Общая статистика по всей системе.' : 'Ваша персональная сводка по клиентам и тестам.'}
          </p>
        </div>
        {!isAdmin && (
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/dashboard/tests">
                Список тестов
              </Link>
            </Button>
            <Button asChild disabled={!isSubscriptionActive()}>
              <Link href="/dashboard/tests/new">
                <Plus className="mr-2 h-4 w-4" />
                Новый тест
              </Link>
            </Button>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name} className="group transition-shadow hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.name}
              </CardTitle>
              <div className={`rounded-lg ${stat.bg} p-2 ${stat.color}`}>
                <stat.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="flex items-center justify-between">
                  <span className="font-outfit text-2xl font-bold text-foreground">
                    {stat.value}
                  </span>
                  <Link
                    href={stat.href}
                    className="text-sm text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    Перейти <ArrowRight className="ml-1 inline h-3 w-3" />
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {!isAdmin ? (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Activity / Submissions */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="font-outfit">Последняя активность</CardTitle>
                <CardDescription>Недавние прохождения тестов клиентами</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/results">Все результаты</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {resultsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : recentSubmissions.length > 0 ? (
                <div className="space-y-4">
                  {recentSubmissions.map((result) => (
                    <Link
                      key={result.id}
                      href={`/dashboard/results?test_id=${result.test_id}`}
                      className="flex items-center justify-between rounded-xl border p-4 transition-all hover:bg-muted/50 hover:border-primary/20"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <Users className="h-5 w-5" />
                        </div>
                        <div className="overflow-hidden">
                          <p className="truncate font-medium">{result.client_name || 'Анонимно'}</p>
                          <p className="truncate text-xs text-muted-foreground">{result.test_title}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-outfit font-bold">{result.total_points}%</p>
                        <p className="text-[10px] text-muted-foreground uppercase">
                          {new Date(result.completed_at).toLocaleDateString()}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-muted-foreground border border-dashed rounded-xl bg-muted/20">
                  <UserPlus className="mx-auto h-12 w-12 opacity-20 mb-4" />
                  <p>Клиентов пока нет. Поделитесь ссылкой на тест!</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tips / Summary Card */}
          <div className="space-y-6">
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-outfit text-primary">
                  <Brain className="h-5 w-5" />
                  Совет психологу
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-primary/80 leading-relaxed">
                  Регулярное тестирование помогает более точно отслеживать динамику состояния клиента. 
                  Для новых клиентов мы рекомендуем отправлять ссылки сразу после первой консультации.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-outfit">Системный обзор</CardTitle>
                <CardDescription>Полезная информация</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 text-sm">
                  <div className="rounded-lg bg-yellow-500/10 p-2 text-yellow-600">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">Лимит тестов</p>
                    <p className="text-xs text-muted-foreground">У вас создано {tests?.length ?? 0} из неограниченно</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="rounded-lg bg-green-500/10 p-2 text-green-600">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">Статус подписки</p>
                    <p className="text-xs text-muted-foreground">
                      {isSubscriptionActive() ? 'Активна до ' + new Date(user?.access_until || '').toLocaleDateString() : 'Не активна'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Admin Cards (Already simplified in last turn) */}
          <Card>
            <CardHeader>
              <CardTitle className="font-outfit text-primary">Быстрые действия</CardTitle>
              <CardDescription>Управление системой</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Button asChild className="h-24 flex-col gap-2 text-lg" variant="outline">
                <Link href="/admin">
                  <Users className="h-6 w-6" />
                  Управление специалистами
                </Link>
              </Button>
              <Button asChild className="h-24 flex-col gap-2 text-lg" variant="outline">
                <Link href="/dashboard/analytics">
                  <TrendingUp className="h-6 w-6" />
                  Глобальная аналитика
                </Link>
              </Button>
            </CardContent>
          </Card>
          
          <Card className="bg-primary/5 border-primary/10">
            <CardHeader>
              <CardTitle className="font-outfit">Отчёты по всей системе</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Как администратор, вы имеете доступ к агрегированным данным по всем специалистам. 
                Используйте вкладку аналитики для просмотра демографии и типов популярных тестов.
              </p>
              <Button asChild variant="link" className="p-0">
                <Link href="/dashboard/analytics">Посмотреть графики &rarr;</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
