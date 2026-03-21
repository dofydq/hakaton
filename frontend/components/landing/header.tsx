'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Brain, Menu, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useState } from 'react'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'

const navigation = [
  { name: 'Возможности', href: '#features' },
  { name: 'Тарифы', href: '#pricing' },
  { name: 'FAQ', href: '#faq' },
]

export function Header() {
  const { theme, setTheme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Brain className="h-5 w-5" />
          </div>
          <span className="font-outfit text-xl font-bold text-foreground">ProfDNK</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navigation.map((item) => (
            <a key={item.name} href={item.href} className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              {item.name}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="Переключить тему">
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/login">Войти</Link>
          </Button>
          <Button asChild>
            <Link href="/register">Начать</Link>
          </Button>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="Переключить тему">
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Открыть меню</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px]">
              <div className="flex flex-col gap-6 pt-6">
                <nav className="flex flex-col gap-4">
                  {navigation.map((item) => (
                    <a key={item.name} href={item.href} onClick={() => setIsOpen(false)} className="text-lg font-medium text-foreground">
                      {item.name}
                    </a>
                  ))}
                </nav>
                <div className="flex flex-col gap-3">
                  <Button variant="outline" asChild>
                    <Link href="/login">Войти</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/register">Начать</Link>
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
