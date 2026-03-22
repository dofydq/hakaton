'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check, Zap, Shield, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

const plans = [
  {
    name: 'Старт',
    description: 'Идеально для начинающих специалистов',
    price: 'Бесплатно',
    period: 'проба 14 дней',
    features: [
      'До 3 тестов', 
      '50 прохождений', 
      'Базовая аналитика', 
      'Экспорт в JSON',
      'Техподдержка'
    ],
    cta: 'Попробовать',
    href: '/register',
    popular: false,
    icon: Shield,
  },
  {
    name: 'Pro',
    description: 'Для активной психологической практики',
    price: '2 900 ₽',
    period: 'в месяц',
    features: [
      'Безлимитные тесты',
      'Безлимитные сессии',
      'Профессиональные PDF-отчеты',
      'Брендинг (логотип в отчете)',
      'Индивидуальные формулы',
      'Приоритетный доступ',
    ],
    cta: 'Подключить Pro',
    href: '/register?plan=pro',
    popular: true,
    icon: Zap,
  },
  {
    name: 'Центр',
    description: 'Для клиник и командной работы',
    price: 'от 9 900 ₽',
    period: 'в месяц',
    features: [
      'Всё из тарифа Pro', 
      'Несколько личных кабинетов', 
      'Общая база клиентов', 
      'API для интеграции', 
      'Персональный менеджер', 
      'Соглашение о хостинге'
    ],
    cta: 'Связаться',
    href: '#footer',
    popular: false,
    icon: Sparkles,
  },
]

export function Pricing() {
  return (
    <section id="pricing" className="py-24 relative">
       {/* Background decoration */}
       <div className="absolute top-0 right-0 h-96 w-96 rounded-full bg-primary/5 blur-3xl -z-10" />
       <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-accent/5 blur-3xl -z-10" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <Badge variant="outline" className="mb-4 border-primary/20 text-primary px-4 py-1">Планы и стоимость</Badge>
          <h2 className="font-outfit text-4xl font-bold tracking-tight text-foreground sm:text-5xl">Выберите ваш темп роста</h2>
          <p className="mt-6 text-lg text-muted-foreground leading-relaxed">Прозрачные условия без скрытых платежей. Масштабируйте практику осознанно вместе с ProfDNK.</p>
        </div>

        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={cn(
                'relative flex flex-col transition-all duration-300 border-border/50 bg-card/50 backdrop-blur-sm hover:translate-y-[-8px] hover:shadow-2xl hover:border-primary/30', 
                plan.popular && 'border-primary/50 shadow-xl ring-1 ring-primary/20 bg-background/80'
              )}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-4 py-1 rounded-full shadow-lg">
                  ХИТ ПРОДАЖ
                </div>
              )}
              
              <CardHeader className="pt-8">
                <div className="flex items-center gap-3 mb-2">
                   <div className={cn("p-2 rounded-lg", plan.popular ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
                      <plan.icon className="h-5 w-5" />
                   </div>
                   <CardTitle className="font-outfit text-2xl">{plan.name}</CardTitle>
                </div>
                <CardDescription className="min-h-[40px] leading-relaxed">{plan.description}</CardDescription>
              </CardHeader>

              <CardContent className="flex-1 px-8">
                <div className="mb-8 border-b border-border/50 pb-6">
                  <span className="font-outfit text-4xl font-extrabold text-foreground">{plan.price}</span>
                  {plan.period && <p className="text-sm text-muted-foreground mt-1">{plan.period}</p>}
                </div>
                
                <ul className="space-y-4">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm">
                      <div className="mt-0.5 rounded-full bg-primary/10 p-0.5">
                        <Check className="h-3 w-3 text-primary" />
                      </div>
                      <span className="text-muted-foreground-foreground/80 leading-snug">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter className="p-8">
                <Button 
                  asChild 
                  className={cn(
                    'w-full h-12 text-md font-bold transition-all', 
                    plan.popular ? 'shadow-lg shadow-primary/20 hover:scale-[1.02]' : ''
                  )} 
                  variant={plan.popular ? 'default' : 'outline'}
                >
                  <Link href={plan.href}>{plan.cta}</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="mt-20 text-center text-sm text-muted-foreground bg-muted/30 py-6 rounded-2xl border border-dashed border-border">
           <p className="flex items-center justify-center gap-2">
              <Shield className="h-4 w-4" />
              Безопасность данных гарантирована. Храним информацию в зашифрованном виде.
           </p>
        </div>
      </div>
    </section>
  )
}
