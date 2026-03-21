'use client'

import useSWR from 'swr'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { resultsApi, testsApi } from '@/lib/api/client'
import { FileText, Users, TrendingUp, Calendar } from 'lucide-react'

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
]

export default function AnalyticsPage() {
  const { data: tests, isLoading: testsLoading } = useSWR('tests', () => testsApi.list())
  const { data: resultCounts, isLoading: countsLoading } = useSWR('results-counts', () => resultsApi.counts())

  const isLoading = testsLoading || countsLoading

  // Prepare chart data
  const testSessionsData = tests?.map((test) => ({
    name: test.title.length > 20 ? test.title.slice(0, 20) + '...' : test.title,
    sessions: test.session_count,
  })) || []

  const pieData = tests?.slice(0, 5).map((test, index) => ({
    name: test.title,
    value: test.session_count,
    color: COLORS[index % COLORS.length],
  })) || []

  // Mock monthly data (would come from API in real app)
  const monthlyData = [
    { month: 'Янв', sessions: 12 },
    { month: 'Фев', sessions: 19 },
    { month: 'Мар', sessions: 25 },
    { month: 'Апр', sessions: 32 },
    { month: 'Май', sessions: 28 },
    { month: 'Июн', sessions: 45 },
  ]

  const stats = [
    {
      name: 'Всего тестов',
      value: tests?.length ?? 0,
      icon: FileText,
      description: 'Активные опросники',
    },
    {
      name: 'Всего сессий',
      value: resultCounts?.total ?? 0,
      icon: Users,
      description: 'Пройдено клиентами',
    },
    {
      name: 'Среднее на тест',
      value: tests?.length ? Math.round((resultCounts?.total ?? 0) / tests.length) : 0,
      icon: TrendingUp,
      description: 'Сессий на тест',
    },
    {
      name: 'За месяц',
      value: 45,
      icon: Calendar,
      description: 'Недавняя активность',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-outfit text-2xl font-bold text-foreground">Аналитика</h1>
        <p className="text-muted-foreground">
          Отслеживайте динамику тестов и активность клиентов
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.name}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="font-outfit text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">{stat.description}</p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sessions Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>Динамика сессий</CardTitle>
            <CardDescription>Количество прохождений по месяцам</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="month" className="text-muted-foreground" />
                    <YAxis className="text-muted-foreground" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="sessions"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sessions by Test */}
        <Card>
          <CardHeader>
            <CardTitle>Сессии по тестам</CardTitle>
            <CardDescription>Распределение прохождений по тестам</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : testSessionsData.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={testSessionsData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis 
                      dataKey="name" 
                      className="text-muted-foreground"
                      tick={{ fontSize: 10 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis className="text-muted-foreground" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar 
                      dataKey="sessions" 
                      fill="hsl(var(--chart-1))" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                Данных пока нет
              </div>
            )}
          </CardContent>
        </Card>

        {/* Test Distribution Pie Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Распределение тестов</CardTitle>
            <CardDescription>Топ-5 тестов по количеству прохождений</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : pieData.length > 0 ? (
              <div className="flex flex-col items-center gap-4 md:flex-row">
                <div className="h-[300px] w-full md:w-1/2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full space-y-2 md:w-1/2">
                  {pieData.map((item, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="flex-1 truncate text-sm">{item.name}</span>
                      <span className="font-medium">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                Данных пока нет
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
