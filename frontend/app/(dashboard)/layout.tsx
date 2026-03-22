'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardSidebar } from '@/components/dashboard/sidebar'
import { DashboardHeader } from '@/components/dashboard/header'
import { SubscriptionBanner } from '@/components/dashboard/subscription-banner'
import { useAuthStore } from '@/lib/store/auth-store'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { isAuthenticated, user, isLoading, isPending } = useAuthStore()

  // Удаляем useEffect с редиректом, так как теперь Middleware защищает маршруты на стороне сервера.
  // Это предотвращает гонку состояний при первом входе.

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  // Если мы попали сюда, значит Middleware разрешил доступ (токен в куках есть).
  // Если Zustand еще не подхватил пользователя, просто ждем или показываем null.
  if (!isAuthenticated || !user) {
    return null
  }

  // Обработка статуса ожидания (можно оставить здесь или перенести в Middleware)
  if (isPending() && typeof window !== 'undefined' && !window.location.pathname.startsWith('/pending')) {
    router.replace('/pending')
    return null
  }

  return (
    <div className="flex min-h-screen">
      <DashboardSidebar />
      <div className="flex flex-1 flex-col">
        <DashboardHeader />
        <SubscriptionBanner />
        <main className="flex-1 overflow-auto bg-muted/30 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
