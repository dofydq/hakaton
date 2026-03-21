'use client'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

const faqs = [
  {
    question: 'Что такое ProfDNK?',
    answer:
      'ProfDNK — это CRM-платформа для психологов. Она помогает создавать тесты, управлять клиентскими сессиями, отслеживать прогресс и формировать подробные отчёты.',
  },
  {
    question: 'Как работает тестирование клиентов?',
    answer:
      'Вы можете создавать собственные тесты с разными типами вопросов. Для каждого клиента или группы формируется отдельная ссылка, по которой тест можно пройти анонимно. Результаты автоматически считаются и сохраняются в кабинете.',
  },
  {
    question: 'Безопасны ли данные клиентов?',
    answer:
      'Да. Безопасность является приоритетом: данные защищаются при хранении и передаче, а работа с чувствительной информацией строится по лучшим практикам.',
  },
  {
    question: 'Можно ли экспортировать отчёты?',
    answer:
      'Да. В тарифах Pro и Enterprise доступен экспорт подробных отчётов в формате DOCX. Можно формировать как клиентские версии, так и профессиональные отчёты.',
  },
  {
    question: 'Что будет после окончания пробного периода?',
    answer:
      'После окончания 14-дневного пробного периода вы сможете перейти на платный тариф и продолжить работу со всеми функциями. Ваши данные сохранятся.',
  },
  {
    question: 'Можно ли отменить подписку в любой момент?',
    answer:
      'Да. Вы можете отменить подписку в любой момент. Доступ сохранится до конца оплаченного периода, а данные можно будет выгрузить заранее.',
  },
]

export function FAQ() {
  return (
    <section id="faq" className="py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="font-outfit text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Частые вопросы</h2>
          <p className="mt-4 text-lg text-muted-foreground">Всё, что важно знать о ProfDNK</p>
        </div>

        <Accordion type="single" collapsible className="mt-12">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-left text-foreground">{faq.question}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{faq.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
