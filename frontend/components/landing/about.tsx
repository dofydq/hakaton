'use client'

import { CheckCircle2, Trophy, Users, Globe } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

const stats = [
  { label: 'Психологов', value: '1,200+', icon: Users },
  { label: 'Проведенных тестов', value: '50,000+', icon: Trophy },
  { label: 'Счастливх клиентов', value: '15,000+', icon: CheckCircle2 },
  { label: 'Доступность', value: '24/7', icon: Globe },
]

export function About() {
  return (
    <section id="about" className="py-24 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <Badge variant="outline" className="mb-4 border-primary/20 text-primary px-4 py-1">О платформе</Badge>
            <h2 className="font-outfit text-4xl font-bold tracking-tight text-foreground sm:text-5xl mb-6">
              Создано профессионалами для профессионалов
            </h2>
            <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
              <p>
                ProfDNK — это не просто инструмент для тестов. Это полноценная экосистема, которая берет на себя рутину подготовки опросников, подсчета баллов и формирования PDF-отчетов.
              </p>
              <p>
                Мы верим, что психолог должен тратить свое время на работу с человеком, а не на технические аспекты. Наша платформа позволяет автоматизировать сбор данных, сохраняя при этом конфиденциальность и точность измерений.
              </p>
              <ul className="space-y-4 pt-4 text-foreground font-medium">
                <li className="flex items-center gap-3">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  Интуитивно понятный конструктор тестов
                </li>
                <li className="flex items-center gap-3">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  Мгновенная обработка результатов
                </li>
                <li className="flex items-center gap-3">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  Архив сессий с каждым клиентом
                </li>
              </ul>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {stats.map((item) => (
              <div key={item.label} className="p-8 rounded-3xl bg-background border border-border/50 shadow-sm flex flex-col items-center text-center group hover:border-primary/30 transition-all hover:translate-y-[-4px]">
                <div className="mb-4 p-3 rounded-2xl bg-primary/5 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <item.icon className="h-6 w-6" />
                </div>
                <div className="text-3xl font-black font-outfit mb-1">{item.value}</div>
                <div className="text-sm text-muted-foreground font-medium uppercase tracking-wider">{item.label}</div>
              </div>
            ))}
            
            {/* Decorative block */}
            <div className="col-span-2 mt-4 p-8 rounded-3xl bg-gradient-to-br from-primary to-accent text-primary-foreground relative overflow-hidden">
               <div className="relative z-10">
                  <h4 className="font-bold text-xl mb-2 italic">"ProfDNK изменил мою практику"</h4>
                  <p className="text-sm opacity-90 leading-relaxed mb-4 whitespace-normal">
                    Раньше я тратила часы на ручной расчет шкал MMPI и формирование таблиц. Теперь это происходит за секунды.
                  </p>
                  <p className="font-bold text-sm">— Елена В., Клинический психолог</p>
               </div>
               <div className="absolute top-0 right-0 h-32 w-32 bg-white/10 blur-3xl -z-0" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
