'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/lib/store/auth-store'
import { Brain, LayoutDashboard, FileText, Link2, Users, BarChart3, User, Shield } from 'lucide-react'

const navigation = [
  { name: 'Главная', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Мои тесты', href: '/dashboard/tests', icon: FileText },
  { name: 'Ссылки', href: '/dashboard/links', icon: Link2 },
  { name: 'Результаты', href: '/dashboard/results', icon: Users },
  { name: 'Аналитика', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'Профиль', href: '/dashboard/profile', icon: User },
]

const adminNavigation = [{ name: 'Панель администратора', href: '/admin', icon: Shield }]

export function DashboardSidebar() {
  const pathname = usePathname()
  const user = useAuthStore((s) => s.user)
  const isAdmin = user?.role === 'admin'

  return (
    <aside className="hidden w-64 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
      <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
          <Brain className="h-5 w-5" />
        </div>
        <span className="font-outfit text-xl font-bold text-sidebar-foreground">ProfDNK</span>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              </li>
            )
          })}
        </ul>

        {isAdmin && (
          <>
            <div className="my-4 border-t border-sidebar-border" />
            <p className="mb-2 px-3 text-xs font-semibold uppercase text-sidebar-foreground/50">Администрирование</p>
            <ul className="space-y-1">
              {adminNavigation.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.name}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </nav>

      <div className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3 rounded-lg bg-sidebar-accent/50 px-3 py-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium text-sidebar-foreground">{user?.name}</p>
            <p className="truncate text-xs text-sidebar-foreground/70">{user?.email}</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
