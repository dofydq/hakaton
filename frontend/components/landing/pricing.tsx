'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

const plans = [
  {
    name: 'Пробный',
    description: 'Подходит для первого знакомства с платформой',
    price: 'Бесплатно',
    period: '14 дней',
    features: ['До 3 тестов', '50 клиентских сессий', 'Базовая аналитика', 'Поддержка по email'],
    cta: 'Начать бесплатно',
    href: '/register',
    popular: false,
  },
  {
    name: 'Pro',
    description: 'Для растущей практики',
    price: '$49',
    period: 'в месяц',
    features: [
      'Неограниченное число тестов',
      'Неограниченное число сессий',
      'Расширенная аналитика',
      'Собственный брендинг',
      'Приоритетная поддержка',
      'Экспорт отчётов (DOCX)',
    ],
    cta: 'Подключить',
    href: '/register?plan=pro',
    popular: true,
  },
  {
    name: 'Enterprise',
    description: 'Для клиник и организаций',
    price: 'По запросу',
    period: 'свяжитесь с нами',
    features: ['Всё из Pro', 'Несколько сотрудников', 'Доступ к API', 'Кастомные интеграции', 'Выделенная поддержка', 'On-premise'],
    cta: 'Связаться',
    href: '/contact',
    popular: false,
  },
]

export function Pricing() {
  return (
    <section id="pricing" className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-outfit text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Простые и понятные тарифы</h2>
          <p className="mt-4 text-lg text-muted-foreground">Выберите тариф, который подходит вашей практике.</p>
        </div>

        <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-8 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={cn('relative flex flex-col transition-all hover:shadow-lg', plan.popular && 'border-primary shadow-lg ring-1 ring-primary/20')}
            >
              {plan.popular && <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">Популярный</Badge>}
              <CardHeader>
                <CardTitle className="font-outfit text-xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="mb-6">
                  <span className="font-outfit text-4xl font-bold text-foreground">{plan.price}</span>
                  {plan.period && <span className="ml-2 text-muted-foreground">/{plan.period}</span>}
                </div>
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3 text-sm">
                      <Check className="h-4 w-4 shrink-0 text-primary" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full" variant={plan.popular ? 'default' : 'outline'}>
                  <Link href={plan.href}>{plan.cta}</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
