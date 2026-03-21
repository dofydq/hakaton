import Link from 'next/link'
import { Brain } from 'lucide-react'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="flex h-16 items-center justify-center border-b border-border/40 bg-background/80 backdrop-blur-lg">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Brain className="h-5 w-5" />
          </div>
          <span className="font-outfit text-xl font-bold text-foreground">
            ProfDNK
          </span>
        </Link>
      </header>

      {/* Content */}
      <main className="relative flex flex-1 items-center justify-center p-4">
        {/* Background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
          <div className="absolute top-1/4 left-1/4 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />
        </div>
        {children}
      </main>
    </div>
  )
}
