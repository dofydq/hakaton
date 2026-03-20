import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin', 'cyrillic'] })

export const metadata: Metadata = {
  title: 'ProfDNK | Платформа Тестирования',
  description: 'Про платформу тестирования с расширенными возможностями',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <Toaster 
            position="top-right"
            toastOptions={{
              className: 'backdrop-blur-xl bg-slate-900/80 text-white border border-white/20',
              style: {
                background: 'rgba(15, 23, 42, 0.8)',
                backdropFilter: 'blur(10px)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.1)',
                padding: '16px',
                borderRadius: '16px',
              },
            }}
          />
          {children}
        </Providers>
      </body>
    </html>
  )
}
