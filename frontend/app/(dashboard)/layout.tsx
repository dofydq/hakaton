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
  const { isAuthenticated, user, isLoading, isPending, setLoading } = useAuthStore()

  useEffect(() => {
    // Check auth state on mount
    const checkAuth = () => {
      setLoading(false)
      if (!isAuthenticated) {
        router.push('/login')
      } else if (isPending()) {
        router.push('/pending')
      }
    }
    
    checkAuth()
  }, [isAuthenticated, isPending, router, setLoading])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!isAuthenticated || !user) {
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
