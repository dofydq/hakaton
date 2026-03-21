import Link from 'next/link'
import { Brain } from 'lucide-react'

const footerLinks = {
  product: [
    { name: 'Возможности', href: '#features' },
    { name: 'Тарифы', href: '#pricing' },
    { name: 'FAQ', href: '#faq' },
  ],
  company: [
    { name: 'О сервисе', href: '/about' },
    { name: 'Контакты', href: '/contact' },
    { name: 'Блог', href: '/blog' },
  ],
  legal: [
    { name: 'Политика конфиденциальности', href: '/privacy' },
    { name: 'Условия использования', href: '/terms' },
    { name: 'GDPR', href: '/gdpr' },
  ],
}

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Brain className="h-5 w-5" />
              </div>
              <span className="font-outfit text-xl font-bold text-foreground">ProfDNK</span>
            </Link>
            <p className="mt-4 text-sm text-muted-foreground">
              Профессиональная CRM-платформа для психологов. Управляйте практикой с помощью удобных инструментов.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground">Продукт</h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <a href={link.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground">Компания</h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground">Документы</h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-border pt-8">
          <p className="text-center text-sm text-muted-foreground">© {new Date().getFullYear()} ProfDNK. Все права защищены.</p>
        </div>
      </div>
    </footer>
  )
}
