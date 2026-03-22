'use client'

import { useState, useMemo } from 'react'
import useSWR from 'swr'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Search, Download, FileText, Users, Eye, BarChart3, ChevronLeft, Calendar, Mail, FileQuestion } from 'lucide-react'
import { resultsApi, testsApi, TestResult, Test } from '@/lib/api/client'
import { ResultScoresChart } from '@/components/dashboard/result-scores-chart'
import { cn } from '@/lib/utils'
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyMedia,
} from '@/components/ui/empty'

export default function ResultsPage() {
  const [search, setSearch] = useState('')
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null)
  const [selectedResult, setSelectedResult] = useState<TestResult | null>(null)

  const { data: results, isLoading: resultsLoading } = useSWR(
    'results',
    () => resultsApi.list()
  )
  const { data: tests, isLoading: testsLoading } = useSWR('tests', () => testsApi.list())

  const viewMode = selectedTestId ? 'test-results' : 'tests-list'

  const statsByTest = useMemo(() => {
    if (!results || !tests) return []
    return tests.map(test => {
      const testResults = results.filter(r => r.test_id === test.id)
      return {
        ...test,
        resultsCount: testResults.length,
        lastResultDate: testResults.length > 0 
          ? new Date(Math.max(...testResults.map(r => new Date(r.completed_at).getTime()))).toLocaleDateString()
          : 'Нет данных'
      }
    }).sort((a, b) => b.resultsCount - a.resultsCount)
  }, [results, tests])

  const currentTestResults = useMemo(() => {
    if (!results || !selectedTestId) return []
    return results
      .filter(r => String(r.test_id) === String(selectedTestId))
      .filter(r => 
        r.client_name?.toLowerCase().includes(search.toLowerCase()) ||
        r.client_email?.toLowerCase().includes(search.toLowerCase())
      )
  }, [results, selectedTestId, search])

  const selectedTest = tests?.find(t => String(t.id) === String(selectedTestId))

  const handleDownload = (id: string, type: 'client' | 'prof') => {
    window.open(resultsApi.downloadReport(id, type), '_blank')
  }

  if (testsLoading || resultsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          {selectedTestId && (
            <Button variant="ghost" size="icon" onClick={() => { setSelectedTestId(null); setSearch('') }}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
          )}
          <h1 className="font-outfit text-2xl font-bold text-foreground">
            {selectedTestId ? `Результаты: ${selectedTest?.title}` : 'Результаты по тестам'}
          </h1>
        </div>
        <p className="text-muted-foreground">
          {selectedTestId 
            ? 'Список клиентов, прошедших данный тест' 
            : 'Выберите тест, чтобы просмотреть детальные результаты участников'
          }
        </p>
      </div>

      {viewMode === 'tests-list' ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {statsByTest.map((test) => (
            <Card 
              key={test.id} 
              className="cursor-pointer transition-all hover:border-primary/50 hover:shadow-md"
              onClick={() => setSelectedTestId(test.id)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="font-outfit text-lg">{test.title}</CardTitle>
                <CardDescription>
                  Прошли: <span className="font-bold text-foreground">{test.resultsCount}</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    Последний: {test.lastResultDate}
                  </div>
                  <Badge variant="secondary">Открыть</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
          {statsByTest.length === 0 && (
            <div className="col-span-full py-12">
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon"><FileText className="h-6 w-6" /></EmptyMedia>
                  <EmptyTitle>Тесты не найдены</EmptyTitle>
                  <EmptyDescription>Создайте тест, чтобы начать получать результаты</EmptyDescription>
                </EmptyHeader>
              </Empty>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Поиск по имени или почте..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <Card>
            <CardContent className="p-0">
              {currentTestResults.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Участник</TableHead>
                      <TableHead>Дата</TableHead>
                      <TableHead>Баллы</TableHead>
                      <TableHead className="text-right">Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentTestResults.map((result) => (
                      <TableRow key={result.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{result.client_name || 'Анонимно'}</span>
                            <span className="text-xs text-muted-foreground">{result.client_email || 'Нет почты'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(result.completed_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-primary/20 bg-primary/5">
                            {result.total_points}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => setSelectedResult(result)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDownload(result.id, 'prof')}>
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="py-12 text-center text-muted-foreground">
                  <Users className="mx-auto h-12 w-12 opacity-20 mb-4" />
                  <p>Результатов по вашему запросу не найдено</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selectedResult} onOpenChange={() => setSelectedResult(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-outfit">Ответы участника</DialogTitle>
            <DialogDescription>
              {selectedResult?.client_name || 'Анонимный клиент'} • {new Date(selectedResult?.completed_at || '').toLocaleString()}
            </DialogDescription>
          </DialogHeader>

          {selectedResult && (
            <div className="mt-6 space-y-8">
              {/* Summary */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-3 rounded-xl border bg-card p-4">
                  <div className="rounded-lg bg-primary/10 p-2 text-primary">
                    <BarChart3 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Общий результат</p>
                    <p className="text-xl font-bold">{selectedResult.total_points}%</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl border bg-card p-4">
                  <div className="rounded-lg bg-accent/10 p-2 text-accent">
                    <Download className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col">
                    <p className="text-sm text-muted-foreground">Отчёты</p>
                    <div className="flex gap-2 mt-1">
                      <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => handleDownload(selectedResult.id, 'client')}>Для клиента</Button>
                      <Button variant="link" size="sm" className="h-auto p-0 text-xs text-accent" onClick={() => handleDownload(selectedResult.id, 'prof')}>Для психолога</Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Answers */}
              <div className="space-y-4">
                <h3 className="flex items-center gap-2 font-outfit text-lg font-semibold">
                  <FileQuestion className="h-5 w-5 text-primary" />
                  Подробные ответы
                </h3>
                <div className="space-y-4">
                  {/* We map questions from test_snapshot if available */}
                  {selectedResult.test_snapshot?.logic_tree?.flatMap((section: any) => section.questions).map((q: any) => {
                    const answer = selectedResult.answers?.[q.id];
                    let answerText = "—";
                    
                    if (q.type === 'single_choice' || q.type === 'dropdown' || q.type === 'yes_no') {
                      answerText = q.options?.find((opt: any) => String(opt.id) === String(answer))?.text || String(answer);
                    } else if (q.type === 'multiple_choice') {
                      const selectedIds = Array.isArray(answer) ? answer : [answer];
                      answerText = q.options?.filter((opt: any) => selectedIds.includes(String(opt.id))).map((o: any) => o.text).join(', ') || "—";
                    } else {
                      answerText = String(answer || "—");
                    }

                    return (
                      <div key={q.id} className="rounded-lg border bg-muted/30 p-4">
                        <p className="text-sm font-medium text-muted-foreground mb-1">Вопрос: {q.title}</p>
                        <p className="font-semibold text-foreground">{answerText}</p>
                        {q.scale_tag && (
                          <Badge variant="outline" className="mt-2 text-[10px] uppercase tracking-wider">
                            Шкала: {q.scale_tag}
                          </Badge>
                        )}
                      </div>
                    )
                  })}
                  {!selectedResult.test_snapshot && (
                    <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                      Данные о структуре теста отсутствуют в снимке результата.
                      Отображение конкретных ответов невозможно.
                    </div>
                  )}
                </div>
              </div>
              
              {/* Scores Chart */}
              <div>
                <h3 className="mb-4 font-outfit text-lg font-semibold">Результаты по шкалам</h3>
                <ResultScoresChart scores={selectedResult.detailed_results || {}} />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
