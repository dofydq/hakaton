'use client'

import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useTheme } from 'next-themes'
import { useAuthStore } from '@/lib/store/auth-store'
import { Menu, Moon, Sun, User, LogOut, Brain } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import Link from 'next/link'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Главная', href: '/dashboard' },
  { name: 'Мои тесты', href: '/dashboard/tests' },
  { name: 'Ссылки', href: '/dashboard/links' },
  { name: 'Результаты', href: '/dashboard/results' },
  { name: 'Аналитика', href: '/dashboard/analytics' },
  { name: 'Профиль', href: '/dashboard/profile' },
]

export function DashboardHeader() {
  const router = useRouter()
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const { user, logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-background px-4 lg:px-6">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Открыть меню</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <div className="flex h-16 items-center gap-2 border-b px-6">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Brain className="h-5 w-5" />
            </div>
            <span className="font-outfit text-xl font-bold">ProfDNK</span>
          </div>
          <nav className="p-4">
            <ul className="space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={cn(
                        'block rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
                      )}
                    >
                      {item.name}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>
        </SheetContent>
      </Sheet>

      <div className="lg:hidden">
        <span className="font-outfit text-lg font-semibold">ProfDNK</span>
      </div>

      <div className="hidden lg:block" />

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="Переключить тему">
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span>{user?.name}</span>
                <span className="text-xs font-normal text-muted-foreground">{user?.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/profile">
                <User className="mr-2 h-4 w-4" />
                Профиль
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Выйти
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
