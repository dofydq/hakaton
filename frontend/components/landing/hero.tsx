'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Brain, Sparkles, Shield, BarChart3 } from 'lucide-react'

export function Hero() {
  return (
    <section id="features" className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
        <div className="absolute top-0 left-1/4 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm text-primary">
            <Sparkles className="h-4 w-4" />
            <span>CRM-платформа для психологов</span>
          </div>

          <h1 className="font-outfit text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            <span className="text-balance">Развивайте практику вместе с</span>{' '}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">ProfDNK</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground text-pretty">
            Современная CRM-платформа для психологов. Создавайте тесты, отслеживайте прогресс клиентов,
            анализируйте результаты и управляйте практикой в одном месте.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button asChild size="lg" className="min-w-[180px]">
              <Link href="/register">Начать бесплатно</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="min-w-[180px]">
              <Link href="/login">Войти</Link>
            </Button>
          </div>
        </div>

        <div className="mx-auto mt-20 grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group relative rounded-2xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm transition-all hover:border-primary/30 hover:bg-card/80"
            >
              <div className="mb-4 inline-flex rounded-xl bg-primary/10 p-3 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="font-outfit text-lg font-semibold text-foreground">{feature.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

const features = [
  {
    title: 'Умное тестирование',
    description: 'Создавайте и проводите психологические тесты с разными типами вопросов.',
    icon: Brain,
  },
  {
    title: 'Аналитика клиентов',
    description: 'Отслеживайте прогресс с подробными оценками и наглядными графиками.',
    icon: BarChart3,
  },
  {
    title: 'Безопасные данные',
    description: 'Защищённое хранение и аккуратная работа с данными клиентов.',
    icon: Shield,
  },
  {
    title: 'Умные отчёты',
    description: 'Формируйте профессиональные отчёты и получайте полезные выводы.',
    icon: Sparkles,
  },
]
