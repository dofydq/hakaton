'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { User, Mail, Calendar, Shield, Save, Camera } from 'lucide-react'
import { useAuthStore } from '@/lib/store/auth-store'
import { profileApi } from '@/lib/api/client'

const profileSchema = z.object({
  name: z.string().min(2, 'Имя должно содержать минимум 2 символа'),
  specialization: z.string().optional(),
  bio: z.string().max(500, 'Описание должно быть короче 500 символов').optional(),
})

type ProfileForm = z.infer<typeof profileSchema>

export default function ProfilePage() {
  const { user, isSubscriptionActive, setUser } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      specialization: user?.specialization || '',
      bio: user?.bio || '',
    },
  })

  const onSubmit = async (data: ProfileForm) => {
    setIsLoading(true)
    try {
      const updatedUser = await profileApi.update(data)
      setUser(updatedUser)
      toast.success('Профиль обновлён')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Не удалось обновить профиль')
    } finally {
      setIsLoading(false)
    }
  }

  const subscriptionStatus = isSubscriptionActive()
  const daysRemaining = user?.access_until 
    ? Math.ceil((new Date(user.access_until).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-outfit text-2xl font-bold text-foreground">Профиль</h1>
        <p className="text-muted-foreground">
          Управляйте настройками аккаунта и информацией о себе
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <Card className="lg:col-span-1">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={user?.avatar} />
                  <AvatarFallback className="text-2xl">
                    {user?.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full"
                >
                  <Camera className="h-4 w-4" />
                  <span className="sr-only">Изменить аватар</span>
                </Button>
              </div>
              <h2 className="mt-4 font-outfit text-xl font-semibold">{user?.name}</h2>
              <p className="text-sm text-muted-foreground">{user?.specialization || 'Психолог'}</p>
              
              <div className="mt-4 flex items-center gap-2">
                <Badge variant={user?.role === 'admin' ? 'default' : 'secondary'}>
                  {user?.role === 'admin' ? 'Администратор' : 'Психолог'}
                </Badge>
                <Badge variant={subscriptionStatus ? 'default' : 'destructive'}>
                  {subscriptionStatus ? 'Активна' : 'Истекла'}
                </Badge>
              </div>

              <div className="mt-6 w-full space-y-3 text-left">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{user?.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    Зарегистрирован {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Не указано'}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {subscriptionStatus 
                      ? `Осталось ${daysRemaining} дн.`
                      : 'Подписка истекла'
                    }
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edit Form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Редактирование профиля</CardTitle>
            <CardDescription>Обновите данные вашего профиля</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="name">Полное имя</FieldLabel>
                  <Input
                    id="name"
                    {...register('name')}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name.message}</p>
                  )}
                </Field>

                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    Чтобы изменить email, обратитесь в поддержку
                  </p>
                </Field>

                <Field>
                  <FieldLabel htmlFor="specialization">Специализация</FieldLabel>
                  <Input
                    id="specialization"
                    placeholder="Например: клиническая психология, КПТ, детская психология"
                    {...register('specialization')}
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="bio">О себе</FieldLabel>
                  <Textarea
                    id="bio"
                    placeholder="Расскажите клиентам о вашей практике и подходе..."
                    rows={4}
                    {...register('bio')}
                  />
                  {errors.bio && (
                    <p className="text-sm text-destructive">{errors.bio.message}</p>
                  )}
                </Field>
              </FieldGroup>
            </CardContent>
            <div className="flex justify-end border-t px-6 py-4">
              <Button type="submit" disabled={isLoading || !isDirty}>
                {isLoading ? <Spinner className="mr-2" /> : <Save className="mr-2 h-4 w-4" />}
                Сохранить изменения
              </Button>
            </div>
          </form>
        </Card>
      </div>

      {/* Subscription Card */}
      <Card>
        <CardHeader>
          <CardTitle>Подписка</CardTitle>
          <CardDescription>Управление тарифом и доступом</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium">
                {subscriptionStatus ? 'Тариф Pro' : 'Нет активной подписки'}
              </p>
              <p className="text-sm text-muted-foreground">
                {subscriptionStatus
                  ? `Подписка активна до ${new Date(user?.access_until || '').toLocaleDateString()}`
                  : 'Оформите подписку, чтобы открыть все функции'
                }
              </p>
            </div>
            <Button variant={subscriptionStatus ? 'outline' : 'default'}>
              {subscriptionStatus ? 'Управлять подпиской' : 'Оформить сейчас'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
