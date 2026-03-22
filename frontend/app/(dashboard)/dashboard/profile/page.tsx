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
import { 
  User, Mail, Calendar, Shield, Save, Camera, 
  CreditCard, CheckCircle2, AlertCircle, Zap, 
  ChevronRight, ArrowUpCircle, Users
} from 'lucide-react'
import { useAuthStore } from '@/lib/store/auth-store'
import { profileApi } from '@/lib/api/client'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

const profileSchema = z.object({
  name: z.string().min(2, 'Имя должно содержать минимум 2 символа'),
  specialization: z.string().optional(),
  bio: z.string().max(500, 'Описание должно быть короче 500 символов').optional(),
})

type ProfileForm = z.infer<typeof profileSchema>

export default function ProfilePage() {
  const { user, isSubscriptionActive, setUser } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false)

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
      toast.success('Профиль успешно обновлён')
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
    <div className="mx-auto max-w-5xl space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="font-outfit text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          Персональные настройки
        </h1>
        <p className="text-muted-foreground max-w-2xl">
          Здесь вы можете изменить публичную информацию о себе и управлять параметрами вашей подписки ProfDNK Pro.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: Visual Profile & Status */}
        <div className="space-y-6 lg:col-span-4">
          <Card className="overflow-hidden border-primary/10 shadow-lg">
            <div className="h-24 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent" />
            <CardContent className="pt-0 -mt-12">
              <div className="flex flex-col items-center text-center">
                <div className="relative group">
                  <Avatar className="h-24 w-24 border-4 border-background shadow-xl scale-110">
                    <AvatarImage src={user?.avatar} />
                    <AvatarFallback className="text-3xl bg-primary/5 text-primary font-bold">
                      {user?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full shadow-md hover:scale-110 transition-transform"
                  >
                    <Camera className="h-4 w-4" />
                    <span className="sr-only">Изменить аватар</span>
                  </Button>
                </div>
                
                <div className="mt-6 space-y-1">
                  <h2 className="font-outfit text-2xl font-bold">{user?.name}</h2>
                  <p className="text-sm font-medium text-primary">
                    {user?.specialization || 'Специалист'}
                  </p>
                </div>

                <div className="mt-6 w-full grid grid-cols-2 gap-2">
                   <div className="flex flex-col rounded-xl bg-muted/50 p-3 items-center justify-center">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">Статус</span>
                      <Badge variant={subscriptionStatus ? 'default' : 'destructive'} className="rounded-full px-3">
                        {subscriptionStatus ? 'Active' : 'Expired'}
                      </Badge>
                   </div>
                   <div className="flex flex-col rounded-xl bg-muted/50 p-3 items-center justify-center">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">Роль</span>
                      <Badge variant="outline" className="rounded-full px-3 border-primary/30">
                        {user?.role === 'admin' ? 'Admin' : 'Psychologist'}
                      </Badge>
                   </div>
                </div>

                <div className="mt-8 w-full space-y-4 text-left border-t border-border/50 pt-6">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="h-8 w-8 rounded-lg bg-primary/5 flex items-center justify-center text-primary">
                      <Mail className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold leading-none mb-1">Эл. почта</p>
                      <span className="text-foreground/80 font-medium">{user?.email}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="h-8 w-8 rounded-lg bg-primary/5 flex items-center justify-center text-primary">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold leading-none mb-1">В системе с</p>
                      <span className="text-foreground/80 font-medium">
                        {user?.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subscription Mini Card */}
          <Card className={cn(
            "border-none shadow-xl transition-all duration-300",
            subscriptionStatus 
              ? "bg-gradient-to-br from-primary/10 via-background to-primary/5 border border-primary/20" 
              : "bg-destructive/5 border border-destructive/20"
          )}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Shield className={cn("h-4 w-4", subscriptionStatus ? "text-primary" : "text-destructive")} />
                Состояние доступа
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {subscriptionStatus 
                  ? `Разблокированы все функции. Ваш доступ активен ещё ${daysRemaining} дн.`
                  : 'Доступ к созданию тестов и просмотру результатов ограничен.'}
              </p>
              
              {!subscriptionStatus && (
                <Button className="w-full bg-gradient-to-r from-primary to-accent border-none shadow-lg shadow-primary/20" onClick={() => setIsUpgradeOpen(true)}>
                  <Zap className="mr-2 h-4 w-4 fill-current" />
                  Активировать PRO
                </Button>
              )}
              {subscriptionStatus && (
                <Button variant="outline" className="w-full border-primary/30 hover:bg-primary/5" onClick={() => setIsUpgradeOpen(true)}>
                  Управление тарифом
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Edit Form */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="border-none shadow-xl bg-card/60 backdrop-blur-sm">
            <CardHeader className="border-b border-border/50 pb-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="font-outfit text-xl">Общая информация</CardTitle>
                  <CardDescription>Эти данные будут видны в ваших отчётах для клиентов.</CardDescription>
                </div>
                <Users className="h-6 w-6 text-muted-foreground/30" />
              </div>
            </CardHeader>
            <form onSubmit={handleSubmit(onSubmit)}>
              <CardContent className="pt-8 px-8">
                <FieldGroup className="max-w-2xl">
                  <Field>
                    <FieldLabel htmlFor="name" className="text-foreground font-semibold">Ваше ФИО</FieldLabel>
                    <Input
                      id="name"
                      placeholder="Иванов Иван Иванович"
                      className="bg-background/50 border-primary/10 focus:border-primary/40 h-11"
                      {...register('name')}
                    />
                    {errors.name && (
                      <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.name.message}
                      </p>
                    )}
                  </Field>

                  <div className="grid gap-6 sm:grid-cols-2">
                    <Field>
                      <FieldLabel className="text-foreground font-semibold">Email аккаунта</FieldLabel>
                      <div className="flex items-center gap-3 rounded-lg bg-muted/30 border border-border/50 px-3 h-11">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground font-medium">{user?.email}</span>
                        <Badge variant="outline" className="ml-auto text-[10px] bg-background">Primary</Badge>
                      </div>
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="specialization" className="text-foreground font-semibold">Специализация</FieldLabel>
                      <Input
                        id="specialization"
                        placeholder="Напр. Гештальт-терапевт"
                        className="bg-background/50 border-primary/10 focus:border-primary/40 h-11"
                        {...register('specialization')}
                      />
                    </Field>
                  </div>

                  <Field>
                    <FieldLabel htmlFor="bio" className="text-foreground font-semibold">О себе / Описание практики</FieldLabel>
                    <Textarea
                      id="bio"
                      placeholder="Кратко расскажите о своём опыте, чтобы клиенты понимали ваш подход..."
                      className="min-h-[140px] bg-background/50 border-primary/10 focus:border-primary/40 resize-none"
                      {...register('bio')}
                    />
                    <div className="flex justify-between mt-2">
                      <p className="text-[10px] text-muted-foreground">Максимум 500 символов</p>
                      {errors.bio && (
                        <p className="text-xs text-destructive">{errors.bio.message}</p>
                      )}
                    </div>
                  </Field>
                </FieldGroup>
              </CardContent>
              <div className="flex justify-end bg-muted/20 border-t border-border/50 px-8 py-5">
                <Button 
                  type="submit" 
                  disabled={isLoading || !isDirty}
                  className="bg-primary hover:bg-primary/90 min-w-[180px] shadow-lg shadow-primary/10 transition-all active:scale-95"
                >
                  {isLoading ? <Spinner className="mr-2" /> : <Save className="mr-2 h-4 w-4" />}
                  Сохранить профиль
                </Button>
              </div>
            </form>
          </Card>

          {/* Billing Section - Separate UI Block */}
          <div className="rounded-2xl bg-gradient-to-r from-primary/5 via-accent/5 to-background border border-primary/10 p-8 flex flex-col md:flex-row items-center gap-6 shadow-md transition-shadow hover:shadow-lg">
             <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <ArrowUpCircle className="h-8 w-8" />
             </div>
             <div className="flex-1 text-center md:text-left space-y-1">
                <h3 className="font-outfit text-xl font-bold">Управление подпиской ProfDNK</h3>
                <p className="text-sm text-muted-foreground max-w-lg">
                  Ваш текущий период доступа оплачен до <span className="text-foreground font-bold">{new Date(user?.access_until || '').toLocaleDateString('ru-RU', { month: 'long', day: 'numeric', year: 'numeric' })}</span>.
                </p>
             </div>
             <Button variant="default" className="shrink-0" onClick={() => setIsUpgradeOpen(true)}>
                Продлить доступ
                <ChevronRight className="ml-2 h-4 w-4" />
             </Button>
          </div>
        </div>
      </div>

      {/* Upgrade Modal */}
      <Dialog open={isUpgradeOpen} onOpenChange={setIsUpgradeOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-outfit">Управление доступом</DialogTitle>
            <DialogDescription>
              Выберите вариант для продолжения или продления вашей практики.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 pt-4">
             <div className="rounded-xl border-2 border-primary bg-primary/5 p-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] px-2 py-1 uppercase font-bold rounded-bl-lg">Текущий</div>
                <div className="flex justify-between items-start mb-2">
                   <h4 className="font-bold text-lg">Тариф PRO</h4>
                   <span className="text-xl font-black">2 900 ₽<span className="text-xs font-normal text-muted-foreground">/мес</span></span>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                   <li className="flex items-center gap-2 font-medium text-foreground/80">
                      <CheckCircle2 className="h-4 w-4 text-primary" /> Неограничено тестов
                   </li>
                   <li className="flex items-center gap-2 font-medium text-foreground/80">
                      <CheckCircle2 className="h-4 w-4 text-primary" /> Хранение всех результатов
                   </li>
                   <li className="flex items-center gap-2 font-medium text-foreground/80">
                      <CheckCircle2 className="h-4 w-4 text-primary" /> Профессиональные PDF отчеты
                   </li>
                </ul>
             </div>

             <div className="space-y-4">
                <div className="flex items-center gap-4 border rounded-xl p-4 hover:border-primary/50 transition-colors cursor-pointer group">
                   <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary">
                      <Calendar className="h-5 w-5" />
                   </div>
                   <div className="flex-1">
                      <p className="font-bold">Продлить на 1 месяц</p>
                      <p className="text-xs text-muted-foreground">Разовый платеж 2 900 ₽</p>
                   </div>
                </div>
                <div className="flex items-center gap-4 border rounded-xl p-4 hover:border-primary/50 transition-colors cursor-pointer group">
                   <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary">
                      <Zap className="h-5 w-5" />
                   </div>
                   <div className="flex-1">
                      <p className="font-bold">Годовой доступ (-20%)</p>
                      <p className="text-xs text-muted-foreground">Выгоднее на 7 000 ₽ / год</p>
                   </div>
                </div>
             </div>

             <div className="bg-muted/50 rounded-xl p-4 text-xs text-muted-foreground text-center">
                Пока мы работаем в тестовом режиме. Для продления, напишите нашему менеджеру в Telegram.
                <Button variant="link" size="sm" className="w-full mt-1 text-primary">@profdnk_supp</Button>
             </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
