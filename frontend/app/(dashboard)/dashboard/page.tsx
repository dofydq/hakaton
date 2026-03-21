'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'
import { FileText, Link2, Users, TrendingUp, Plus, ArrowRight } from 'lucide-react'
import useSWR from 'swr'
import { testsApi, resultsApi, linksApi } from '@/lib/api/client'
import { useAuthStore } from '@/lib/store/auth-store'

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const isSubscriptionActive = useAuthStore((s) => s.isSubscriptionActive)

  const { data: tests, isLoading: testsLoading } = useSWR('tests', () => testsApi.list())
  const { data: results, isLoading: resultsLoading } = useSWR('results-counts', () => resultsApi.counts())
  const { data: links, isLoading: linksLoading } = useSWR('links', () => linksApi.list())

  const stats = [
    {
      name: 'Всего тестов',
      value: tests?.length ?? 0,
      icon: FileText,
      href: '/dashboard/tests',
      color: 'text-chart-1',
      bg: 'bg-chart-1/10',
    },
    {
      name: 'Активные ссылки',
      value: links?.length ?? 0,
      icon: Link2,
      href: '/dashboard/links',
      color: 'text-chart-2',
      bg: 'bg-chart-2/10',
    },
    {
      name: 'Сессии клиентов',
      value: results?.total ?? 0,
      icon: Users,
      href: '/dashboard/results',
      color: 'text-chart-3',
      bg: 'bg-chart-3/10',
    },
    {
      name: 'За месяц',
      value: '+12%',
      icon: TrendingUp,
      href: '/dashboard/analytics',
      color: 'text-chart-4',
      bg: 'bg-chart-4/10',
    },
  ]

  const isLoading = testsLoading || resultsLoading || linksLoading

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-outfit text-2xl font-bold text-foreground sm:text-3xl">
            С возвращением, {user?.name?.split(' ')[0]}!
          </h1>
          <p className="mt-1 text-muted-foreground">
            Краткая сводка по вашей практике.
          </p>
        </div>
        <Button asChild disabled={!isSubscriptionActive()}>
          <Link href="/dashboard/tests/new">
            <Plus className="mr-2 h-4 w-4" />
            Создать тест
          </Link>
        </Button>
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
                    Открыть <ArrowRight className="ml-1 inline h-3 w-3" />
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Tests */}
        <Card>
          <CardHeader>
            <CardTitle className="font-outfit">Последние тесты</CardTitle>
            <CardDescription>Недавно созданные тесты</CardDescription>
          </CardHeader>
          <CardContent>
            {testsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : tests && tests.length > 0 ? (
              <ul className="space-y-3">
                {tests.slice(0, 5).map((test) => (
                  <li key={test.id}>
                    <Link
                      href={`/dashboard/tests/${test.id}`}
                      className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                    >
                      <div>
                        <p className="font-medium text-foreground">{test.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {test.questions.length} questions
                        </p>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {test.session_count} sessions
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="py-8 text-center">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-2 text-muted-foreground">Тестов пока нет</p>
                <Button asChild className="mt-4" size="sm">
                  <Link href="/dashboard/tests/new">Создать первый тест</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Results */}
        <Card>
          <CardHeader>
            <CardTitle className="font-outfit">Последняя активность</CardTitle>
            <CardDescription>Недавние ответы клиентов</CardDescription>
          </CardHeader>
          <CardContent>
            {resultsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : results && results.total > 0 ? (
              <div className="space-y-4">
                <div className="rounded-lg bg-muted/50 p-4">
                  <p className="text-sm text-muted-foreground">Всего отправок</p>
                  <p className="font-outfit text-3xl font-bold text-foreground">
                    {results.total}
                  </p>
                </div>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/dashboard/results">
                    Все результаты
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="py-8 text-center">
                <Users className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-2 text-muted-foreground">Результатов пока нет</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Поделитесь ссылкой на тест, чтобы начать собирать ответы
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
