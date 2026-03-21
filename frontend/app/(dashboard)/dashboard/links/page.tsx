'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Empty } from '@/components/ui/empty'
import { Spinner } from '@/components/ui/spinner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Plus, Copy, Check, Link2, ExternalLink, QrCode } from 'lucide-react'
import { linksApi, testsApi, TestLink } from '@/lib/api/client'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/store/auth-store'

export default function LinksPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedTestId, setSelectedTestId] = useState('')
  const [label, setLabel] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const isSubscriptionActive = useAuthStore((s) => s.isSubscriptionActive)

  const { data: links, isLoading, mutate } = useSWR('links', () => linksApi.list())
  const { data: tests } = useSWR('tests', () => testsApi.list())

  const handleCreateLink = async () => {
    if (!selectedTestId || !label.trim()) {
      toast.error('Выберите тест и введите название ссылки')
      return
    }

    setIsCreating(true)
    try {
      await linksApi.create({ test_id: selectedTestId, label: label.trim() })
      mutate()
      toast.success('Ссылка создана')
      setIsDialogOpen(false)
      setSelectedTestId('')
      setLabel('')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Не удалось создать ссылку')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-outfit text-2xl font-bold text-foreground">Ссылки на тесты</h1>
          <p className="text-muted-foreground">
            Создавайте уникальные ссылки для отправки клиентам
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={!isSubscriptionActive() || !tests?.length}>
              <Plus className="mr-2 h-4 w-4" />
              Создать ссылку
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Новая ссылка</DialogTitle>
              <DialogDescription>
                Создайте уникальную ссылку на тест с удобной меткой
              </DialogDescription>
            </DialogHeader>
            <FieldGroup className="py-4">
              <Field>
                <FieldLabel>Выберите тест</FieldLabel>
                <Select value={selectedTestId} onValueChange={setSelectedTestId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите тест" />
                  </SelectTrigger>
                  <SelectContent>
                    {tests?.map((test) => (
                      <SelectItem key={test.id} value={test.id}>
                        {test.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel>Метка ссылки</FieldLabel>
                <Input
                  placeholder="Например: Группа 10-А, март"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Метки помогают разделять группы и отслеживать результаты
                </p>
              </Field>
            </FieldGroup>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Отмена
              </Button>
              <Button onClick={handleCreateLink} disabled={isCreating}>
                {isCreating && <Spinner className="mr-2" />}
                Создать ссылку
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Links Grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : links && links.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {links.map((link) => (
            <LinkCard key={link.id} link={link} />
          ))}
        </div>
      ) : (
        <Empty
          icon={Link2}
          title="Ссылок пока нет"
          description="Создайте первую ссылку, чтобы отправить тест клиентам"
        >
          <Button onClick={() => setIsDialogOpen(true)} disabled={!tests?.length}>
            <Plus className="mr-2 h-4 w-4" />
            Создать первую ссылку
          </Button>
        </Empty>
      )}
    </div>
  )
}

function LinkCard({ link }: { link: TestLink }) {
  const [copied, setCopied] = useState(false)
  const fullUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/test/${link.id}` 
    : link.url

  const handleCopy = async () => {
    await navigator.clipboard.writeText(fullUrl)
    setCopied(true)
    toast.success('Ссылка скопирована')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">{link.test_title}</CardTitle>
            <CardDescription className="flex items-center gap-2">
              <Badge variant="outline" className="font-normal">
                {link.label}
              </Badge>
            </CardDescription>
          </div>
          <Badge variant="secondary">
            {link.submission_count} ответов
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 rounded-lg bg-muted p-2">
          <code className="flex-1 truncate text-xs text-muted-foreground">
            {fullUrl}
          </code>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={handleCopy}>
            {copied ? (
              <Check className="mr-2 h-4 w-4 text-green-500" />
            ) : (
              <Copy className="mr-2 h-4 w-4" />
            )}
            {copied ? 'Скопировано' : 'Копировать'}
          </Button>
          <Button variant="outline" size="icon" asChild>
            <a href={fullUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
              <span className="sr-only">Открыть ссылку</span>
            </a>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Создано {new Date(link.created_at).toLocaleDateString()}
        </p>
      </CardContent>
    </Card>
  )
}
