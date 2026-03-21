'use client'

import { useState } from 'react'
import Link from 'next/link'
import useSWR from 'swr'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Empty } from '@/components/ui/empty'
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  Link2,
  Trash2,
  Upload,
  FileText,
  Users,
} from 'lucide-react'
import { testsApi, Test } from '@/lib/api/client'
import { useAuthStore } from '@/lib/store/auth-store'
import { toast } from 'sonner'

export default function TestsPage() {
  const [search, setSearch] = useState('')
  const isSubscriptionActive = useAuthStore((s) => s.isSubscriptionActive)
  
  const { data: tests, isLoading, mutate } = useSWR('tests', () => testsApi.list())

  const filteredTests = tests?.filter((test) =>
    test.title.toLowerCase().includes(search.toLowerCase())
  )

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить этот тест?')) return
    
    try {
      await testsApi.delete(id)
      mutate()
      toast.success('Тест удалён')
    } catch (error) {
      toast.error('Не удалось удалить тест')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-outfit text-2xl font-bold text-foreground">Мои тесты</h1>
          <p className="text-muted-foreground">
            Создавайте и управляйте психологическими тестами
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" disabled={!isSubscriptionActive()}>
            <Upload className="mr-2 h-4 w-4" />
            Импорт
          </Button>
          <Button asChild disabled={!isSubscriptionActive()}>
            <Link href="/dashboard/tests/new">
              <Plus className="mr-2 h-4 w-4" />
              Создать тест
            </Link>
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Поиск тестов..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Tests Grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredTests && filteredTests.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTests.map((test) => (
            <TestCard key={test.id} test={test} onDelete={handleDelete} />
          ))}
        </div>
      ) : (
        <Empty
          icon={FileText}
          title="Тесты не найдены"
          description={search ? 'Попробуйте другой запрос' : 'Создайте первый психологический тест'}
        >
          <Button asChild>
            <Link href="/dashboard/tests/new">
              <Plus className="mr-2 h-4 w-4" />
              Создать тест
            </Link>
          </Button>
        </Empty>
      )}
    </div>
  )
}

function TestCard({ test, onDelete }: { test: Test; onDelete: (id: string) => void }) {
  return (
    <Card className="group transition-shadow hover:shadow-md">
      <CardHeader className="flex flex-row items-start justify-between">
        <div className="space-y-1">
          <CardTitle className="font-outfit text-lg">
            <Link 
              href={`/dashboard/tests/${test.id}`}
              className="hover:text-primary"
            >
              {test.title}
            </Link>
          </CardTitle>
          <CardDescription>
            {test.questions.length} questions
          </CardDescription>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/tests/${test.id}`}>
                <Edit className="mr-2 h-4 w-4" />
                Редактировать
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/links?test_id=${test.id}`}>
                <Link2 className="mr-2 h-4 w-4" />
                Создать ссылку
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => onDelete(test.id)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Удалить
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{test.session_count} sessions</span>
          </div>
          <Badge variant="secondary">
            {new Date(test.created_at).toLocaleDateString()}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}
