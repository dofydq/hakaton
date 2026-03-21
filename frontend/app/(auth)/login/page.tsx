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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import { useAuthStore } from '@/lib/store/auth-store'
import { authApi } from '@/lib/api/client'

const loginSchema = z.object({
  email: z.string().email('Введите корректный email'),
  password: z.string().min(6, 'Пароль должен содержать минимум 6 символов'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const login = useAuthStore((s) => s.login)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true)
    try {
      const tokenResponse = await authApi.login({
        email: data.email,
        password: data.password,
      })

      const userResponse = await authApi.me().catch(() => authApi.bootstrapUser(data.email, tokenResponse.access_token))
      login(userResponse.user, tokenResponse.access_token)

      toast.success('Вход выполнен')

      if (userResponse.user.status === 'pending') {
        router.push('/pending')
      } else if (userResponse.user.role === 'admin') {
        router.push('/admin')
      } else {
        router.push('/dashboard')
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Не удалось войти')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md border-border/50 bg-card/80 backdrop-blur-sm">
      <CardHeader className="text-center">
        <CardTitle className="font-outfit text-2xl">Вход</CardTitle>
        <CardDescription>Войдите в аккаунт ProfDNK</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                {...register('email')}
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </Field>
            <Field>
              <FieldLabel htmlFor="password">Пароль</FieldLabel>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Введите пароль"
                  autoComplete="current-password"
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
              {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? <Spinner className="mr-2" /> : <LogIn className="mr-2 h-4 w-4" />}
            Войти
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Нет аккаунта?{' '}
            <Link href="/register" className="text-primary hover:underline">
              Зарегистрироваться
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
