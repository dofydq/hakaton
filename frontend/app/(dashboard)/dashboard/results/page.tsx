'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Empty } from '@/components/ui/empty'
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
import { Search, Download, FileText, Users, Eye } from 'lucide-react'
import { resultsApi, testsApi, TestResult } from '@/lib/api/client'
import { ResultScoresChart } from '@/components/dashboard/result-scores-chart'

export default function ResultsPage() {
  const [search, setSearch] = useState('')
  const [filterTest, setFilterTest] = useState<string>('all')
  const [filterLabel, setFilterLabel] = useState<string>('all')
  const [selectedResult, setSelectedResult] = useState<TestResult | null>(null)

  const { data: results, isLoading } = useSWR(
    ['results', filterTest, filterLabel],
    () => resultsApi.list({ 
      test_id: filterTest !== 'all' ? filterTest : undefined,
      label: filterLabel !== 'all' ? filterLabel : undefined,
    })
  )
  const { data: tests } = useSWR('tests', () => testsApi.list())

  // Get unique labels from results
  const uniqueLabels = [...new Set(results?.map((r) => r.link_label) || [])]

  const filteredResults = results?.filter((result) =>
    (result.client_name?.toLowerCase().includes(search.toLowerCase()) ||
     result.client_email?.toLowerCase().includes(search.toLowerCase()) ||
     result.test_title.toLowerCase().includes(search.toLowerCase()))
  )

  const handleDownload = (id: string, type: 'client' | 'prof') => {
    window.open(resultsApi.downloadReport(id, type), '_blank')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-outfit text-2xl font-bold text-foreground">Результаты / CRM</h1>
        <p className="text-muted-foreground">
          Просматривайте и анализируйте все ответы клиентов
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Поиск по имени, почте или тесту..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterTest} onValueChange={setFilterTest}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Фильтр по тесту" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все тесты</SelectItem>
                {tests?.map((test) => (
                  <SelectItem key={test.id} value={test.id}>
                    {test.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterLabel} onValueChange={setFilterLabel}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Фильтр по метке" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все метки</SelectItem>
                {uniqueLabels.map((label) => (
                  <SelectItem key={label} value={label}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Результаты клиентов
          </CardTitle>
          <CardDescription>
            Всего ответов: {filteredResults?.length ?? 0}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredResults && filteredResults.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Клиент</TableHead>
                    <TableHead>Тест</TableHead>
                    <TableHead>Метка</TableHead>
                    <TableHead>Дата</TableHead>
                    <TableHead className="text-right">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredResults.map((result) => (
                    <TableRow key={result.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{result.client_name || 'Анонимно'}</p>
                          <p className="text-sm text-muted-foreground">
                            {result.client_email || 'Без почты'}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{result.test_title}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{result.link_label}</Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(result.completed_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedResult(result)}
                          >
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">Открыть детали</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDownload(result.id, 'client')}
                          >
                            <Download className="h-4 w-4" />
                            <span className="sr-only">Скачать отчёт</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <Empty
              icon={FileText}
              title="Результатов пока нет"
              description="Ответы появятся здесь после прохождения тестов клиентами"
            />
          )}
        </CardContent>
      </Card>

      {/* Result Details Dialog */}
      <Dialog open={!!selectedResult} onOpenChange={() => setSelectedResult(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Детали результата</DialogTitle>
            <DialogDescription>
              {selectedResult?.test_title} - {selectedResult?.link_label}
            </DialogDescription>
          </DialogHeader>
          {selectedResult && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Клиент</p>
                  <p className="font-medium">{selectedResult.client_name || 'Анонимно'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Почта</p>
                  <p className="font-medium">{selectedResult.client_email || 'Не указана'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Завершено</p>
                  <p className="font-medium">
                    {new Date(selectedResult.completed_at).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Scores Chart */}
              <div>
                <h3 className="mb-4 font-semibold">Разбивка по шкалам</h3>
                <ResultScoresChart scores={selectedResult.scores} />
              </div>

              {/* Download Buttons */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleDownload(selectedResult.id, 'client')}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Отчёт для клиента
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => handleDownload(selectedResult.id, 'prof')}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Профессиональный отчёт
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
