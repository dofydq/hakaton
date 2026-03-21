'use client'

import { useState } from 'react'
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import {
  Search,
  Users,
  FileText,
  TrendingUp,
  Calendar,
  Edit,
  ShieldCheck,
  ShieldX,
  Clock,
} from 'lucide-react'
import { adminApi } from '@/lib/api/client'
import { User, UserStatus, UserRole } from '@/lib/store/auth-store'
import { toast } from 'sonner'

export default function AdminPage() {
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [editForm, setEditForm] = useState({
    status: '' as UserStatus,
    role: '' as UserRole,
    accessDays: 30,
  })

  const { data: users, isLoading: usersLoading, mutate } = useSWR('admin-users', () => adminApi.users())
  const { data: stats, isLoading: statsLoading } = useSWR('admin-stats', () => adminApi.stats())

  const isLoading = usersLoading || statsLoading

  const filteredUsers = users?.filter((user) => {
    const matchesSearch = 
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setEditForm({
      status: user.status,
      role: user.role,
      accessDays: 30,
    })
  }

  const handleUpdateUser = async () => {
    if (!selectedUser) return

    setIsUpdating(true)
    try {
      const accessUntil = new Date()
      accessUntil.setDate(accessUntil.getDate() + editForm.accessDays)

      await adminApi.updateUser(selectedUser.id, {
        status: editForm.status,
        role: editForm.role,
        access_until: accessUntil.toISOString(),
      })
      mutate()
      toast.success('Пользователь обновлён')
      setSelectedUser(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Не удалось обновить пользователя')
    } finally {
      setIsUpdating(false)
    }
  }

  const statCards = [
    {
      name: 'Всего пользователей',
      value: stats?.total_users ?? 0,
      icon: Users,
      color: 'text-chart-1',
      bg: 'bg-chart-1/10',
    },
    {
      name: 'Активные пользователи',
      value: stats?.active_users ?? 0,
      icon: ShieldCheck,
      color: 'text-chart-2',
      bg: 'bg-chart-2/10',
    },
    {
      name: 'Всего тестов',
      value: stats?.total_tests ?? 0,
      icon: FileText,
      color: 'text-chart-3',
      bg: 'bg-chart-3/10',
    },
    {
      name: 'Всего сессий',
      value: stats?.total_sessions ?? 0,
      icon: TrendingUp,
      color: 'text-chart-4',
      bg: 'bg-chart-4/10',
    },
  ]

  const getStatusBadge = (status: UserStatus) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/10 text-green-600">Активен</Badge>
      case 'pending':
        return <Badge className="bg-yellow-500/10 text-yellow-600">Ожидает</Badge>
      case 'blocked':
        return <Badge variant="destructive">Заблокирован</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-outfit text-2xl font-bold text-foreground">Панель администратора</h1>
        <p className="text-muted-foreground">
          Управляйте пользователями, доступами и статистикой платформы
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.name}>
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
                <div className="font-outfit text-2xl font-bold">{stat.value}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Users Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Пользователи
          </CardTitle>
          <CardDescription>
            Просмотр и управление зарегистрированными специалистами
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Поиск пользователей..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Фильтр по статусу" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все статусы</SelectItem>
                <SelectItem value="active">Активен</SelectItem>
                <SelectItem value="pending">Ожидает</SelectItem>
                <SelectItem value="blocked">Заблокирован</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Users Table */}
          {usersLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredUsers && filteredUsers.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Пользователь</TableHead>
                    <TableHead>Роль</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Доступ до</TableHead>
                    <TableHead>Дата регистрации</TableHead>
                    <TableHead className="text-right">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                          {user.role === 'admin' ? 'Администратор' : 'Психолог'}
                        </Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(user.status)}</TableCell>
                      <TableCell>
                        {user.access_until ? (
                          <span className={
                            new Date(user.access_until) < new Date() 
                              ? 'text-destructive' 
                              : 'text-foreground'
                          }>
                            {new Date(user.access_until).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Не указано</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Не указано'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditUser(user)}
                        >
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Редактировать пользователя</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              Пользователи не найдены
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактирование пользователя</DialogTitle>
            <DialogDescription>
              Измените статус, роль и срок доступа
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="font-medium">{selectedUser.name}</p>
                <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
              </div>

              <FieldGroup>
                <Field>
                  <FieldLabel>Статус</FieldLabel>
                  <Select
                    value={editForm.status}
                    onValueChange={(value: UserStatus) =>
                      setEditForm({ ...editForm, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4 text-green-500" />
                          Активен
                        </div>
                      </SelectItem>
                      <SelectItem value="pending">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-yellow-500" />
                          Ожидает
                        </div>
                      </SelectItem>
                      <SelectItem value="blocked">
                        <div className="flex items-center gap-2">
                          <ShieldX className="h-4 w-4 text-destructive" />
                          Заблокирован
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </Field>

                <Field>
                  <FieldLabel>Роль</FieldLabel>
                  <Select
                    value={editForm.role}
                    onValueChange={(value: UserRole) =>
                      setEditForm({ ...editForm, role: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="psychologist">Психолог</SelectItem>
                      <SelectItem value="admin">Администратор</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>

                <Field>
                  <FieldLabel>Продлить доступ (дней)</FieldLabel>
                  <Input
                    type="number"
                    value={editForm.accessDays}
                    onChange={(e) =>
                      setEditForm({ ...editForm, accessDays: parseInt(e.target.value) || 0 })
                    }
                    min={0}
                    max={365}
                  />
                  <p className="text-xs text-muted-foreground">
                    Укажите 0, чтобы оставить текущую дату без изменений
                  </p>
                </Field>
              </FieldGroup>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedUser(null)}>
              Отмена
            </Button>
            <Button onClick={handleUpdateUser} disabled={isUpdating}>
              {isUpdating && <Spinner className="mr-2" />}
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
