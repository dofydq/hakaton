'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock, Mail, ArrowLeft } from 'lucide-react'
import { useAuthStore } from '@/lib/store/auth-store'

export default function PendingPage() {
  const logout = useAuthStore((s) => s.logout)
  const user = useAuthStore((s) => s.user)

  return (
    <Card className="w-full max-w-md border-border/50 bg-card/80 backdrop-blur-sm text-center">
      <CardHeader>
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-warning/10">
          <Clock className="h-8 w-8 text-warning" />
        </div>
        <CardTitle className="font-outfit text-2xl">Заявка на рассмотрении</CardTitle>
        <CardDescription>Ваш аккаунт проходит проверку</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground">
          Спасибо за регистрацию, <span className="font-medium text-foreground">{user?.name || 'пользователь'}</span>! Ваша заявка
          сейчас рассматривается нашей командой.
        </p>
        <div className="flex items-center justify-center gap-2 rounded-lg bg-muted/50 p-4">
          <Mail className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Мы отправим уведомление на <span className="font-medium text-foreground">{user?.email}</span>
          </span>
        </div>
        <p className="text-sm text-muted-foreground">Обычно это занимает 1-2 рабочих дня. Спасибо за ожидание.</p>
      </CardContent>
      <CardFooter className="flex flex-col gap-3">
        <Button variant="outline" asChild className="w-full">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            На главную
          </Link>
        </Button>
        <Button
          variant="ghost"
          className="w-full text-muted-foreground"
          onClick={() => {
            logout()
            window.location.href = '/login'
          }}
        >
          Выйти
        </Button>
      </CardFooter>
    </Card>
  )
}
