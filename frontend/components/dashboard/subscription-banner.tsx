'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AlertTriangle, X } from 'lucide-react'
import { useAuthStore } from '@/lib/store/auth-store'
import { useState } from 'react'

export function SubscriptionBanner() {
  const { user, isSubscriptionActive } = useAuthStore()
  const [dismissed, setDismissed] = useState(false)

  // Don't show if subscription is active, no user, or user is admin
  if (!user || isSubscriptionActive() || user.role === 'admin' || dismissed) {
    return null
  }

  const daysExpired = user.access_until 
    ? Math.ceil((Date.now() - new Date(user.access_until).getTime()) / (1000 * 60 * 60 * 24))
    : 0

  return (
    <div className="flex items-center justify-between gap-4 bg-destructive/10 px-4 py-3 text-destructive lg:px-6">
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-5 w-5 shrink-0" />
        <p className="text-sm font-medium">
          Подписка истекла
          {daysExpired > 0 && ` ${daysExpired} дн. назад`}. 
          Часть функций сейчас недоступна.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="destructive" asChild>
          <Link href="/pricing">Продлить</Link>
        </Button>
        <Button 
          size="icon" 
          variant="ghost" 
          className="h-8 w-8 text-destructive hover:bg-destructive/10"
          onClick={() => setDismissed(true)}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Скрыть</span>
        </Button>
      </div>
    </div>
  )
}
