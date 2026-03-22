'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/lib/store/auth-store'
import { authApi } from '@/lib/api/client'
import { Spinner } from '@/components/ui/spinner'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { token, setToken, setUser, logout, isInitialized, isLoading, setLoading } = useAuthStore()

  useEffect(() => {
    let isMounted = true

    const restoreSession = async () => {
      if (token && isMounted) {
        setLoading(true)
        try {
          const { user } = await authApi.me()
          if (isMounted) {
            setUser(user)
          }
        } catch (error) {
          console.error('Failed to restore session:', error)
          if (isMounted) {
            logout()
          }
        } finally {
          if (isMounted) {
            setLoading(false)
          }
        }
      }
    }

    if (isInitialized) {
      restoreSession()
    }

    return () => {
      isMounted = false
    }
  }, [isInitialized, token, setUser, logout, setLoading])

  // Если приложение еще не гидрировано (Zustand persist не прочитал данные),
  // или если мы активно проверяем токен в первый раз — показываем лоадер.
  // Это предотвращает FOUC и редиректы на основе пустых данных из localStorage.
  if (!isInitialized || isLoading) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="font-medium text-muted-foreground">Проверка авторизации...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
