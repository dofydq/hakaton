'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { FieldGroup, Field, FieldLabel, FieldError } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import { Eye, EyeOff, UserPlus } from 'lucide-react'
import { authApi } from '@/lib/api/client'

const registerSchema = z
  .object({
    name: z.string().min(1, 'ФИО обязательно').min(2, 'Имя должно содержать минимум 2 символа'),
    email: z.string().min(1, 'Email обязателен').email('Введите корректный email'),
    password: z.string().min(1, 'Пароль обязателен').min(8, 'Пароль должен содержать минимум 8 символов'),
    confirmPassword: z.string().min(1, 'Подтвердите пароль'),
    specialization: z.string().optional(),
    bio: z.string().max(500, 'Описание должно быть короче 500 символов').optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Пароли не совпадают',
    path: ['confirmPassword'],
  })

type RegisterForm = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    mode: 'onTouched',
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      specialization: '',
      bio: '',
    },
  })

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true)
    try {
      await authApi.register({
        name: data.name,
        email: data.email,
        password: data.password,
        specialization: data.specialization,
        bio: data.bio,
      })

      toast.success('Заявка отправлена. Дождитесь подтверждения.')
      router.push('/pending')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Не удалось зарегистрироваться')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md border-border/50 bg-card/80 backdrop-blur-sm">
      <CardHeader className="text-center">
        <CardTitle className="font-outfit text-2xl">Регистрация</CardTitle>
        <CardDescription>Создайте аккаунт в ProfDNK</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="name" required>ФИО</FieldLabel>
              <Input id="name" type="text" placeholder="Иван Иванов" autoComplete="name" {...register('name')} />
              <FieldError errors={[errors.name]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="email" required>Email</FieldLabel>
              <Input id="email" type="email" placeholder="you@example.com" autoComplete="email" {...register('email')} />
              <FieldError errors={[errors.email]} />
            </Field>

            <Field>
              <FieldLabel htmlFor="specialization">Специализация (необязательно)</FieldLabel>
              <Input id="specialization" type="text" placeholder="Например, клинический психолог" {...register('specialization')} />
            </Field>

            <Field>
              <FieldLabel htmlFor="bio">О себе (необязательно)</FieldLabel>
              <Textarea id="bio" placeholder="Расскажите о своей практике..." rows={3} {...register('bio')} />
              {errors.bio && <p className="text-sm text-destructive">{errors.bio.message}</p>}
            </Field>

            <Field>
              <FieldLabel htmlFor="password" required>Пароль</FieldLabel>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Придумайте пароль"
                  autoComplete="new-password"
                  className="pr-10"
                  {...register('password')}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="sr-only">{showPassword ? 'Скрыть пароль' : 'Показать пароль'}</span>
                </Button>
              </div>
              <FieldError errors={[errors.password]} />
            </Field>

            <Field>
              <FieldLabel htmlFor="confirmPassword" required>Подтверждение пароля</FieldLabel>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Повторите пароль"
                autoComplete="new-password"
                {...register('confirmPassword')}
              />
              <FieldError errors={[errors.confirmPassword]} />
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? <Spinner className="mr-2" /> : <UserPlus className="mr-2 h-4 w-4" />}
            Зарегистрироваться
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Уже есть аккаунт?{' '}
            <Link href="/login" className="text-primary hover:underline">
              Войти
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
